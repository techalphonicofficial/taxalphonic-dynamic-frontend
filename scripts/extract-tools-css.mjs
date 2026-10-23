// Builds components/tax-alphonic/tools/tools-page.css from uirefrence.html: the CSS of the
// reference's free tools views (#/tools hub and #/tool/<key>), scoped under .ta-tools like home-page.css.
//   node scripts/extract-tools-css.mjs
// A rule is kept when every class in its selector belongs to the tools views;
// its media queries and the @keyframes it animates with come along. Local additions go in
// tools-page.css below the "Local additions" marker, which this script keeps.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import postcss from "postcss";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(root, "uirefrence.html");
const TARGET = path.join(root, "components/tax-alphonic/tools/tools-page.css");
const SCOPE = ".ta-tools";
const MARKER = "/* ---- Local additions (kept by scripts/extract-tools-css.mjs) ---- */";

// Classes of the tools views (matched as prefixes).
const PREFIXES = ["tool-", "tools-", "calc", "hsn-"];
const EXACT = new Set(["crumb", "lede", "eyebrow", "btn-primary", "btn-ghost", "wrap", "tools"]);
// State classes: only together with a tools class.
const MODIFIERS = new Set(["win", "good", "bad", "total", "active"]);

const isToolsClass = (name) => EXACT.has(name) || PREFIXES.some((p) => name.startsWith(p));

function keepSelector(selector) {
  const sel = selector.trim();
  if (!sel || /(^|[\s>+~(,])(html|body|:root)\b/.test(sel) || sel.includes("#")) return false;
  const classes = [...sel.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
  if (!classes.length) return false;
  if (!classes.every((c) => isToolsClass(c) || MODIFIERS.has(c))) return false;
  return classes.some(isToolsClass);
}

const html = fs.readFileSync(SOURCE, "utf8");
const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join("\n");
const source = postcss.parse(css);
const out = postcss.root();
const animations = new Set();
const keyframes = new Map();

source.walkAtRules("keyframes", (rule) => keyframes.set(rule.params.trim(), rule));

function scopedRule(rule) {
  const selectors = rule.selectors.filter(keepSelector);
  if (!selectors.length) return null;
  const clone = rule.clone({ selectors: selectors.map((s) => `${SCOPE} ${s.trim()}`) });
  clone.walkDecls(/^animation(-name)?$/, (decl) => {
    decl.value.split(/[\s,]+/).forEach((word) => { if (keyframes.has(word)) animations.add(word); });
  });
  return clone;
}

for (const node of source.nodes) {
  if (node.type === "rule") {
    const kept = scopedRule(node);
    if (kept) out.append(kept);
  } else if (node.type === "atrule" && node.name === "media") {
    const media = node.clone({ nodes: [] });
    node.each((child) => {
      if (child.type === "rule") {
        const kept = scopedRule(child);
        if (kept) media.append(kept);
      }
    });
    if (media.nodes.length) out.append(media);
  }
}
for (const name of animations) out.append(keyframes.get(name).clone());

// The reference CSS is minified: lay it out one declaration per line.
out.walk((node) => {
  const depth = (() => { let d = 0; for (let p = node.parent; p && p.type !== "root"; p = p.parent) d++; return d; })();
  const pad = "  ".repeat(depth);
  if (node.type === "decl") node.raws = { before: `\n${pad}`, between: ": " };
  else if (node.type === "rule" || node.type === "atrule") {
    node.raws = { before: depth ? `\n${pad}` : "\n\n", between: " ", after: `\n${pad}`, semicolon: true, afterName: " " };
    if (node.type === "rule") node.selector = node.selectors.join(`,\n${pad}`);
  }
});

const base = `${SCOPE} {
  --ink: #0a0e1a;
  --ink2: #1a2236;
  --paper: #fbfbfd;
  --mist: #f3f4f8;
  --line: #e6e8f0;
  --brand: #0e96ac;
  --brand2: #3cb7cc;
  --accent: #e8521e;
  --gold: #f39200;
  --muted: #5b6478;
  --shadow: 0 1px 2px rgba(10,14,26,.04),0 8px 30px rgba(10,14,26,.06);
  --shadow-lg: 0 20px 60px rgba(14,150,172,.16);
  max-width: 100vw;
  overflow-x: clip;
  font-family: var(--font-inter),Inter,system-ui,sans-serif;
  background: var(--paper);
  color: var(--ink);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  padding-bottom: 40px;
}

${SCOPE} * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

${SCOPE} img,
${SCOPE} svg {
  max-width: 100%;
}

${SCOPE} h1,
${SCOPE} h2,
${SCOPE} h3,
${SCOPE} h4 {
  font-family: var(--font-sora),Sora,sans-serif;
  letter-spacing: -.02em;
  line-height: 1.15;
}

${SCOPE} a {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}
`;

const previous = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, "utf8") : "";
const local = previous.includes(MARKER) ? previous.slice(previous.indexOf(MARKER)) : `${MARKER}\n`;
const header = `/*
 * Free tools styles, extracted from uirefrence.html (#/tools and #/tool/<key> views) by
 * scripts/extract-tools-css.mjs and scoped under ${SCOPE}. Regenerate rather than hand-edit
 * this part; local additions live at the end of the file.
 */
`;
const generated = out.toString().replace(/\n{3,}/g, "\n\n");
fs.writeFileSync(TARGET, `${header}\n${base}\n${generated}\n\n${local}`);
console.log(`${out.nodes.length} rules / media blocks, keyframes: ${[...animations].join(", ") || "none"} -> ${path.relative(root, TARGET)}`);
