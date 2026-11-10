"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openFormPopup, prefillFormIn } from "@/lib/formPopup";
import { blockLandingNavigation } from "@/lib/landingLinks";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import CmsForm from "../forms/CmsForm";
import Calculator from "../tools/calculators";
import AutoPopup from "./AutoPopup";
import ButtonLabel from "./ButtonLabel";
import { EXTRA_BLOCKS } from "./ExtraBlocks";
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

function A({ url, className, children, label, style }) {
  const href = String(url || "").trim();
  if (!href) return <span className={className} style={style}>{children}</span>;
  if (isExternal(href)) return <a href={href} className={className} style={style} aria-label={label} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <Link href={href} className={className} style={style} aria-label={label}>{children}</Link>;
}

function Button({ button, ghost = false }) {
  const go = useGo();
  if (!hasButton(button)) return null;
  return <button type="button" className={ghost || button.style === "ghost" ? "cb-btn cb-btn-ghost" : "cb-btn"} onClick={() => go(button.url, button.text)}><ButtonLabel button={button} /></button>;
}

/** Emoji / text, or an image URL; `alt` describes an image icon (empty = decorative). */
function Icon({ value, alt = "" }) {
  const icon = String(value || "").trim();
  if (!icon) return null;
  // eslint-disable-next-line @next/next/no-img-element
  if (isImage(icon)) return <img src={icon} alt={alt} className="cb-icon-img" />;
  return icon;
}

/** Paragraphs (blank lines) with **bold** words. */
function Paragraphs({ text }) {
  return String(text || "").split(/\n\s*\n/).map((para) => para.trim()).filter(Boolean).map((para, i) => (
    <p key={i}>{para.split(/\*\*(.+?)\*\*/g).map((part, j) => (j % 2 ? <b key={j}>{part}</b> : <Fragment key={j}>{part}</Fragment>))}</p>
  ));
}

