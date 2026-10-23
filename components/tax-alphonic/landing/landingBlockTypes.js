// Header / footer region blocks of a landing page (admin: src/components/page-builder/landingBlocks.js,
// backend: services/landing/landingValidation.js). Server-safe: no "use client", so server code can use it.
// Every other block of a landing page is a normal Page Builder block rendered by ApiServicePage.

export const LANDING_HEADER = "LandingHeader";
export const LANDING_FOOTER = "LandingFooter";

export const isLandingRegion = (section) => section?.type === LANDING_HEADER || section?.type === LANDING_FOOTER;

/** Splits a landing page's blocks into its header block, body blocks and footer block. */
export function splitLandingSections(sections) {
  const list = Array.isArray(sections) ? sections : [];
  return {
    header: list.find((s) => s?.type === LANDING_HEADER) || null,
    body: list.filter((s) => s && !isLandingRegion(s)),
    footer: list.find((s) => s?.type === LANDING_FOOTER) || null,
  };
}

/** "site" (the website's own header / footer, from Menus & Settings), "simple" (page-specific) or "none". No block = "site". */
export function regionMode(section) {
  const mode = section?.payload?.mode;
  return mode === "simple" || mode === "none" ? mode : "site";
}
