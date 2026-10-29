"use client";

import { useEffect } from "react";

/*
 * Tells the page's forms (CmsForm, also in the form popup) where to send the visitor after a
 * successful submission: the shared thank-you page, /lp/thank-you?from=<label>. Rendered by the
 * live landing route only when the thank-you page is switched on.
 */
export default function ThankYouRedirect({ url }) {
  useEffect(() => {
    window.__taThankYouUrl = url;
    return () => {
      if (window.__taThankYouUrl === url) delete window.__taThankYouUrl;
    };
  }, [url]);
  return null;
}

/** The thank-you page address set by ThankYouRedirect, or "". */
export function thankYouUrl() {
  return typeof window !== "undefined" && typeof window.__taThankYouUrl === "string" ? window.__taThankYouUrl : "";
}
