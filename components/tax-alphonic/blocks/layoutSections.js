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
  let areaOrder = null;
  for (const section of first < 0 ? [] : all.slice(first)) {
    if (section.type !== LAYOUT_SECTION) {
      groups[groups.length - 1]?.items.push(section);
      continue;
    }
    const p = section.payload || {};
    if (p.scope === "base") {
      baseMainWidth = widthOf(p.mainWidth);
      areaOrder = Array.isArray(p.areaOrder) ? p.areaOrder.map(String) : null;
    } else groups.push({ id: section.id, layout: p.layout === "full" ? "full" : "split", mainWidth: widthOf(p.mainWidth), items: [] });
  }
  return { base, baseMainWidth, areaOrder, groups };
}

/*
 * Order of a page's areas (2026-11-13; admin Page Builder ↑ / ↓ on each area): the built-in areas of the
 * service-page layout (hero, top, body = main + sidebar, bottom) and the layout sections, in any order.
 * Saved as payload.areaOrder of the "base" LayoutSection marker: built-in keys and "g" (the next layout
 * section, in list order). Missing built-ins go back to their usual place, extra sections to the end; no
 * order = hero, top, body, bottom, then the sections (as before). Keep in sync with the admin's layoutZones.js.
 * Returns [{ key }] / [{ group: index }].
 */
export const BUILTIN_AREAS = ["hero", "top", "body", "bottom"];
export function areaTokens(areaOrder, groupCount) {
  const tokens = [];
  const seen = new Set();
  let g = 0;
  (Array.isArray(areaOrder) ? areaOrder : []).forEach((key) => {
    if (key === "g") {
      if (g < groupCount) tokens.push({ group: g++ });
    } else if (BUILTIN_AREAS.includes(key) && !seen.has(key)) {
      seen.add(key);
      tokens.push({ key });
    }
  });
  BUILTIN_AREAS.forEach((key, i) => {
    if (seen.has(key)) return;
    let at = 0;
    for (let j = i - 1; j >= 0; j -= 1) {
      const before = tokens.findIndex((t) => t.key === BUILTIN_AREAS[j]);
      if (before >= 0) {
        at = before + 1;
        break;
      }
    }
    tokens.splice(at, 0, { key });
    seen.add(key);
  });
  while (g < groupCount) tokens.push({ group: g++ });
  return tokens;
}

/** Props for a main + sidebar grid with a chosen share ({} keeps the design's own columns). */
export const mainWidthProps = (mainWidth) => (mainWidth ? { style: { "--ta-lg-main": `${mainWidth}%` } } : {});
