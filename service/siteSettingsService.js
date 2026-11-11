import { apiClient } from "@/service/apiClient";
import { normalizeAssetUrl } from "@/service/servicePageService";
import { cache } from "react";

// Site-wide settings from the CMS (admin: Settings → Organization / Contact / Address /
// Social Media), shaped for the layout.

const FALLBACK_LOGO = "/logo.png";

async function loadGroup(group) {
  try {
    const payload = await apiClient(`/api/v1/settings/${group}`, { cache: "no-store" });
    return payload?.success && payload.data && typeof payload.data === "object" ? payload.data : {};
  } catch (error) {
    console.error(`Unable to load ${group} settings.`, error);
    return {};
  }
}

const text = (value) => String(value ?? "").trim();
const asset = (value) => (text(value) ? normalizeAssetUrl(text(value)) : "");

// Social links in the reference order, with the short label shown in the footer square.
const SOCIALS = [
  ["linkedin", "in", "LinkedIn"],
  ["twitterX", "X", "X (Twitter)"],
  ["twitter", "X", "X (Twitter)"],
  ["facebook", "f", "Facebook"],
  ["youtube", "▶", "YouTube"],
  ["instagram", "IG", "Instagram"],
  ["pinterest", "P", "Pinterest"],
  ["telegram", "TG", "Telegram"],
  ["whatsappLink", "WA", "WhatsApp"],
  ["threads", "@", "Threads"],
  ["tumblr", "t", "Tumblr"],
];

function socialLinks(social) {
  const seen = new Set();
  return SOCIALS.map(([key, label, name]) => ({ label, name, url: text(social[key]) }))
    .filter((link) => link.url && !seen.has(link.url) && seen.add(link.url));
}

function fullAddress(address, contact) {
  const zip = text(address.zipPostalCode || address.zipCode);
  const parts = [address.addressLine1, address.addressLine2, address.area, address.city, address.state, address.country].map(text).filter(Boolean);
  if (parts.length) return `${parts.join(", ")}${zip ? ` ${zip}` : ""}`;
  return text(contact.address);
}

/**
 * Logos: `lightLogo` is shown in light mode (and on white, like the footer badge), `darkLogo` in
 * dark mode; each falls back to `logo`, then to the bundled /logo.png.
 */
function branding(org) {
  const logo = asset(org.logo);
  return {
    name: text(org.shortName || org.organizationName) || "Tax Alphonic",
    tagline: text(org.tagline),
    logo: logo || FALLBACK_LOGO,
    lightLogo: asset(org.lightLogo) || logo || FALLBACK_LOGO,
    darkLogo: asset(org.darkLogo) || logo || FALLBACK_LOGO,
    favicon: asset(org.favicon),
    appleTouchIcon: asset(org.appleTouchIcon),
  };
}

/** Contact details for the footer "Get in touch" column, from the Contact / Address / Social settings. */
function contactDetails({ contact, address, social }) {
  return {
    address: fullAddress(address, contact),
    phone: text(contact.tollFreeNumber || contact.mobileNumber || contact.phone),
    email: text(contact.supportEmail),
    socials: socialLinks(social),
  };
}

/**
 * Settings → Website Layout (group "layout") as CSS variables for :root. Only numbers / known
 * words go into the CSS. Empty = the defaults in app/globals.css (full width, 10px sides).
 *   pageWidth: "full" | "1200" | "1320" | "1440" | "1600" | "1800" | "custom" (+ customWidth px)
 *   gutter (px, desktop), gutterMobile (px, phones under 768px), sectionGap (px)
 *   heroTextWidth: "normal" | "wide" | "full"
 */
const num = (value, min, max) => {
  if (value === "" || value === null || value === undefined) return null;
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
};

export function layoutCss(layout = {}) {
  const vars = [];
  const width = String(layout.pageWidth || "").trim();
  if (width === "full") vars.push("--ta-page-max:100%");
  else if (width === "custom") {
    const w = num(layout.customWidth, 600, 3000);
    if (w) vars.push(`--ta-page-max:${w}px`);
  } else if (/^\d{3,4}$/.test(width)) vars.push(`--ta-page-max:${num(width, 600, 3000)}px`);

  const desktop = num(layout.gutter, 0, 160);
  const mobile = num(layout.gutterMobile, 0, 80);
  if (desktop !== null) vars.push(`--ta-gutter:${desktop}px`);
  const gap = num(layout.sectionGap, 0, 200);
  if (gap !== null) vars.push(`--ta-section-gap:${gap}px`);

  const hero = { wide: ["1100px", "820px"], full: ["none", "none"] }[layout.heroTextWidth];
  if (hero) vars.push(`--ta-hero-h1:${hero[0]}`, `--ta-hero-lede:${hero[1]}`);

  let css = vars.length ? `:root{${vars.join(";")}}` : "";
  if (mobile !== null) css += `@media (max-width:767px){:root{--ta-gutter:${mobile}px}}`;
  return css;
}

/** Branding and contact details for the root layout. Never throws; missing settings fall back. */
export const getSiteSettings = cache(async function getSiteSettings() {
  const [org, contact, address, social, layout] = await Promise.all(
    ["organization", "contact", "address", "social", "layout"].map(loadGroup)
  );

  return {
    branding: branding(org),
    contact: contactDetails({ contact, address, social }),
    layoutCss: layoutCss(layout),
  };
});
