"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { openFormPopup } from "@/lib/formPopup";
import { blockLandingNavigation } from "@/lib/landingLinks";
import ButtonLabel from "./ButtonLabel";
import "./blocks.css";
import "./extra-blocks.css";

/*
 * More general-purpose blocks (admin: commonBlocks.js), rendered through CommonBlocks.jsx:
 * - CommonCarousel: slider of images, text, image + text, or text over a background image;
 *   any number of slides, auto-swipes every N seconds, swipe / arrows / dots, 1–4 slides at once.
 *   Sizes itself to the column it sits in (hero, top, main, sidebar, bottom), not the screen.
 * - CommonBlogPosts: the newest live blog posts (payload.posts, filled on the server by
 *   service/homeContentService.js attachBlogPosts): one featured post + a list, or a grid.
 * - CommonAnchorNav: section tabs that stick under the site header with a reading progress bar;
 *   links to the given #anchors, or to every section of the page with an id when none are given.
 * Styles: extra-blocks.css (same --cb-* tokens as blocks.css).
 */

const list = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);
const has = (value) => (typeof value === "string" ? value.trim() !== "" : Boolean(value));
const isExternal = (url) => /^(?:https?:)?\/\//i.test(url) || /^(mailto|tel):/i.test(url);

function useGo() {
  const router = useRouter();
  return (url, label) => {
    const target = String(url || "").trim();
    if (!target) return;
    if (openFormPopup(target, label)) return;
    if (blockLandingNavigation(target, label)) return;
    if (target.startsWith("#")) document.getElementById(target.slice(1))?.scrollIntoView({ behavior: "smooth" });
    else if (isExternal(target)) window.open(target, "_blank", "noopener");
    else router.push(target);
  };
}

function SlideButton({ text, url, icon, ghost }) {
  const go = useGo();
  if (!has(text)) return null;
  return (
    <button type="button" className={ghost ? "cb-btn cb-btn-ghost" : "cb-btn"} onClick={(e) => { e.stopPropagation(); go(url, text); }}>
      <ButtonLabel button={{ text, icon }} />
    </button>
  );
}

function Paragraphs({ text }) {
  return String(text || "").split(/\n\s*\n/).map((para) => para.trim()).filter(Boolean).map((para, i) => (
    <p key={i}>{para.split(/\*\*(.+?)\*\*/g).map((part, j) => (j % 2 ? <b key={j}>{part}</b> : <Fragment key={j}>{part}</Fragment>))}</p>
  ));
}

function Head({ p, center }) {
  if (!has(p.kicker) && !has(p.heading) && !has(p.sub)) return null;
  return (
    <div className={`cb-head${center || p.align === "center" ? " cb-center" : ""}`}>
      {has(p.kicker) && <span className="cb-kicker">{p.kicker}</span>}
      {has(p.heading) && <h2>{p.heading}</h2>}
      {has(p.sub) && <p className="cb-sub">{p.sub}</p>}
    </div>
  );
}

function Section({ type, p, className = "", children }) {
  return (
    <section className={`ta-cb cb-${type} ${className}`.trim()} id={has(p.anchorId) ? p.anchorId : undefined}>
      <div className="cb-wrap">{children}</div>
    </section>
  );
}

// ---- Carousel ------------------------------------------------------------------------------

/** How a slide is drawn: image | text | split | overlay ("auto" picks from what it has). */
function slideLayout(s) {
  const image = has(s.image);
  const text = has(s.title) || has(s.text) || has(s.kicker) || has(s.buttonText);
  const chosen = s.layout || "auto";
  if (chosen === "image") return image ? "image" : "text";
  if (chosen === "text") return "text";
  if (chosen === "split" || chosen === "split-right") return image && text ? chosen : image ? "image" : "text";
  if (chosen === "overlay") return image ? "overlay" : "text";
  return image && text ? "overlay" : image ? "image" : "text";
}

