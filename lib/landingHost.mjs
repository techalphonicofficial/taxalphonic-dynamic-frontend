// Landing page subdomains: which hostnames are a landing page ("cbdt.taxalphonic.com" → "cbdt").
// Used by proxy.js (edge) and the landing route; plain functions, tested by
// `node --test scripts/landingHost.test.mjs`. Keep RESERVED and the label rules in sync with the
// backend's services/landing/subdomain.js (the backend refuses these labels when a page is created).

export const RESERVED = new Set([
  "www", "admin", "api", "app", "apps", "backend", "frontend", "cms", "cms-admin", "dashboard",
  "mail", "email", "webmail", "smtp", "imap", "pop", "pop3", "mx", "ftp", "sftp", "ssh", "vpn",
  "ns", "ns1", "ns2", "ns3", "ns4", "dns", "cpanel", "whm", "webdisk", "autodiscover", "autoconfig",
  "cdn", "static", "assets", "media", "uploads", "files", "img", "images",
  "dev", "staging", "stage", "test", "testing", "qa", "uat", "demo", "beta", "sandbox", "preview",
  "localhost", "status", "docs", "help", "support", "blog", "shop", "store", "pay", "payments",
  "secure", "login", "auth", "account", "accounts", "id", "sso", "portal", "landing", "lp",
]);

const LABEL = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])$/;

/** Base domains from LANDING_BASE_DOMAINS (comma-separated); "localhost" lets cbdt.localhost:3000 work in development. */
export function landingBaseDomains(value = process.env.LANDING_BASE_DOMAINS) {
  return String(value || "taxalphonic.com,localhost")
    .split(",")
    .map((domain) => domain.trim().toLowerCase().replace(/^\.+|\.+$/g, ""))
    .filter(Boolean);
}

/** True when `label` may be a landing page subdomain (format and not reserved). */
export function isLandingLabel(label, extraReserved = process.env.LANDING_RESERVED_SUBDOMAINS) {
  const value = String(label || "");
  if (!LABEL.test(value) || value.slice(2, 4) === "--" || /^\d+$/.test(value)) return false;
  if (RESERVED.has(value)) return false;
  const extra = String(extraReserved || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  return !extra.includes(value);
}

/**
 * The landing label of a Host header value, or null. Only one label directly under a base
 * domain counts; the port and a trailing dot are ignored. Nothing else from the request is
 * trusted: the label only selects which *published* page to show.
 */
export function landingLabelFromHost(host, domains = landingBaseDomains()) {
  const name = String(host || "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");
  if (!name || name.length > 253) return null;
  for (const domain of domains) {
    const suffix = `.${domain}`;
    if (!name.endsWith(suffix)) continue;
    const label = name.slice(0, -suffix.length);
    return !label.includes(".") && isLandingLabel(label) ? label : null;
  }
  return null;
}

/** Request header the proxy sets on a landing request (and strips from every incoming request). */
export const LANDING_HEADER = "x-ta-landing";
/** Internal route the proxy rewrites landing hosts to. */
export const LANDING_ROUTE = "/landing-host";
