"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openFormPopup } from "@/lib/formPopup";
import { blockLandingNavigation } from "@/lib/landingLinks";
import { HomeBlock } from "../home/HomeSections";
import CommonBlock from "../blocks/CommonBlocks";
import BlockBackground from "../blocks/BlockBackground";
import { isCommonSection, isHomeSection } from "../blocks/commonBlockTypes";
import Calculator from "./calculators";
import CmsForm from "../forms/CmsForm";
import "./tools-page.css";

/*
 * Free tools (uirefrence.html #/tools hub and #/tool/<key>): a CMS page built from Tool blocks
 * (admin: Pages → Free Tools). Markup and classes follow the reference (tools-page.css, scoped
 * under .ta-tools); texts and calculator settings come from the block payloads.
 * - A page with a ToolCalculator block is a tool page; one with a ToolsGrid block is the hub.
 * - ToolsGrid and ToolMore list the published tools (GET /api/v1/pages/tools-list), so a new
 *   tool page shows up on the hub and under every other tool by itself.
 * Block types must match TOOL_BLOCKS in the admin's src/components/page-builder/toolBlocks.js.
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

function A({ url, className, children }) {
  const href = String(url || "").trim();
  if (!href) return <a className={className}>{children}</a>;
  if (isExternal(href)) return <a href={href} className={className} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <Link href={href} className={className}>{children}</Link>;
}

function Button({ button, className = "btn-primary" }) {
  const go = useGo();
  if (!hasButton(button)) return null;
  return <button type="button" className={className} onClick={() => go(button.url, button.text)}>{button.text}</button>;
}

function Icon({ value }) {
  const icon = String(value || "").trim();
  if (!icon) return null;
  // eslint-disable-next-line @next/next/no-img-element
  if (isImage(icon)) return <img src={icon} alt="" className="tool-icon-img" />;
  return icon;
}

/** Text with paragraphs (blank lines) and **bold** words. */
function Paragraphs({ text }) {
  return String(text || "").split(/\n\s*\n/).map((para) => para.trim()).filter(Boolean).map((para, i) => (
    <p key={i}>
      {para.split(/\*\*(.+?)\*\*/g).map((part, j) => (j % 2 ? <b key={j}>{part}</b> : <Fragment key={j}>{part}</Fragment>))}
    </p>
  ));
}

// ---- Blocks -------------------------------------------------------------------------------

function Hero({ p, ctx }) {
  return (
    <div className={ctx.isHub ? "tools-hub-hero" : "tool-page-hero"}>
      <div className="wrap">
        {has(p.eyebrow) && <span className="eyebrow" style={{ color: "var(--brand)" }}>{p.eyebrow}</span>}
        {has(p.title) && <h1>{p.title}</h1>}
        {has(p.description) && <p className="lede">{p.description}</p>}
      </div>
    </div>
  );
}

function CalculatorBlock({ p }) {
  return (
    <div className="tool-panel" id={p.anchorId || "calculator"}>
      {has(p.heading) && <h2 className="tool-panel-title">{p.heading}</h2>}
      <Calculator calculator={p.calculator} settings={p.settings} />
    </div>
  );
}

function Grid({ p, ctx }) {
  const tools = ctx.tools;
  if (!tools.length) return <p className="calc-empty">Tools will appear here once they are published.</p>;
  return (
    <>
      {has(p.heading) && <h2 className="tool-section-title">{p.heading}</h2>}
      <div className="tool-grid">
        {tools.map((t) => (
          <A key={t.slug} url={t.url} className="tool-card">
            <div className="tool-ic"><Icon value={t.icon} /></div>
            <b>{t.title}</b>
            {has(t.tag) && <span>{t.tag}</span>}
          </A>
        ))}
      </div>
    </>
  );
}

function Content({ p }) {
  if (!has(p.heading) && !has(p.text)) return null;
  return (
    <div className="tool-content" id={p.anchorId || undefined}>
      {has(p.heading) && <h2>{p.heading}</h2>}
      <Paragraphs text={p.text} />
      {list(p.points).some((x) => has(x.text)) && (
        <ul>{list(p.points).filter((x) => has(x.text)).map((x, i) => <li key={i}>{x.text}</li>)}</ul>
      )}
    </div>
  );
}

function Faq({ p }) {
  const items = list(p.items).filter((x) => has(x.question));
  if (!items.length) return null;
  return (
    <div className="tool-content tool-faq">
      {has(p.heading) && <h2>{p.heading}</h2>}
      {items.map((x, i) => (
        <details key={i} open={i === 0}>
          <summary>{x.question}</summary>
          <Paragraphs text={x.answer} />
        </details>
      ))}
    </div>
  );
}

