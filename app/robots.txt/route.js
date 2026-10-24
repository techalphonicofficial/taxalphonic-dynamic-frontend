import { SITE_URL } from "@/service/sitemapService";
import { apiClient } from "@/service/apiClient";

/*
 * /robots.txt. When the admin has put up a custom file (SEO → Robots.txt, GET /seo/robots-txt/public)
 * that text is served as is; otherwise the automatic one: everything may be crawled except the
 * CMS live preview, plus the sitemap index. Read on every request, so a change shows at once.
 */
export const dynamic = "force-dynamic";

const AUTO_ROBOTS = `User-agent: *
Allow: /
Disallow: /cms-preview

Host: ${SITE_URL}
Sitemap: ${SITE_URL}/sitemap.xml
`;

async function customRobots() {
  try {
    const payload = await apiClient("/api/v1/seo/robots-txt/public", { cache: "no-store" });
    const content = payload?.data?.content;
    return typeof content === "string" && content.trim() ? content : null;
  } catch {
    return null; // API down: the automatic file keeps the site crawlable
  }
}

export async function GET() {
  const body = (await customRobots()) || AUTO_ROBOTS;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
