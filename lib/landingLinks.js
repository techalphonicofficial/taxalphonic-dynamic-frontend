// Landing pages never navigate away (ad landing pages: the visitor stays on the page).
// Allowed on a landing page: anchors on the same page (#process, #faq; "/#x" becomes "#x"), form popups
// (#form, #form-<id>, lib/formPopup.js) and tel: / mailto: / sms:. Anything else (a page of the
// main website, another site, WhatsApp, social profiles, ...) opens the page's form popup instead.
//
// Enforced three times:
// - server: lockLandingLinks() rewrites the link values of the blocks (service/landingPageService.js),
//   so the HTML holds no outbound hrefs;
// - client: LandingLinkGuard (components/tax-alphonic/landing) sets window.__taLandingLock, blocks
//   clicks on any remaining <a> and rewrites their href (module content, website header / footer);
// - code paths that navigate without a link (useGo in the section renderers, form redirects) ask
//   blockLandingNavigation() first.

import { openFormPopup } from "@/lib/formPopup";

export const LANDING_FALLBACK_URL = "#form";

/** True for a link that keeps the visitor on the landing page. */
export function isInPageHref(href) {
  const url = String(href ?? "").trim();
  if (!url) return true;
  if (url.startsWith("#")) return true;
  return /^(tel|mailto|sms):/i.test(url);
}

// "/#process" meant this page while landing pages had their own subdomain; at /lp/<label> it
// would be the homepage, so it becomes "#process".
const OLD_SAME_PAGE = /^\/#/;

/** The link as allowed on a landing page: kept when in-page, "/#x" → "#x", else the form popup. */
export function landingHref(href) {
  const url = String(href ?? "").trim();
  if (OLD_SAME_PAGE.test(url)) return url.slice(1);
  return isInPageHref(url) ? url : LANDING_FALLBACK_URL;
}

/**
 * In the browser: the in-page form of a link to this very page ("https://taxalphonic.com/lp/cbdt#faq",
 * "/lp/cbdt#faq" → "#faq"; no hash → "#top"), else null.
 */
export function samePageHref(href) {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(String(href ?? "").trim(), window.location.href);
    if (url.origin !== window.location.origin || url.pathname.replace(/\/+$/, "") !== window.location.pathname.replace(/\/+$/, "")) return null;
    return url.hash || "#top";
  } catch {
    return null;
  }
}

/** Scrolls to "#id" on the page. */
function scrollToHash(hash) {
  document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: "smooth" });
}

/** True while a landing page is shown (set by LandingLinkGuard). */
export function landingLocked() {
  return typeof window !== "undefined" && Boolean(window.__taLandingLock);
}

/**
 * For code that navigates without a link: on a landing page an outbound URL opens the form popup
 * instead. Returns true when the navigation was handled (the caller must stop).
 */
export function blockLandingNavigation(url, label = "") {
  if (!landingLocked() || isInPageHref(url)) return false;
  const local = OLD_SAME_PAGE.test(String(url).trim()) ? String(url).trim().slice(1) : samePageHref(url);
  if (local) scrollToHash(local);
  else openFormPopup(LANDING_FALLBACK_URL); // the button text of a blocked link is not a form heading
  return true;
}

// Keys whose string value is a link the website follows. `url` is only a link inside a
// button / card / link item (it is the media address of video and embed blocks).
const LINK_KEY = /^(href|link|.*(?:Url|Link|Href))$/;
const MEDIA_KEY = /(image|img|logo|icon|avatar|photo|poster|video|embed|src|thumb|banner|background|media)/i;
const MEDIA_BLOCKS = new Set(["CommonVideo", "CommonEmbed"]);
const HTML_LINK = /(<a\b[^>]*?\bhref\s*=\s*)(["'])(.*?)\2/gi;

function lockValue(value, key, parent) {
  if (typeof value === "string") {
    const isLink = (LINK_KEY.test(key) && !MEDIA_KEY.test(key)) || (key === "url" && parent && !Array.isArray(parent));
    if (isLink) return landingHref(value);
    if (value.includes("<a")) return value.replace(HTML_LINK, (all, start, quote, href) => `${start}${quote}${landingHref(href)}${quote}`);
    return value;
  }
  if (Array.isArray(value)) return value.map((item) => lockValue(item, key, value));
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, lockValue(v, k, value)]));
  }
  return value;
}

/** The sections with every outbound link value turned into the form popup ("#form"). */
export function lockLandingLinks(sections) {
  return (Array.isArray(sections) ? sections : []).map((section) => {
    if (!section || typeof section !== "object") return section;
    const payload = section.payload;
    if (!payload || typeof payload !== "object") return section;
    if (MEDIA_BLOCKS.has(section.type)) {
      // The block's own `url` is its video / embed address: keep it, lock the rest.
      const { url, ...rest } = payload;
      return { ...section, payload: { ...lockValue(rest, "", null), ...(url !== undefined ? { url } : {}) } };
    }
    return { ...section, payload: lockValue(payload, "", null) };
  });
}
