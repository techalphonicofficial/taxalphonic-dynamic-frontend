"use client";

import { useEffect, useState } from "react";
import { FORM_POPUP_CLOSED_EVENT, isFormPopupOpen, openFormPopup } from "@/lib/formPopup";

/*
 * Auto Popup Form (CommonAutoPopup, admin commonBlocks.js): opens a CMS form in the page's form
 * popup (FormPopupHost) a few seconds after the visitor lands. Once the visitor closes it (or sends
 * the form and closes it), it stays away: for good, for N days, or until the browser tab is closed,
 * on this page only or on every page that uses the same form. Renders nothing on the website;
 * in the admin's Live Preview (window.__taPreview) it shows a small note with a "Test now" button.
 *
 * payload: { formId, heading, sub, delay (s), remember: forever | days | session, days,
 *            scope: page | site, device: all | desktop | mobile }
 */

const STORE = "ta-autopopup";
const has = (value) => typeof value === "string" ? value.trim() !== "" : Boolean(value);

function storageFor(remember) {
  try {
    return remember === "session" ? window.sessionStorage : window.localStorage;
  } catch {
    return null; // storage blocked: the popup still shows, it just cannot remember a close
  }
}

function readMap(storage) {
  try {
    const map = JSON.parse(storage?.getItem(STORE) || "{}");
    return map && typeof map === "object" ? map : {};
  } catch {
    return {};
  }
}

function writeMap(storage, map) {
  try {
    storage?.setItem(STORE, JSON.stringify(map));
  } catch {
    /* storage full or blocked */
  }
}

const keyOf = (p) => `${p.scope === "site" ? "*" : window.location.pathname}|${formKey(p)}`;

/** true when the visitor closed this popup and the remember period has not run out. */
function dismissed(p) {
  const at = Number(readMap(storageFor(p.remember))[keyOf(p)]);
  if (!at) return false;
  if (p.remember !== "days") return true;
  const days = Math.max(1, parseInt(p.days, 10) || 7);
  return Date.now() - at < days * 86400000;
}

function deviceMatches(device) {
  if (device !== "desktop" && device !== "mobile") return true;
  const mobile = window.matchMedia?.("(max-width: 767px)").matches;
  return device === "mobile" ? mobile : !mobile;
}

/** Seconds before the popup opens: 5 when empty, 0–600. */
const delayOf = (p) => {
  const n = Number(p.delay);
  return p.delay === undefined || p.delay === null || String(p.delay).trim() === "" || !Number.isFinite(n) ? 5 : Math.max(0, Math.min(600, n));
};

/** Popup URL: the chosen form, or (no form picked) the page's own form when it has one (landing pages). */
const popupUrl = (p) => (has(p.formId) ? `#form-${String(p.formId).trim()}` : window.__taFormPopupDefault ? "#form" : "");
const formKey = (p) => (has(p.formId) ? String(p.formId).trim() : "page-form");
const openNow = (p, source) => Boolean(popupUrl(p)) && openFormPopup(popupUrl(p), p.heading || "", "", { subHeading: p.sub || "", source });

function PreviewNote({ p }) {
  const [msg, setMsg] = useState("");
  const delay = delayOf(p);
  return (
    <div style={{ margin: "12px auto", maxWidth: 1160, padding: "10px 14px", border: "2px dashed #0e96ac", borderRadius: 12, background: "rgba(14,150,172,.06)", font: "500 13px/1.45 system-ui, sans-serif", color: "#0a0e1a", display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
      <span>🪟 <b>Auto popup form</b>{has(p.formId) ? ` opens ${delay} s after the page loads on the website` : ": no form picked (landing pages use their own enquiry form)"}. It is not opened by itself in this preview.</span>
      {(has(p.formId) || window.__taFormPopupDefault) && (
        <button type="button" onClick={() => setMsg(openNow(p, "") ? "" : "The popup opens on the website (no popup in this preview).")} style={{ marginLeft: "auto", border: "1px solid #0e96ac", background: "#fff", color: "#0e96ac", borderRadius: 8, padding: "5px 12px", font: "600 12.5px system-ui, sans-serif", cursor: "pointer" }}>
          Test now
        </button>
      )}
      {msg && <span style={{ width: "100%", color: "#5b6478" }}>{msg}</span>}
    </div>
  );
}

export default function AutoPopup({ p }) {
  // Admin Live Preview only (no server render there, so no hydration mismatch on the website).
  const [preview] = useState(() => typeof window !== "undefined" && Boolean(window.__taPreview));

  useEffect(() => {
    if (preview) return undefined;
    if (!popupUrl(p) || !deviceMatches(p.device) || dismissed(p)) return undefined;

    const source = `auto:${keyOf(p)}`;
    const onClosed = (event) => {
      if (event.detail?.source !== source) return;
      const storage = storageFor(p.remember);
      writeMap(storage, { ...readMap(storage), [keyOf(p)]: Date.now() });
    };
    window.addEventListener(FORM_POPUP_CLOSED_EVENT, onClosed);

    // Waits while another popup is open (e.g. the visitor clicked an Enquire button first).
    let timer;
    const tryOpen = () => {
      if (dismissed(p)) return;
      if (isFormPopupOpen()) { timer = setTimeout(tryOpen, 3000); return; }
      openNow(p, source);
    };
    timer = setTimeout(tryOpen, delayOf(p) * 1000);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(FORM_POPUP_CLOSED_EVENT, onClosed);
    };
  }, [p, preview]);

  return preview ? <PreviewNote p={p} /> : null;
}
