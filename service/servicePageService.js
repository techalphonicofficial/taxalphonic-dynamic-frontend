import { apiClient } from "@/service/apiClient";
import { cache } from "react";
import { getServiceLocations } from "@/service/serviceLocationsService";

const imageBaseUrl = (process.env.IMAGE_BASE_URL || process.env.BASE_URL || "").replace(/\/$/, "");

export function normalizeAssetUrl(value) {
  const url = String(value || "").trim();
  if (!url || /^(?:https?:)?\/\//i.test(url) || url.startsWith("data:")) return url;
  if (!imageBaseUrl) return url;
  return `${imageBaseUrl}/${url.replace(/^\/+/, "")}`;
}

function normalizeContentImages(content) {
  return String(content || "").replace(
    /(src\s*=\s*["'])(\/uploads\/[^"']*)(["'])/gi,
    (_, before, url, after) => `${before}${normalizeAssetUrl(url)}${after}`
  );
}

// Only real paths become absolute URLs: "icon" fields usually hold an emoji, not a file.
function looksLikeAssetPath(value) {
  return /^(\/|uploads\/|https?:|data:)/i.test(value) || /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(value);
}

export function normalizePayload(value, key = "") {
  if (typeof value === "string") {
    if (/image|banner|thumb|gallery|icon/i.test(key)) return looksLikeAssetPath(value.trim()) ? normalizeAssetUrl(value) : value;
    if (key === "content") return normalizeContentImages(value);
    return value;
  }

  if (Array.isArray(value)) return value.map((entry) => normalizePayload(entry));

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        normalizePayload(entryValue, entryKey),
      ])
    );
  }

  return value;
}

export function parsePayload(payload) {
  if (!payload) return {};
  if (typeof payload === "object") return payload;

  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

export function mapService(service) {
  // The backend exposes draft services for preview, so render any non-deleted
  // record returned by the slug endpoint. Publication access stays backend-owned.
  if (!service || service.deletedAt) return null;

  return {
    id: service.id,
    title: service.title?.trim() || "Untitled service",
    slug: service.slug,
    // "published" | "draft" | ...: a service that is not published is never indexed (see app/[...slug]/page.jsx).
    status: service.status || "",
    summary: service.summary || service.shortDescription || "",
    categoryId: service.categoryId || null,
    readingTime: service.readingTime || null,
    updatedAt: service.updatedAt || null,
    bannerImage: normalizeAssetUrl(service.bannerImage),
    thumbImage: normalizeAssetUrl(service.thumbImage),
    gallery: normalizePayload(service.gallery, "gallery"),
    metaTitle: service.metaTitle || service.title,
    metaDescription: service.metaDescription || "",
    canonicalUrl: service.canonicalUrl || "",
    robots: service.robots || "",
    keywords: service.keywords || "",
    ogTitle: service.ogTitle || "",
    ogDescription: service.ogDescription || "",
    ogImage: normalizeAssetUrl(service.ogImage),
    twitterCard: service.twitterCard || "",
    schemaMarkup: service.schemaMarkup || "",
    sections: (service.sections || [])
      .filter((section) => section.isActive !== false)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
      .map((section) => ({
        id: section.id,
        type: section.type?.componentKey || section.type?.name || "Content",
        config: normalizePayload(parsePayload(section.config)),
        payload: normalizePayload(parsePayload(section.data?.payload)),
      })),
  };
}

/** Category name for the hero chip; a missing category only hides the chip. */
export const getServiceCategory = cache(async function getServiceCategory(categoryId) {
  if (!categoryId) return null;

  try {
    const payload = await apiClient(`/api/v1/service-categories/${encodeURIComponent(categoryId)}`, {
      cache: "no-store",
    });
    const category = payload?.success ? payload.data : null;

    return category?.name ? { name: category.name.trim(), slug: category.slug } : null;
  } catch {
    return null;
  }
});

/** Loads a published service by the route's final slug. */
export const getServiceBySlug = cache(async function getServiceBySlug(slug) {
  if (!slug) return null;

  try {
    const payload = await apiClient(`/api/v1/services/slug/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });

    const service = payload?.success ? mapService(payload.data) : null;
    if (!service) return null;

    const [category, locations] = await Promise.all([
      getServiceCategory(service.categoryId),
      getServiceLocations(service.slug || service.id),
    ]);
    return { ...service, category, locations };
  } catch (error) {
    if (error.status !== 404) {
      console.error(`Unable to load service for slug: ${slug}`, error);
    }

    return null;
  }
});
