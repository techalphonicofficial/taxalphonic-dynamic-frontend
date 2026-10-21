import { NextResponse } from "next/server";

// The live LiteSpeed proxy sends some request headers twice (e.g. Origin), which Node joins into
// "https://frontend.taxalphonic.com, https://frontend.taxalphonic.com". Next.js reads Origin as one
// URL when checking a Server Action, so every CMS form submit failed with "TypeError: Invalid URL"
// (500, "This page couldn't load"). Each of these headers holds a single value: keep the first.
const SINGLE_VALUE_HEADERS = ["origin", "x-forwarded-host", "x-forwarded-proto"];

export function proxy(request) {
  let headers = null;
  for (const name of SINGLE_VALUE_HEADERS) {
    const value = request.headers.get(name);
    if (value && value.includes(",")) {
      headers ??= new Headers(request.headers);
      headers.set(name, value.split(",")[0].trim());
    }
  }
  return headers ? NextResponse.next({ request: { headers } }) : NextResponse.next();
}

// Pages and Server Actions only, not static files.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|woff2?)$).*)"],
};
