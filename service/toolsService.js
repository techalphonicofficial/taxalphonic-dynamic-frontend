import { cache } from "react";
import { apiClient } from "@/service/apiClient";

/**
 * Published free tool pages ({ slug, url, calculator, title, icon, tag, description, order }),
 * in their order. Feeds the tools hub grid and each tool page's "More free tools". Never throws.
 */
export const getTools = cache(async function getTools() {
  try {
    const payload = await apiClient("/api/v1/pages/tools-list", { cache: "no-store" });
    return payload?.success && Array.isArray(payload.data) ? payload.data : [];
  } catch (error) {
    console.error("Unable to load the free tools.", error);
    return [];
  }
});
