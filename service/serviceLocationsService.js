import { cache } from "react";
import { apiClient } from "@/service/apiClient";

/**
 * Published location pages (pSEO) of a service, A-Z: [{ name, href }].
 * Shown as "Locations We Serve" on the service page and on each of its location pages.
 */
export const getServiceLocations = cache(async function getServiceLocations(serviceSlugOrId) {
  if (!serviceSlugOrId) return [];

  try {
    const payload = await apiClient(`/api/v1/seo-pages/by-service/${encodeURIComponent(serviceSlugOrId)}`, { cache: "no-store" });
    const locations = payload?.success ? payload.data?.locations || [] : [];
    const seen = new Set();

    return locations
      .map((item) => ({
        name: String(item?.location?.name || item?.entityName || "").replace(/\s+/g, " ").trim(),
        href: `/${String(item?.slug || "").replace(/^\/+|\/+$/g, "")}`,
      }))
      .filter((item) => item.name && item.href !== "/" && !seen.has(item.href) && seen.add(item.href));
  } catch (error) {
    if (error.status !== 404) console.error(`Unable to load locations for service: ${serviceSlugOrId}`, error);
    return [];
  }
});
