import { Fragment, createElement } from "react";

/*
 * Links inside plain CMS text. The admin's "Link" button (selected text in any content box,
 * admin components/page-builder/InlineLinkTool.jsx) writes Markdown-style links:
 *   [words](/gst-registration)   [words](https://… "_blank") = new tab
 *   [words](#form) / (#form-12) = form popup (FormPopupHost)   (#faq)   (tel:…)   (mailto:…)
 * - withLinks(text): React nodes for server-rendered helpers (paragraphs, card texts);
 * - linkifyIn(root) / watchInlineLinks(root): the browser pass that turns the syntax in any other
 *   rendered text node into an <a> (InlineLinksScanner in app/layout.js, and the admin Live Preview
 *   on its frame). It never replaces React's text nodes: it shortens them and inserts the rest after,
 *   and undoes that when React changes or removes the node.
 * Landing pages: LandingLinkGuard turns outbound ones into the form popup as with any link.
 */

export const INLINE_LINK_RE = /\[([^\]\n]+)\]\(([^)\s]+)(?:\s+"_blank")?\)/g;

/** Only page paths, #anchors, http(s), tel: and mailto: (never javascript: etc.). */
export function safeLinkHref(url) {
  const value = String(url || "").trim();
  if (/^(\/|#|https?:\/\/|tel:|mailto:)/i.test(value)) return value;
  return null;
}

/** Text → [string | { text, href, newTab }]. */
export function splitInlineLinks(text) {
  const value = String(text ?? "");
  if (value.indexOf("](") < 0) return [value];
  const out = [];
  let last = 0;
  for (const match of value.matchAll(INLINE_LINK_RE)) {
    const href = safeLinkHref(match[2]);
    if (match.index > last) out.push(value.slice(last, match.index));
    out.push(href ? { text: match[1], href, newTab: /\s"_blank"\)$/.test(match[0]) } : match[1]);
    last = match.index + match[0].length;
  }
  if (last < value.length) out.push(value.slice(last));
  return out.length ? out : [value];
}

/** Plain text with [words](url) links as React nodes (server-safe). */
export function withLinks(text) {
  const parts = splitInlineLinks(text);
  if (parts.length === 1 && typeof parts[0] === "string") return parts[0];
  return parts.map((part, i) => (typeof part === "string"
    ? createElement(Fragment, { key: i }, part)
    : createElement("a", {
      key: i,
      href: part.href,
      className: "ta-inline-link",
      ...(part.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {}),
    }, part.text)));
}

/** Plain text without the link syntax (for places where a link cannot go, e.g. inside another link). */
export const stripInlineLinks = (text) => String(text ?? "").replace(INLINE_LINK_RE, "$1");

// ---- Browser pass -------------------------------------------------------------------------

const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "SELECT", "OPTION", "CODE", "PRE", "NOSCRIPT", "TITLE", "SVG"]);
const NO_NEST = new Set(["A", "BUTTON", "LABEL"]);
// text node → { made: inserted nodes, value: the text we left in it }
const owned = new WeakMap();

function contextOf(node) {
  let strip = false;
  for (let el = node.parentNode; el && el.nodeType === 1; el = el.parentNode) {
    const tag = el.tagName.toUpperCase();
    if (SKIP.has(tag) || el.isContentEditable || el.hasAttribute("data-no-links")) return "skip";
    if (NO_NEST.has(tag)) strip = true;
  }
  return strip ? "strip" : "link";
}

function undo(node) {
  const entry = owned.get(node);
  if (!entry) return;
  entry.made.forEach((n) => n.parentNode?.removeChild(n));
  owned.delete(node);
}

function makeAnchor(doc, part) {
  const a = doc.createElement("a");
  a.setAttribute("href", part.href);
  a.className = "ta-inline-link";
  if (part.newTab) {
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  }
  a.textContent = part.text;
  return a;
}

function linkifyNode(node) {
  const text = node.nodeValue || "";
  if (text.indexOf("](") < 0 || !node.parentNode) return;
  const mode = contextOf(node);
  if (mode === "skip") return;
  const parts = splitInlineLinks(text);
  if (parts.length === 1 && typeof parts[0] === "string") return;
  undo(node);
  if (mode === "strip") {
    const plain = parts.map((p) => (typeof p === "string" ? p : p.text)).join("");
    owned.set(node, { made: [], value: plain });
    node.nodeValue = plain;
    return;
  }
  const doc = node.ownerDocument;
  const first = typeof parts[0] === "string" ? parts[0] : "";
  const rest = typeof parts[0] === "string" ? parts.slice(1) : parts;
  const made = rest.map((p) => (typeof p === "string" ? doc.createTextNode(p) : makeAnchor(doc, p)));
  const frag = doc.createDocumentFragment();
  made.forEach((n) => frag.appendChild(n));
  node.parentNode.insertBefore(frag, node.nextSibling);
  owned.set(node, { made, value: first });
  node.nodeValue = first;
}

/** Turns [words](url) in every text node under root into links. */
export function linkifyIn(root) {
  if (!root) return;
  if (root.nodeType === 3) { linkifyNode(root); return; }
  if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
  const doc = root.ownerDocument || root;
  const walker = doc.createTreeWalker(root, 4 /* NodeFilter.SHOW_TEXT */);
  const found = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.nodeValue && n.nodeValue.indexOf("](") >= 0) found.push(n);
  }
  found.forEach(linkifyNode);
}

/** linkifyIn(root) now and whenever React renders new text; returns a stop function. */
export function watchInlineLinks(root) {
  if (!root) return () => {};
  linkifyIn(root);
  const win = (root.ownerDocument || root).defaultView || window;
  const observer = new win.MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "characterData") {
        const node = record.target;
        const entry = owned.get(node);
        if (entry && node.nodeValue === entry.value) return; // our own change
        if (entry) undo(node);
        linkifyNode(node);
        return;
      }
      record.removedNodes.forEach((node) => { if (node.nodeType === 3) undo(node); });
      record.addedNodes.forEach((node) => linkifyIn(node));
    });
  });
  observer.observe(root, { childList: true, subtree: true, characterData: true });
  return () => observer.disconnect();
}
