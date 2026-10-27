import { NextResponse } from "next/server";
import {
  LANDING_HEADER, LANDING_PATH_PREFIX, LANDING_ROUTE, LANDING_SITE_LABEL,
  isLandingSiteHost, landingLabelFromHost, landingLabelFromPath, landingSiteOrigin,
} from "@/lib/landingHost.mjs";

// The live LiteSpeed proxy sends some request headers twice (e.g. Origin), which Node joins into
// "https://frontend.taxalphonic.com, https://frontend.taxalphonic.com". Next.js reads Origin as one
// URL when checking a Server Action, so every CMS form submit failed with "TypeError: Invalid URL"
// (500, "This page couldn't load"). Each of these headers holds a single value: keep the first.
const SINGLE_VALUE_HEADERS = ["origin", "x-forwarded-host", "x-forwarded-proto"];

/*
 * Landing pages (admin: Landing Pages) live at services.taxalphonic.com/lp/<label> (the landing
 * host, services.<base domain>; same Next.js app). There /lp/<label> is rewritten to
 * /landing-host/<label> with the label in the x-ta-landing request header. That header is removed
 * from every incoming request first, so only this proxy can set it; the landing route answers 404
 * without it (so /landing-host/... opened directly shows nothing), and the root layout leaves out
 * the site header / footer when it is set. Unknown labels reach the route and get its 404.
 * Any other path on the landing host goes to the same path on the main site.
 *
 * Redirects (308) to the landing host:
 * - /lp/<label> on the main site (taxalphonic.com/lp/cbdt);
 * - old subdomain addresses (<label>.taxalphonic.com, used until 2026-10-26): "/" goes to
 *   /lp/<label>, other paths to the same path on the main site.
 */
export function proxy(request) {
  const headers = new Headers(request.headers);
  for (const name of SINGLE_VALUE_HEADERS) {
    const value = headers.get(name);
    if (value && value.includes(",")) headers.set(name, value.split(",")[0].trim());
  }
  headers.delete(LANDING_HEADER);
  const { pathname, search } = request.nextUrl;

  // Behind the live proxy the public host arrives as X-Forwarded-Host.
  const host = (headers.get("x-forwarded-host") || headers.get("host") || "").split(",")[0].trim();
  const proto = (headers.get("x-forwarded-proto") || request.nextUrl.protocol.replace(":", "") || "https").toLowerCase();
  const label = landingLabelFromPath(pathname);

  // 1. The landing host.
  if (isLandingSiteHost(host)) {
    if (label) {
      headers.set(LANDING_HEADER, label);
      const url = request.nextUrl.clone();
      url.pathname = `${LANDING_ROUTE}/${label}`;
      return NextResponse.rewrite(url, { request: { headers } });
    }
    // Not a landing page: the main site (services.taxalphonic.com → taxalphonic.com).
    const mainSite = `${proto}://${host.slice(LANDING_SITE_LABEL.length + 1)}`;
    return NextResponse.redirect(`${mainSite}${pathname}${search}`, 308);
  }

  // 2. An old landing subdomain.
  const hostLabel = landingLabelFromHost(host);
  if (hostLabel) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(`${landingSiteOrigin(host, proto)}${LANDING_PATH_PREFIX}/${hostLabel}${search}`, 308);
    }
    return NextResponse.redirect(`${proto}://${host.slice(hostLabel.length + 1)}${pathname}${search}`, 308);
  }

  // 3. /lp/<label> on the main site.
  if (label) return NextResponse.redirect(`${landingSiteOrigin(host, proto)}${LANDING_PATH_PREFIX}/${label}${search}`, 308);

  return NextResponse.next({ request: { headers } });
}

// Pages and Server Actions only, not static files or Next.js internals (/_next/...).
export const config = {
  matcher: ["/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)"],
};
