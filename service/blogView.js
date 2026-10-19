"use server";

import { apiClient } from "@/service/apiClient";

/** Counts one read of a blog post (called once per visit by BlogViewCounter). Never throws. */
export async function countBlogView(slug) {
  if (!slug || typeof slug !== "string" || slug.length > 255) return;
  try {
    await apiClient(`/api/v1/blogs/public/${encodeURIComponent(slug)}/view`, { method: "POST", cache: "no-store" });
  } catch {
    // a missed view count is not worth an error
  }
}
