// URL slug of a header menu item title ("Income Tax" → "income-tax", "GST & TDS" → "gst-tds").
// Used for the explore pages (/explore/<item>/<column>): service/menuExploreService.js builds
// them, service/navigationService.js links the header "View all" to them. Keep both in step.

export function menuSlug(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const explorePath = (...titles) => `/explore/${titles.map(menuSlug).filter(Boolean).join("/")}`;
