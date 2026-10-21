import { apiClient } from "@/service/apiClient";

// Dynamic sitemap: /sitemap.xml is an index of /sitemaps/pages.xml, /sitemaps/services.xml, /sitemaps/blog.xml and
// /sitemaps/seo-pages-<n>.xml (pSEO pages, split every PER_FILE URLs; Google's limit is 50,000).
// Entries come from GET /api/v1/sitemap (read fresh on every request, so a newly published service,
// page, pSEO page or blog post is listed straight away) and are listed with the same rules
// the pages render with: published only, no "noindex" robots, no canonical pointing elsewhere,
// with any SEO Config (admin) override of robots / canonical applied.

export const SITE_URL = (process.env.SITE_URL || "https://taxalphonic.com").replace(/\/+$/, "");
export const PER_FILE = 45000;

const EMPTY = { pages: [], services: [], seoPages: [], blogs: [] };

/** "/india/seo services" → "https://taxalphonic.com/india/seo%20services". */
export function absoluteUrl(path) {
  const clean = String(path || "/").split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return clean ? `${SITE_URL}/${clean}` : `${SITE_URL}/`;
}

const sameUrl = (a, b) => String(a || "").replace(/\/+$/, "").toLowerCase() === String(b || "").replace(/\/+$/, "").toLowerCase();

function latest(...dates) {
  const times = dates.map((date) => (date ? new Date(date).getTime() : NaN)).filter(Number.isFinite);
  return times.length ? new Date(Math.max(...times)) : undefined;
}

/**
 * One URL if it may be indexed: robots without "noindex" and no canonical pointing elsewhere,
 * the SEO Config (if any) winning field by field like on the page itself.
 */
function entry(path, record, config) {
  const robots = String(config?.robots || record.robots || "").toLowerCase();
  const canonical = config?.canonicalUrl || record.canonicalUrl || "";
  const loc = absoluteUrl(path);

  if (robots.includes("noindex")) return null;
  if (canonical && !sameUrl(canonical, loc)) return null;
  return { loc, lastmod: latest(record.updatedAt, config?.updatedAt) };
}

async function fetchEntries() {
  try {
    const payload = await apiClient("/api/v1/sitemap", { cache: "no-store" });
    return payload?.success ? payload.data : null;
  } catch (error) {
    console.error("Unable to load sitemap entries", error);
    return null;
  }
}

/** { pages, services, seoPages }: each [{ loc, lastmod }]. */
export async function getSitemapGroups() {
  const data = await fetchEntries();
  if (!data) return EMPTY;

  const configs = new Map((data.seoConfigs || []).map((config) => [`${config.targetType}:${config.targetId}`, config]));
  const configOf = (type, id) => configs.get(`${type}:${id}`);
  // Blog posts have no SEO Config type of their own: a config is matched by its URL (custom route).
  const routeConfigs = new Map((data.seoConfigs || []).filter((config) => config.route).map((config) => [String(config.route).replace(/\/+$/, "").toLowerCase(), config]));
  const configOfRoute = (path) => routeConfigs.get(path.toLowerCase());
  const slugOf = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

  const services = (data.services || []).filter((service) => slugOf(service.slug));
  const serviceSlugs = new Set(services.map((service) => slugOf(service.slug).toLowerCase()));
  // A CMS page whose slug is also a service's never shows (the service wins), so it isn't listed.
  const cmsPages = (data.pages || []).filter((page) => {
    const slug = slugOf(page.slug).toLowerCase();
    return slug && !serviceSlugs.has(slug);
  });
  const homePage = cmsPages.find((page) => slugOf(page.slug) === "home");
  const pageSlugs = new Set(cmsPages.map((page) => slugOf(page.slug).toLowerCase()));

  const pages = [
    entry("/", homePage || {}, configOf("static", "home")),
    data.about ? entry("/about", data.about, configOf("static", "about")) : null,
    ...cmsPages
      .filter((page) => page !== homePage)
      .map((page) => entry(`/${slugOf(page.slug)}`, page, configOf("page", page.id))),
  ].filter(Boolean);

  const serviceEntries = services
    .map((service) => entry(`/${slugOf(service.slug)}`, service, configOf("service", service.id)))
    .filter(Boolean);

  const seoPages = (data.seoPages || [])
    // A one-segment pSEO slug that is also a service or page never shows (they win).
    .filter((page) => {
      const slug = slugOf(page.slug).toLowerCase();
      return slug && (slug.includes("/") || (!serviceSlugs.has(slug) && !pageSlugs.has(slug)));
    })
    .map((page) => entry(
      `/${slugOf(page.slug)}`,
      { ...page, robots: page.indexable ? "index, follow" : "noindex, follow" },
      configOf("seo_page", page.id)
    ))
    .filter(Boolean);

  const blogs = (data.blogs || []).filter((blog) => slugOf(blog.slug));
  const blogEntries = blogs.length ? [
    entry("/blog", { updatedAt: blogs[0].updatedAt }, configOfRoute("/blog")),
    ...blogs.map((blog) => entry(`/blog/${slugOf(blog.slug)}`, blog, configOfRoute(`/blog/${slugOf(blog.slug)}`))),
  ].filter(Boolean) : [];

  return { pages, services: serviceEntries, seoPages, blogs: blogEntries };
}

const escapeXml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const XML_HEADERS = {
  "Content-Type": "application/xml; charset=utf-8",
  // A CDN may keep it for 10 minutes at most, so changes show within ~10 minutes (the data itself is not cached).
  "Cache-Control": "public, max-age=0, s-maxage=600, stale-while-revalidate=600",
};

export function urlsetResponse(entries) {
  const urls = entries.map(({ loc, lastmod }) => (
    `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : ""}\n  </url>`
  )).join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
    { headers: XML_HEADERS }
  );
}

export function indexResponse(files) {
  const items = files.map(({ loc, lastmod }) => (
    `  <sitemap>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod.toISOString()}</lastmod>` : ""}\n  </sitemap>`
  )).join("\n");

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</sitemapindex>\n`,
    { headers: XML_HEADERS }
  );
}

/** The child sitemap files: [{ name, entries }] (empty groups left out, pages always listed). */
export async function getSitemapFiles() {
  const groups = await getSitemapGroups();
  const files = [{ name: "pages.xml", entries: groups.pages }];

  if (groups.services.length) files.push({ name: "services.xml", entries: groups.services });
  if (groups.blogs.length) files.push({ name: "blog.xml", entries: groups.blogs });
  for (let index = 0; index * PER_FILE < groups.seoPages.length; index += 1) {
    files.push({ name: `seo-pages-${index + 1}.xml`, entries: groups.seoPages.slice(index * PER_FILE, (index + 1) * PER_FILE) });
  }

  return files;
}
