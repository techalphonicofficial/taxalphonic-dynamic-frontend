import { NextResponse } from "next/server";

import {
  LANDING_HEADER,
  LANDING_PATH_PREFIX,
  LANDING_ROUTE,
  LANDING_SITE_LABEL,
  isLandingSiteHost,
  landingLabelFromHost,
  landingLabelFromPath,
  landingSiteOrigin,
} from "@/lib/landingHost.mjs";

const SINGLE_VALUE_HEADERS = [
  "origin",
  "x-forwarded-host",
  "x-forwarded-proto",
];

export function proxy(request) {
  const pathname = request.nextUrl.pathname;
  const search = request.nextUrl.search;

  // Internal landing route ko dobara rewrite mat karo.
  if (
    pathname === LANDING_ROUTE ||
    pathname.startsWith(`${LANDING_ROUTE}/`)
  ) {
    return NextResponse.next();
  }

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

  // 1. Landing host: services.taxalphonic.com
  if (isLandingSiteHost(host)) {
    if (label) {
      headers.set(LANDING_HEADER, label);

      const rewriteUrl = request.nextUrl.clone();
      rewriteUrl.pathname = `${LANDING_ROUTE}/${label}`;

      return NextResponse.rewrite(rewriteUrl, {
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

  // 3. Main website par /lp/<label> ko landing host par redirect karo.
  if (label) {
    return NextResponse.redirect(
      `${landingSiteOrigin(host, proto)}${LANDING_PATH_PREFIX}/${label}${search}`,
      308
    );
  }

  // 4. Baaki requests unchanged rahengi.
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
