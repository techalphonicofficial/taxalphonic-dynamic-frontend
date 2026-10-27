// Landing pages live at /lp/<label> on the landing host services.<base domain>
// (services.taxalphonic.com/lp/cbdt; landingLabelFromPath, isLandingSiteHost). Old subdomain
// addresses ("cbdt.taxalphonic.com" → "cbdt", landingLabelFromHost) are redirected there by proxy.js.
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
  "secure", "login", "auth", "account", "accounts", "id", "sso", "portal", "landing", "lp", "services",
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

/** Subdomain that serves the landing pages: services.<base domain>. */
export const LANDING_SITE_LABEL = "services";

const hostName = (host) => String(host || "").split(",")[0].trim().toLowerCase().replace(/:\d+$/, "").replace(/\.$/, "");

/** True for the landing host (services.taxalphonic.com, services.localhost:3000). */
export function isLandingSiteHost(host, domains = landingBaseDomains()) {
  const name = hostName(host);
  return Boolean(name) && domains.some((domain) => name === `${LANDING_SITE_LABEL}.${domain}`);
}

/**
 * Origin of the landing host for a request host: services.<its base domain> on the same protocol
 * and port ("frontend.taxalphonic.com" → https://services.taxalphonic.com, "localhost:3000" →
 * http://services.localhost:3000). LANDING_SITE_URL in .env overrides it.
 */
export function landingSiteOrigin(host, proto = "https", domains = landingBaseDomains(), override = process.env.LANDING_SITE_URL) {
  if (override) return String(override).trim().replace(/\/+$/, "");
  const raw = String(host || "").split(",")[0].trim().toLowerCase();
  const port = (/:\d+$/.exec(raw) || [""])[0];
  const name = hostName(raw);
  const domain = domains.find((d) => name === d || name.endsWith(`.${d}`)) || "taxalphonic.com";
  return `${proto}://${LANDING_SITE_LABEL}.${domain}${port}`;
}

/** Path prefix of landing pages on the landing host: /lp/<label>. */
export const LANDING_PATH_PREFIX = "/lp";

/** The label of a landing page path ("/lp/cbdt" or "/lp/cbdt/"), else null. */
export function landingLabelFromPath(pathname) {
  const match = /^\/lp\/([^/]+)\/?$/.exec(String(pathname || ""));
  if (!match) return null;
  const label = match[1].toLowerCase();
  return isLandingLabel(label) ? label : null;
}

/**
 * Request header the proxy sets on a landing request (and strips from every incoming request).
 * The page itself is app/lp/[label]; the proxy passes the request on with this header (no rewrite:
 * behind LiteSpeed a middleware rewrite became an external proxy and broke form Server Actions).
 */
export const LANDING_HEADER = "x-ta-landing";
