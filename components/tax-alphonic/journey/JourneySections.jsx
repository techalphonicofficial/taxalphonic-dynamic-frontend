"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HomeBlock } from "../home/HomeSections";
import CommonBlock from "../blocks/CommonBlocks";
import BlockBackground from "../blocks/BlockBackground";
import { isCommonSection, isHomeSection } from "../blocks/commonBlockTypes";
import "./journey-page.css";

/*
 * Journey Stage page (uirefrence.html #/journey/<stage>): a CMS page built from Journey blocks
 * (admin: Pages → Journey Stage). Markup and classes follow the reference (styles in
 * journey-page.css, scoped under .ta-journey); content comes from the block payloads.
 * - The page's JourneyHero block defines the stage (number, icon, colour, title); every other
 *   block uses its colour and icon, and "{stage}" in any text becomes the stage title.
 * - Progress, Roadmap, Flow and Prev / Next are built from `stages`, the published Journey pages
 *   (GET /api/v1/pages/journey-stages), ordered by stage number.
 * Block types must match JOURNEY_BLOCKS in the admin's src/components/page-builder/journeyBlocks.js.
 */

const list = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const has = (value) => (typeof value === "string" ? value.trim() !== "" : Boolean(value));
const hasButton = (button) => Boolean(button && has(button.text));
const isExternal = (url) => /^(?:https?:)?\/\//i.test(url) || /^(mailto|tel):/i.test(url);
const isImage = (value) => /^(https?:|\/|data:)/i.test(String(value || "").trim());
const DEFAULT_COLOR = "#0E96AC";

function useGo() {
  const router = useRouter();
  return (url) => {
    const target = String(url || "").trim();
    if (!target) return;
    if (target.startsWith("#")) document.getElementById(target.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else if (isExternal(target)) window.open(target, "_blank", "noopener");
    else router.push(target);
  };
}

function A({ url, className, style, title, children }) {
  const href = String(url || "").trim();
  if (!href) return <a className={className} style={style} title={title}>{children}</a>;
  if (isExternal(href)) return <a href={href} className={className} style={style} title={title} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <Link href={href} className={className} style={style} title={title}>{children}</Link>;
}

function Button({ button, className = "btn-primary" }) {
  const go = useGo();
  if (!hasButton(button)) return null;
  return <button type="button" className={className} onClick={() => go(button.url)}>{button.text}</button>;
}

/** Emoji / text icon, or an image when the CMS stores a URL. */
function Icon({ value }) {
  const icon = String(value || "").trim();
  if (!icon) return null;
  // eslint-disable-next-line @next/next/no-img-element
  if (isImage(icon)) return <img src={icon} alt="" className="journey-icon-img" />;
  return icon;
}

/** "{stage}" in CMS text becomes the stage title. */
const fill = (text, stage) => String(text || "").replace(/\{stage\}/gi, stage.title || "");

/** Plain text where **double asterisks** mark bold words. */
function Rich({ text }) {
  return String(text || "").split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>));
}

function BlockHead({ kicker, heading, sub, stage, center = false, kickerColor }) {
  if (!has(kicker) && !has(heading) && !has(sub)) return null;
  return (
    <div className="jblock-head" style={center ? { textAlign: "center" } : undefined}>
      {has(kicker) && <span className="jkicker" style={{ color: kickerColor || stage.color }}>{fill(kicker, stage)}</span>}
      {has(heading) && <h2>{fill(heading, stage)}</h2>}
      {has(sub) && <p>{fill(sub, stage)}</p>}
    </div>
  );
}

// ---- Blocks -------------------------------------------------------------------------------

function Progress({ p, ctx }) {
  const { stage, stages, index } = ctx;
  if (!stages.length) return null;
  const pct = Math.round(((index + 1) / stages.length) * 100);
  return (
    <div className="wrap">
      <div className="jprog-wrap">
        <div className="jprog-head">
          {has(p.label) && <span className="jprog-label">{fill(p.label, stage)}</span>}
          <span className="jprog-count">Stage {index + 1} of {stages.length} · {pct}% {p.goalText || "to revenue"}</span>
        </div>
        <div className="jprogress-track"><div className="jprogress-fill" style={{ width: `${pct}%`, background: stage.color }}></div></div>
        <div className="jprogress">
          {stages.map((s, i) => (
            <A key={s.slug} url={s.url} className={`jp-stage ${i === index ? "active" : ""} ${i < index ? "done" : ""}`} title={s.title} style={{ "--jc": s.color || DEFAULT_COLOR }}>
              <span className="jp-dot">{i < index ? "✓" : s.number || String(i + 1).padStart(2, "0")}</span>
              <span className="jp-name">{s.shortLabel || s.title}</span>
            </A>
          ))}
        </div>
      </div>
    </div>
  );
}

