"use client";

import { Fragment, useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CmsForm from "../forms/CmsForm";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import "./home-page.css";

/*
 * Homepage blocks from the CMS Page Builder (page slug "home"), or DEFAULT_HOME_SECTIONS.
 * Markup and classes are those of uirefrence.html's home view (styles in home-page.css,
 * scoped under .ta-home); only the content comes from the block payload. Empty fields hide
 * their element and a block with no content renders nothing.
 * Block types must match HOME_BLOCKS in cms-admin src/components/page-builder/homeBlocks.js.
 */

const list = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const has = (value) => (typeof value === "string" ? value.trim() !== "" : Boolean(value));
const hasButton = (button) => Boolean(button && has(button.text));
const pad = (index) => String(index + 1).padStart(2, "0");
const isExternal = (url) => /^(?:https?:)?\/\//i.test(url) || /^(mailto|tel):/i.test(url);

function scrollToHash(url) {
  document.getElementById(url.slice(1))?.scrollIntoView({ behavior: "smooth" });
}

function useGo() {
  const router = useRouter();
  return (url) => {
    const target = String(url || "").trim();
    if (!target) return;
    if (target.startsWith("#")) scrollToHash(target);
    else if (isExternal(target)) window.open(target, "_blank", "noopener");
    else router.push(target);
  };
}

/** An <a> element (where the reference uses one) pointing at a CMS link. */
function A({ url, className, style, children }) {
  const href = String(url || "").trim();
  if (!href) return <a className={className} style={style}>{children}</a>;
  if (href.startsWith("#")) {
    return <a href={href} className={className} style={style} onClick={(e) => { e.preventDefault(); scrollToHash(href); }}>{children}</a>;
  }
  if (isExternal(href)) return <a href={href} className={className} style={style} target="_blank" rel="noopener noreferrer">{children}</a>;
  return <Link href={href} className={className} style={style}>{children}</Link>;
}

/** A clickable card that keeps the reference's element (div) so its layout is unchanged. */
function Card({ url, className, style, children }) {
  const go = useGo();
  if (!has(url)) return <div className={className} style={style}>{children}</div>;
  return (
    <div
      className={className}
      style={style}
      role="link"
      tabIndex={0}
      onClick={() => go(url)}
      onKeyDown={(e) => { if (e.key === "Enter") go(url); }}
    >
      {children}
    </div>
  );
}

function Button({ button, className = "btn-primary", style }) {
  const go = useGo();
  if (!hasButton(button)) return null;
  return <button type="button" className={className} style={style} onClick={() => go(button.url)}>{button.text}</button>;
}

/** Emoji/text icon, or an image when the CMS stores a URL. */
function Icon({ value }) {
  const icon = String(value || "").trim();
  if (!icon) return null;
  if (/^(https?:|\/|data:)/i.test(icon)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" className="home-icon-img" />;
  }
  return icon;
}

/** Module text (e.g. a FAQ answer) may be rich-text HTML from the CMS editor. */
function TextOrHtml({ value, as: Tag = "p", className }) {
  const text = String(value || "");
  // A <div> wrapper: the HTML usually brings its own <p> tags, which cannot nest in a <p>.
  if (/<[a-z][\s\S]*>/i.test(text)) return <div className={`home-rich${className ? ` ${className}` : ""}`} dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />;
  return <Tag className={className}>{text}</Tag>;
}

const isImage = (value) => /^(https?:|\/|data:)/i.test(String(value || "").trim());

/** Plain text where **double asterisks** mark bold words. */
function RichText({ text }) {
  return String(text || "").split(/\*\*(.+?)\*\*/g).map((part, i) => (i % 2 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>));
}

function SecHead({ eyebrow, heading, sub, id }) {
  if (!has(eyebrow) && !has(heading) && !has(sub)) return null;
  return (
    <div className="sec-head">
      {has(eyebrow) && <span className="eyebrow">{eyebrow}</span>}
      {has(heading) && <h2 id={id}>{heading}</h2>}
      {has(sub) && <p className="sub">{sub}</p>}
    </div>
  );
}

// Chip slots around the dashboard card, as laid out in the reference SVG.
const CHIP_SLOTS = [
  { x: 22, y: 60, w: 120, h: 48, ix: 44, iy: 90, tx: 62, t1: 80, t2: 95 },
  { x: 350, y: 40, w: 108, h: 48, ix: 374, iy: 70, tx: 392, t1: 68, t2: 83 },
  { x: 372, y: 200, w: 100, h: 48, ix: 394, iy: 230, tx: 412, t1: 228, t2: 243 },
  { x: 14, y: 300, w: 104, h: 48, ix: 38, iy: 330, tx: 56, t1: 328, t2: 343 },
  { x: 348, y: 392, w: 112, h: 48, ix: 372, iy: 422, tx: 390, t1: 420, t2: 435 },
  { x: 150, y: 410, w: 120, h: 46, ix: 174, iy: 439, tx: 192, t1: 431, t2: 446, iconSize: 20 },
];
const BAR_ROWS = [256, 290, 324];

function HeroVisual({ d }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const ids = { card: `hvCard${uid}`, accent: `hvAccent${uid}`, shadow: `hvShadow${uid}`, chip: `hvChip${uid}` };
  const bars = list(d.bars).slice(0, BAR_ROWS.length);
  const chips = list(d.chips).slice(0, CHIP_SLOTS.length);
  const text = { fontFamily: "Inter,sans-serif" };

  return (
    <div className="hero-visual">
      <svg viewBox="0 0 480 480" xmlns="http://www.w3.org/2000/svg" role="img" aria-label={`${d.brand || "Platform"} overview`}>
        <defs>
          <linearGradient id={ids.card} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0E96AC" /><stop offset="100%" stopColor="#1A2236" />
          </linearGradient>
          <linearGradient id={ids.accent} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0E96AC" /><stop offset="100%" stopColor="#E8521E" />
          </linearGradient>
          <filter id={ids.shadow} x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="10" stdDeviation="18" floodColor="#0E96AC" floodOpacity="0.18" />
          </filter>
          <filter id={ids.chip} x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#0A0E1A" floodOpacity="0.10" />
          </filter>
        </defs>

        <rect x="90" y="90" width="300" height="300" rx="28" fill={`url(#${ids.card})`} filter={`url(#${ids.shadow})`} />
        {has(d.brand) && <circle cx="124" cy="126" r="9" fill="#E8521E" />}
        <text x="142" y="131" fontSize="15" fontWeight="700" fill="#fff" fontFamily="Sora,sans-serif">{d.brand}</text>
        <text x="356" y="131" fontSize="12" fill="rgba(255,255,255,.55)" textAnchor="end" {...text}>{d.label}</text>
        <text x="124" y="196" fontSize="44" fontWeight="800" fill="#fff" fontFamily="Sora,sans-serif">{d.value}</text>
        <text x="124" y="220" fontSize="13" fill="rgba(255,255,255,.6)" {...text}>{d.caption}</text>

        <g {...text}>
          {bars.map((bar, i) => {
            const y = BAR_ROWS[i];
            const width = (232 * Math.min(100, Math.max(0, Number(bar.percent) || 0))) / 100;
            return (
              <Fragment key={i}>
                <text x="124" y={y} fontSize="11" fill="rgba(255,255,255,.7)">{bar.label}</text>
                <rect x="124" y={y + 6} width="232" height="7" rx="3.5" fill="rgba(255,255,255,.12)" />
                <rect x="124" y={y + 6} width={width} height="7" rx="3.5" fill={`url(#${ids.accent})`} />
              </Fragment>
            );
          })}
        </g>

        {(has(d.rating) || has(d.ratingText)) && (
          <>
            <rect x="124" y="352" width="120" height="26" rx="13" fill="rgba(255,255,255,.1)" />
            <text x="138" y="369" fontSize="12" fill="#F5A623" {...text}>{d.rating}</text>
            <text x="172" y="369" fontSize="11" fill="rgba(255,255,255,.7)" {...text}>{d.ratingText}</text>
          </>
        )}

        {chips.map((chip, i) => {
          const s = CHIP_SLOTS[i];
          return (
            <g key={i} filter={`url(#${ids.chip})`}>
              <rect x={s.x} y={s.y} width={s.w} height={s.h} rx="14" fill="#fff" />
              <text x={s.ix} y={s.iy} fontSize={s.iconSize || 22} textAnchor="middle">{chip.icon}</text>
              <text x={s.tx} y={s.t1} fontSize="11.5" fontWeight="600" fill="#0A0E1A" {...text}>{chip.title}</text>
              <text x={s.tx} y={s.t2} fontSize="11.5" fontWeight="600" fill="#0A0E1A" {...text}>{chip.subtitle}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function Hero({ p }) {
  const go = useGo();
  const [search, setSearch] = useState("");
  const searchItems = list(p.searchItems);
  const statCards = list(p.statCards);
  const metrics = list(p.metrics);
  const d = p.dashboard || {};
  // Right side: the admin's image when set, else the dashboard visual. Size: sm | md | lg | xl.
  const image = has(p.heroImage) ? String(p.heroImage).trim() : "";
  const showVisual = Boolean(image) || has(d.value) || list(d.bars).length > 0 || list(d.chips).length > 0;
  const size = ["sm", "md", "lg", "xl"].includes(p.visualSize) ? p.visualSize : "lg";
  const showSearch = has(p.searchPlaceholder) || searchItems.length > 0;

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return searchItems.filter((x) => `${x.label} ${x.desc}`.toLowerCase().includes(q)).slice(0, 8);
  }, [search, searchItems]);

  const submitSearch = () => results[0] && go(results[0].url);

  if (!has(p.heading) && !has(p.highlight) && !has(p.subHeading) && !showVisual) return null;

  return (
    <div className="hh">
      <div className="hh-bg" />
      <div className={`wrap hero-grid hero-size-${size}`} style={showVisual ? undefined : { gridTemplateColumns: "1fr" }}>
        <div className="hero-text">
          {has(p.eyebrow) && <span className="eyebrow">{p.eyebrow}</span>}
          {(has(p.heading) || has(p.highlight)) && (
            <h1>{p.heading}{has(p.heading) && has(p.highlight) && " "}{has(p.highlight) && <em>{p.highlight}</em>}</h1>
          )}
          {has(p.subHeading) && <p className="lede">{p.subHeading}</p>}
          {statCards.length > 0 && (
            <div className="hero-stats">
              {statCards.map((card, i) => (
                <Card key={i} url={card.url} className="hstat"><b>{card.value}</b><span>{card.label}</span></Card>
              ))}
            </div>
          )}
          {showSearch && (
            <div className="hero-search">
              <span className="hs-ic">🔍</span>
              <input
                value={search}
                placeholder={p.searchPlaceholder || ""}
                aria-label={p.searchPlaceholder || "Search"}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitSearch()}
              />
              {has(p.searchButtonText) && <button type="button" className="hs-btn" onClick={submitSearch}>{p.searchButtonText}</button>}
              <div className={`results${search.trim() ? " show" : ""}`}>
                {search.trim() && (results.length ? results.map((r, i) => (
                  <a key={`${r.url}-${i}`} onMouseDown={() => go(r.url)}><span><Icon value={r.icon} /></span> {r.label}{has(r.desc) && <span className="cat">{r.desc}</span>}</a>
                )) : has(p.searchEmptyText) && <div className="empty">{p.searchEmptyText}</div>)}
              </div>
            </div>
          )}
          {(hasButton(p.primaryButton) || hasButton(p.secondaryButton)) && (
            <div className="hh-cta">
              <Button button={p.primaryButton} />
              <Button button={p.secondaryButton} className="btn-ghost" />
            </div>
          )}
          {metrics.length > 0 && (
            <div className="hero-trust">
              {metrics.map((m, i) => <div key={i}><b>{m.value}</b><span>{m.label}</span></div>)}
            </div>
          )}
        </div>
        {showVisual && (image ? (
          <div className="hero-visual hero-visual-img">
            {/* CMS images come from arbitrary hosts, so next/image remotePatterns can't cover them. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt={p.heroImageAlt || ""} />
          </div>
        ) : <HeroVisual d={d} />)}
      </div>
    </div>
  );
}

function TrustBar({ p }) {
  const items = list(p.items).filter((item) => has(item.text));
  if (!items.length) return null;
  return (
    <div className="trustbar">
      {items.map((item, i) => <span key={i}>{has(item.icon) && <><Icon value={item.icon} /> </>}{item.text}</span>)}
    </div>
  );
}

function Stages({ p }) {
  const items = list(p.items);
  const stats = list(p.stats);
  const showCta = has(p.ctaTitle) || has(p.ctaText) || hasButton(p.primaryButton) || hasButton(p.secondaryButton);
  if (!items.length && !has(p.heading)) return null;
  return (
    <div className="ej">
      <div className="wrap">
        <div className="ej-head">
          {has(p.eyebrow) && <span className="ej-eyebrow">{p.eyebrow}</span>}
          {(has(p.heading) || has(p.highlight)) && <h2>{p.heading}{has(p.heading) && has(p.highlight) && " "}{has(p.highlight) && <em>{p.highlight}</em>}</h2>}
          {has(p.text) && <p className="ej-sub"><RichText text={p.text} /></p>}
          {stats.length > 0 && (
            <div className="ej-head-stats">
              {stats.map((s, i) => (
                <Fragment key={i}>
                  {i > 0 && <div className="ej-hdiv" />}
                  <div className="ej-hstat"><b>{s.value}</b><span>{s.label}</span></div>
                </Fragment>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="ej-track">
            {items.map((st, i) => (
              <A key={i} url={st.url} className="ej-stage" style={{ "--ejc": st.color || "#0E96AC" }}>
                <div className="ej-stage-accent" />
                <div className="ej-stage-top">
                  <div className="ej-num">{pad(i)}<span className="ej-num-total">/{String(items.length).padStart(2, "0")}</span></div>
                  <div className="ej-ic"><span><Icon value={st.icon} /></span></div>
                </div>
                <h3>{st.title}</h3>
                {has(st.text) && <p>{st.text}</p>}
                {has(st.tag) && <span className="ej-tag">{st.tag}</span>}
                {(has(st.step) || has(p.linkText)) && (
                  <div className="ej-reveal">
                    {has(st.step) && <div className="ej-reveal-row">✓ {st.step}</div>}
                    {has(p.linkText) && <span className="ej-go">{p.linkText}</span>}
                  </div>
                )}
                {i < items.length - 1 && <div className="ej-connector" />}
              </A>
            ))}
          </div>
        )}
        {showCta && (
          <div className="ej-cta">
            <div className="ej-cta-glow" />
            <div className="ej-cta-text">{has(p.ctaTitle) && <b>{p.ctaTitle}</b>}{has(p.ctaText) && <span>{p.ctaText}</span>}</div>
            <div className="ej-cta-btns">
              <Button button={p.primaryButton} />
              <Button button={p.secondaryButton} className="btn-ghost-light" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Knowledge({ p }) {
  const items = list(p.items).filter((item) => has(item.label));
  if (!items.length && !hasButton(p.moreLink)) return null;
  return (
    <div className="ql-strip">
      <div className="wrap ql-in">
        {(has(p.title) || has(p.badge)) && (
          <span className="ql-label">
            {has(p.icon) && <><span className="ql-pin"><Icon value={p.icon} /></span> </>}
            {p.title}
            {has(p.badge) && <> <span className="ql-live">{p.badge}</span></>}
          </span>
        )}
        <div className="ql-chips">
          {items.map((item, i) => <A key={i} url={item.url} className="ql-chip">{has(item.icon) && <span className="ql-ic"><Icon value={item.icon} /></span>}{item.label}</A>)}
          {hasButton(p.moreLink) && <A url={p.moreLink.url} className="ql-chip ql-more">{p.moreLink.text} <span className="ql-arrow">→</span></A>}
        </div>
      </div>
    </div>
  );
}

function Services({ p }) {
  const items = list(p.items);
  if (!items.length && !has(p.heading)) return null;
  return (
    <div className="cats" id={p.anchorId || undefined}>
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        {items.length > 0 && (
          <div className="catgrid">
            {items.map((item, i) => (
              <Card key={i} url={item.url} className="catcard">
                <div className="ci"><Icon value={item.icon} /></div>
                <h3>{item.title}</h3>{has(item.text) && <p>{item.text}</p>}
                {has(item.countText) && <span className="cn">{item.countText}</span>}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Platform({ p }) {
  const items = list(p.items);
  if (!items.length && !has(p.heading)) return null;
  return (
    <div className="bigsec">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        {items.length > 0 && (
          <div className="sec-grid">
            {items.map((item, i) => (
              <Card key={i} url={item.url} className="sec-card">
                <div className="sec-ic"><Icon value={item.icon} /></div>
                <div className="sec-body"><h3>{item.title}</h3>{has(item.text) && <p>{item.text}</p>}{has(item.linkText) && <span className="sec-n">{item.linkText}</span>}</div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Press({ p }) {
  const items = list(p.items).filter((item) => has(item.name) || has(item.image));
  if (!items.length) return null;
  return (
    <div className="press">
      <div className="wrap">
        {has(p.label) && <span className="press-label">{p.label}</span>}
        <div className="press-logos">
          {items.map((item, i) => (
            <A key={i} url={item.url} className="press-logo" style={item.color ? { "--pc": item.color } : undefined}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {has(item.image) ? <img src={item.image} alt={item.name || ""} className="press-img" /> : item.name}
            </A>
          ))}
        </div>
        {hasButton(p.link) && <A url={p.link.url} className="press-all">{p.link.text}</A>}
      </div>
    </div>
  );
}

function Journey({ p }) {
  const items = list(p.items);
  if (!items.length) return null;
  return (
    <div className="info-journey">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="journey3d">
          {items.map((st, i) => (
            <Card key={i} url={st.url} className="j3d-stage">
              <div className="j3d-orb" style={{ "--oc": st.color || "#0E96AC" }}><span><Icon value={st.icon} /></span></div>
              <h4>{st.title}</h4>
              {has(st.text) && <p>{st.text}</p>}
              {i < items.length - 1 && <div className="j3d-line" />}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Clients({ p }) {
  const items = list(p.items).filter((item) => has(item.name) || has(item.logo));
  const headingId = useId();
  if (!items.length) return null;
  const cards = (copy) => items.map((item, i) => {
    const logo = isImage(item.logo)
      // eslint-disable-next-line @next/next/no-img-element
      ? <img src={item.logo} alt={item.name || ""} className="client-logo-img" />
      : <span className="client-logo"><Icon value={item.logo} /></span>;
    return copy ? (
      <div key={`${copy}-${i}`} className="client-card" aria-hidden="true">{logo}{has(item.name) && <b>{item.name}</b>}</div>
    ) : (
      <Card key={`${copy}-${i}`} url={item.url} className="client-card">{logo}{has(item.name) && <b>{item.name}</b>}</Card>
    );
  });
  return (
    <section className="clients" aria-labelledby={has(p.heading) ? headingId : undefined}>
      <div className="wrap">
        <SecHead eyebrow={p.eyebrow} heading={p.heading} sub={p.sub} id={headingId} />
        <div className="clients-marquee">
          {/* The track holds the logos twice so the marquee loops seamlessly. */}
          <div className="clients-track">{cards(0)}{cards(1)}</div>
        </div>
        {has(p.note) && <p className="clients-note">{p.note}</p>}
      </div>
    </section>
  );
}

function HowItWorks({ p }) {
  const items = list(p.items);
  if (!items.length) return null;
  return (
    <div className="how">
      <div className="wrap">
        <SecHead eyebrow={p.eyebrow} heading={p.heading} sub={p.sub} />
        <div className="how-flow">
          <div className="how-line" aria-hidden="true" />
          {items.map((item, i) => (
            <Card key={i} url={item.url} className="how-card">
              <div className="how-top"><span className="how-num">{i + 1}</span><span className="how-ic"><Icon value={item.icon} /></span></div>
              <h4>{item.title}</h4>{has(item.text) && <p>{item.text}</p>}
              {has(item.tag) && <span className="how-tag">{item.tag}</span>}
            </Card>
          ))}
        </div>
        {hasButton(p.button) && <div className="how-cta"><Button button={p.button} /></div>}
      </div>
    </div>
  );
}

function Tools({ p }) {
  const items = list(p.items);
  if (!items.length) return null;
  return (
    <div className="tools">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="tool-grid">
          {items.map((item, i) => (
            <A key={i} url={item.url} className="tool-card"><div className="tool-ic"><Icon value={item.icon} /></div><b>{item.title}</b>{has(item.text) && <span>{item.text}</span>}</A>
          ))}
        </div>
        {hasButton(p.button) && <div style={{ textAlign: "center", marginTop: 24 }}><Button button={p.button} className="btn-ghost" /></div>}
      </div>
    </div>
  );
}

function Bundles({ p }) {
  const items = list(p.items);
  if (!items.length) return null;
  return (
    <div className="bundles">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="bundle-grid">
          {items.map((item, i) => {
            const featured = item.featured === true || item.featured === "true";
            return (
              <Card key={i} url={item.url} className={`bundle-card${featured ? " pop" : ""}`}>
                {has(item.tag) && <div className="bundle-tag">{item.tag}</div>}
                <h3>{item.title}</h3>
                {has(item.text) && <p>{item.text}</p>}
                {(has(item.price) || has(item.priceNote)) && <div className="bundle-price">{item.price}{has(item.priceNote) && <> <small>{item.priceNote}</small></>}</div>}
                {has(item.linkText) && <span className="bundle-go">{item.linkText}</span>}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WhyUs({ p }) {
  const items = list(p.items);
  if (!items.length) return null;
  return (
    <div className="why">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="why-grid">
          {items.map((item, i) => <div key={i} className="why-card"><div className="ic"><Icon value={item.icon} /></div><h4>{item.title}</h4>{has(item.text) && <p>{item.text}</p>}</div>)}
        </div>
      </div>
    </div>
  );
}

function Comparison({ p }) {
  const rows = list(p.rows);
  if (!rows.length) return null;
  return (
    <div className="compare">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="cmp-table">
          <div className="cmp-row cmp-head"><div>{p.labelHeader}</div><div className="cmp-us">{p.oursHeader}</div><div>{p.col2Header}</div><div>{p.col3Header}</div></div>
          {rows.map((r, i) => <div key={i} className="cmp-row"><div>{r.label}</div><div className="cmp-us">{r.ours}</div><div>{r.col2}</div><div>{r.col3}</div></div>)}
        </div>
      </div>
    </div>
  );
}

function Industries({ p }) {
  const items = list(p.items);
  if (!items.length) return null;
  return (
    <div className="industries">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="ind-grid">
          {items.map((item, i) => (
            <Card key={i} url={item.url} className="ind-card"><div className="ind-ic"><Icon value={item.icon} /></div><b>{item.title}</b>{has(p.linkText) && <span className="ind-go">{p.linkText}</span>}</Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function ExpertCta({ p }) {
  const form = p.form && Array.isArray(p.form.fields) ? p.form : null;
  if (!has(p.heading) && !has(p.text) && !form) return null;
  return (
    <div className="wrap">
      <div className="expert-banner" id={p.anchorId || undefined} style={form ? undefined : { gridTemplateColumns: "1fr" }}>
        <div className="eb-left">
          {has(p.eyebrow) && <span className="eyebrow" style={{ color: "#fff", background: "rgba(255,255,255,.15)" }}>{p.eyebrow}</span>}
          {has(p.heading) && <h2>{p.heading}</h2>}
          {has(p.text) && <p>{p.text}</p>}
          {(hasButton(p.primaryButton) || hasButton(p.secondaryButton)) && (
            <div className="eb-cta">
              <Button button={p.primaryButton} style={{ background: "#fff", color: "var(--ink)" }} />
              {/* Shown only with a link, e.g. https://wa.me/91XXXXXXXXXX */}
              {hasButton(p.secondaryButton) && has(p.secondaryButton.url) && <A url={p.secondaryButton.url} className="eb-wa">{p.secondaryButton.text}</A>}
            </div>
          )}
        </div>
        {form && (
          <div className="eb-form">
            {has(p.formTitle) && <h3>{p.formTitle}</h3>}
            <CmsForm form={form} compact />
            {has(p.formNote) && <p className="lead-note">{p.formNote}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function Testimonials({ p }) {
  const items = list(p.items).filter((item) => has(item.quote));
  if (!items.length) return null;
  const initials = (name) => String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return (
    <div className="ttm">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="ttm-grid">
          {items.map((item, i) => {
            const stars = Math.min(5, Math.max(0, Math.round(Number(item.rating) || 0)));
            return (
              <div key={i} className="review">
                {stars > 0 && <div className="stars">{"★".repeat(stars)}</div>}
                <p>&quot;{String(item.quote).replace(/^["“]|["”]$/g, "")}&quot;</p>
                {has(item.name) && (
                  <div className="rauthor">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <div className="ravatar">{isImage(item.avatar) ? <img src={item.avatar} alt="" className="ravatar-img" /> : initials(item.name)}</div>
                    <div><b>{item.name}</b>{has(item.role) && <span>{item.role}</span>}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Security({ p }) {
  const items = list(p.items);
  if (!items.length) return null;
  return (
    <div className="secband">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="sec-grid2">
          {items.map((item, i) => <div key={i} className="sec2-card"><div className="sec2-ic"><Icon value={item.icon} /></div><h4>{item.title}</h4>{has(item.text) && <p>{item.text}</p>}</div>)}
        </div>
      </div>
    </div>
  );
}

function Faq({ p }) {
  const items = list(p.items).filter((item) => has(item.question));
  if (!items.length) return null;
  return (
    <div className="home-faq">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="faq-wrap">
          {items.map((item, i) => <details key={i} className="faq" open={i === 0}><summary>{item.question}</summary><TextOrHtml value={item.answer} /></details>)}
        </div>
      </div>
    </div>
  );
}

function Newsletter({ p }) {
  const form = p.form && Array.isArray(p.form.fields) ? p.form : null;
  if (!has(p.heading) && !has(p.text)) return null;
  return (
    <div className="wrap">
      <div className="news-band">
        <div className="news-left">{has(p.heading) && <h2>{p.heading}</h2>}{has(p.text) && <p>{p.text}</p>}</div>
        {form ? (
          <div className="news-cms-form"><CmsForm form={form} compact /></div>
        ) : has(p.buttonText) && (
          <div className="news-form">
            <input placeholder={p.placeholder || ""} aria-label={p.placeholder || "Email address"} />
            <button type="button" className="btn-primary">{p.buttonText}</button>
          </div>
        )}
      </div>
    </div>
  );
}

function FinalCta({ p }) {
  if (!has(p.heading) && !has(p.text) && !hasButton(p.button)) return null;
  return (
    <div className="wrap">
      <div className="ctastrip">
        {has(p.heading) && <h2>{p.heading}</h2>}
        {has(p.text) && <p>{p.text}</p>}
        <Button button={p.button} />
      </div>
    </div>
  );
}

/** A CMS form (payload.formId, hydrated into payload.form by the backend) in a card. */
function FormBlock({ p }) {
  const form = p.form && Array.isArray(p.form.fields) ? p.form : null;
  if (!form) return null;
  return (
    <div className="home-form" id={p.anchorId || undefined}>
      <div className="wrap">
        <div className="home-form-card">
          <SecHead eyebrow={p.eyebrow} heading={p.heading} sub={p.sub} />
          <CmsForm form={form} compact />
          {has(p.note) && <p className="lead-note">{p.note}</p>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Blocks fed by CMS modules (not in the reference; styled in home-page.css) ---------- */

function Team({ p }) {
  const items = list(p.items).filter((m) => has(m.name));
  if (!items.length) return null;
  const initials = (name) => String(name).split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return (
    <div className="home-team">
      <div className="wrap">
        <SecHead eyebrow={p.eyebrow} heading={p.heading} sub={p.sub} />
        <div className="team-grid">
          {items.map((m, i) => (
            <div key={i} className="team-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="team-photo">{isImage(m.image) ? <img src={m.image} alt={m.name} /> : <span>{initials(m.name)}</span>}</div>
              <h4>{m.name}</h4>
              {has(m.role) && <span className="team-role">{m.role}</span>}
              {p.showBio !== "hide" && has(m.bio) && <p>{m.bio}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Banners({ p }) {
  const items = list(p.items).filter((b) => has(b.image));
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const seconds = Math.max(2, Number(p.interval) || 6);
  const count = items.length;

  useEffect(() => {
    if (count < 2 || paused) return undefined;
    const timer = setInterval(() => setActive((i) => (i + 1) % count), seconds * 1000);
    return () => clearInterval(timer);
  }, [count, paused, seconds]);

  if (!count) return null;
  const current = Math.min(active, count - 1);
  return (
    <div className="home-banners">
      <div className="wrap">
        <SecHead heading={p.heading} sub={p.sub} />
        <div className="hb-slider" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
          {items.map((b, i) => (
            <div key={i} className={`hb-slide hb-${b.align || "left"} hb-${b.theme === "dark" ? "dark" : "light"}${i === current ? " is-active" : ""}`} aria-hidden={i === current ? undefined : "true"}>
              <picture>
                {has(b.mobileImage) && <source media="(max-width: 640px)" srcSet={b.mobileImage} />}
                <img src={b.image} alt={b.title || ""} loading={i === 0 ? "eager" : "lazy"} />
              </picture>
              {(has(b.title) || has(b.subtitle) || has(b.text) || has(b.buttonText)) && (
                <div className="hb-copy">
                  {has(b.title) && <h2>{b.title}</h2>}
                  {has(b.subtitle) && <p className="hb-sub">{b.subtitle}</p>}
                  {has(b.text) && <p>{b.text}</p>}
                  {has(b.buttonText) && has(b.url) && (
                    b.newTab
                      ? <a className="btn-primary" href={b.url} target="_blank" rel="noopener noreferrer" tabIndex={i === current ? 0 : -1}>{b.buttonText}</a>
                      : <A url={b.url} className="btn-primary">{b.buttonText}</A>
                  )}
                </div>
              )}
            </div>
          ))}
          {count > 1 && (
            <>
              <button type="button" className="hb-nav hb-prev" aria-label="Previous banner" onClick={() => setActive((current - 1 + count) % count)}>‹</button>
              <button type="button" className="hb-nav hb-next" aria-label="Next banner" onClick={() => setActive((current + 1) % count)}>›</button>
              <div className="hb-dots">
                {items.map((_, i) => <button key={i} type="button" className={i === current ? "is-active" : ""} aria-label={`Show banner ${i + 1}`} onClick={() => setActive(i)} />)}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Branches({ p }) {
  const items = list(p.items).filter((b) => has(b.name));
  if (!items.length) return null;
  return (
    <div className="home-branches">
      <div className="wrap">
        <SecHead eyebrow={p.eyebrow} heading={p.heading} sub={p.sub} />
        <div className="branch-grid">
          {items.map((b, i) => (
            <div key={i} className="branch-card">
              <div className="branch-top">
                <h4>{b.name}</h4>
                {b.isHeadOffice && has(p.headOfficeLabel) && <span className="branch-badge">{p.headOfficeLabel}</span>}
              </div>
              {(has(b.address) || has(b.country)) && <p className="branch-line">📍 {[b.address, b.country].filter(Boolean).join(", ")}</p>}
              {has(b.phone) && <p className="branch-line">📞 <a href={`tel:${b.phone.replace(/[^\d+]/g, "")}`}>{b.phone}</a></p>}
              {has(b.email) && <p className="branch-line">✉️ <a href={`mailto:${b.email}`}>{b.email}</a></p>}
              {has(b.hours) && <p className="branch-line">🕒 {b.hours}</p>}
              {has(b.manager) && <p className="branch-line branch-muted">👤 {b.manager}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GlobalPresence({ p }) {
  const items = list(p.items).filter((c) => has(c.name));
  if (!items.length) return null;
  return (
    <div className="industries home-global">
      <div className="wrap">
        <SecHead eyebrow={p.eyebrow} heading={p.heading} sub={p.sub} />
        <div className="ind-grid">
          {items.map((c, i) => (
            <div key={i} className="ind-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <div className="ind-ic">{isImage(c.flag) ? <img src={c.flag} alt="" className="home-flag" /> : "🌍"}</div>
              <b>{c.name}</b>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Portfolio (admin: Portfolio module; block "Portfolio" in the Home Page Builder).
 * Tabs = top-level portfolio categories present in the items; `limit` items show at first and
 * "Show more" reveals the next batch. A card opens a full-size preview; items with a website
 * link also get "Visit website".
 */
function Portfolio({ p }) {
  const items = list(p.items).filter((item) => isImage(item.image));
  const step = Math.max(1, parseInt(p.limit, 10) || 8);
  const [tab, setTab] = useState("all");
  const [visible, setVisible] = useState(step);
  const [preview, setPreview] = useState(null);

  const groups = useMemo(() => {
    const seen = new Map();
    items.forEach((item) => {
      if (item.group?.id && !seen.has(item.group.id)) seen.set(item.group.id, { ...item.group, count: 0 });
      if (item.group?.id) seen.get(item.group.id).count += 1;
    });
    return [...seen.values()];
  }, [items]);

  useEffect(() => {
    if (!preview) return undefined;
    const onKey = (e) => { if (e.key === "Escape") setPreview(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [preview]);

  if (!items.length) return null;
  const filtered = tab === "all" ? items : items.filter((item) => item.group?.id === tab);
  const shown = filtered.slice(0, visible);
  const showTabs = p.tabs !== "hide" && groups.length > 1;
  const pick = (id) => { setTab(id); setVisible(step); };

  return (
    <div className={`home-portfolio${p.imageFit === "contain" ? " pf-contain" : ""}`} id={p.anchorId || "portfolio"}>
      <div className="wrap">
        <SecHead eyebrow={p.eyebrow} heading={p.heading} sub={p.sub} />
        {showTabs && (
          <div className="pf-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "all"} className={tab === "all" ? "on" : ""} onClick={() => pick("all")}>
              {has(p.allLabel) ? p.allLabel : "All work"} <span>{items.length}</span>
            </button>
            {groups.map((g) => (
              <button key={g.id} type="button" role="tab" aria-selected={tab === g.id} className={tab === g.id ? "on" : ""} onClick={() => pick(g.id)}>
                {g.name} <span>{g.count}</span>
              </button>
            ))}
          </div>
        )}
        <div className="pf-grid">
          {shown.map((item, i) => (
            <figure key={`${item.title}-${i}`} className="pf-card">
              <button type="button" className="pf-img" onClick={() => setPreview(item)} aria-label={`View ${item.title}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.title} loading="lazy" />
                <span className="pf-zoom" aria-hidden="true">🔍</span>
              </button>
              <figcaption>
                <span className="pf-title">{item.title}</span>
                <span className="pf-cat">{item.category?.name || item.group?.name}</span>
                {has(item.url) && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="pf-visit">Visit website ↗</a>
                )}
              </figcaption>
            </figure>
          ))}
        </div>
        {(filtered.length > visible || hasButton(p.button)) && (
          <div className="pf-more">
            {filtered.length > visible && (
              <button type="button" className="btn-ghost" onClick={() => setVisible((v) => v + step)}>
                {has(p.moreLabel) ? p.moreLabel : "Show more"} ({filtered.length - visible} more)
              </button>
            )}
            {hasButton(p.button) && <Button button={p.button} />}
          </div>
        )}
      </div>
      {preview && (
        <div className="pf-lightbox" role="dialog" aria-modal="true" aria-label={preview.title} onClick={() => setPreview(null)}>
          <div className="pf-lightbox-box" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="pf-close" onClick={() => setPreview(null)} aria-label="Close">✕</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview.image} alt={preview.title} />
            <div className="pf-lightbox-cap">
              <div>
                <b>{preview.title}</b>
                <span>{[preview.client, preview.category?.name].filter(has).join(" · ")}</span>
              </div>
              {has(preview.url) && <a href={preview.url} target="_blank" rel="noopener noreferrer" className="btn-primary">Visit website ↗</a>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const BLOCKS = {
  HomeHero: Hero,
  HomeTrustBar: TrustBar,
  HomeStages: Stages,
  HomeKnowledge: Knowledge,
  HomeServices: Services,
  HomePlatform: Platform,
  HomePress: Press,
  HomeJourney: Journey,
  HomeClients: Clients,
  HomeHowItWorks: HowItWorks,
  HomeTools: Tools,
  HomeBundles: Bundles,
  HomeWhyUs: WhyUs,
  HomeComparison: Comparison,
  HomeIndustries: Industries,
  HomeExpertCta: ExpertCta,
  HomeTestimonials: Testimonials,
  HomeSecurity: Security,
  HomeFaq: Faq,
  HomeNewsletter: Newsletter,
  HomeFinalCta: FinalCta,
  HomeForm: FormBlock,
  HomeBanners: Banners,
  HomeTeam: Team,
  HomeBranches: Branches,
  HomeGlobalPresence: GlobalPresence,
  HomePortfolio: Portfolio,
};

// Which blocks may sit in a column, and where they go by default. As on service pages, the
// default is "main", so blocks next to a sidebar block (the Form) fill the left column; with no
// sidebar block around, main content is full width. "full" means always full width. Blocks
// not listed (hero, strips, sliders, wide banners) are always full width. Keep in sync with
// HOME_PLACEMENT_RULES in cms-admin src/components/page-builder/homeBlocks.js.
const ANY = ["full", "main", "sidebar"];
const WIDE = ["full", "main"];
const PLACEMENT_RULES = {
  HomeForm: { default: "sidebar", options: ANY },
  HomeTestimonials: { default: "main", options: ANY },
  HomeFaq: { default: "main", options: ANY },
  HomeWhyUs: { default: "main", options: ANY },
  HomeSecurity: { default: "main", options: ANY },
  HomeTools: { default: "main", options: ANY },
  HomeTeam: { default: "main", options: ANY },
  HomeBranches: { default: "main", options: ANY },
  HomeGlobalPresence: { default: "main", options: ANY },
  HomeServices: { default: "main", options: WIDE },
  HomePlatform: { default: "main", options: WIDE },
  HomeJourney: { default: "main", options: WIDE },
  HomeHowItWorks: { default: "main", options: WIDE },
  HomeBundles: { default: "main", options: WIDE },
  HomeComparison: { default: "main", options: WIDE },
  HomeIndustries: { default: "main", options: WIDE },
  HomePortfolio: { default: "main", options: WIDE },
};

function placementOf(section) {
  const rule = PLACEMENT_RULES[section.type];
  if (!rule) return "full";
  const chosen = section.config?.placement;
  return rule.options.includes(chosen) ? chosen : rule.default;
}

/**
 * Full-width blocks render in order and end a row. A run of consecutive "main"/"sidebar" blocks
 * becomes a two-column area (main left, sidebar right). A run with only one side stays full width,
 * and a column whose blocks all render nothing collapses (see .home-split in home-page.css).
 */
function groupSections(sections) {
  const groups = [];
  for (const section of sections) {
    const placement = placementOf(section);
    const last = groups[groups.length - 1];
    if (placement === "full") groups.push({ full: section });
    else if (last?.split) last.split[placement].push(section);
    else groups.push({ split: { main: placement === "main" ? [section] : [], sidebar: placement === "sidebar" ? [section] : [] } });
  }
  return groups;
}

function renderBlock(section, i) {
  const Block = BLOCKS[section.type];
  return Block ? <Block key={section.id || i} p={section.payload || {}} /> : null;
}

export default function HomeSections({ sections = [] }) {
  return (
    <main className="ta-home">
      <div className="home-page">
        {groupSections(sections).map((group, g) => {
          if (group.full) return renderBlock(group.full, g);
          const { main, sidebar } = group.split;
          if (!main.length || !sidebar.length) return <Fragment key={g}>{[...main, ...sidebar].map(renderBlock)}</Fragment>;
          return (
            <div key={g} className="home-split">
              <div className="home-main">{main.map(renderBlock)}</div>
              <aside className="home-side">{sidebar.map(renderBlock)}</aside>
            </div>
          );
        })}
      </div>
    </main>
  );
}
