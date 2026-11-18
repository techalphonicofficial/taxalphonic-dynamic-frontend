import Link from "next/link";
import ButtonLabel from "./ButtonLabel";
import "./blocks.css";
import "./center-grids.css";

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

/*
 * Phone view of any block (admin: the block's "Mobile view" panel, saved as section.config.mobile).
 * Applies up to 767px (blocks.css "Mobile view"); desktop / tablet never change. Keys:
 *   hide: "yes"                         block not shown on phones
 *   bg: same | image | none             background image on phones (heroes default "none", others "same")
 *   image, position                     the phone image (bg "image")
 *   color                               phone background colour (#hex, any bg mode)
 *   shade: light | dark, shadeOpacity   veil over the phone background
 *   text: dark | light                  text colour on phones (else follows background / shade)
 *   images: show | hide                 images in the block (heroes default: side image hidden)
 *   align: left | center | right, headSize, textSize, padTop, padBottom (px)
 *   buttons: full                       buttons full width, one under the other
 *   hideKicker / hideSub / hideButtons: "yes"
 * Cards per row on phones stay in config.layout.colsPhone ("Heading & cards").
 * Keep in sync with cms-admin components/page-builder/MobileSettings.jsx.
 */
export const MOBILE_HERO_BLOCKS = new Set(["HeroBanner", "HomeHero", "CommonFormHero", "JourneyHero", "ToolHero"]);
const M_POS = new Set(["center", "top", "bottom", "left", "right"]);
const M_HEX = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
const mPx = (v, min, max) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : null;
};

export function mobileOf(config, type = "") {
  const m = config?.mobile && typeof config.mobile === "object" ? config.mobile : {};
  const isHero = MOBILE_HERO_BLOCKS.has(type);
  const image = String(m.image || "").trim();
  let bg = ["same", "image", "none"].includes(m.bg) ? m.bg : isHero ? "none" : "same";
  if (bg === "image" && !image) bg = "same";
  return {
    m,
    isHero,
    bg,
    image: bg === "image" ? image : "",
    position: M_POS.has(m.position) ? m.position : "center",
    color: M_HEX.test(String(m.color || "")) ? m.color : "",
    shade: m.shade === "light" || m.shade === "dark" ? m.shade : "",
    shadeAlpha: (mPx(m.shadeOpacity, 0, 100) ?? (m.shade === "dark" ? 55 : 80)) / 100,
    images: m.images === "show" || m.images === "hide" ? m.images : isHero ? "hero" : "show",
  };
}

/** The display: contents wrapper's classes / variables (everything except the background). */
function mobileWrapOf(mob) {
  const { m } = mob;
  const classes = [];
  const style = {};
  if (m.hide === "yes") classes.push("ta-m-hide");
  if (mob.images === "hide") classes.push("ta-m-img-hide");
  else if (mob.images === "hero") classes.push("ta-m-heroimg-hide");
  if (["left", "center", "right"].includes(m.align)) classes.push(`ta-m-al-${m.align}`);
  const hs = mPx(m.headSize, 16, 64);
  if (hs) { classes.push("ta-m-hs"); style["--m-hs"] = `${hs}px`; }
  const ts = mPx(m.textSize, 11, 24);
  if (ts) { classes.push("ta-m-ts"); style["--m-ts"] = `${ts}px`; }
  const pt = mPx(m.padTop, 0, 300);
  const pb = mPx(m.padBottom, 0, 300);
  if (pt !== null) { classes.push("ta-m-pt"); style["--m-pt"] = `${pt}px`; }
  if (pb !== null) { classes.push("ta-m-pb"); style["--m-pb"] = `${pb}px`; }
  if (m.buttons === "full") classes.push("ta-m-btn-full");
  if (m.hideKicker === "yes") classes.push("ta-m-no-kicker");
  if (m.hideSub === "yes") classes.push("ta-m-no-sub");
  if (m.hideButtons === "yes") classes.push("ta-m-no-btns");
  return classes.length ? { className: `ta-m ${classes.join(" ")}`, style } : null;
}

const themeOf = (value) => (value === "light" || value === "dark" ? value : "");