function Hero({ p, ctx }) {
  const { stage, stages, index, counts } = ctx;
  const total = stages.length || 1;
  const pct = Math.round(((index + 1) / total) * 100);
  return (
    <div className="jhero2" style={{ "--jc": stage.color }}>
      <div className="jhero2-bg"></div>
      <div className="wrap">
        <div className="jhero2-grid">
          <div className="jhero2-left">
            {(has(stage.number) || has(p.tag)) && (
              <div className="jhero2-badge">
                {has(stage.number) && <span className="jhero2-num">{stage.number}</span>}
                {has(p.tag) && <span className="jhero2-tag">{p.tag}</span>}
              </div>
            )}
            {has(stage.title) && <h1>{stage.title}</h1>}
            {list(p.chips).some((c) => has(c.text)) && (
              <div className="nl9-meta">
                {list(p.chips).filter((c) => has(c.text)).map((c, i) => <span key={i}>{fill(c.text, stage).replace(/\{read\}/gi, String(ctx.readMinutes))}</span>)}
              </div>
            )}
            {has(p.description) && <p className="lede"><Rich text={fill(p.description, stage)} /></p>}
            {p.showMeta !== "hide" && (
              <div className="jhero2-meta">
                <div className="jhero2-meta-item"><span>📍 Stage</span><b>{index + 1} of {total}</b></div>
                {counts.steps > 0 && <div className="jhero2-meta-item"><span>📋 Steps</span><b>{counts.steps} steps</b></div>}
                {counts.services > 0 && <div className="jhero2-meta-item"><span>🛠️ Services</span><b>{counts.services}+ services</b></div>}
              </div>
            )}
            {p.showMeta !== "hide" && stages.length > 0 && (
              <>
                <div className="jhero2-prog"><div className="jhero2-prog-bar" style={{ width: `${pct}%`, background: stage.color }}></div></div>
                <div className="jhero2-prog-label">Journey progress: <b>{pct}% {p.goalText || "to revenue"}</b></div>
              </>
            )}
            {(hasButton(p.primaryButton) || hasButton(p.secondaryButton)) && (
              <div className="hh-cta" style={{ marginTop: 20 }}>
                <Button button={p.primaryButton} />
                <Button button={p.secondaryButton} className="btn-ghost" />
              </div>
            )}
          </div>
          <div className="jhero2-right">
            {has(p.image) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.image} alt={stage.title || ""} className="journey-hero-img" />
            ) : (
              <div className="jhero2-orb" style={{ "--oc": stage.color }}>
                <span><Icon value={stage.icon} /></span>
                <div className="jhero2-ring"></div>
                <div className="jhero2-ring r2"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Offer({ p, ctx }) {
  const { stage } = ctx;
  return (
    <div className="jblock2 joffer-block" style={{ "--jc": stage.color }}>
      <div className="joffer-grid">
        <div className="joffer-left">
          {has(p.kicker) && <span className="jkicker" style={{ color: stage.color }}>{fill(p.kicker, stage)}</span>}
          {has(p.heading) && <h2>{fill(p.heading, stage)}</h2>}
          {has(p.outcome) && (
            <p className="joffer-out">By the end of <b>{stage.title}</b>, you will have <b style={{ color: stage.color }}>{fill(p.outcome, stage)}</b>.</p>
          )}
          {has(p.sub) && <p className="joffer-sub">{fill(p.sub, stage)}</p>}
          {hasButton(p.button) && <div className="hh-cta"><Button button={p.button} /></div>}
        </div>
        <div className="joffer-right">
          <div className="joffer-badge" style={{ "--jc": stage.color }}>
            <div className="joffer-badge-ic"><Icon value={stage.icon} /></div>
            {has(stage.number) && <div className="joffer-badge-num">Stage {stage.number}</div>}
            <div className="joffer-badge-title">{stage.title}</div>
            <div className="joffer-badge-line"></div>
            {has(p.badgeFoot) && <div className="joffer-badge-foot">{fill(p.badgeFoot, stage)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Roadmap({ p, ctx }) {
  const { stage, stages, index } = ctx;
  if (!stages.length) return null;
  return (
    <div className="jblock2 jrm-block">
      <BlockHead kicker={p.kicker} heading={p.heading} sub={p.sub} stage={stage} kickerColor="var(--brand)" />
      <div className="jrm-list">
        {stages.map((s, i) => (
          <A key={s.slug} url={s.url} className={`jrm-row ${i === index ? "current" : ""}`} style={{ "--jc": s.color || DEFAULT_COLOR }}>
            <span className="jrm-num">{s.number || String(i + 1).padStart(2, "0")}</span>
            <span className="jrm-ic"><Icon value={s.icon} /></span>
            <div className="jrm-text"><b>{s.title}</b><span>{s.roadmapText}</span></div>
            {i === index ? <span className="jrm-here">{p.hereLabel || "You are here"}</span> : <span className="jrm-go">→</span>}
          </A>
        ))}
      </div>
    </div>
  );
}

function Steps({ p, ctx }) {
  const { stage } = ctx;
  const items = list(p.items).filter((item) => has(item.text));
  if (!items.length) return null;
  return (
    <div className="jblock2">
      <BlockHead kicker={p.kicker} heading={p.heading} sub={p.sub} stage={stage} center />
      <div className="jtimeline" style={{ "--jc": stage.color }}>
        {items.map((item, i) => (
          <div key={i} className={`jt-item ${i % 2 === 0 ? "left" : "right"}`}>
            <div className="jt-card">
              <div className="jt-step-label" style={{ color: stage.color }}>STEP {String(i + 1).padStart(2, "0")}</div>
              <p>{fill(item.text, stage)}</p>
            </div>
            <div className="jt-node" style={{ background: stage.color }}>{i + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Deliverables({ p, ctx }) {
  const { stage } = ctx;
  const delivs = list(p.deliverables).filter((d) => has(d.text));
  const services = list(p.services).filter((s) => has(s.name));
  if (!delivs.length && !services.length) return null;
  return (
    <div className="jcols">
      {delivs.length > 0 && (
        <div className="jblock2">
          <BlockHead kicker={p.leftKicker} heading={p.leftHeading} stage={stage} />
          <div className="jdelivs">
            {delivs.map((d, i) => <div key={i} className="jdeliv"><span style={{ color: stage.color }}>✓</span>{fill(d.text, stage)}</div>)}
          </div>
        </div>
      )}
      {services.length > 0 && (
        <div className="jblock2">
          <BlockHead kicker={p.rightKicker} heading={p.rightHeading} stage={stage} />
          <div className="jsvc-grid">
            {services.map((s, i) => (
              <A key={i} url={s.url} className="jsvc">
                <span className="jsvc-ic" style={{ background: `color-mix(in srgb,${stage.color} 12%,white)` }}><Icon value={s.icon || stage.icon} /></span>
                <b>{s.name}</b>
                <i style={{ color: stage.color }}>→</i>
              </A>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Why({ p, ctx }) {
  const { stage } = ctx;
  if (!has(p.heading) && !has(p.text)) return null;
  return (
    <div className="jwhy2" style={{ "--jc": stage.color }}>
      <div className="jwhy2-ic"><Icon value={p.icon || stage.icon} /></div>
      <div>
        {has(p.heading) && <h3>{fill(p.heading, stage)}</h3>}
        {has(p.text) && <p>{fill(p.text, stage)}</p>}
      </div>
    </div>
  );
}

function Story({ p, ctx }) {
  const { stage } = ctx;
  if (!has(p.before) && !has(p.did) && !has(p.after)) return null;
  return (
    <div className="jblock2 jex-block" style={{ "--jc": stage.color }}>
      <BlockHead kicker={p.kicker} heading={p.heading} sub={p.sub} stage={stage} />
      <div className="jex">
        {has(p.business) && (
          <div className="jex-who"><span className="jex-avatar" style={{ background: stage.color }}><Icon value={stage.icon} /></span><b>{p.business}</b></div>
        )}
        <div className="jex-flow">
          <div className="jex-step jex-before"><span className="jex-tag">{p.beforeLabel || "😟 Before"}</span><p>{p.before}</p></div>
          <div className="jex-arrow">→</div>
          <div className="jex-step jex-did" style={{ borderColor: stage.color }}><span className="jex-tag" style={{ color: stage.color }}>{p.didLabel || "🛠️ What we did"}</span><p>{p.did}</p></div>
          <div className="jex-arrow">→</div>
          <div className="jex-step jex-after"><span className="jex-tag" style={{ color: "#16A34A" }}>{p.afterLabel || "🎉 The result"}</span><p>{p.after}</p></div>
        </div>
      </div>
      {has(p.note) && <p className="lead-note" style={{ marginTop: 6 }}><em style={{ color: "var(--muted)" }}>{p.note}</em></p>}
    </div>
  );
}

function Flow({ p, ctx }) {
  const { stage, stages, index } = ctx;
  if (!stages.length) return null;
  return (
    <div className="jblock2 jflow-block">
      <BlockHead kicker={p.kicker} heading={p.heading} sub={p.sub} stage={stage} center />
      <div className="jflow">
        {stages.map((s, i) => (
          <A key={s.slug} url={s.url} className={`jflow-node ${i === index ? "current" : ""} ${i < index ? "past" : ""}`} style={{ "--fc": s.color || DEFAULT_COLOR }}>
            <div className="jflow-ic"><Icon value={s.icon} /></div>
            <span className="jflow-lbl">{s.title}</span>
            {i < stages.length - 1 && <div className="jflow-link"></div>}
          </A>
        ))}
      </div>
      {(hasButton(p.primaryButton) || hasButton(p.secondaryButton)) && (
        <div className="jflow-cta">
          <Button button={p.primaryButton} />
          <Button button={p.secondaryButton} className="btn-ghost" />
        </div>
      )}
    </div>
  );
}

function Photos({ p, ctx }) {
  const { stage } = ctx;
  const items = list(p.items).filter((item) => has(item.image) || has(item.tag) || has(item.caption));
  if (!items.length) return null;
  return (
    <div className="jblock2">
      <BlockHead kicker={p.kicker} heading={p.heading} sub={p.sub} stage={stage} />
      <div className="jugc-grid">
        {items.map((item, i) => (
          <div key={i} className="jugc-frame" style={{ "--uc": stage.color }}>
            <div className="jugc-photo">
              {has(item.image) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.caption || item.tag || ""} className="journey-photo-img" />
              ) : (
                <span className="jugc-ph-ic">📷</span>
              )}
              {has(item.tag) && <span className="jugc-ph-tag">{item.tag}</span>}
            </div>
            {has(item.caption) && <div className="jugc-cap">{item.caption}</div>}
          </div>
        ))}
      </div>
      {has(p.note) && <p className="lead-note" style={{ textAlign: "center", marginTop: 14 }}><em style={{ color: "var(--muted)" }}>{p.note}</em></p>}
    </div>
  );
}

function Sectors({ p, ctx }) {
  const { stage } = ctx;
  const industries = list(p.industries).filter((x) => has(x.name));
  const states = list(p.states).filter((x) => has(x.name));
  return (
    <>
      {industries.length > 0 && (
        <div className="jblock2">
          <BlockHead kicker={p.kicker} heading={p.heading} sub={p.sub} stage={stage} />
          <div className="jsector-grid">
            {industries.map((x, i) => (
              <A key={i} url={x.url} className="jsector-card" style={{ "--sc": x.color || stage.color }}>
                <div className="jsector-ic"><Icon value={x.icon} /></div>
                <b>{x.name}</b>
                {has(x.text) && <span>{fill(x.text, stage)}</span>}
                <i>{p.cardLinkText || "View →"}</i>
              </A>
            ))}
          </div>
        </div>
      )}
      {states.length > 0 && (
        <div className="jblock2 jstate-block" style={{ "--jc": stage.color }}>
          <BlockHead kicker={p.statesKicker} heading={p.statesHeading} sub={p.statesSub} stage={stage} />
          <div className="jstate-map">
            <div className="jstate-chips">
              {states.map((x, i) => <div key={i} className="jstate-chip">{x.icon ? <><Icon value={x.icon} /> </> : null}{x.name}</div>)}
            </div>
            {(has(p.noteTitle) || has(p.noteText) || hasButton(p.button)) && (
              <div className="jstate-note">
                {has(p.noteTitle) && <b>{fill(p.noteTitle, stage)}</b>}
                {has(p.noteText) && <p>{fill(p.noteText, stage)}</p>}
                <Button button={p.button} />
              </div>
            )}
          </div>
          {has(p.footnote) && <p className="lead-note" style={{ marginTop: 12 }}><em style={{ color: "var(--muted)" }}>{p.footnote}</em></p>}
        </div>
      )}
    </>
  );
}

function Resources({ p, ctx }) {
  const { stage } = ctx;
  const items = list(p.items).filter((x) => has(x.title));
  if (!items.length) return null;
  return (
    <div className="jblock2 jres-block">
      <BlockHead kicker={p.kicker} heading={p.heading} sub={p.sub} stage={stage} />
      <div className="jres-grid">
        {items.map((x, i) => (
          <A key={i} url={x.url} className="jres-card">
            <span><Icon value={x.icon} /></span>
            <b>{x.title}</b>
            {has(x.text) && <p>{fill(x.text, stage)}</p>}
            <i>→</i>
          </A>
        ))}
      </div>
    </div>
  );
}

function Nav({ p, ctx }) {
  const { stages, index } = ctx;
  if (!stages.length) return null;
  const prev = index > 0 ? stages[index - 1] : null;
  const next = index < stages.length - 1 ? stages[index + 1] : null;
  return (
    <div className="jnav">
      {prev ? (
        <A url={prev.url} className="jnav-btn prev"><span>{p.prevLabel || "← Previous stage"}</span><b><Icon value={prev.icon} /> {prev.title}</b></A>
      ) : <div></div>}
      {next ? (
        <A url={next.url} className="jnav-btn next"><span>{p.nextLabel || "Next stage →"}</span><b><Icon value={next.icon} /> {next.title}</b></A>
      ) : (
        <A url={p.lastUrl || "/talk-to-expert"} className="jnav-btn next"><span>{p.lastLabel || "Goal reached! 🎉"}</span><b>{p.lastTitle || "🎧 Start your journey"}</b></A>
      )}
    </div>
  );
}

function Knowledge({ p, ctx }) {
  const { stage } = ctx;
  const items = list(p.items).filter((x) => has(x.label));
  if (!items.length) return null;
  return (
    <div className="wrap kc-wrap">
      <div className="blk kc-blk">
        {has(p.kicker) && <div className="kicker">{fill(p.kicker, stage)}</div>}
        {has(p.heading) && <h2>{fill(p.heading, stage)}</h2>}
        {has(p.sub) && <p>{fill(p.sub, stage)}</p>}
        <div className="ikb-grid">
          {items.map((x, i) => (
            <A key={i} url={x.url} className="ikb-btn"><span className="ikb-ic"><Icon value={x.icon} /></span><span className="ikb-label">{x.label}</span></A>
          ))}
        </div>
        {(has(p.footText) || hasButton(p.footLink)) && (
          <div className="kc-foot">
            {has(p.footText) && <span>{p.footText}</span>}
            {hasButton(p.footLink) && <A url={p.footLink.url} className="kc-all">{p.footLink.text}</A>}
          </div>
        )}
      </div>
    </div>
  );
}

function Cta({ p, ctx }) {
  const { stage } = ctx;
  if (!has(p.heading) && !has(p.text) && !hasButton(p.button)) return null;
  return (
    <div className="wrap">
      <div className="ctastrip">
        {has(p.heading) && <h2>{fill(p.heading, stage)}</h2>}
        {has(p.text) && <p>{fill(p.text, stage)}</p>}
        <Button button={p.button} />
      </div>
    </div>
  );
}

// type -> [component, sits inside the body column (.wrap.jbody)]
const BLOCKS = {
  JourneyProgress: [Progress, false],
  JourneyHero: [Hero, false],
  JourneyOffer: [Offer, true],
  JourneyRoadmap: [Roadmap, true],
  JourneySteps: [Steps, true],
  JourneyDeliverables: [Deliverables, true],
  JourneyWhy: [Why, true],
  JourneyStory: [Story, true],
  JourneyFlow: [Flow, true],
  JourneyPhotos: [Photos, true],
  JourneySectors: [Sectors, true],
  JourneyResources: [Resources, true],
  JourneyNav: [Nav, true],
  JourneyKnowledge: [Knowledge, false],
  JourneyCta: [Cta, false],
};

/** The stage this page describes, from its JourneyHero block. */
function stageOf(sections, page = {}) {
  const hero = list(sections).find((s) => s.type === "JourneyHero")?.payload || {};
  return {
    slug: String(page.slug || "").replace(/^\/+|\/+$/g, ""),
    url: `/${String(page.slug || "").replace(/^\/+|\/+$/g, "")}`,
    number: String(hero.number || "").trim(),
    title: String(hero.title || page.title || "").trim(),
    shortLabel: String(hero.shortLabel || "").trim(),
    icon: String(hero.icon || "").trim(),
    color: String(hero.color || "").trim() || DEFAULT_COLOR,
    tag: String(hero.tag || "").trim(),
    roadmapText: String(hero.roadmapText || "").trim(),
  };
}

/**
 * sections: the page's blocks ({ id, type, config, payload }); stages: the published Journey
 * pages; page: { slug, title }. A page that is not in `stages` yet (draft, preview) is placed in
 * the list by its stage number, so its own progress and navigation already look right.
 */
export default function JourneySections({ sections = [], stages = [], page = {} }) {
  const stage = stageOf(sections, page);
  const all = list(stages).filter((s) => s.slug !== stage.slug);
  if (stage.slug) all.push(stage);
  all.sort((a, b) => (parseFloat(a.number) || 999) - (parseFloat(b.number) || 999) || a.title.localeCompare(b.title));
  const index = Math.max(0, all.findIndex((s) => s.slug === stage.slug));
  const counts = {
    steps: list(sections).filter((s) => s.type === "JourneySteps").reduce((n, s) => n + list(s.payload?.items).filter((x) => has(x?.text)).length, 0),
    services: list(sections).filter((s) => s.type === "JourneyDeliverables").reduce((n, s) => n + list(s.payload?.services).filter((x) => has(x?.name)).length, 0),
  };
  // "{read}" in the hero chips: reading time of the page's texts, as the reference computes it (220 words / min).
  const words = JSON.stringify(list(sections).map((s) => s.payload || {})).replace(/"[a-zA-Z]+":/g, " ").split(/\s+/).filter((w) => /[a-z]/i.test(w)).length;
  const ctx = { stage, stages: all, index, counts, readMinutes: Math.max(1, Math.round(words / 220)) };

  // Consecutive body blocks share one .wrap.jbody column, as in the reference.
  const groups = [];
  for (const section of list(sections)) {
    const entry = BLOCKS[section.type];
    // Homepage and general-purpose blocks may be added too: full width, between the page's own blocks.
    const extra = !entry && (isHomeSection(section) ? <HomeBlock section={section} /> : isCommonSection(section) ? <CommonBlock section={section} /> : null);
    if (!entry && !extra) continue;
    const inBody = entry ? entry[1] : false;
    const Component = entry?.[0];
    // Every block may have its own background (admin: the block's Background panel).
    const node = (
      <Fragment key={section.id}>
        <BlockBackground config={section.config} hero={section.type === "JourneyHero"}>
          {entry ? <Component p={section.payload || {}} ctx={ctx} /> : extra}
        </BlockBackground>
      </Fragment>
    );
    const last = groups[groups.length - 1];
    if (inBody && last?.body) last.nodes.push(node);
    else groups.push({ body: inBody, key: section.id, nodes: [node] });
  }

  return (
    <main className="ta-journey" style={{ "--jc": stage.color }}>
      {groups.map((group) => (group.body ? <div key={group.key} className="wrap jbody">{group.nodes}</div> : <Fragment key={group.key}>{group.nodes}</Fragment>))}
    </main>
  );
}
