export const FALLBACK_FAVICON_PATH = "/logo.png";

const MIME_BY_EXT = {
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".avif": "image/avif",
};

/**
 * Validates and normalizes a CMS favicon / Apple touch icon URL.
 * Accepts safe root-relative paths (e.g. "/logo.png") or http/https URLs without
 * embedded credentials. Rejects protocol-relative URLs ("//evil.com") and scripts.
 */
export function parseSafeFaviconUrl(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001F\u007F]/.test(trimmed)) return null;

  if (trimmed.startsWith("/")) {
    if (trimmed.startsWith("//")) return null;
    return { url: trimmed, isAbsolute: false };
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    if (parsed.username || parsed.password || !parsed.hostname) return null;
    return { url: parsed.href, isAbsolute: true };
  } catch {
    return null;
  }
}

/** Infers the image MIME type from a URL pathname extension, or returns undefined. */
export function getIconMimeType(iconUrl) {
  if (!iconUrl) return undefined;
  try {
    const pathname = new URL(iconUrl, "https://placeholder.local").pathname.toLowerCase();
    const match = pathname.match(/(\.[a-z0-9]+)$/);
    return match ? MIME_BY_EXT[match[1]] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Builds Next.js `metadata.icons` from `getSiteSettings().branding`.
 * Falls back to the local `/logo.png` when no valid CMS favicon is available.
 */
export function buildSiteIcons(branding = {}) {
  const favicon = parseSafeFaviconUrl(branding?.favicon);
  const apple = parseSafeFaviconUrl(branding?.appleTouchIcon);

  const iconUrl = favicon?.url || FALLBACK_FAVICON_PATH;
  const iconType = getIconMimeType(iconUrl);
  const iconEntry = { url: iconUrl };
  if (iconType) iconEntry.type = iconType;
  if (iconType === "image/svg+xml") iconEntry.sizes = "any";

  const icons = {
    icon: [iconEntry],
  };

  if (apple?.url) {
    const appleType = getIconMimeType(apple.url);
    const appleEntry = { url: apple.url };
    if (appleType) appleEntry.type = appleType;
    icons.apple = [appleEntry];
  }

  return icons;
}
