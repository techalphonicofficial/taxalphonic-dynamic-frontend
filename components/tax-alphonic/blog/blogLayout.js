// Blog post layout (admin: Blog → Page Builder, blockSet="blog"). Keep in sync with the admin's
// components/page-builder/blogBlocks.js (block types, default texts, settings keys).
//
// A post's sections may hold:
//   - the blog blocks below (On this page, Share, Expert help card), placed like any block
//     (config.placement main | sidebar | top | bottom; none = sidebar);
//   - one "BlogSettings" entry (never drawn): sidebar side / width, sticky part, cover image
//     position, text width, reading progress bar, table of contents on phones.
// Posts saved before this layout have no BlogSettings: their blocks stay in one column and the
// three sidebar cards are added, so they look as they did.

export const BLOG_SETTINGS = "BlogSettings";
export const BLOG_BLOCK_TYPES = new Set(["BlogToc", "BlogShare", "BlogExpertCta"]);
export const isBlogBlock = (section) => BLOG_BLOCK_TYPES.has(section?.type);

export const BLOG_SETTINGS_DEFAULT = {
  sidebar: "right", // right | left | none
  sidebarWidth: 300, // px, 220–460
  sticky: "toc", // toc (from "On this page" down) | all | none
  cover: "beside", // beside (next to the title) | below (full width under it) | none
  textWidth: "full", // full | comfortable (~900px) | narrow (~760px)
  progress: "yes", // reading progress bar at the top
  tocMobile: "yes", // "On this page" as a fold-out box above the article on phones / tablets
  foot: "full", // tags / author / comments: full | center (~900px) | article (under the article column)
};

export const BLOG_BLOCK_DEFAULTS = {
  BlogToc: { title: "On this page", icon: "📑", levels: "h2h3" },
  BlogShare: { title: "Share this article", copyLink: "yes" },
  BlogExpertCta: {
    heading: "Need expert help?",
    text: "Get a free consultation with a Tax Alphonic expert.",
    button: { text: "🎧 Talk to an expert", url: "/talk-to-expert" },
  },
};

const clamp = (value, min, max, fallback) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.min(max, Math.max(min, n)) : fallback;
};

/** { settings, sections } with the BlogSettings entry taken out, and old posts given the default layout. */
export function splitBlogSettings(input) {
  const list = Array.isArray(input) ? input : [];
  const entry = list.find((section) => section?.type === BLOG_SETTINGS);
  const rest = list.filter((section) => section?.type !== BLOG_SETTINGS);
  if (!entry) {
    // Old posts: one column, as before (the service default would move a FAQ / form elsewhere).
    const kept = rest.map((section) => (section.config?.placement || section.type === "LayoutSection" ? section : { ...section, config: { ...(section.config || {}), placement: "main" } }));
    const defaults = Object.entries(BLOG_BLOCK_DEFAULTS).map(([type, payload]) => ({ id: `default-${type}`, type, config: { placement: "sidebar" }, payload }));
    // The cards belong to the page's own area, i.e. before the first repeatable layout section.
    const marker = kept.findIndex((section) => section.type === "LayoutSection");
    const at = marker < 0 ? kept.length : marker;
    return {
      legacy: true,
      settings: { ...BLOG_SETTINGS_DEFAULT },
      sections: [...kept.slice(0, at), ...defaults, ...kept.slice(at)],
    };
  }
  const p = { ...BLOG_SETTINGS_DEFAULT, ...(entry.payload || entry.data?.payload || {}) };
  return {
    legacy: false,
    settings: { ...p, sidebarWidth: clamp(p.sidebarWidth, 220, 460, 300) },
    sections: rest,
  };
}
