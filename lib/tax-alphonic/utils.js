export function getSlugPath(slug) {
  const parts = Array.isArray(slug) ? slug : [slug];
  return "/" + parts.filter(Boolean).join("/");
}

export function prettyTitle(value = "") {
  return String(value)
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function safeText(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return "";
}
