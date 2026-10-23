import { apiClient } from "@/service/apiClient";
import { normalizePayload, parsePayload } from "@/service/servicePageService";
import { cache } from "react";

// The homepage is the CMS page with this slug (Pages → Home Page in the admin).
export const HOME_PAGE_SLUG = "home";

export function mapSection(section, index) {
  if (!section?.type) return null;
  return {
    id: section.id || `home-${index}`,
    type: section.type,
    // { placement, kicker, anchorId, background } from the builder; background image paths made absolute like payload images
    config: normalizePayload(parsePayload(section.config)),
    payload: normalizePayload(parsePayload(section.data?.payload)),
  };
}

function mapHomePage(page) {
  if (!page || page.status !== "published") return null;

  return {
    title: page.title || "",
    metaTitle: page.metaTitle || "",
    metaDescription: page.metaDescription || "",
    sections: (Array.isArray(page.sections) ? page.sections : []).map(mapSection).filter(Boolean),
  };
}

/** Published homepage from GET /api/v1/pages/slug/home, or null (draft, missing or API down). */
export const getHomePage = cache(async function getHomePage() {
  try {
    const payload = await apiClient(`/api/v1/pages/slug/${HOME_PAGE_SLUG}`, { cache: "no-store" });
    return payload?.success ? mapHomePage(payload.data) : null;
  } catch (error) {
    if (error.status !== 404) console.error("Unable to load the CMS homepage.", error);
    return null;
  }
});
