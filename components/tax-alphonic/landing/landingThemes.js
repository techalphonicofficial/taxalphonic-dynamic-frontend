// Colour themes of a landing page. The admin's copy (src/components/page-builder/landingThemes.js)
// must list the same keys and colours. The theme is saved on the Header block
// (payload.pageTheme) so it is part of the draft, the published versions and the preview;
// landing-themes.css turns it into colours for every block on the page.

export const LANDING_THEMES = [
  { key: "default", name: "Tax Alphonic", brand: "#0e96ac", accent: "#e8521e", deep: "#0b1120" },
  { key: "ocean", name: "Ocean Blue", brand: "#2563eb", accent: "#f59e0b", deep: "#0b1b3f" },
  { key: "emerald", name: "Emerald", brand: "#059669", accent: "#f97316", deep: "#052e24" },
  { key: "royal", name: "Royal Purple", brand: "#7c3aed", accent: "#ec4899", deep: "#1e1240" },
  { key: "sunset", name: "Sunset Orange", brand: "#ea580c", accent: "#db2777", deep: "#2a1206" },
  { key: "rose", name: "Rose", brand: "#e11d48", accent: "#7c3aed", deep: "#2a0a14" },
  { key: "midnight", name: "Navy & Gold", brand: "#1e3a8a", accent: "#d97706", deep: "#0a1230" },
  { key: "forest", name: "Forest Green", brand: "#15803d", accent: "#ca8a04", deep: "#0c2414" },
  { key: "crimson", name: "Crimson", brand: "#b91c1c", accent: "#f59e0b", deep: "#1c0a0a" },
  { key: "slate", name: "Slate & Sky", brand: "#334155", accent: "#0ea5e9", deep: "#0f172a" },
];

const KEYS = new Set(LANDING_THEMES.map((t) => t.key));
const HEX = /^#[0-9a-f]{6}$/i;

/**
 * A page's own colours (admin "Create your own theme"): pageTheme "custom" with
 * payload.customTheme { brand, accent, deep }. Only exact hex colours are used (they go into CSS).
 */
function customColours(header) {
  const payload = header?.payload || {};
  if (payload.pageTheme !== "custom") return null;
  const custom = payload.customTheme || {};
  return ["brand", "accent", "deep"].every((c) => HEX.test(String(custom[c] || ""))) ? custom : null;
}

/** The theme key of a landing page's Header block ("custom" for the page's own colours), or "default". */
export function landingThemeOf(header) {
  if (customColours(header)) return "custom";
  const key = String(header?.payload?.pageTheme || "").trim();
  return KEYS.has(key) ? key : "default";
}

/** Inline CSS variables of a custom theme (landing-themes.css takes the rest), else undefined. */
export function landingThemeStyle(header) {
  const custom = customColours(header);
  return custom ? { "--t-brand": custom.brand, "--t-accent": custom.accent, "--t-deep": custom.deep } : undefined;
}
