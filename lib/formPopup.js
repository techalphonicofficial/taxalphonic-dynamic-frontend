// Form popups: any CMS button or link whose URL is "#form-<form id>" opens that CMS form in a
// popup instead of navigating; "#form" opens the page's own form (the first Form block of a
// landing page). The popup itself is components/tax-alphonic/forms/FormPopupHost.jsx (mounted in
// app/layout.js and in LandingPage); the admin's button field writes these URLs.

export const FORM_POPUP_EVENT = "ta:form-popup";

const POPUP_URL = /^#form(?:-([A-Za-z0-9_-]{1,64}))?$/;

/** The form id of a popup URL ("" = the page's own form), or null when the URL is not one. */
export function formPopupTarget(url) {
  const match = POPUP_URL.exec(String(url ?? "").trim());
  return match ? match[1] || "" : null;
}

/**
 * Opens the popup for a popup URL. Returns false (the caller handles the URL as usual) when the
 * URL is not a popup URL or no popup host is on the page.
 */
export function openFormPopup(url, label = "") {
  const id = formPopupTarget(url);
  if (id === null || typeof window === "undefined" || !window.__taFormPopup) return false;
  window.dispatchEvent(new CustomEvent(FORM_POPUP_EVENT, { detail: { id, label: String(label || "").trim() } }));
  return true;
}