/** Heading block; `p.subLink` ({ text, url, icon }, Cards Grid) adds a link after the sub text. */
function Head({ p, center = false }) {
  const subLink = hasButton(p.subLink) ? p.subLink : null;
  if (!has(p.kicker) && !has(p.heading) && !has(p.sub) && !subLink) return null;
  return (
    <div className={`cb-head${center || p.align === "center" ? " cb-center" : ""}`}>
      {has(p.kicker) && <span className="cb-kicker">{p.kicker}</span>}
      {has(p.heading) && <h2>{p.heading}</h2>}
      {(has(p.sub) || subLink) && (
        <p className="cb-sub">
          {p.sub}
          {subLink && <>{has(p.sub) && " "}<A url={subLink.url} className="cb-sublink"><ButtonLabel button={subLink} /></A></>}
        </p>
      )}
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
      <div className={`cb-text${p.align === "center" ? " cb-center" : p.align === "right" ? " cb-right" : p.align === "justify" ? " cb-justify" : ""}`}>
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
  // Automatic = every number in one row, at most 6.
  const n = cols(p.columns, Math.min(items.length, 6));
  return (
    <Section type="stats" p={p}>
      <Head p={p} center />
      <div className={`cb-stats${n > 3 ? " cb-stats-many" : ""}${n > 2 ? " cb-stats-wide" : ""}`} style={{ "--cb-cols": n }}>
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

const CARD_LOOKS = new Set(["link", "solid", "outline", "soft"]);

/** Buttons inside a card ([button, look] pairs): a text link or a small button (blocks.css .ta-blk-btn-*). */
function CardButtons({ buttons }) {
  return buttons.map(([b, look], i) => {
    const style = CARD_LOOKS.has(look) ? look : "link";
    return (
      <A key={i} url={b.url} className={`ta-blk-btn ta-blk-btn-${style} ta-blk-btn-sm cb-card-btn`} label={b.text}>
        <ButtonLabel button={style === "link" && !has(b.icon) ? { ...b, icon: "→", iconSide: "right" } : b} />
      </A>
    );
  });
}

function Cards({ p }) {
  const items = list(p.items).filter((x) => has(x.title) || has(x.text));
  if (!items.length) return null;
  return (
    <Section type="cards" p={p}>
      <Head p={p} center={p.align === "center"} />
      {/* At least 4 per row on a laptop (older blocks saved 1–3), fewer only when there are fewer cards. */}
      <div className={`cb-cards${p.style === "plain" ? " cb-cards-plain" : ""}`} style={{ "--cb-cols": Math.min(Math.max(cols(p.columns, 4), 4), items.length) }}>
        {items.map((x, i) => {
          const buttons = [[x.btn1, x.btn1Style], [x.btn2, x.btn2Style]].filter(([b]) => hasButton(b));
          const inner = (
            <>
              {has(x.icon) && <span className="cb-card-ic"><Icon value={x.icon} alt={x.iconAlt || ""} /></span>}
              {has(x.title) && <b>{x.title}</b>}
              {has(x.text) && <p>{x.text}</p>}
            </>
          );
          // With its own buttons the card is not one big link (no link inside a link): the title links instead.
          if (!buttons.length) return <A key={i} url={x.url} className="cb-card">{inner}{has(x.url) && <i>{x.linkText || "Learn more →"}</i>}</A>;
          return (
            <div key={i} className="cb-card cb-card-btns">
              {inner}
              {has(x.url) && <A url={x.url} className="cb-card-more">{x.linkText || "Learn more →"}</A>}
              <div className="cb-card-actions"><CardButtons buttons={buttons} /></div>
            </div>
          );
        })}
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

// ---- Blocks from the reference design (uirefrence.html) ------------------------------------

/** "Heading with *highlight*": the highlighted words must end the heading (as on the hero). */
function Highlighted({ text, highlight }) {
  const heading = String(text || "");
  const words = String(highlight || "").trim();
  if (!words || !heading.endsWith(words)) return heading;
  return <>{heading.slice(0, -words.length)}<em>{words}</em></>;
}

const telHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
const waHref = (number, text) => `https://wa.me/${String(number || "").replace(/\D/g, "")}${has(text) ? `?text=${encodeURIComponent(text)}` : ""}`;

/**
 * Hero with a form (reference: Talk to an expert / Book a meeting): text, points and trust chips
 * on one side, a CMS form in a card on the other (p.form, filled in by the backend from p.formId).
 */
function FormHero({ p }) {
  const points = list(p.points).filter((x) => has(x.title) || has(x.text));
  const chips = list(p.chips).filter((x) => has(x.text));
  const fields = list(p.form?.fields);
  if (!has(p.heading) && !fields.length) return null;
  return (
    <Section type="formhero" p={p}>
      <div className={`cb-fh${p.formSide === "left" ? " cb-fh-rev" : ""}${fields.length ? "" : " cb-fh-solo"}`}>
        <div className="cb-fh-text">
          {has(p.kicker) && <span className="cb-fh-eyebrow">{p.kicker}</span>}
          {has(p.heading) && <h1 className="cb-fh-h"><Highlighted text={p.heading} highlight={p.highlight} /></h1>}
          {has(p.text) && <p className="cb-fh-lede">{p.text}</p>}
          {points.length > 0 && (
            <div className="cb-fh-points">
              {points.map((x, i) => (
                <div key={i} className="cb-fh-point">
                  {has(x.icon) && <span className="cb-fh-point-ic"><Icon value={x.icon} /></span>}
                  <div>{has(x.title) && <b>{x.title}</b>}{has(x.text) && <p>{x.text}</p>}</div>
                </div>
              ))}
            </div>
          )}
          {(hasButton(p.primaryButton) || hasButton(p.secondaryButton)) && (
            <div className="cb-buttons cb-fh-buttons"><Button button={p.primaryButton} /><Button button={p.secondaryButton} ghost /></div>
          )}
          {chips.length > 0 && (
            <div className="cb-fh-chips">
              {chips.map((x, i) => <span key={i}>{has(x.icon) && <Icon value={x.icon} />} {x.text}</span>)}
            </div>
          )}
          {has(p.rating) && <div className="cb-fh-rating"><span className="cb-stars" aria-hidden>★★★★★</span> {p.rating}</div>}
        </div>
        {fields.length > 0 && (
          <div className="cb-fh-card">
            {has(p.formHeading) && <h3>{p.formHeading}</h3>}
            {has(p.formSub) && <p className="cb-fh-card-sub">{p.formSub}</p>}
            <CmsForm form={p.form} compact />
            {has(p.formNote) && <p className="cb-fh-note">{p.formNote}</p>}
          </div>
        )}
      </div>
    </Section>
  );
}

/** Case study (reference .cs-card): a story with a few result numbers. */
function CaseStudy({ p }) {
  const stats = list(p.stats).filter((x) => has(x.value));
  if (!has(p.text) && !stats.length) return null;
  return (
    <Section type="case" p={p}>
      <Head p={p} />
      <div className="cb-case">
        <div className="cb-case-quote" aria-hidden>“</div>
        <div className="cb-case-body">
          {has(p.tag) && <div className="cb-case-tag">{p.tag}</div>}
          {has(p.client) && <b className="cb-case-client">{p.client}</b>}
          <Paragraphs text={p.text} />
          {stats.length > 0 && (
            <div className="cb-case-stats">
              {stats.map((x, i) => <div key={i} className="cb-case-stat"><b>{x.value}</b>{has(x.label) && <span>{x.label}</span>}</div>)}
            </div>
          )}
          {has(p.note) && <p className="cb-case-note">{p.note}</p>}
        </div>
      </div>
    </Section>
  );
}

/** Awards / certifications (reference .award-grid). */
function Awards({ p }) {
  const items = list(p.items).filter((x) => has(x.title));
  if (!items.length) return null;
  return (
    <Section type="awards" p={p}>
      <Head p={p} center />
      <div className="cb-awards">
        {items.map((x, i) => (
          <div key={i} className="cb-award">
            {has(x.icon) && <div className="cb-award-ic"><Icon value={x.icon} /></div>}
            <b>{x.title}</b>
            {has(x.text) && <span>{x.text}</span>}
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Timeline (reference .ind-timeline past / present / future): steps side by side or down the page. */
function Timeline({ p }) {
  const items = list(p.items).filter((x) => has(x.title) || has(x.text));
  if (!items.length) return null;
  return (
    <Section type="timeline" p={p}>
      <Head p={p} />
      <div className={`cb-timeline${p.layout === "vertical" ? " cb-timeline-v" : ""}`} style={{ "--cb-cols": Math.min(items.length, 4) }}>
        {items.map((x, i) => (
          <div key={i} className="cb-tl-item" style={has(x.color) ? { "--tl": x.color } : undefined}>
            <span className="cb-tl-dot" aria-hidden>{has(x.icon) ? <Icon value={x.icon} /> : i + 1}</span>
            <div className="cb-tl-body">
              {has(x.tag) && <span className="cb-tl-tag">{x.tag}</span>}
              {has(x.title) && <b>{x.title}</b>}
              {has(x.text) && <p>{x.text}</p>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/** Lines of a tab text: blank lines = paragraphs, lines starting with "- " = a ticked list. */
function TabText({ text }) {
  const blocks = String(text || "").split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  return blocks.map((block, i) => {
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.every((l) => /^[-•*]\s+/.test(l))) {
      return <ul key={i} className="cb-ticks">{lines.map((l, j) => <li key={j}>{l.replace(/^[-•*]\s+/, "")}</li>)}</ul>;
    }
    return <Paragraphs key={i} text={block} />;
  });
}

/** Tabs (reference .tpx-tabs / .lc-tabs): one panel of text per tab, with an optional button. */
function Tabs({ p }) {
  const tabs = list(p.tabs).filter((x) => has(x.label));
  const [active, setActive] = useState(0);
  if (!tabs.length) return null;
  const tab = tabs[Math.min(active, tabs.length - 1)];
  return (
    <Section type="tabs" p={p}>
      <Head p={p} />
      <div className="cb-tabs" role="tablist">
        {tabs.map((x, i) => (
          <button key={i} type="button" role="tab" aria-selected={tab === x} className={`cb-tab${tab === x ? " on" : ""}`} onClick={() => setActive(i)}>
            {has(x.icon) && <Icon value={x.icon} />} {x.label}
          </button>
        ))}
      </div>
      <div className="cb-tab-panel" role="tabpanel">
        {has(tab.heading) && <h3>{tab.heading}</h3>}
        <TabText text={tab.text} />
        {hasButton({ text: tab.buttonText }) && <div className="cb-buttons"><Button button={{ text: tab.buttonText, url: tab.buttonUrl }} /></div>}
      </div>
    </Section>
  );
}

/** Client story (reference .jex-flow): before → what we did → the result. */
function Story({ p }) {
  const steps = [
    { key: "before", tag: p.beforeLabel || "😟 Before", text: p.before },
    { key: "did", tag: p.didLabel || "🛠️ What we did", text: p.did },
    { key: "after", tag: p.afterLabel || "🎉 The result", text: p.after },
  ].filter((s) => has(s.text));
  if (!steps.length) return null;
  return (
    <Section type="story" p={p}>
      <Head p={p} />
      <div className="cb-story">
        {(has(p.client) || has(p.icon)) && (
          <div className="cb-story-who">{has(p.icon) && <span className="cb-story-avatar"><Icon value={p.icon} /></span>}{has(p.client) && <b>{p.client}</b>}</div>
        )}
        <div className="cb-story-flow">
          {steps.map((s, i) => (
            <Fragment key={s.key}>
              {i > 0 && <span className="cb-story-arrow" aria-hidden>→</span>}
              <div className={`cb-story-step cb-story-${s.key}`}><span className="cb-story-tag">{s.tag}</span><p>{s.text}</p></div>
            </Fragment>
          ))}
        </div>
        {has(p.note) && <p className="cb-caption">{p.note}</p>}
      </div>
    </Section>
  );
}

/** Trust badges (reference .side-trust): small icon + text tiles; fits the sidebar too. */
function Trust({ p }) {
  const items = list(p.items).filter((x) => has(x.text));
  if (!items.length) return null;
  return (
    <Section type="trust" p={p}>
      <div className="cb-trust">
        {has(p.heading) && <b className="cb-trust-h">{p.heading}</b>}
        <div className="cb-trust-grid" style={{ "--cb-cols": cols(p.columns, 2) }}>
          {items.map((x, i) => <div key={i} className="cb-trust-item">{has(x.icon) && <span><Icon value={x.icon} /></span>}{x.text}</div>)}
        </div>
      </div>
    </Section>
  );
}

/** Contact card (reference sidebar call / WhatsApp card): call, WhatsApp and a button. */
function Contact({ p }) {
  const phone = String(p.phone || "").trim();
  const whatsapp = String(p.whatsapp || "").replace(/\D/g, "");
  if (!has(p.heading) && !phone && !whatsapp && !hasButton(p.button)) return null;
  return (
    <Section type="contact" p={p}>
      <div className="cb-contact">
        {has(p.icon) && <div className="cb-contact-ic"><Icon value={p.icon} /></div>}
        {has(p.heading) && <b className="cb-contact-h">{p.heading}</b>}
        {has(p.text) && <p>{p.text}</p>}
        <div className="cb-contact-actions">
          {hasButton(p.button) && <Button button={p.button} />}
          {/* Second button (optional): outline by default, under the main one. */}
          {hasButton(p.button2) && (
            <A url={p.button2.url} className={`ta-blk-btn ta-blk-btn-${CARD_LOOKS.has(p.button2Style) ? p.button2Style : "outline"} ta-blk-btn-md cb-contact-btn2`} label={p.button2.text}>
              <ButtonLabel button={p.button2} />
            </A>
          )}
          {phone && <a className="cb-contact-link" href={telHref(phone)}>📞 {has(p.phoneText) ? p.phoneText : phone}</a>}
          {whatsapp && <a className="cb-contact-link cb-contact-wa" href={waHref(whatsapp, p.whatsappMessage)} target="_blank" rel="noopener noreferrer">💬 {has(p.whatsappText) ? p.whatsappText : "Chat on WhatsApp"}</a>}
        </div>
        {has(p.note) && <p className="cb-contact-note">{p.note}</p>}
      </div>
    </Section>
  );
}

/** Quick answers (reference .side-faq-mini): a short FAQ that also fits the sidebar. */
function MiniFaq({ p }) {
  const items = list(p.items).filter((x) => has(x.question) && has(x.answer));
  if (!items.length) return null;
  return (
    <Section type="minifaq" p={p}>
      <div className="cb-minifaq">
        {has(p.heading) && <b className="cb-minifaq-h">{p.heading}</b>}
        {items.map((x, i) => (
          <details key={i} className="cb-minifaq-item" open={i === 0 && p.firstOpen === "yes"}>
            <summary>{x.question}</summary>
            <p>{x.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

/** Long text with a side card (reference .hc-grid): an SEO intro next to a short points card. */
function TextSide({ p }) {
  const points = list(p.points).filter((x) => has(x.text));
  if (!has(p.heading) && !has(p.text)) return null;
  const card = has(p.cardTitle) || points.length > 0 || hasButton(p.button);
  return (
    <Section type="textside" p={p}>
      <div className={`cb-ts${card ? "" : " cb-ts-solo"}`}>
        <div className="cb-ts-main">
          {has(p.kicker) && <span className="cb-kicker">{p.kicker}</span>}
          {has(p.heading) && <h2>{p.heading}</h2>}
          {has(p.lead) && <p className="cb-ts-lead">{p.lead}</p>}
          <Paragraphs text={p.text} />
        </div>
        {card && (
          <aside className="cb-ts-card">
            {has(p.cardTitle) && <b className="cb-ts-card-h">{p.cardTitle}</b>}
            {points.length > 0 && (
              <ul>{points.map((x, i) => <li key={i}><span>{has(x.icon) ? <Icon value={x.icon} /> : "✓"}</span>{x.text}</li>)}</ul>
            )}
            {hasButton(p.button) && <div className="cb-buttons"><Button button={p.button} /></div>}
          </aside>
        )}
      </div>
    </Section>
  );
}

/**
 * Explore links grid (reference .xhub "Explore everything for your business"): cards, each with an
 * icon + title (optionally a link) over a list of links with their own icons.
 */
function ExploreHub({ p }) {
  const cards = list(p.cards)
    .map((c) => ({ ...c, links: list(c.links).filter((l) => has(l.text)) }))
    .filter((c) => has(c.title) || c.links.length);
  if (!cards.length) return null;
  return (
    <Section type="xhub" p={p}>
      <Head p={p} center={p.align !== "left"} />
      <div className="cb-xhub-grid" style={{ "--cb-cols": cols(p.columns, 4) }}>
        {cards.map((c, i) => (
          <div key={i} className="cb-xhub-card">
            {has(c.title) && (
              <A url={c.url} className="cb-xhub-title">
                {has(c.icon) && <span className="cb-xhub-ic"><Icon value={c.icon} /></span>}
                <span>{c.title}</span>
              </A>
            )}
            {c.links.length > 0 && (
              <ul className="cb-xhub-links">
                {c.links.map((l, j) => (
                  <li key={j}>
                    <A url={l.url} className="cb-xhub-link">
                      {has(l.icon) && <span className="cb-xhub-lic"><Icon value={l.icon} /></span>}
                      <span>{l.text}</span>
                    </A>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/**
 * Questions & answers (reference .sp-qna + Taxpedia tabs .tpx): an ask box, optional answered
 * questions, and a knowledge panel with tabs of link cards and related-topic chips. "Post question"
 * runs the ask button: a form popup gets the question in its message box (submitted as a CRM lead,
 * captcha included); a #section scrolls there and fills that form; any other link just opens.
 */
function Qna({ p }) {
  const go = useGo();
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState([]);
  const [active, setActive] = useState(0);
  const items = list(p.items).filter((x) => has(x.question));
  const tabs = list(p.tabs).map((t) => ({ ...t, cards: list(t.cards).filter((c) => has(c.title) || has(c.text)) })).filter((t) => has(t.label));
  const topics = list(p.topics).filter((t) => has(t.text));
  const askButton = hasButton(p.askButton) ? p.askButton : null;
  const panel = p.showPanel !== "no" && (has(p.panelTitle) || tabs.length > 0 || topics.length > 0);
  if (!askButton && !items.length && !panel && !has(p.heading)) return null;
  const tab = tabs[Math.min(active, tabs.length - 1)];

  const ask = (event) => {
    event.preventDefault();
    const q = question.trim();
    if (!q || !askButton) return;
    const url = String(askButton.url || "").trim();
    if (!openFormPopup(url, p.askFormHeading || askButton.text, q)) {
      if (url.startsWith("#")) {
        const target = document.getElementById(url.slice(1));
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
        prefillFormIn(target, q);
      } else {
        go(url, askButton.text);
      }
    }
    setAsked((prev) => [...prev, q]);
    setQuestion("");
  };

  return (
    <Section type="qna" p={p}>
      <Head p={p} center={p.align !== "left"} />
      {askButton && (
        <form className="cb-qna-ask" onSubmit={ask}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={p.askPlaceholder || "Ask a question"}
            aria-label={p.askPlaceholder || "Your question"}
            maxLength={500}
          />
          <button type="submit" className="cb-btn" disabled={!question.trim()}><ButtonLabel button={askButton} /></button>
        </form>
      )}
      {(asked.length > 0 || items.length > 0) && (
        <div className="cb-qna-list">
          {asked.map((q, i) => (
            <div key={`a${i}`} className="cb-qna-item cb-qna-new">
              <b>Q: {q}</b>
              {has(p.askNote) && <p>{p.askNote}</p>}
            </div>
          ))}
          {items.map((x, i) => (
            <details key={i} className="cb-qna-item" open={i === 0 && p.firstOpen === "yes"}>
              <summary><b>Q: {x.question}</b></summary>
              {has(x.answer) && <Paragraphs text={x.answer} />}
            </details>
          ))}
        </div>
      )}
      {panel && (
        <div className="cb-tpx">
          {(has(p.panelTitle) || has(p.panelSub) || hasButton(p.panelButton)) && (
            <div className="cb-tpx-head">
              <div>
                {has(p.panelTitle) && <b>{has(p.panelIcon) && <Icon value={p.panelIcon} />} {p.panelTitle}</b>}
                {has(p.panelSub) && <span>{p.panelSub}</span>}
              </div>
              {hasButton(p.panelButton) && <Button button={p.panelButton} ghost />}
            </div>
          )}
          {tabs.length > 0 && (
            <>
              <div className="cb-tpx-tabs" role="tablist">
                {tabs.map((t, i) => (
                  <button key={i} type="button" role="tab" aria-selected={tab === t} className={`cb-tpx-tab${tab === t ? " on" : ""}`} onClick={() => setActive(i)}>
                    {has(t.icon) && <Icon value={t.icon} />} {t.label}
                  </button>
                ))}
              </div>
              {tab.cards.length > 0 && (
                <div className="cb-tpx-cards" role="tabpanel">
                  {tab.cards.map((c, i) => (
                    <A key={i} url={c.url} className="cb-tpx-card">
                      {has(c.title) && <b>{c.title}</b>}
                      {has(c.text) && <p>{c.text}</p>}
                      {has(c.linkText) && <span className="cb-tpx-cta">{c.linkText}</span>}
                    </A>
                  ))}
                </div>
              )}
            </>
          )}
          {topics.length > 0 && (
            <div className="cb-tpx-topics">
              {has(p.topicsLabel) && <span className="cb-tpx-label">{p.topicsLabel}</span>}
              {topics.map((t, i) => (
                <A key={i} url={t.url} className="cb-tpx-chip">{has(t.icon) && <Icon value={t.icon} />} {t.text}</A>
              ))}
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

// ---- Numbers dashboard (reference .databand): donut, bars, rings and a stats strip -------------

/** First number in a text such as "12,400+", "₹50Cr" or "96%"; 0 when there is none. */
const numberIn = (value) => {
  const m = String(value ?? "").replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return m ? Number(m[0]) : 0;
};
const DB_COLORS = ["#0E96AC", "#E8521E", "#F5A623", "#7C3AED", "#16A34A", "#DB2777", "#2563EB", "#64748B"];
const HEX = /^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i;
const colorOr = (value, fallback) => (HEX.test(String(value || "").trim()) ? String(value).trim() : fallback);

function DbButton({ button, className = "" }) {
  const go = useGo();
  if (!hasButton(button)) return null;
  return <button type="button" className={`cb-db-btn ${className}`.trim()} onClick={() => go(button.url, button.text)}><ButtonLabel button={button} /></button>;
}

/** Link when it has a URL, plain element otherwise. */
function DbItem({ url, className, children }) {
  return has(url) ? <A url={url} className={`${className} cb-db-link`}>{children}</A> : <div className={className}>{children}</div>;
}

function DbDonut({ p }) {
  const segments = list(p.segments).filter((s) => has(s.label) || has(s.value));
  if (!segments.length && !has(p.donutValue)) return null;
  const amounts = segments.map((s) => Math.max(0, has(s.amount) ? numberIn(s.amount) : numberIn(s.value)));
  const total = amounts.reduce((a, b) => a + b, 0);
  const C = 2 * Math.PI * 48;
  let offset = 0;
  return (
    <div className="cb-db-card">
      {has(p.donutTitle) && <h4>{p.donutTitle}</h4>}
      <div className="cb-db-donut">
        <svg viewBox="0 0 120 120" role="img" aria-label={p.donutTitle || "Chart"}>
          <circle cx="60" cy="60" r="48" fill="none" stroke="var(--cb-mist)" strokeWidth="20" />
          {total > 0 && segments.map((s, i) => {
            const len = (amounts[i] / total) * C;
            const arc = <circle key={i} cx="60" cy="60" r="48" fill="none" stroke={colorOr(s.color, DB_COLORS[i % DB_COLORS.length])} strokeWidth="20" strokeDasharray={`${len} ${C}`} strokeDashoffset={-offset} transform="rotate(-90 60 60)" />;
            offset += len;
            return arc;
          })}
        </svg>
        {(has(p.donutValue) || has(p.donutLabel)) && (
          <div className="cb-db-donut-center">{has(p.donutValue) && <b>{p.donutValue}</b>}{has(p.donutLabel) && <span>{p.donutLabel}</span>}</div>
        )}
      </div>
      {segments.length > 0 && (
        <div className="cb-db-legend">
          {segments.map((s, i) => (
            <DbItem key={i} url={s.url} className="cb-db-legend-item">
              <i style={{ background: colorOr(s.color, DB_COLORS[i % DB_COLORS.length]) }} />
              <span>{s.label}</span>
              {has(s.value) && <b>{s.value}</b>}
            </DbItem>
          ))}
        </div>
      )}
    </div>
  );
}

function DbBars({ p }) {
  const bars = list(p.bars).filter((b) => has(b.label) || has(b.value));
  const ref = useRef(null);
  const [shown, setShown] = useState(false);
  // Bars grow when the chart scrolls into view (at once without IntersectionObserver).
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") { setShown(true); return undefined; }
    const io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) { setShown(true); io.disconnect(); } }, { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, [bars.length]);
  if (!bars.length) return null;
  const max = Math.max(...bars.map((b) => numberIn(b.value)), 0) || 1;
  const from = colorOr(p.barColor, "var(--cb-brand)");
  const to = colorOr(p.barColor2, "#E8521E");
  return (
    <div className="cb-db-card">
      {(has(p.barsTitle) || has(p.barsTag)) && <h4>{p.barsTitle} {has(p.barsTag) && <span className="cb-db-tag">{p.barsTag}</span>}</h4>}
      <div className="cb-db-bars" ref={ref}>
        {bars.map((b, i) => (
          <div key={i} className="cb-db-bar-col">
            {has(b.value) && <span className="cb-db-bar-val">{b.value}</span>}
            <div className="cb-db-bar" style={{ height: shown ? `${Math.max(4, (numberIn(b.value) / max) * 100)}%` : "4%", background: `linear-gradient(180deg, ${from}, ${to})` }} />
            {has(b.label) && <span className="cb-db-bar-label">{b.label}</span>}
          </div>
        ))}
      </div>
      {has(p.barsNote) && <p className="cb-db-note">{p.barsNote}</p>}
      <DbButton button={p.barsButton} />
    </div>
  );
}

function DbRings({ p }) {
  const rings = list(p.rings).filter((r) => has(r.value) || has(r.label));
  if (!rings.length) return null;
  const color = colorOr(p.ringColor, "var(--cb-brand)");
  return (
    <div className="cb-db-card cb-db-rings">
      {has(p.ringsTitle) && <h4>{p.ringsTitle}</h4>}
      {rings.map((r, i) => (
        <DbItem key={i} url={r.url} className="cb-db-ring-row">
          <div className="cb-db-ring" style={{ "--p": Math.max(0, Math.min(100, numberIn(r.value))), "--rc": color }}><b>{r.value}</b></div>
          <span>{r.label}</span>
        </DbItem>
      ))}
      <DbButton button={p.ringsButton} className="cb-db-btn-end" />
    </div>
  );
}

function DataBand({ p }) {
  const stats = list(p.stats).filter((s) => has(s.value) || has(s.label));
  const donut = p.showDonut !== "no" && <DbDonut p={p} />;
  const bars = p.showBars !== "no" && <DbBars p={p} />;
  const rings = p.showRings !== "no" && <DbRings p={p} />;
  const hasCards = (p.showDonut !== "no" && (list(p.segments).length > 0 || has(p.donutValue)))
    || (p.showBars !== "no" && list(p.bars).length > 0)
    || (p.showRings !== "no" && list(p.rings).length > 0);
  if (!hasCards && !stats.length) return null;
  return (
    <Section type="databand" p={p}>
      <Head p={p} center={p.align !== "left"} />
      {hasCards && <div className="cb-db-grid">{donut}{bars}{rings}</div>}
      {stats.length > 0 && (
        <div className="cb-db-stats" style={{ "--db-cols": cols(p.statColumns, Math.min(6, stats.length)) }}>
          {stats.map((s, i) => (
            <DbItem key={i} url={s.url} className="cb-db-stat">
              {has(s.icon) && <span className="cb-db-stat-ic"><Icon value={s.icon} /></span>}
              {has(s.value) && <b>{s.value}</b>}
              {has(s.label) && <span>{s.label}</span>}
            </DbItem>
          ))}
        </div>
      )}
      {has(p.disclaimer) && <p className="cb-db-disclaimer">{p.disclaimer}</p>}
    </Section>
  );
}

// ---- Platform pillars (reference .eco3d): a centre badge with the pillars under it ------------------

const ECO_ICON = { small: "22px", medium: "30px", large: "40px", xl: "52px" };

function Ecosystem({ p }) {
  const pillars = list(p.pillars).filter((x) => has(x.title) || has(x.icon));
  const lines = String(p.centerText || "").split(/\n|<br\s*\/?>/i).map((t) => t.trim()).filter(Boolean);
  const hasCenter = p.showCenter !== "no" && (lines.length > 0 || has(p.centerImage));
  if (!pillars.length && !hasCenter) return null;
  const n = cols(p.columns, Math.min(Math.max(pillars.length, 1), 6));
  const centre = hasCenter && (
    <>
      {has(p.centerImage)
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={p.centerImage} alt={p.centerImageAlt || lines.join(" ")} className="cb-eco-center-img" />
        : lines.map((line, i) => <span key={i}>{line}</span>)}
    </>
  );
  const centerStyle = {
    "--eco-c1": colorOr(p.centerColor, "#0e96ac"),
    "--eco-c2": colorOr(p.centerColor2, "#0a1840"),
  };
  return (
    <Section type="eco" p={p}>
      <Head p={p} center={p.align !== "left"} />
      <div className={`cb-eco${p.boxed === "no" ? " cb-eco-plain" : ""}`} style={{ "--eco-ic": ECO_ICON[p.iconSize] || ECO_ICON.medium }}>
        {hasCenter && (has(p.centerUrl)
          ? <A url={p.centerUrl} className="cb-eco-center" style={centerStyle}>{centre}</A>
          : <div className="cb-eco-center" style={centerStyle}>{centre}</div>)}
        {pillars.length > 0 && (
          <div className={`cb-eco-pillars${n > 3 ? " cb-eco-many" : ""}`} style={{ "--eco-cols": n }}>
            {pillars.map((x, i) => (
              <DbItem key={i} url={x.url} className="cb-eco-pillar">
                {has(x.icon) && <span className="cb-eco-ic"><Icon value={x.icon} alt={x.iconAlt || ""} /></span>}
                {has(x.title) && <b>{x.title}</b>}
                {has(x.text) && <small>{x.text}</small>}
              </DbItem>
            ))}
          </div>
        )}
      </div>
    </Section>
  );
}

// ---- Tabbed cards (reference .lc labour law section): tabs, each with its own grid of cards ------------

/** Heading text with *stars* around words shown in the brand gradient (<em>). */
function StarHighlight({ text }) {
  return String(text || "").split(/\*([^*]+)\*/g).map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <Fragment key={i}>{part}</Fragment>));
}

/** Card text: each line a line, **bold** words. */
function CardLines({ text }) {
  return String(text || "").split(/\n/).map((line) => line.trim()).filter(Boolean).map((line, i) => (
    <p key={i}>{line.split(/\*\*(.+?)\*\*/g).map((part, j) => (j % 2 ? <b key={j}>{part}</b> : <Fragment key={j}>{part}</Fragment>))}</p>
  ));
}

function TabCards({ p }) {
  const tabs = list(p.tabs).map((t) => ({ ...t, cards: list(t.cards).filter((c) => has(c.title) || has(c.text)) })).filter((t) => t.cards.length);
  const [active, setActive] = useState(0);
  if (!tabs.length && !has(p.heading)) return null;
  const current = tabs[Math.min(active, Math.max(tabs.length - 1, 0))];
  const n = cols(current?.columns, cols(p.columns, 4));
  const left = p.align === "left";
  return (
    <Section type="tabcards" p={p}>
      {(has(p.kicker) || has(p.heading) || has(p.sub)) && (
        <div className={`cb-tc-head${left ? " cb-tc-left" : ""}`}>
          {has(p.kicker) && <span className="cb-tc-kicker">{p.kicker}</span>}
          {has(p.heading) && <h2><StarHighlight text={p.heading} /></h2>}
          {has(p.sub) && <p className="cb-sub">{p.sub}</p>}
        </div>
      )}
      {tabs.length > 1 && (
        <div className="cb-tc-tabs" role="tablist">
          {tabs.map((t, i) => (
            <button key={i} type="button" role="tab" aria-selected={t === current} className={`cb-tc-tab${t === current ? " is-active" : ""}`} onClick={() => setActive(i)}>
              {has(t.icon) && <Icon value={t.icon} />}{t.label || `Tab ${i + 1}`}
            </button>
          ))}
        </div>
      )}
      {current && (
        <div className={`cb-tc-grid${n > 3 ? " cb-tc-many" : ""}`} style={{ "--tc-cols": n }} role="tabpanel">
          {current.cards.map((c, i) => {
            const style = HEX.test(String(c.color || "").trim()) ? { "--tc": c.color.trim() } : undefined;
            const body = (
              <>
                {(has(c.icon) || has(c.tag)) && (
                  <div className="cb-tc-top">
                    {has(c.icon) ? <div className="cb-tc-ic"><Icon value={c.icon} alt={c.iconAlt || ""} /></div> : <span />}
                    {has(c.tag) && <span className="cb-tc-tag">{c.tag}</span>}
                  </div>
                )}
                {has(c.title) && <h3>{c.title}</h3>}
                {has(c.text) && <div className="cb-tc-text"><CardLines text={c.text} /></div>}
                {(has(c.chip) || has(c.url)) && (
                  <div className="cb-tc-foot">
                    {has(c.chip) && <span className="cb-tc-chip">{c.chip}</span>}
                    {has(c.url) && <span className="cb-tc-go">{c.linkText || "Details →"}</span>}
                  </div>
                )}
              </>
            );
            return has(c.url)
              ? <A key={`${active}-${i}`} url={c.url} className="cb-tc-card" style={style}>{body}</A>
              : <div key={`${active}-${i}`} className="cb-tc-card" style={style}>{body}</div>;
          })}
        </div>
      )}
    </Section>
  );
}

const BLOCKS = {
  CommonTabCards: TabCards,
  CommonEcosystem: Ecosystem,
  CommonDataBand: DataBand,
  CommonAutoPopup: AutoPopup,
  CommonExploreHub: ExploreHub,
  CommonQna: Qna,
  CommonFormHero: FormHero,
  CommonCaseStudy: CaseStudy,
  CommonAwards: Awards,
  CommonTimeline: Timeline,
  CommonTabs: Tabs,
  CommonStory: Story,
  CommonTrust: Trust,
  CommonContact: Contact,
  CommonMiniFaq: MiniFaq,
  CommonTextSide: TextSide,
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
  ...EXTRA_BLOCKS,
};

/** One general-purpose block ({ id, type, payload }). */
export default function CommonBlock({ section }) {
  const Block = BLOCKS[section?.type];
  return Block ? <Block p={section.payload || {}} /> : null;
}
