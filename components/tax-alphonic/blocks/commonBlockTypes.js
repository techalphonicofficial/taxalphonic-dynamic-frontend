// General-purpose Page Builder blocks usable in every builder (homepage, service pages, CMS pages,
// blogs, journey stages, tools). Server-safe (no "use client"), so server routes may call these.
// Must match COMMON_BLOCKS in the admin's src/components/page-builder/commonBlocks.js.
export const COMMON_BLOCK_TYPES = [
  "CommonText", "CommonImageText", "CommonImage", "CommonVideo", "CommonGallery", "CommonStats",
  "CommonCards", "CommonLogos", "CommonButtons", "CommonSpacer", "CommonEmbed",
];

export const isCommonSection = (section) => COMMON_BLOCK_TYPES.includes(section?.type);

/** Homepage blocks (HomeHero, HomeFaq, ...) can be placed on any page too. */
export const isHomeSection = (section) => /^Home[A-Z]/.test(String(section?.type || ""));
