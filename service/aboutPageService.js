import { apiClient } from "@/service/apiClient";
import { normalizeAssetUrl } from "@/service/servicePageService";
import { cache } from "react";

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function mapStat(page, key) {
  const value = page[`stat${key}`];
  if (!value) return null;

  return {
    value: String(value).trim(),
    label: page[`stat${key}Label`] || "",
    description: page[`stat${key}Desc`] || "",
  };
}

function mapAboutPage(page) {
  if (!page) return null;

  return {
    heroTitle: page.heroTitle?.trim() || "About us",
    heroSubtitle: page.heroSubtitle || "",
    overviewHeading: page.overviewHeading || "",
    overviewDescription: page.overviewDescription || "",
    missionText: page.missionText || "",
    visionText: page.visionText || "",
    aboutImage: normalizeAssetUrl(page.aboutImage),
    stats: ["Years", "Projects", "Experts", "Retention"].map((key) => mapStat(page, key)).filter(Boolean),
    coreValues: parseList(page.coreValues).filter((value) => value?.title),
    historyTimeline: parseList(page.historyTimeline).filter((entry) => entry?.year),
    updatedAt: page.updatedAt || null,
  };
}

/** Loads the singleton About page content from GET /api/v1/about-page. */
export const getAboutPage = cache(async function getAboutPage() {
  try {
    const payload = await apiClient("/api/v1/about-page", { cache: "no-store" });
    return payload?.success ? mapAboutPage(payload.data) : null;
  } catch (error) {
    console.error("Unable to load About page.", error);
    return null;
  }
});
