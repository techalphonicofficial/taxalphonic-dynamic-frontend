"use client";

import { useEffect } from "react";
import { openFormPopup } from "@/lib/formPopup";
import { LANDING_FALLBACK_URL, isInPageHref, landingHref, samePageHref } from "@/lib/landingLinks";

/*
 * Landing pages never navigate away (lib/landingLinks.js). Rendered once by LandingPage:
 * - window.__taLandingLock tells useGo / form redirects to stay on the page;
 * - links that still point away (module content, website header / footer, pasted HTML) get
 *   href="#form" and lose target="_blank", also when React renders new ones later; links to this
 *   page itself ("/#faq", "/lp/cbdt#faq") become "#faq";
 * - a click on such a link (left, middle or ctrl / cmd click) opens the page's form popup
 *   (or scrolls to the section).
 */

const OUTBOUND = "data-lp-outbound";
// nodeType checks, not instanceof: the admin preview renders this inside an iframe.
const isElement = (node) => node?.nodeType === 1;
const isAnchor = (node) => isElement(node) && node.tagName === "A";

function lockAnchor(anchor) {
  const href = anchor.getAttribute("href");
  if (isInPageHref(href)) return;
  // "/#faq" (old subdomain style) or a link to this very page (/lp/cbdt#faq) stays on the page.
  const local = landingHref(href) !== LANDING_FALLBACK_URL ? landingHref(href) : samePageHref(href);
  anchor.setAttribute(OUTBOUND, href || "");
  anchor.setAttribute("href", local || LANDING_FALLBACK_URL);
  anchor.removeAttribute("target");
}

function lockAll(root) {
  root.querySelectorAll("a[href]").forEach(lockAnchor);
}

export default function LandingLinkGuard({ rootId = "top" }) {
  useEffect(() => {
    const root = document.getElementById(rootId) || document.body;
    window.__taLandingLock = true;
    lockAll(root);

    // React may render new links (menus, accordions) or set an href back.
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        if (m.type === "attributes" && isAnchor(m.target)) lockAnchor(m.target);
        m.addedNodes?.forEach((node) => {
          if (isAnchor(node)) lockAnchor(node);
          else if (isElement(node)) lockAll(node);
        });
      });
    });
    observer.observe(root, { subtree: true, childList: true, attributes: true, attributeFilter: ["href"] });

    // Capture phase on the document: runs before React / next/link handlers.
    const onClick = (event) => {
      const anchor = isElement(event.target) ? event.target.closest("a[href]") : null;
      if (!anchor) return;
      const href = anchor.hasAttribute(OUTBOUND) ? anchor.getAttribute(OUTBOUND) : anchor.getAttribute("href");
      if (isInPageHref(href)) return;
      // An outbound link (next/link would still follow its original href): handle it here.
      if (!anchor.hasAttribute(OUTBOUND)) lockAnchor(anchor);
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.type !== "click") return;
      const target = anchor.getAttribute("href") || LANDING_FALLBACK_URL;
      // No label: the text of a blocked link ("About us") is not a heading for the form.
      if (openFormPopup(target)) return;
      document.getElementById(target.slice(1))?.scrollIntoView({ behavior: "smooth" });
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("auxclick", onClick, true);

    return () => {
      window.__taLandingLock = false;
      observer.disconnect();
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("auxclick", onClick, true);
    };
  }, [rootId]);

  return null;
}
