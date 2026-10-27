"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openFormPopup } from "@/lib/formPopup";
import { blockLandingNavigation } from "@/lib/landingLinks";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import Calculator from "../tools/calculators";
import "../tools/tools-page.css";
import "./blocks.css";

/*
 * General-purpose blocks (admin: commonBlocks.js), usable on every page type. Each renders a
 * <section class="ta-cb cb-*"> styled by blocks.css with the site's own tokens, so it looks the
 * same on the homepage, service pages, CMS pages, blogs, journey stages and tool pages.
 * Empty fields hide their element; a block with nothing to show renders nothing.
 */

const list = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const has = (value) => (typeof value === "string" ? value.trim() !== "" : Boolean(value));
const hasButton = (button) => Boolean(button && has(button.text));
const isExternal = (url) => /^(?:https?:)?\/\//i.test(url) || /^(mailto|tel):/i.test(url);
const isImage = (value) => /^(https?:|\/|data:)/i.test(String(value || "").trim());

function useGo() {
  const router = useRouter();
  return (url, label) => {
    const target = String(url || "").trim();
    if (!target) return;
    if (openFormPopup(target, label)) return; // "#form-<id>": form popup (FormPopupHost)
    if (blockLandingNavigation(target, label)) return; // landing pages never navigate away
    if (target.startsWith("#")) document.getElementById(target.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else if (isExternal(target)) window.open(target, "_blank", "noopener");
    else router.push(target);
  };
}

function A({ url, className, children, label }) {
  const href = String(url || "").trim();
  if (!href) return <span className={className}>{children}</span>;
  if (isExternal(href)) return <a href={href} className={className} aria-label={label} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <Link href={href} className={className} aria-label={label}>{children}</Link>;
}

function Button({ button, ghost = false }) {
  const go = useGo();
  if (!hasButton(button)) return null;
  return <button type="button" className={ghost || button.style === "ghost" ? "cb-btn cb-btn-ghost" : "cb-btn"} onClick={() => go(button.url, button.text)}>{button.text}</button>;
}

function Icon({ value }) {
  const icon = String(value || "").trim();
  if (!icon) return null;
  // eslint-disable-next-line @next/next/no-img-element
  if (isImage(icon)) return <img src={icon} alt="" className="cb-icon-img" />;
  return icon;
}

/** Paragraphs (blank lines) with **bold** words. */
function Paragraphs({ text }) {
  return String(text || "").split(/\n\s*\n/).map((para) => para.trim()).filter(Boolean).map((para, i) => (
    <p key={i}>{para.split(/\*\*(.+?)\*\*/g).map((part, j) => (j % 2 ? <b key={j}>{part}</b> : <Fragment key={j}>{part}</Fragment>))}</p>
  ));
}

function Head({ p, center = false }) {
  if (!has(p.kicker) && !has(p.heading) && !has(p.sub)) return null;
  return (
    <div className={`cb-head${center || p.align === "center" ? " cb-center" : ""}`}>
      {has(p.kicker) && <span className="cb-kicker">{p.kicker}</span>}
      {has(p.heading) && <h2>{p.heading}</h2>}
      {has(p.sub) && <p className="cb-sub">{p.sub}</p>}
    </div>
  );
}

function Section({ type, p, children }) {
  return (
    <section className={`ta-cb cb-${type}`} id={has(p.anchorId) ? p.anchorId : undefined}>
      <div className="cb-wrap">{children}</div>
    </section>
  );
}

const cols = (value, fallback) => {
  const n = parseInt(value, 10);
  return n >= 1 && n <= 6 ? n : fallback;
};

// ---- Blocks -------------------------------------------------------------------------------

function Text({ p }) {
  if (!has(p.heading) && !has(p.text)) return null;
  return (
    <Section type="text" p={p}>
      <div className={`cb-text${p.align === "center" ? " cb-center" : ""}`}>
        <Head p={p} />
        <Paragraphs text={p.text} />
        {(hasButton(p.primaryButton) || hasButton(p.secondaryButton)) && (
          <div className="cb-buttons"><Button button={p.primaryButton} /><Button button={p.secondaryButton} ghost /></div>
        )}
      </div>
    </Section>
  );
}

function ImageText({ p }) {
  if (!has(p.image) && !has(p.heading) && !has(p.text)) return null;
  const points = list(p.points).filter((x) => has(x.text));
  return (
    <Section type="imagetext" p={p}>
      <div className={`cb-split${p.imageSide === "right" ? " cb-split-rev" : ""}`}>
        {has(p.image) && (
          <div className="cb-split-media">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.image} alt={p.imageAlt || p.heading || ""} loading="lazy" />
          </div>
        )}
        <div className="cb-split-body">
          <Head p={p} />
          <Paragraphs text={p.text} />
          {points.length > 0 && <ul className="cb-points">{points.map((x, i) => <li key={i}>{x.text}</li>)}</ul>}
          {(hasButton(p.primaryButton) || hasButton(p.secondaryButton)) && (
            <div className="cb-buttons"><Button button={p.primaryButton} /><Button button={p.secondaryButton} ghost /></div>
          )}
        </div>
      </div>
    </Section>
  );
}