function SlideBody({ s, center }) {
  return (
    <div className={`cb-slide-body${center ? " cb-center" : ""}`}>
      {has(s.kicker) && <span className="cb-slide-kicker">{s.kicker}</span>}
      {has(s.title) && <h3 className="cb-slide-title">{s.title}</h3>}
      {has(s.text) && <div className="cb-slide-copy"><Paragraphs text={s.text} /></div>}
      {(has(s.buttonText) || has(s.button2Text)) && (
        <div className="cb-slide-buttons">
          <SlideButton text={s.buttonText} url={s.buttonUrl} icon={s.buttonIcon} />
          <SlideButton text={s.button2Text} url={s.button2Url} ghost />
        </div>
      )}
    </div>
  );
}

function Slide({ s, index, total, visible, center, onOpen }) {
  const layout = slideLayout(s);
  const link = String(s.link || "").trim();
  // eslint-disable-next-line @next/next/no-img-element
  const img = has(s.image) ? <img src={s.image} alt={s.alt || s.title || ""} loading={index === 0 ? "eager" : "lazy"} draggable={false} /> : null;
  return (
    <div
      className={`cb-slide cb-slide-${layout}${link ? " cb-slide-link" : ""}`}
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      aria-hidden={!visible}
      onClick={link ? () => onOpen(link, s.title) : undefined}
    >
      {layout === "image" && <div className="cb-slide-media">{img}</div>}
      {layout === "overlay" && (
        <div className="cb-slide-media">
          {img}
          <div className="cb-slide-shade" />
          <SlideBody s={s} center={center} />
        </div>
      )}
      {(layout === "split" || layout === "split-right") && (
        <div className="cb-slide-split">
          <div className="cb-slide-media">{img}</div>
          <SlideBody s={s} />
        </div>
      )}
      {layout === "text" && <SlideBody s={s} center={center} />}
    </div>
  );
}

const clampInt = (value, min, max, fallback) => {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

function Carousel({ p }) {
  const slides = list(p.slides).filter((s) => has(s.image) || has(s.title) || has(s.text));
  const go = useGo();
  const rootRef = useRef(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(1);
  const [paused, setPaused] = useState(false);
  const drag = useRef(null);
  const swiped = useRef(false); // the click that follows a swipe must not open a linked slide

  const perView = clampInt(p.perView, 1, 4, 1);
  const seconds = p.autoplay === "0" ? 0 : clampInt(p.autoplay, 2, 30, 5);
  const fade = p.effect === "fade" && perView === 1;
  const count = slides.length;
  const maxIndex = Math.max(0, count - visible);

  // Slides at once follow the block's own width (a sidebar shows one), not the screen.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return undefined;
    const update = () => {
      const w = el.clientWidth;
      setVisible(Math.min(perView, w < 560 ? 1 : w < 860 ? 2 : w < 1100 ? 3 : 4));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [perView]);

  // The block got wider (more slides at once): never past the last full view.
  const current = Math.min(index, maxIndex);
  const step = (delta) => setIndex((i) => {
    const at = Math.min(i, maxIndex);
    return delta > 0 ? (at >= maxIndex ? 0 : at + 1) : (at <= 0 ? maxIndex : at - 1);
  });
  const next = () => step(1);
  const prev = () => step(-1);

  // Auto-swipe; stops while hovered / focused, while the tab is hidden, or with reduced motion.
  useEffect(() => {
    if (!seconds || paused || maxIndex === 0) return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex((i) => (Math.min(i, maxIndex) >= maxIndex ? 0 : Math.min(i, maxIndex) + 1));
    }, seconds * 1000);
    return () => window.clearInterval(timer);
  }, [seconds, paused, maxIndex]);

  if (!count) return null;

  const onPointerDown = (e) => { drag.current = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e) => {
    const start = drag.current;
    drag.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(e.clientY - start.y)) {
      (dx < 0 ? next : prev)();
      swiped.current = true;
      window.setTimeout(() => { swiped.current = false; }, 80);
    }
  };
  const openSlide = (url, label) => { if (!swiped.current) go(url, label); };
  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); next(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); prev(); }
  };

  const height = ["sm", "md", "lg", "xl"].includes(p.height) ? p.height : "auto";
  const showArrows = p.arrows !== "no" && maxIndex > 0;
  const showDots = p.dots !== "no" && maxIndex > 0;
  const className = [
    `cb-car-h-${height}`,
    `cb-car-fit-${p.imageFit === "contain" ? "contain" : "cover"}`,
    p.width === "full" ? "cb-car-full" : "",
    p.rounded === "no" ? "cb-car-square" : "",
    p.shade === "light" ? "cb-car-shade-light" : p.shade === "none" ? "cb-car-shade-none" : "",
  ].filter(Boolean).join(" ");

  return (
    <Section type="carousel" p={p} className={className}>
      <Head p={p} center />
      <div
        ref={rootRef}
        className={`cb-car${fade ? " cb-car-fade" : ""}`}
        role="region"
        aria-roledescription="carousel"
        aria-label={p.heading || "Slides"}
        tabIndex={0}
        style={{ "--cb-car-visible": visible }}
        data-visible={visible}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={() => { drag.current = null; }}
      >
        <div className="cb-car-viewport">
          <div className="cb-car-track" style={fade ? undefined : { transform: `translateX(-${(current * 100) / visible}%)` }}>
            {slides.map((s, i) => (
              <div key={i} className={`cb-car-cell${fade && i === current ? " is-active" : ""}`}>
                <Slide s={s} index={i} total={count} visible={i >= current && i < current + visible} center={p.textAlign !== "left"} onOpen={openSlide} />
              </div>
            ))}
          </div>
        </div>
        {showArrows && (
          <>
            <button type="button" className="cb-car-arrow cb-car-prev" aria-label="Previous slide" onClick={prev}>‹</button>
            <button type="button" className="cb-car-arrow cb-car-next" aria-label="Next slide" onClick={next}>›</button>
          </>
        )}
      </div>
      {showDots && (
        <div className="cb-car-dots" role="tablist" aria-label="Choose slide">
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button key={i} type="button" role="tab" aria-selected={i === current} aria-label={`Go to slide ${i + 1}`} className={i === current ? "on" : ""} onClick={() => setIndex(i)} />
          ))}
        </div>
      )}
    </Section>
  );
}

