import "./blocks.css";

/*
 * Background of any Page Builder block (admin: the block's "Background" panel, saved as
 * section.config.background): colour, image (position / size), an overlay colour with its
 * opacity, light or dark text, inner padding and rounded corners. No background set = the block
 * renders exactly as before. Image URLs are made absolute when the sections are mapped
 * (normalizePayload on the config). Server-safe: no hooks, so every renderer can use it.
 */

const PADDING = new Set(["none", "sm", "md", "lg", "xl"]);

export function backgroundOf(config) {
  const bg = config?.background;
  if (!bg || typeof bg !== "object") return null;
  const color = String(bg.color || "").trim();
  const image = String(bg.image || "").trim();
  if (!color && !image) return null;
  return { ...bg, color, image };
}

/** true / false for a dark / light colour (#rgb, #rrggbb, rgb(a)), null when unknown. */
function isDark(color) {
  const value = String(color || "").trim();
  let rgb = null;
  const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    const h = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
    rgb = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  } else {
    const m = value.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i);
    if (m) rgb = m.slice(1, 4).map(Number);
  }
  if (!rgb) return null;
  return 0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2] < 140;
}

/**
 * Text colour when the editor left it on "As designed": a dark overlay (35%+) or a dark
 * background colour gives white text, a light one dark text; a bare image keeps the design.
 */
function autoTextTheme(bg, overlay) {
  const shade = overlay >= 35 ? isDark(bg.overlayColor || "#000000") : bg.image ? null : isDark(bg.color);
  return shade === null ? "" : shade ? "light" : "dark";
}

function Background({ config, hero = false, children }) {
  const bg = backgroundOf(config);
  if (!bg) return children;

  const overlay = Math.max(0, Math.min(100, Number(bg.overlayOpacity) || 0));
  const textTheme = bg.textTheme === "light" || bg.textTheme === "dark" ? bg.textTheme : autoTextTheme(bg, overlay);
  // Heroes bring their own spacing; other blocks get some room inside the colour by default.
  const padding = PADDING.has(bg.padding) ? bg.padding : hero ? "none" : "md";
  const classes = [
    "ta-bg",
    hero ? "ta-bg-hero" : "",
    `ta-bg-pad-${padding}`,
    bg.rounded === "yes" ? "ta-bg-rounded" : "",
    textTheme === "light" ? "ta-bg-light" : textTheme === "dark" ? "ta-bg-dark" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} style={bg.color ? { backgroundColor: bg.color } : undefined}>
      {bg.image && (
        <div
          className="ta-bg-img"
          aria-hidden="true"
          style={{
            backgroundImage: `url("${bg.image.replace(/"/g, "%22")}")`,
            backgroundPosition: bg.position || "center",
            backgroundSize: bg.size === "contain" ? "contain" : bg.size === "repeat" ? "auto" : "cover",
            backgroundRepeat: bg.size === "repeat" ? "repeat" : "no-repeat",
            backgroundAttachment: bg.fixed === "yes" ? "fixed" : undefined,
          }}
        />
      )}
      {overlay > 0 && <div className="ta-bg-overlay" aria-hidden="true" style={{ background: bg.overlayColor || "#000000", opacity: overlay / 100 }} />}
      <div className="ta-bg-content">{children}</div>
    </div>
  );
}

// Spacing of any block (admin: the block's "Spacing" panel, saved as section.config.spacing, in px).
const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const SPACING = { marginTop: "mt", marginBottom: "mb", paddingTop: "pt", paddingBottom: "pb", paddingLeft: "pl", paddingRight: "pr" };

function spacingOf(config) {
  const spacing = config?.spacing;
  if (!spacing || typeof spacing !== "object") return null;
  const classes = [];
  const style = {};
  for (const [key, side] of Object.entries(SPACING)) {
    if (spacing[key] === "" || spacing[key] === null || spacing[key] === undefined) continue;
    const value = Number(spacing[key]);
    if (!Number.isFinite(value) || value < 0) continue;
    classes.push(`ta-sp-${side}`);
    style[`--sp-${side}`] = `${Math.min(400, Math.round(value))}px`;
  }
  // Border: width, then style and colour; radius on its own.
  const borderWidth = Number(spacing.borderWidth);
  if (borderWidth > 0) {
    classes.push("ta-sp-bw");
    style["--sp-bw"] = `${Math.min(40, Math.round(borderWidth))}px`;
    style["--sp-bs"] = ["dashed", "dotted"].includes(spacing.borderStyle) ? spacing.borderStyle : "solid";
    if (HEX_COLOR.test(String(spacing.borderColor || ""))) style["--sp-bc"] = spacing.borderColor;
  }
  const borderRadius = Number(spacing.borderRadius);
  if (spacing.borderRadius !== "" && spacing.borderRadius !== null && spacing.borderRadius !== undefined && borderRadius >= 0) {
    classes.push("ta-sp-br");
    style["--sp-br"] = `${Math.min(200, Math.round(borderRadius))}px`;
  }
  return classes.length ? { className: `ta-sp ${classes.join(" ")}`, style } : null;
}

export default function BlockBackground({ config, hero = false, children }) {
  const body = <Background config={config} hero={hero}>{children}</Background>;
  const spacing = spacingOf(config);
  const node = spacing ? <div className={spacing.className} style={spacing.style}>{body}</div> : body;
  // Admin Live Preview only: marks the block being edited, so it can draw the spacing over it.
  return config?.previewMark ? <div data-ta-block={config.previewMark}>{node}</div> : node;
}
