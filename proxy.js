import { NextResponse } from "next/server";
import { LANDING_HEADER, LANDING_ROUTE, landingLabelFromHost } from "@/lib/landingHost.mjs";

// The live LiteSpeed proxy sends some request headers twice (e.g. Origin), which Node joins into
// "https://frontend.taxalphonic.com, https://frontend.taxalphonic.com". Next.js reads Origin as one
// URL when checking a Server Action, so every CMS form submit failed with "TypeError: Invalid URL"
// (500, "This page couldn't load"). Each of these headers holds a single value: keep the first.
const SINGLE_VALUE_HEADERS = ["origin", "x-forwarded-host", "x-forwarded-proto"];

// Main website, for links from a landing page to anything but its own home ("/talk-to-expert").
const MAIN_SITE = String(process.env.SITE_URL || "https://taxalphonic.com").replace(/\/$/, "");

/*
 * Landing pages (admin: Landing Pages): <label>.taxalphonic.com — any label under a base domain
 * in LANDING_BASE_DOMAINS, served from one wildcard DNS record — is rewritten to
 * /landing-host/<label>, with the label in the x-ta-landing request header. That header is
 * removed from every incoming request first, so only this proxy can set it; the landing route
 * answers 404 without it (so /landing-host/... on the main site shows nothing), and the root
 * layout leaves out the site header / footer when it is set. Other paths on a landing host go
 * to the same path on the main site. Unknown labels reach the route and get its 404.
 */
export function proxy(request) {
  const headers = new Headers(request.headers);
  for (const name of SINGLE_VALUE_HEADERS) {
    const value = headers.get(name);
    if (value && value.includes(",")) headers.set(name, value.split(",")[0].trim());
  }
  headers.delete(LANDING_HEADER);

  // Behind the live proxy the public host arrives as X-Forwarded-Host.
  const label = landingLabelFromHost(headers.get("x-forwarded-host") || headers.get("host"));
  if (!label) return NextResponse.next({ request: { headers } });

  const { pathname, search } = request.nextUrl;
  if (pathname !== "/" && pathname !== "") {
    return NextResponse.redirect(`${MAIN_SITE}${pathname}${search}`, 308);
  }
  headers.set(LANDING_HEADER, label);
  const url = request.nextUrl.clone();
  url.pathname = `${LANDING_ROUTE}/${label}`;
  return NextResponse.rewrite(url, { request: { headers } });
}

// Pages and Server Actions only, not static files.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)"],
};
