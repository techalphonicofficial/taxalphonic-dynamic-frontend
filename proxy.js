import { NextResponse } from "next/server";

import {
  LANDING_HEADER,
  LANDING_PATH_PREFIX,
  LANDING_SITE_LABEL,
  isLandingSiteHost,
  isLandingThankYouPath,
  landingLabelFromHost,
  landingLabelFromPath,
  landingSiteOrigin,
} from "@/lib/landingHost.mjs";

const SINGLE_VALUE_HEADERS = [
  "origin",
  "x-forwarded-host",
  "x-forwarded-proto",
];

// ---- 410 Gone (2026-11-12) ----
// Paths of deleted services / pages / pSEO pages / blog posts (backend services/goneUrls.js, public
// GET /api/v1/seo/gone-urls). They answer "410 Gone" so search engines drop them for good. The list is
// fetched at most once a minute; when the backend cannot be reached the site works as before.
const GONE_TTL = 60 * 1000;
let gone = { at: 0, paths: new Set(), loading: null };

async function gonePaths() {
  if (Date.now() - gone.at < GONE_TTL) return gone.paths;
  if (!gone.loading) {
    const base = String(process.env.BASE_URL || "").replace(/\/$/, "");
    gone.loading = (async () => {
      try {
        if (!base) return;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 2500);
        const response = await fetch(`${base}/api/v1/seo/gone-urls`, { signal: controller.signal, cache: "no-store" });
        clearTimeout(timer);
        if (!response.ok) return;
        const payload = await response.json();
        const list = Array.isArray(payload?.data) ? payload.data : [];
        gone.paths = new Set(list.map((p) => String(p).toLowerCase()));
      } catch {
        // keep the last list
      } finally {
        gone.at = Date.now();
        gone.loading = null;
      }
    })();
  }
  await gone.loading;
  return gone.paths;
}

function goneResponse(pathname) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Page removed — Tax Alphonic</title><style>body{margin:0;font:16px/1.6 Inter,system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#1c2b4b;background:#f6f8fb;display:grid;place-items:center;min-height:100vh;padding:20px;box-sizing:border-box}main{max-width:520px;text-align:center;background:#fff;border:1px solid #e3e8ef;border-radius:16px;padding:32px 26px}h1{font-size:22px;font-weight:500;margin:0 0 8px}p{color:#4b5565;margin:0 0 18px}a{display:inline-block;background:#0e96ac;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;margin:4px}a.alt{background:#fff;color:#0e96ac;border:1px solid #0e96ac}</style></head><body><main><h1>This page has been removed</h1><p>The page you are looking for is no longer available.</p><a href="/">Go to the homepage</a><a class="alt" href="/blog">Read our guides</a></main></body></html>`;
  return new Response(html, {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8", "x-robots-tag": "noindex", "cache-control": "public, max-age=300" },
  });
}

const goneKey = (pathname) => {
  try {
    return decodeURIComponent(pathname).replace(/\/+$/, "").toLowerCase() || "/";
  } catch {
    return pathname.replace(/\/+$/, "").toLowerCase() || "/";
  }
};

export async function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  const headers = new Headers(request.headers);

  // Duplicate headers ko normalize karo.
  for (const name of SINGLE_VALUE_HEADERS) {
    const value = headers.get(name);

    if (value && value.includes(",")) {
      headers.set(name, value.split(",")[0].trim());
    }
  }

  // Incoming internal landing header par trust mat karo.
  headers.delete(LANDING_HEADER);

  // Reverse proxy ke through original public host identify karo.
  const host = (
    headers.get("x-forwarded-host") ||
    headers.get("host") ||
    ""
  )
    .split(",")[0]
    .trim()
    .toLowerCase();

  const proto = (
    headers.get("x-forwarded-proto") ||
    request.nextUrl.protocol.replace(":", "") ||
    "https"
  )
    .split(",")[0]
    .trim()
    .toLowerCase();

  const label = landingLabelFromPath(pathname);
  // /lp/thank-you: thank-you page after every landing form (app/lp/thank-you), on the landing host.
  const thankYou = isLandingThankYouPath(pathname);

  // 1. Landing host: services.taxalphonic.com
  if (isLandingSiteHost(host)) {
    if (thankYou) {
      // Header set: app/layout.js leaves out the website header / footer, as on landing pages.
      headers.set(LANDING_HEADER, "thank-you");
      return NextResponse.next({
        request: { headers },
      });
    }

    if (label) {
      headers.set(LANDING_HEADER, label);

      // Route khud app/lp/[label] par hai, isliye rewrite nahi, sirf header ke saath aage bhejo.
      // Rewrite mat lagana: live par LiteSpeed X-Forwarded-Proto https bhejta hai, Next.js rewrite ko
      // "external" maan kar khud par proxy karta tha aur form ka Server Action 500 deta tha.
      return NextResponse.next({
        request: { headers },
      });
    }

    // Landing host par doosre paths main website par redirect honge.
    const mainHost = host.slice(LANDING_SITE_LABEL.length + 1);
    const mainSite = `${proto}://${mainHost}`;

    return NextResponse.redirect(
      `${mainSite}${pathname}${search}`,
      308
    );
  }

  // 2. Purane landing subdomains handle karo.
  const hostLabel = landingLabelFromHost(host);

  if (hostLabel) {
    if (pathname === "/" || pathname === "") {
      return NextResponse.redirect(
        `${landingSiteOrigin(host, proto)}${LANDING_PATH_PREFIX}/${hostLabel}${search}`,
        308
      );
    }

    const mainHost = host.slice(hostLabel.length + 1);

    return NextResponse.redirect(
      `${proto}://${mainHost}${pathname}${search}`,
      308
    );
  }

  // 3. Main website par /lp/<label> (aur /lp/thank-you) ko landing host par redirect karo.
  if (label || thankYou) {
    return NextResponse.redirect(
      `${landingSiteOrigin(host, proto)}${LANDING_PATH_PREFIX}/${label || "thank-you"}${search}`,
      308
    );
  }

  // 4. Deleted pages: 410 Gone (only page loads; Server Actions / prefetch data pass through).
  if ((request.method === "GET" || request.method === "HEAD") && pathname !== "/" && !request.headers.get("next-action")) {
    const paths = await gonePaths();
    if (paths.size && paths.has(goneKey(pathname))) return goneResponse(pathname);
  }

  // 5. Baaki requests unchanged rahengi.
  return NextResponse.next({
    request: { headers },
  });
}

// Pages aur Server Actions ke liye proxy.
// Static assets aur Next.js internal resources exclude hain.
export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)",
  ],
};
