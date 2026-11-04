// Repeatable layout sections (admin: "Add section" in every Page Builder). Server-safe. A LayoutSection
// block in the page's list starts a section; the blocks after it, up to the next one, belong to it.
// payload: { layout: "full" | "split", mainWidth } (main column share in %), or { scope: "base", mainWidth }:
// only the width of the page's first main + sidebar area. Blocks before the first marker render as
// they always did, so pages without markers do not change.
export const LAYOUT_SECTION = "LayoutSection";

const widthOf = (value) => {
  const n = Number(value);
  return n >= 30 && n <= 85 ? n : null;
};

export function splitLayoutSections(sections) {
  const all = Array.isArray(sections) ? sections.filter(Boolean) : [];
  const first = all.findIndex((section) => section.type === LAYOUT_SECTION);
  const base = first < 0 ? all : all.slice(0, first);
  const groups = [];
  let baseMainWidth = null;
  for (const section of first < 0 ? [] : all.slice(first)) {
    if (section.type !== LAYOUT_SECTION) {
      groups[groups.length - 1]?.items.push(section);
      continue;
    }
    const p = section.payload || {};
    if (p.scope === "base") baseMainWidth = widthOf(p.mainWidth);
    else groups.push({ id: section.id, layout: p.layout === "full" ? "full" : "split", mainWidth: widthOf(p.mainWidth), items: [] });
  }
  return { base, baseMainWidth, groups };
}

/** Props for a main + sidebar grid with a chosen share ({} keeps the design's own columns). */
export const mainWidthProps = (mainWidth) => (mainWidth ? { style: { "--ta-lg-main": `${mainWidth}%` } } : {});
