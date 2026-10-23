// Free-tool block types, shared by the server route (app/[...slug]/page.jsx) and ToolSections.jsx.
// Kept out of that "use client" file: a server component cannot call a client module's function.
// Must match TOOL_BLOCKS in the admin's src/components/page-builder/toolBlocks.js.
export const TOOL_BLOCK_TYPES = ["ToolHero", "ToolCalculator", "ToolsGrid", "ToolContent", "ToolFaq", "ToolForm", "ToolCta", "ToolMore", "ToolNote"];

export const isToolSection = (section) => TOOL_BLOCK_TYPES.includes(section?.type);