// ---- Latest blog posts -----------------------------------------------------------------------

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
};

function PostMeta({ post }) {
  const parts = [post.category, formatDate(post.date), post.readTime ? `${post.readTime} min read` : ""].filter(Boolean);
  return parts.length ? <div className="cb-post-meta">{parts.join(" · ")}</div> : null;
}

function PostCard({ post, featured, showExcerpt }) {
  return (
    <Link href={post.url} className={`cb-post${featured ? " cb-post-featured" : ""}${post.image ? "" : " cb-post-noimg"}`}>
      {post.image && (
        <div className="cb-post-img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.image} alt="" loading="lazy" />
        </div>
      )}
      <div className="cb-post-body">
        <PostMeta post={post} />
        <h3>{post.title}</h3>
        {showExcerpt && has(post.excerpt) && <p>{post.excerpt}</p>}
        <span className="cb-post-more">Read article →</span>
      </div>
    </Link>
  );
}

function BlogPosts({ p }) {
  const posts = list(p.posts);
  const go = useGo();
  if (!posts.length) return null;
  const showExcerpt = p.excerpt !== "no";
  const featured = p.layout !== "grid" && posts.length > 1;
  return (
    <Section type="blogposts" p={p}>
      <div className="cb-posts-head">
        <Head p={p} />
        {has(p.button?.text) && (
          <button type="button" className="cb-btn cb-btn-ghost" onClick={() => go(p.button.url || "/blog", p.button.text)}>
            <ButtonLabel button={p.button} />
          </button>
        )}
      </div>
      {featured ? (
        <div className="cb-posts-featured">
          <PostCard post={posts[0]} featured showExcerpt={showExcerpt} />
          <div className="cb-posts-side">
            {posts.slice(1).map((post) => <PostCard key={post.id || post.url} post={post} showExcerpt={false} />)}
          </div>
        </div>
      ) : (
        <div className="cb-posts-grid" style={{ "--cb-cols": clampInt(p.columns, 1, 4, 3) }}>
          {posts.map((post) => <PostCard key={post.id || post.url} post={post} showExcerpt={showExcerpt} />)}
        </div>
      )}
    </Section>
  );
}

