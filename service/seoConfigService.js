import { cache } from "react";
import { apiClient } from "@/service/apiClient";
import { normalizeAssetUrl } from "@/service/servicePageService";

// SEO Configs (admin: SEO Management → SEO Configs): a detailed SEO override for one page.
// The admin picks the page; here the website asks for the config of the record it renders
// (type + id, with the URL as fallback). Each field set in the config wins over the record's own
// SEO; empty fields keep the record's value.
//
// type: "service" | "page" | "seo_page" | "static" (id "home" / "about").

export const getSeoConfig = cache(async function getSeoConfig(type, id, route) {
  const params = new URLSearchParams();
  if (type && id) {
    params.set("type", type);
    params.set("id", String(id));
  }
  if (route) params.set("route", route);
  if (![...params.keys()].length) return null;

  try {
    const payload = await apiClient(`/api/v1/seo/lookup?${params}`, { cache: "no-store" });
    return payload?.success ? payload.data : null;
  } catch (error) {
    if (error.status !== 404) console.error(`Unable to load SEO config for ${type}:${id} ${route || ""}`, error);
    return null;
  }
});

const SEO_FIELDS = [
  "metaTitle",
  "metaDescription",
  "keywords",
  "canonicalUrl",
  "robots",
  "ogTitle",
  "ogDescription",
  "ogImage",
  "twitterCard",
  "schemaMarkup",
  "otherMetaTags",
];

/** The record with every non-empty field of its SEO config on top. */
export function applySeoConfig(record, config) {
  if (!record || !config) return record;

  const merged = { ...record, seoConfigId: config.id };
  SEO_FIELDS.forEach((field) => {
    const value = typeof config[field] === "string" ? config[field].trim() : config[field];
    if (value) merged[field] = field === "ogImage" ? normalizeAssetUrl(value) : value;
  });
  return merged;
}

/** Loads the record's SEO config and applies it. */
export async function withSeoConfig(record, type, id, route) {
  if (!record) return record;
  return applySeoConfig(record, await getSeoConfig(type, id, route));
}
