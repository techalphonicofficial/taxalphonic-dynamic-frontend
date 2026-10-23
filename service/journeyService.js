import { cache } from "react";
import { apiClient } from "@/service/apiClient";

/**
 * Published Journey Stage pages ({ slug, url, number, title, shortLabel, icon, color, tag,
 * roadmapText }), ordered by stage number. Feeds each stage page's progress tracker, roadmap,
 * flow and previous / next links. Never throws: no stages = those blocks hide.
 */
export const getJourneyStages = cache(async function getJourneyStages() {
  try {
    const payload = await apiClient("/api/v1/pages/journey-stages", { cache: "no-store" });
    return payload?.success && Array.isArray(payload.data) ? payload.data : [];
  } catch (error) {
    console.error("Unable to load journey stages.", error);
    return [];
  }
});
