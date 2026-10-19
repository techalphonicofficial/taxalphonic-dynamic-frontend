"use client";

import { useEffect, useState } from "react";
import { countBlogView } from "@/service/blogView";

/** Counts one read per post per browser session (Server Action → POST /blogs/public/:slug/view). */
export function BlogViewCounter({ slug }) {
  useEffect(() => {
    const key = `ta-blog-view:${slug}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // storage blocked: count anyway
    }
    countBlogView(slug);
  }, [slug]);
  return null;
}

/** Share links for the current post, plus "copy link". */
export function ShareButtons({ url, title }) {
  const [copied, setCopied] = useState(false);
  const text = encodeURIComponent(title);
  const link = encodeURIComponent(url);
  const targets = [
    { label: "WhatsApp", icon: "🟢", href: `https://wa.me/?text=${text}%20${link}` },
    { label: "LinkedIn", icon: "💼", href: `https://www.linkedin.com/sharing/share-offsite/?url=${link}` },
    { label: "X", icon: "✖️", href: `https://twitter.com/intent/tweet?text=${text}&url=${link}` },
    { label: "Facebook", icon: "📘", href: `https://www.facebook.com/sharer/sharer.php?u=${link}` },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  };

  return (
    <div className="blog-share">
      {targets.map((t) => (
        <a key={t.label} href={t.href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${t.label}`}>
          <span aria-hidden="true">{t.icon}</span>{t.label}
        </a>
      ))}
      <button type="button" onClick={copy}>
        <span aria-hidden="true">🔗</span>{copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

const slugify = (text) =>
  text.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").slice(0, 80);

/** Reads the h2/h3 headings of the post body (#blog-content), gives each an id and lists them. */
function useHeadings(rootId) {
  const [headings, setHeadings] = useState([]);
  useEffect(() => {
    const root = document.getElementById(rootId);
    if (!root) return undefined;
    const used = new Set();
    const scan = () => {
      const found = [...root.querySelectorAll("h2, h3")]
        .filter((el) => !el.closest("details, .blog-author") && el.textContent.trim())
        .map((el) => {
          if (!el.id) {
            const base = slugify(el.textContent) || "section";
            let id = base;
            for (let n = 2; used.has(id) || document.getElementById(id); n += 1) id = `${base}-${n}`;
            el.id = id;
          }
          used.add(el.id);
          return { id: el.id, text: el.textContent.trim(), level: el.tagName === "H3" ? 3 : 2 };
        });
      setHeadings(found);
    };
    const frame = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(frame);
  }, [rootId]);
  return headings;
}

/** Highlights the heading the reader is currently on. */
function useActiveHeading(headings) {
  const [active, setActive] = useState("");
  useEffect(() => {
    if (!headings.length) return undefined;
    const onScroll = () => {
      let current = headings[0].id;
      for (const h of headings) {
        const el = document.getElementById(h.id);
        if (el && el.getBoundingClientRect().top <= 140) current = h.id;
      }
      setActive(current);
    };
    const frame = requestAnimationFrame(onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, [headings]);
  return active;
}

/** "On this page" list for the post; a click smooth-scrolls to the section. Hidden when the post has fewer than 2 headings. */
export function TableOfContents({ rootId = "blog-content", title = "On this page", variant = "side" }) {
  const headings = useHeadings(rootId);
  const active = useActiveHeading(headings);
  if (headings.length < 2) return null;

  const go = (event, id) => {
    const el = document.getElementById(id);
    if (!el) return;
    event.preventDefault();
    // Close the mobile box first, so its collapse doesn't shift the page mid-scroll.
    const box = event.currentTarget.closest("details");
    if (box) box.open = false;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" }));
    history.replaceState(null, "", `#${id}`);
  };

  const list = (
    <ol className="blog-toc-list">
      {headings.map((h) => (
        <li key={h.id} className={`lvl-${h.level}${active === h.id ? " active" : ""}`}>
          <a href={`#${h.id}`} onClick={(e) => go(e, h.id)} aria-current={active === h.id ? "location" : undefined}>{h.text}</a>
        </li>
      ))}
    </ol>
  );

  if (variant === "inline") {
    return (
      <details className="blog-toc blog-toc-inline">
        <summary>📑 {title}</summary>
        {list}
      </details>
    );
  }
  return (
    <nav className="blog-side-card blog-toc blog-toc-side" aria-label={title}>
      <h3>📑 {title}</h3>
      {list}
    </nav>
  );
}