function FormBlock({ p }) {
  if (!p.form) return null;
  return (
    <div className="tool-content tool-form" id={p.anchorId || "enquiry"}>
      {has(p.heading) && <h2>{p.heading}</h2>}
      {has(p.sub) && <p>{p.sub}</p>}
      <CmsForm form={p.form} compact />
    </div>
  );
}

function Cta({ p }) {
  if (!has(p.title) && !has(p.text) && !hasButton(p.button)) return null;
  return (
    <div className="tool-cta">
      <div>{has(p.title) && <b>{p.title}</b>}{has(p.text) && <span>{p.text}</span>}</div>
      <Button button={p.button} />
    </div>
  );
}

function More({ p, ctx }) {
  const limit = parseInt(p.limit, 10) || 5;
  const others = ctx.tools.filter((t) => t.slug !== ctx.page.slug).slice(0, limit);
  if (!others.length) return null;
  return (
    <div className="tool-more">
      {has(p.heading) && <h3>{p.heading}</h3>}
      <div className="tool-more-grid">
        {others.map((t) => <A key={t.slug} url={t.url} className="tool-mini"><span><Icon value={t.icon} /></span>{t.title}</A>)}
      </div>
    </div>
  );
}

function Note({ p }) {
  if (!has(p.text)) return null;
  return <p className="tool-note">{p.text}</p>;
}

// Blocks shown in the right-hand column of a tool page.
const ASIDE_TYPES = new Set(["ToolCta", "ToolMore", "ToolNote"]);

// type -> [component, sits inside the body column]
const BLOCKS = {
  ToolHero: [Hero, false],
  ToolCalculator: [CalculatorBlock, true],
  ToolsGrid: [Grid, true],
  ToolContent: [Content, true],
  ToolFaq: [Faq, true],
  ToolForm: [FormBlock, true],
  ToolCta: [Cta, true],
  ToolMore: [More, true],
  ToolNote: [Note, true],
};

/**
 * sections: the page's blocks ({ id, type, payload }); tools: the published tool pages;
 * page: { slug, title }. The page itself is listed among `tools` when it is a draft (preview).
 */
export default function ToolSections({ sections = [], tools = [], page = {} }) {
  const blocks = list(sections);
  const slug = String(page.slug || "").replace(/^\/+|\/+$/g, "");
  const isHub = !blocks.some((s) => s.type === "ToolCalculator") && blocks.some((s) => s.type === "ToolsGrid");
  const hero = blocks.find((s) => s.type === "ToolHero")?.payload || {};
  const ctx = { isHub, tools: list(tools), page: { slug, title: page.title } };

  // Consecutive body blocks share one column, as in the reference (.wrap.tool-page-body). On a tool
  // page that column is two columns wide: the calculator and texts on the left, the expert strip,
  // "More free tools" and the note in a sticky column on the right (.tool-layout).
  const groups = [];
  for (const section of blocks) {
    const entry = BLOCKS[section.type];
    // Homepage and general-purpose blocks may be added too: full width, between the page's own blocks.
    const extra = !entry && (isHomeSection(section) ? <HomeBlock section={section} /> : isCommonSection(section) ? <CommonBlock section={section} /> : null);
    if (!entry && !extra) continue;
    const inBody = entry ? entry[1] : false;
    const Component = entry?.[0];
    // Every block may have its own background (admin: the block's Background panel).
    const node = (
      <Fragment key={section.id}>
        <BlockBackground config={section.config} hero={section.type === "ToolHero"}>
          {entry ? <Component p={section.payload || {}} ctx={ctx} /> : extra}
        </BlockBackground>
      </Fragment>
    );
    const aside = !isHub && ASIDE_TYPES.has(section.type);
    const last = groups[groups.length - 1];
    if (inBody && last?.body) (aside ? last.aside : last.nodes).push(node);
    else groups.push({ body: inBody, key: section.id, nodes: aside ? [] : [node], aside: aside ? [node] : [] });
  }
  const bodyContent = (group) => (group.aside.length && group.nodes.length
    ? <div className="tool-layout"><div className="tool-main">{group.nodes}</div><aside className="tool-aside">{group.aside}</aside></div>
    : [...group.nodes, ...group.aside]);

  return (
    <main className="ta-tools">
      {groups.map((group) => (group.body
        ? <div key={group.key} className={`wrap ${isHub ? "tools-hub-body" : "tool-page-body"}`}>{bodyContent(group)}</div>
        : <Fragment key={group.key}>{group.nodes}</Fragment>))}
    </main>
  );
}
