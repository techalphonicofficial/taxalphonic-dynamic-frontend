import { apiClient } from "@/service/apiClient";
import { cache } from "react";
import { mapSection } from "@/service/homePageService";

function mapPage(page) {
  if (!page || page.status !== "published") return null;

  return {
    id: page.id,
    title: page.title?.trim() || "Untitled page",
    slug: page.slug,
    content: page.content || "",
    metaTitle: page.metaTitle || page.title,
    metaDescription: page.metaDescription || "",
    canonicalUrl: page.canonicalUrl || "",
    robots: page.robots || "",
    keywords: page.keywords || "",
    ogTitle: page.ogTitle || "",
    ogDescription: page.ogDescription || "",
    ogImage: page.ogImage || "",
    twitterCard: page.twitterCard || "",
    schemaMarkup: page.schemaMarkup || "",
    // Page Builder blocks ({ id, type, config, payload }); Form and Packages come hydrated from the API.
    sections: (Array.isArray(page.sections) ? page.sections : []).map(mapSection).filter(Boolean),
  };
}

/**
 * Loads a CMS page by the last URL segment.
 * Example: /privacy-policy becomes GET /api/v1/pages/slug/privacy-policy.
 */
export const getPageBySlug = cache(async function getPageBySlug(slug) {
  if (!slug) return null;

  try {
    const payload = await apiClient(`/api/v1/pages/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    return payload?.success ? mapPage(payload.data) : null;
  } catch (error) {
    if (error.status !== 404) {
      console.error(`Unable to load CMS page for slug: ${slug}`, error);
    }

    return null;
  }
});
