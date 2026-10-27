import { cache } from "react";
import { apiClient } from "@/service/apiClient";
import { mapSection } from "@/service/homePageService";
import { attachModuleContent } from "@/service/homeContentService";
import { needsModuleContent } from "@/components/tax-alphonic/blocks/commonBlockTypes";
import { isLandingLabel } from "@/lib/landingHost.mjs";
import { lockLandingLinks } from "@/lib/landingLinks";

/**
 * The live version of a landing page by its subdomain label, or null (draft, archived,
 * unpublished or unknown). GET /api/v1/landing-pages/public/resolve only ever returns the
 * published snapshot. Not cached: publishing / unpublishing shows on the next request.
 */
export const getLandingPage = cache(async function getLandingPage(label) {
  if (!isLandingLabel(label)) return null;
  try {
    const payload = await apiClient(`/api/v1/landing-pages/public/resolve?slug=${encodeURIComponent(label)}`, { cache: "no-store" });
    const data = payload?.success ? payload.data : null;
    if (!data || data.slug !== label) return null;
    let sections = (Array.isArray(data.sections) ? data.sections : []).map(mapSection).filter(Boolean);
    // Homepage blocks (Testimonials, Team, FAQ, ...) read their CMS module, as on the homepage.
    if (sections.some(needsModuleContent)) sections = await attachModuleContent(sections);
    // No navigation away: outbound links become the form popup (lib/landingLinks.js).
    sections = lockLandingLinks(sections);
    return {
      id: `landing-${data.slug}`,
      recordId: data.id || null, // the landing page's id (SEO Config type "landing")
      slug: data.slug,
      url: data.url,
      title: String(data.title || "").trim(),
      seo: data.seo || {},
      service: data.service || null,
      version: data.version,
      sections,
    };
  } catch (error) {
    if (error.status !== 404) console.error(`Unable to load landing page "${label}"`, error);
    return null;
  }
});
