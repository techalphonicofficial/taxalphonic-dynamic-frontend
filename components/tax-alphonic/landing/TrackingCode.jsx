/*
 * Ad / analytics tracking code from the admin (Landing Pages → Thank-you page & tracking):
 * Google tag, Google Tag Manager, Meta Pixel ... pasted as HTML (<script>, <noscript>, <img>).
 * Server-rendered as is, so the browser runs the scripts while it reads the page (a full page load:
 * landing pages and the thank-you page are always opened that way). Only staff with the
 * LandingPages "update" permission can set it. {{page}} becomes the landing page's URL name.
 */
export default function TrackingCode({ html, page = "", where }) {
  const code = String(html || "").trim();
  if (!code) return null;
  const pageName = /^[a-z0-9-]{1,63}$/.test(String(page)) ? page : "";
  return (
    <div
      data-ta-tracking={where}
      style={{ display: "contents" }}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: code.replace(/\{\{\s*page\s*\}\}/g, pageName) }}
    />
  );
}
