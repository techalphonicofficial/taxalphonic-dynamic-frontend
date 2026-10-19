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

/** Branding and contact details for the root layout. Never throws; missing settings fall back. */
export const getSiteSettings = cache(async function getSiteSettings() {
  const [org, contact, address, social] = await Promise.all(
    ["organization", "contact", "address", "social"].map(loadGroup)
  );

  return {
    branding: branding(org),
    contact: contactDetails({ contact, address, social }),
  };
});