function Background({ config, hero = false, mob, children }) {
  const desk = backgroundOf(config);
  // Phones may get a background of their own (image / colour) even when desktop has none.
  const phoneOnly = !desk && Boolean(mob.image || mob.color);
  if (!desk && !phoneOnly) return children;
  const bg = desk || { color: "", image: "" };

  const overlay = desk ? Math.max(0, Math.min(100, Number(bg.overlayOpacity) || 0)) : 0;
  const textTheme = !desk ? "" : bg.textTheme === "light" || bg.textTheme === "dark" ? bg.textTheme : autoTextTheme(bg, overlay);

  // Text colour on phones: chosen, or from the shade, or from what the phone background is.
  const phoneColor = mob.color || bg.color;
  let phoneTheme;
  if (themeOf(mob.m.text)) phoneTheme = mob.m.text;
  else if (mob.shade) phoneTheme = mob.shade === "dark" ? "light" : "dark";
  else if (mob.bg === "same") phoneTheme = mob.color ? autoTextTheme({ ...bg, color: phoneColor }, overlay) : textTheme;
  else if (mob.bg === "image") phoneTheme = "";
  else phoneTheme = phoneColor ? (isDark(phoneColor) ? "light" : "dark") : "";

  // Heroes bring their own spacing; other blocks get some room inside the colour by default.
  const padding = !desk ? "none" : PADDING.has(bg.padding) ? bg.padding : hero ? "none" : "md";
  const style = {};
  if (bg.color) style.backgroundColor = bg.color;
  if (mob.color && mob.color !== bg.color) style["--m-bgc"] = mob.color;
  const classes = [
    "ta-bg",
    phoneOnly ? "ta-bg-monly" : "",
    hero ? "ta-bg-hero" : "",
    `ta-bg-pad-${padding}`,
    bg.rounded === "yes" ? "ta-bg-rounded" : "",
    textTheme === phoneTheme
      ? (textTheme ? `ta-bg-${textTheme}` : "")
      : [textTheme ? `ta-bg-d-${textTheme}` : "", phoneTheme ? `ta-bg-m-${phoneTheme}` : ""].filter(Boolean).join(" "),
    mob.color && mob.color !== bg.color ? "ta-bg-mc" : "",
    mob.bg === "none" ? "ta-bg-m-noimg" : mob.bg === "image" ? "ta-bg-m-ownimg" : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={classes} style={Object.keys(style).length ? style : undefined}>
      {mob.image && (
        <div
          className="ta-bg-mimg"
          aria-hidden="true"
          style={{ backgroundImage: `url("${mob.image.replace(/"/g, "%22")}")`, backgroundPosition: mob.position }}
        />
      )}
      {mob.shade && (
        <div
          className="ta-bg-mshade"
          aria-hidden="true"
          style={{ background: mob.shade === "dark" ? `rgba(10, 14, 26, ${mob.shadeAlpha})` : `rgba(255, 255, 255, ${mob.shadeAlpha})` }}
        />
      )}
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

const CONTENT_WIDTH = { full: "100%", wide: "1600px", site: "", medium: "1200px", narrow: "960px" };

/*
 * "Heading & cards" panel (admin CardLayoutSettings.jsx, section.config.layout): cards per row
 * (desktop / tablet / phone), gap, card padding, short-row position, text inside cards, heading
 * alignment and space under it. Classes / variables for blocks/center-grids.css.
 */
const ALIGN = new Set(["left", "center", "right"]);
function layoutInto(layout, classes, style) {
  if (!layout || typeof layout !== "object") return;
  const int = (value, min, max) => {
    if (value === "" || value === null || value === undefined) return null;
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : null;
  };
  const cols = int(layout.cols, 1, 8);
  const md = int(layout.colsTablet, 1, 6);
  const sm = int(layout.colsPhone, 1, 3);
  const gap = int(layout.gap, 0, 80);
  const pad = int(layout.cardPadding, 0, 80);
  const headGap = int(layout.headGap, 0, 120);
  if (cols) { classes.push("ta-ly-cols"); style["--ly-cols"] = cols; }
  if (md) { classes.push("ta-ly-md"); style["--ly-cols-md"] = md; }
  if (sm) { classes.push("ta-ly-sm"); style["--ly-cols-sm"] = sm; }
  if (gap !== null) { classes.push("ta-ly-gap"); style["--ly-g"] = `${gap}px`; }
  if (pad !== null) { classes.push("ta-ly-cp"); style["--ly-cp"] = `${pad}px`; }
  if (headGap !== null) { classes.push("ta-ly-hg"); style["--ly-hg"] = `${headGap}px`; }
  if (layout.rowAlign === "left") classes.push("ta-ly-rl");
  if (layout.rowAlign === "right") classes.push("ta-ly-rr");
  if (ALIGN.has(layout.cardAlign)) classes.push(`ta-ly-ca-${layout.cardAlign}`);
  if (ALIGN.has(layout.headAlign)) classes.push(`ta-ly-ha-${layout.headAlign}`);

  // Heading / sub text width: "full" = no reading-width cap, "line" = one line on wide screens.
  if (["full", "line"].includes(layout.headWidth)) classes.push(`ta-ly-hw-${layout.headWidth}`);
  if (["full", "line"].includes(layout.subWidth)) classes.push(`ta-ly-sw-${layout.subWidth}`);
  // A set maximum width in px (preset "600" … or "custom" + headWidthPx / subWidthPx).
  const widthPx = (value, custom) => (value === "custom" ? int(custom, 200, 2000) : /^\d+$/.test(String(value || "")) ? int(value, 200, 2000) : null);
  const hw = widthPx(layout.headWidth, layout.headWidthPx);
  const sw = widthPx(layout.subWidth, layout.subWidthPx);
  if (hw) { classes.push("ta-ly-hw-px"); style["--ly-hw"] = `${hw}px`; }
  if (sw) { classes.push("ta-ly-sw-px"); style["--ly-sw"] = `${sw}px`; }
  // Colours and heading size.
  const colours = { headColor: ["ta-ly-hc", "--ly-hc"], subColor: ["ta-ly-sc", "--ly-sc"], kickerColor: ["ta-ly-kc", "--ly-kc"] };
  for (const [key, [cls, prop]] of Object.entries(colours)) {
    if (HEX_COLOR.test(String(layout[key] || ""))) { classes.push(cls); style[prop] = layout[key]; }
  }
  const headSize = int(layout.headSize, 14, 96);
  if (headSize) { classes.push("ta-ly-hs"); style["--ly-hs"] = `${headSize}px`; }
  // Two-tone highlight (*words* / <em> in headings): colour 1 covers hlShare % of the words,
  // then blends (hlBlend %) into colour 2.
  const from = HEX_COLOR.test(String(layout.hlFrom || "")) ? layout.hlFrom : "";
  const to = HEX_COLOR.test(String(layout.hlTo || "")) ? layout.hlTo : "";
  const share = int(layout.hlShare, 0, 100);
  const blend = int(layout.hlBlend, 0, 100);
  if (from || to || share !== null || blend !== null) {
    const s = share ?? 50;
    const b = blend ?? 60;
    classes.push("ta-ly-hl");
    if (from) style["--ly-hl-1"] = from;
    if (to) style["--ly-hl-2"] = to;
    style["--ly-hl-a"] = `${Math.max(0, s - b / 2)}%`;
    style["--ly-hl-b"] = `${Math.min(100, s + b / 2)}%`;
  }
}

function spacingOf(config) {
  const spacing = config?.spacing && typeof config.spacing === "object" ? config.spacing : {};
  const classes = [];
  const style = {};
  layoutInto(config?.layout, classes, style);
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
  // Content width of this block (admin Spacing "Content width"): overrides the site page width
  // (--ta-page-max, Settings → Website Layout) inside this block only.
  const width = CONTENT_WIDTH[spacing.contentWidth] || (spacing.contentWidth === "custom" ? Number(spacing.customWidth) : 0);
  if (width) {
    classes.push("ta-sp-cw");
    style["--ta-page-max"] = typeof width === "string" ? width : `${Math.max(320, Math.min(3000, Math.round(width)))}px`;
  }
  // Text width: "full" lets headings / paragraphs use the whole block width (no reading-width cap).
  if (spacing.textWidth === "full") classes.push("ta-sp-tw-full");
  const borderRadius = Number(spacing.borderRadius);
  if (spacing.borderRadius !== "" && spacing.borderRadius !== null && spacing.borderRadius !== undefined && borderRadius >= 0) {
    classes.push("ta-sp-br");
    style["--sp-br"] = `${Math.min(200, Math.round(borderRadius))}px`;
  }
  return classes.length ? { className: `ta-sp ${classes.join(" ")}`, style } : null;
}

// Extra buttons of any block (admin: the block's "Buttons" panel, saved as section.config.buttons =
// { items: [{ text, url, icon, iconSide, style, size, color }], align, position: below | above }).
// Plain links, so form popups ("#form-<id>", FormPopupHost), #anchors and the landing link guard all
// work as with any CMS link. Styles: .ta-blk-btns in blocks.css.
const BTN_STYLES = new Set(["solid", "outline", "soft", "dark", "white", "link", "gradient"]);
const BTN_SIZES = new Set(["sm", "md", "lg"]);
const isExternal = (url) => /^(?:https?:)?\/\//i.test(url) || /^(mailto|tel):/i.test(url);

function buttonsOf(config) {
  const set = config?.buttons;
  const items = Array.isArray(set?.items) ? set.items.filter((b) => b && String(b.text || "").trim()) : [];
  return items.length ? { ...set, items } : null;
}

function BlockButtons({ set }) {
  const align = ["center", "right", "stretch"].includes(set.align) ? set.align : "left";
  return (
    <div className={`ta-blk-btns ta-blk-btns-${align} ta-blk-btns-${set.position === "above" ? "above" : "below"}`}>
      {set.items.map((b, i) => {
        const url = String(b.url || "").trim();
        const style = BTN_STYLES.has(b.style) ? b.style : "solid";
        const size = BTN_SIZES.has(b.size) ? b.size : "md";
        const className = `ta-blk-btn ta-blk-btn-${style} ta-blk-btn-${size}`;
        const css = HEX_COLOR.test(String(b.color || "")) ? { "--bb-c": b.color } : undefined;
        const label = <ButtonLabel button={b} />;
        if (!url) return <span key={i} className={className} style={css}>{label}</span>;
        if (isExternal(url)) return <a key={i} href={url} className={className} style={css} target={/^(mailto|tel):/i.test(url) ? undefined : "_blank"} rel="noopener noreferrer">{label}</a>;
        if (url.startsWith("#")) return <a key={i} href={url} className={className} style={css}>{label}</a>;
        return <Link key={i} href={url} className={className} style={css}>{label}</Link>;
      })}
    </div>
  );
}

/** `type` = the block type (section.type): heroes get "no image on phones" by default. */
export default function BlockBackground({ config, hero = false, type = "", children }) {
  const buttons = buttonsOf(config);
  const inner = buttons
    ? (buttons.position === "above" ? <><BlockButtons set={buttons} />{children}</> : <>{children}<BlockButtons set={buttons} /></>)
    : children;
  const mob = mobileOf(config, type);
  const body = <Background config={config} hero={hero} mob={mob}>{inner}</Background>;
  const spacing = spacingOf(config);
  const spaced = spacing ? <div className={spacing.className} style={spacing.style}>{body}</div> : body;
  // Mobile view (phones only): display: contents, so desktop / tablet layout is untouched.
  const wrap = mobileWrapOf(mob);
  const node = wrap ? <div className={wrap.className} style={{ ...wrap.style, display: "contents" }}>{spaced}</div> : spaced;
  // Admin Live Preview only: marks the block being edited, so it can draw the spacing over it.
  const marked = config?.previewMark ? <div data-ta-block={config.previewMark}>{node}</div> : node;
  // Admin Live Preview only: every block carries its id, so a click on it opens it in the editor.
  // display: contents, so the page layout stays exactly the same.
  return config?.previewId ? <div data-ta-bid={config.previewId} style={{ display: "contents" }}>{marked}</div> : marked;
}