// ---- Sticky section tabs -------------------------------------------------------------------

const cleanAnchor = (value) => String(value || "").trim().replace(/^#/, "");

/** Sections of the page that can be linked: elements with an id and a heading, in page order. */
function pageSections(own) {
  const root = document.querySelector("main") || document.body;
  const seen = new Set();
  return [...root.querySelectorAll("[id]")]
    .filter((el) => !own.contains(el) && !el.closest(".cb-anchornav") && el.querySelector("h2"))
    .filter((el) => !el.parentElement?.closest("[id]") || !el.parentElement.closest("[id]").querySelector("h2"))
    .map((el) => ({ anchor: el.id, label: el.dataset.navLabel || el.querySelector("h2").textContent.trim().slice(0, 40) }))
    .filter((t) => t.label && !seen.has(t.anchor) && seen.add(t.anchor));
}

function AnchorNav({ p }) {
  const given = list(p.items).filter((x) => has(x.label) && has(x.anchor)).map((x) => ({ label: x.label.trim(), anchor: cleanAnchor(x.anchor) }));
  const holderRef = useRef(null);
  const [tabs, setTabs] = useState(given);
  const [active, setActive] = useState("");
  const [progress, setProgress] = useState(0);
  const [stuck, setStuck] = useState(false);
  const [height, setHeight] = useState(0);
  const givenKey = JSON.stringify(given);

  useEffect(() => {
    if (given.length || !holderRef.current) { setTabs(given); return; }
    setTabs(pageSections(holderRef.current));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [givenKey]);

  useEffect(() => {
    const onScroll = () => {
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ta-header-h")) || 0;
      const holder = holderRef.current;
      if (holder) {
        setStuck(holder.getBoundingClientRect().top < header);
        setHeight(holder.firstElementChild?.offsetHeight || 0);
      }
      const doc = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(doc > 0 ? Math.min(100, Math.max(0, (window.scrollY / doc) * 100)) : 0);
      const line = header + (holder?.firstElementChild?.offsetHeight || 0) + 24;
      let current = "";
      tabs.forEach((t) => {
        const el = document.getElementById(t.anchor);
        if (el && el.getBoundingClientRect().top <= line) current = t.anchor;
      });
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [tabs]);

  // Keep the active tab in view on phones (the tab row scrolls sideways).
  useEffect(() => {
    if (!active) return;
    holderRef.current?.querySelector(`[data-anchor="${CSS.escape(active)}"]`)?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  if (!tabs.length) return <div ref={holderRef} className="cb-anchornav-probe" aria-hidden="true" />;

  const jump = (anchor) => {
    const el = document.getElementById(anchor);
    if (!el) return;
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--ta-header-h")) || 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - header - height - 12, behavior: "smooth" });
  };

  return (
    <div ref={holderRef} className="ta-cb cb-anchornav" style={{ minHeight: stuck ? height : undefined }}>
      <nav className={`cb-anav${stuck ? " is-stuck" : ""}`} aria-label={p.label || "On this page"}>
        <div className="cb-anav-row">
          {has(p.label) && <span className="cb-anav-label">{p.label}</span>}
          <div className="cb-anav-tabs">
            {tabs.map((t) => (
              <button key={t.anchor} type="button" data-anchor={t.anchor} className={active === t.anchor ? "on" : ""} aria-current={active === t.anchor ? "true" : undefined} onClick={() => jump(t.anchor)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {p.progress !== "no" && <div className="cb-anav-progress" style={{ width: `${progress}%` }} aria-hidden="true" />}
      </nav>
    </div>
  );
}

export const EXTRA_BLOCKS = {
  CommonCarousel: Carousel,
  CommonBlogPosts: BlogPosts,
  CommonAnchorNav: AnchorNav,
};
