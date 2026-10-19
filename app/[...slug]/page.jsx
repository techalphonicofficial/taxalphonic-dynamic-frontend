import { getSlugPath } from "@/lib/tax-alphonic/utils";
import { ApiPage, ApiServicePage } from "@/components/tax-alphonic/pages";
import { NotFound } from "@/components/tax-alphonic/sections";
import { getPageBySlug } from "@/service/pageService";
import { getServiceBySlug } from "@/service/servicePageService";
import { getSeoPageByPath } from "@/service/seoPageService";
import { HOME_PAGE_SLUG } from "@/service/homePageService";
import { withSeoConfig } from "@/service/seoConfigService";
import { createMetadata } from "@/lib/seoMetadata";
import { permanentRedirect } from "next/navigation";

/**
 * What the URL shows:
 * - a path with several segments ("/india/seo-services-noida") is first a pSEO page (its full slug);
 * - else the LAST segment is a service, then a CMS page;
 * - a single segment that is neither can still be a pSEO page ("/seo-services-for-ecommerce").
 */
async function findRecord(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  const slug = segments.at(-1);
  const fullPath = segments.join("/");

  if (segments.length > 1) {
    const seoPage = await getSeoPageByPath(fullPath);
    if (seoPage) return { kind: "seo", record: seoPage };
  }

  const service = await getServiceBySlug(slug);
  if (service) return { kind: "service", record: service };

  const page = await getPageBySlug(slug);
  if (page) return { kind: "page", record: page };

  if (segments.length === 1) {
    const seoPage = await getSeoPageByPath(fullPath);
    if (seoPage) return { kind: "seo", record: seoPage };
  }

  return null;
}

// SEO Config "type" of each kind of record (admin: SEO Management → SEO Configs).
const SEO_CONFIG_TYPE = { seo: "seo_page", service: "service", page: "page" };

/** The record for the URL, with its SEO Config (if any) applied over its own SEO. */
async function resolvePath(pathname) {
  const resolved = await findRecord(pathname);
  if (!resolved) return null;

  const record = await withSeoConfig(resolved.record, SEO_CONFIG_TYPE[resolved.kind], resolved.record.id, pathname);
  return { ...resolved, record };
}

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  const pathname = getSlugPath(resolvedParams?.slug);
  const resolved = await resolvePath(pathname);

  if (resolved) return createMetadata(resolved.record);

  return {
    title: "Page not found",
    robots: { index: false, follow: false },
  };
}

export default async function DynamicPage({ params }) {
  const resolvedParams = await params;
  const pathname = getSlugPath(resolvedParams?.slug);
  // The CMS "home" page is the homepage itself.
  if (pathname === `/${HOME_PAGE_SLUG}`) permanentRedirect("/");
  const resolved = await resolvePath(pathname);

  if (resolved?.kind === "page") return <ApiPage page={resolved.record} />;
  // pSEO pages render through the service page layout (see service/seoPageService.js).
  if (resolved) return <ApiServicePage service={resolved.record} />;

  return <NotFound pathname={pathname} />;
}
