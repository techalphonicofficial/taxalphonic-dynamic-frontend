// General-purpose Page Builder blocks usable in every builder (homepage, service pages, CMS pages,
// blogs, journey stages, tools). Server-safe (no "use client"), so server routes may call these.
// Must match COMMON_BLOCKS in the admin's src/components/page-builder/commonBlocks.js.
export const COMMON_BLOCK_TYPES = [
  "CommonText", "CommonImageText", "CommonImage", "CommonVideo", "CommonGallery", "CommonStats",
  "CommonCards", "CommonLogos", "CommonButtons", "CommonSpacer", "CommonEmbed", "CommonTool",
  // From the reference design (uirefrence.html).
  "CommonFormHero", "CommonCaseStudy", "CommonAwards", "CommonTimeline", "CommonTabs", "CommonStory",
  "CommonTrust", "CommonContact", "CommonMiniFaq", "CommonTextSide",
  // Explore links grid and Questions & answers + knowledge tabs (reference .xhub / .sp-qna + .tpx).
  "CommonExploreHub", "CommonQna",
  // Numbers dashboard: donut, bars, percentage rings and a key-numbers strip (reference .databand).
  "CommonDataBand",
  // Opens a CMS form in a popup a few seconds after the page loads (AutoPopup.jsx).
  "CommonAutoPopup",
  // Centre badge with the platform pillars under it (reference .eco3d).
  "CommonEcosystem",
  // Tabs, each with its own grid of cards (reference .lc labour law section).
  "CommonTabCards",
  // Colour banner with text, numbers, buttons and link cards (reference .hloan Business Loans).
  "CommonLoanBanner",
  // Carousel / slider, latest blog posts and sticky section tabs (ExtraBlocks.jsx).
  "CommonCarousel", "CommonBlogPosts", "CommonAnchorNav",
];

export const isCommonSection = (section) => COMMON_BLOCK_TYPES.includes(section?.type);

/** Homepage blocks (HomeHero, HomeFaq, ...) can be placed on any page too. */
export const isHomeSection = (section) => /^Home[A-Z]/.test(String(section?.type || ""));

/** Service page body blocks (ApiServicePage ServiceBlock), which can also be placed on any page. */
export const SERVICE_BLOCK_TYPES = ["Overview", "WhyUs", "ServicesIncluded", "OurProcess", "Faq", "Form", "Packages", "Highlights", "Checklist", "CallToAction"];
export const isServiceSection = (section) => SERVICE_BLOCK_TYPES.includes(section?.type);

/**
 * Blocks whose content is loaded by service/homeContentService.js attachModuleContent: homepage
 * blocks (their CMS module), the Free Tool block (the calculator of a published tool page) and
 * Latest Blog Posts (the newest live posts), and the tool lists (the published tool pages).
 */
export const needsModuleContent = (section) => isHomeSection(section) || ["CommonTool", "CommonBlogPosts", "ToolsGrid", "ToolMore"].includes(section?.type);