function Image({ p }) {
  if (!has(p.image)) return null;
  // eslint-disable-next-line @next/next/no-img-element
  const img = <img src={p.image} alt={p.alt || p.caption || ""} loading="lazy" />;
  return (
    <Section type="image" p={p}>
      <figure className={`cb-figure cb-size-${p.size || "wide"}`}>
        {has(p.link) ? <A url={p.link} className="cb-figure-link">{img}</A> : img}
        {has(p.caption) && <figcaption>{p.caption}</figcaption>}
      </figure>
    </Section>
  );
}

/** Embed URL for YouTube / Vimeo links, or null (then a direct video file is played). */
export function videoEmbedUrl(url) {
  const u = String(url || "").trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/i);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return null;
}

function Video({ p }) {
  if (!has(p.url)) return null;
  const embed = videoEmbedUrl(p.url);
  return (
    <Section type="video" p={p}>
      <Head p={p} center />
      <div className="cb-video">
        {embed ? (
          <iframe src={embed} title={p.heading || "Video"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        ) : (
          <video src={p.url} poster={p.poster || undefined} controls preload="metadata" />
        )}
      </div>
      {has(p.caption) && <p className="cb-caption">{p.caption}</p>}
    </Section>
  );
}

function Gallery({ p }) {
  const items = list(p.items).filter((x) => has(x.image));
  const [open, setOpen] = useState(null);
  useEffect(() => {
    if (open === null) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(null);
      if (e.key === "ArrowRight") setOpen((i) => (i + 1) % items.length);
      if (e.key === "ArrowLeft") setOpen((i) => (i - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, items.length]);
  if (!items.length) return null;
  return (
    <Section type="gallery" p={p}>
      <Head p={p} center />
      <div className="cb-gallery" style={{ "--cb-cols": cols(p.columns, 3) }}>
        {items.map((x, i) => (
          <button key={i} type="button" className="cb-gallery-item" onClick={() => setOpen(i)} aria-label={x.caption || `Open image ${i + 1}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={x.image} alt={x.caption || ""} loading="lazy" />
            {has(x.caption) && <span>{x.caption}</span>}
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="cb-lightbox" role="dialog" aria-modal="true" onClick={() => setOpen(null)}>
          <button type="button" className="cb-lb-close" aria-label="Close" onClick={() => setOpen(null)}>×</button>
          {items.length > 1 && <button type="button" className="cb-lb-nav cb-lb-prev" aria-label="Previous" onClick={(e) => { e.stopPropagation(); setOpen((open - 1 + items.length) % items.length); }}>‹</button>}
          <figure onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={items[open].image} alt={items[open].caption || ""} />
            {has(items[open].caption) && <figcaption>{items[open].caption}</figcaption>}
          </figure>
          {items.length > 1 && <button type="button" className="cb-lb-nav cb-lb-next" aria-label="Next" onClick={(e) => { e.stopPropagation(); setOpen((open + 1) % items.length); }}>›</button>}
        </div>
      )}
    </Section>
  );
}

function Stats({ p }) {
  const items = list(p.items).filter((x) => has(x.value));
  if (!items.length) return null;
  return (
    <Section type="stats" p={p}>
      <Head p={p} center />
      <div className="cb-stats" style={{ "--cb-cols": cols(p.columns, Math.min(items.length, 4)) }}>
        {items.map((x, i) => (
          <div key={i} className="cb-stat">
            {has(x.icon) && <span className="cb-stat-ic"><Icon value={x.icon} /></span>}
            <b>{x.value}</b>
            {has(x.label) && <span>{x.label}</span>}
          </div>
        ))}
      </div>
    </Section>
  );
}

function Cards({ p }) {
  const items = list(p.items).filter((x) => has(x.title) || has(x.text));
  if (!items.length) return null;
  return (
    <Section type="cards" p={p}>
      <Head p={p} center={p.align === "center"} />
      <div className={`cb-cards${p.style === "plain" ? " cb-cards-plain" : ""}`} style={{ "--cb-cols": cols(p.columns, 3) }}>
        {items.map((x, i) => (
          <A key={i} url={x.url} className="cb-card">
            {has(x.icon) && <span className="cb-card-ic"><Icon value={x.icon} /></span>}
            {has(x.title) && <b>{x.title}</b>}
            {has(x.text) && <p>{x.text}</p>}
            {has(x.url) && <i>{x.linkText || "Learn more →"}</i>}
          </A>
        ))}
      </div>
    </Section>
  );
}

function Logos({ p }) {
  const items = list(p.items).filter((x) => has(x.image) || has(x.name));
  if (!items.length) return null;
  return (
    <Section type="logos" p={p}>
      <Head p={p} center />
      <div className={`cb-logos${p.grayscale === "no" ? "" : " cb-logos-gray"}`}>
        {items.map((x, i) => (
          <A key={i} url={x.url} className="cb-logo" label={x.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {has(x.image) ? <img src={x.image} alt={x.name || ""} loading="lazy" /> : <span>{x.name}</span>}
          </A>
        ))}
      </div>
    </Section>
  );
}

function Buttons({ p }) {
  const buttons = list(p.buttons).filter(hasButton);
  if (!buttons.length && !has(p.heading)) return null;
  return (
    <Section type="buttons" p={p}>
      <Head p={p} center={p.align !== "left"} />
      <div className={`cb-buttons cb-align-${p.align || "center"}`}>
        {buttons.map((b, i) => <Button key={i} button={b} />)}
      </div>
    </Section>
  );
}

function Spacer({ p }) {
  return (
    <div className={`ta-cb cb-spacer cb-space-${p.size || "md"}`} aria-hidden="true">
      {p.line === "yes" && <div className="cb-wrap"><hr /></div>}
    </div>
  );
}

function Embed({ p }) {
  const url = String(p.url || "").trim();
  const safeUrl = /^https:\/\//i.test(url) ? url : "";
  const html = p.kind === "html" ? sanitizeHtml(p.html) : "";
  if (!safeUrl && !html) return null;
  const height = Math.min(1200, Math.max(150, parseInt(p.height, 10) || 420));
  return (
    <Section type="embed" p={p}>
      <Head p={p} center />
      {p.kind === "html"
        ? <div className="cb-embed-html" dangerouslySetInnerHTML={{ __html: html }} />
        : <div className="cb-embed" style={{ height }}><iframe src={safeUrl} title={p.heading || "Embedded content"} loading="lazy" allowFullScreen referrerPolicy="no-referrer-when-downgrade" /></div>}
      {has(p.caption) && <p className="cb-caption">{p.caption}</p>}
    </Section>
  );
}

/**
 * A free tool's calculator on any page (admin: "Free Tool / Calculator"). source "page" uses the
 * calculator and settings of a published tool page (p.tool, loaded by attachModuleContent);
 * source "calculator" a calculator type with its default settings. The tool styles
 * (tools-page.css) are scoped under .ta-tools, so the calculator sits in such a wrapper.
 */
function Tool({ p }) {
  const fromPage = p.source !== "calculator";
  const calculator = fromPage ? p.tool?.calculator : p.calculator;
  if (!calculator) return null;
  return (
    <Section type="tool" p={p}>
      <Head p={p} />
      <div className="ta-tools cb-tool-embed">
        <div className="tool-panel">
          <Calculator calculator={calculator} settings={fromPage ? p.tool?.settings || {} : {}} />
        </div>
      </div>
      {hasButton(p.button) && <div className="cb-buttons"><Button button={p.button} /></div>}
    </Section>
  );
}

const BLOCKS = {
  CommonText: Text,
  CommonImageText: ImageText,
  CommonImage: Image,
  CommonVideo: Video,
  CommonGallery: Gallery,
  CommonStats: Stats,
  CommonCards: Cards,
  CommonLogos: Logos,
  CommonButtons: Buttons,
  CommonSpacer: Spacer,
  CommonEmbed: Embed,
  CommonTool: Tool,
};

/** One general-purpose block ({ id, type, payload }). */
export default function CommonBlock({ section }) {
  const Block = BLOCKS[section?.type];
  return Block ? <Block p={section.payload || {}} /> : null;
}
