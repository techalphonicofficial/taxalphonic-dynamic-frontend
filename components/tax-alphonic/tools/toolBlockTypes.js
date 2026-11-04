// Free-tool block types, shared by the server route (app/[...slug]/page.jsx) and ToolSections.jsx.
// Kept out of that "use client" file: a server component cannot call a client module's function.
// Must match TOOL_BLOCKS in the admin's src/components/page-builder/toolBlocks.js.
export const TOOL_BLOCK_TYPES = ["ToolHero", "ToolCalculator", "ToolsGrid", "ToolContent", "ToolFaq", "ToolForm", "ToolCta", "ToolMore", "ToolNote"];

export const isToolSection = (section) => TOOL_BLOCK_TYPES.includes(section?.type);

/** A free tool page or the hub: other pages may hold Tool blocks too, without becoming one. */
export function isToolPage(page) {
  const slug = String(page?.slug || "").replace(/^\/+/, "");
  return slug === "tools" || slug.startsWith("tool/")
    || Boolean(page?.sections?.some((section) => ["ToolHero", "ToolCalculator"].includes(section?.type)));
}
