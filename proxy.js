

import { NextResponse } from "next/server";
import {
  LANDING_HEADER,
  LANDING_ROUTE,
  landingLabelFromHost,
} from "@/lib/landingHost.mjs";

const SINGLE_VALUE_HEADERS = [
  "origin",
  "x-forwarded-host",
  "x-forwarded-proto",
];

export function proxy(request) {
  const pathname = request.nextUrl.pathname;

  // Internal landing route ko dobara rewrite mat karo.
  if (
    pathname === LANDING_ROUTE ||
    pathname.startsWith(`${LANDING_ROUTE}/`)
  ) {
    return NextResponse.next();
  }

  const headers = new Headers(request.headers);

  // Normalize duplicate forwarded headers.
  for (const name of SINGLE_VALUE_HEADERS) {
    const value = headers.get(name);

    if (value && value.includes(",")) {
      headers.set(name, value.split(",")[0].trim());
    }
  }

  // Incoming internal landing header par trust mat karo.
  headers.delete(LANDING_HEADER);

  const host =
    headers.get("x-forwarded-host") || headers.get("host");

  const label = landingLabelFromHost(host);

  // Main website aur reserved subdomains unchanged rahenge.
  if (!label) {
    return NextResponse.next({
      request: { headers },
    });
  }

  // Selected subdomain ka naam internal route ko pass karo.
  headers.set(LANDING_HEADER, label);

  // Next.js port 3001 par HTTP use karta hai.
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.protocol = "http:";
  rewriteUrl.hostname = "127.0.0.1";
  rewriteUrl.port = "3001";
  rewriteUrl.pathname = `${LANDING_ROUTE}/${label}`;

  return NextResponse.rewrite(rewriteUrl, {
    request: { headers },
  });
}

export const config = {
  matcher: [
    "/((?!landing-host(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)",
  ],
};