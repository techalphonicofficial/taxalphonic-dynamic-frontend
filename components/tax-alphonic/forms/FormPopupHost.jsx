"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CmsForm from "./CmsForm";
import { FORM_POPUP_EVENT, formPopupTarget } from "@/lib/formPopup";
import { loadPublicForm } from "@/service/formSubmission";
import "../service-page.css";
import "./form-popup.css";

/**
 * The form popup (lib/formPopup.js): opens when a button or link with a "#form-<id>" / "#form"
 * URL is clicked anywhere on the page. One per page: app/layout.js mounts it on the website,
 * LandingPage on landing pages (with the page's own form as `defaultForm`).
 *
 * defaultForm: { form, heading, subHeading } for "#form" (the first Form block's form). Without
 * it, "#form" scrolls to the page's form (#enquiry) instead. theme: a landing page theme key
 * (landing-themes.css), so the popup has the page's colours; themeStyle: the colours of a custom theme.
 */
// Mounted hosts; only one handles clicks: the one with the page's own form, else the first.
const hosts = [];
const activeHost = () => hosts.find((h) => h.hasDefault) || hosts[0];

export default function FormPopupHost({ defaultForm = null, theme, themeStyle }) {
  const [state, setState] = useState(null); // { loading, form, heading, subHeading, error }
  const cache = useRef(new Map());
  const lastFocus = useRef(null);

  const open = useCallback(async ({ id, label }) => {
    lastFocus.current = document.activeElement;
    if (!id) {
      if (defaultForm?.form) {
        setState({ form: defaultForm.form, heading: defaultForm.heading || label, subHeading: defaultForm.subHeading });
      } else {
        document.getElementById("enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    if (defaultForm?.form && String(defaultForm.form.id) === id) {
      setState({ form: defaultForm.form, heading: label || defaultForm.heading, subHeading: defaultForm.subHeading });
      return;
    }
    setState({ loading: true, heading: label });
    let form = cache.current.get(id);
    if (form === undefined) {
      form = await loadPublicForm(id).catch(() => null);
      cache.current.set(id, form);
    }
    setState((current) => (current?.loading ? {
      form,
      heading: label || form?.name,
      subHeading: form?.description,
      error: form ? "" : "This form is not available right now. Please try again later.",
    } : current));
  }, [defaultForm]);

  // Buttons rendered as <button> call openFormPopup (custom event); <a href="#form-…"> links are
  // caught here before Next's Link or a block's own scroll handler sees the click.
  useEffect(() => {
    const me = { hasDefault: Boolean(defaultForm?.form) };
    hosts.push(me);
    window.__taFormPopup = true;
    const onEvent = (event) => activeHost() === me && open(event.detail || {});
    const onClick = (event) => {
      if (activeHost() !== me) return;
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = event.target.closest?.("a[href^='#form']");
      if (!link) return;
      const id = formPopupTarget(link.getAttribute("href"));
      if (id === null) return;
      event.preventDefault();
      event.stopPropagation();
      open({ id, label: link.textContent.trim() });
    };
    window.addEventListener(FORM_POPUP_EVENT, onEvent);
    document.addEventListener("click", onClick, true);
    return () => {
      hosts.splice(hosts.indexOf(me), 1);
      window.__taFormPopup = hosts.length > 0;
      window.removeEventListener(FORM_POPUP_EVENT, onEvent);
      document.removeEventListener("click", onClick, true);
    };
  }, [open, defaultForm]);

  const close = useCallback(() => {
    setState(null);
    lastFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!state) return undefined;
    const onKey = (event) => event.key === "Escape" && close();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [state, close]);

  if (!state || typeof document === "undefined") return null;

  return createPortal(
    <div className="ta-svc ta-fp" data-lp-theme={theme} style={themeStyle} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="ta-fp-dialog lead-card" role="dialog" aria-modal="true" aria-label={state.heading || "Enquiry form"}>
        {/* Heading stays on top, the fields scroll, the submit button stays at the bottom (form-popup.css). */}
        <div className="ta-fp-head">
          <button type="button" className="ta-fp-close" onClick={close} aria-label="Close" autoFocus>×</button>
          {state.heading && <h3>{state.heading}</h3>}
          {state.subHeading && <p className="csub">{state.subHeading}</p>}
        </div>
        <div className="ta-fp-body">
          {state.loading && <div className="ta-fp-loading" aria-live="polite">Loading…</div>}
          {state.error && <p className="ta-fp-error">{state.error}</p>}
          {state.form && <CmsForm form={state.form} compact />}
        </div>
      </div>
    </div>,
    document.body,
  );
}
