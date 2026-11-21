import test from "node:test";
import assert from "node:assert/strict";
import {
  FALLBACK_FAVICON_PATH,
  buildSiteIcons,
  getIconMimeType,
  parseSafeFaviconUrl,
} from "../lib/favicon.js";

test("parseSafeFaviconUrl validates http/https and safe local paths, rejecting unsafe inputs", () => {
  assert.deepEqual(
    parseSafeFaviconUrl("https://api.taxalphonic.com/uploads/TAX LOGO-01-1794474330408.webp"),
    {
      url: "https://api.taxalphonic.com/uploads/TAX%20LOGO-01-1794474330408.webp",
      isAbsolute: true,
    }
  );
  assert.deepEqual(parseSafeFaviconUrl("/logo.png"), {
    url: "/logo.png",
    isAbsolute: false,
  });

  for (const unsafe of [
    "",
    "   ",
    null,
    undefined,
    "//evil.com/favicon.ico",
    "javascript:alert(1)",
    "data:image/svg+xml,<svg></svg>",
    "file:///etc/passwd",
    "https://user:pass@evil.com/icon.png",
    "https://api.taxalphonic.com/\nLocation: https://evil.com",
  ]) {
    assert.equal(parseSafeFaviconUrl(unsafe), null, `Expected null for ${String(unsafe)}`);
  }
});

test("getIconMimeType resolves standard icon formats", () => {
  assert.equal(getIconMimeType("https://api.taxalphonic.com/uploads/icon.webp?v=1"), "image/webp");
  assert.equal(getIconMimeType("https://api.taxalphonic.com/uploads/icon.png"), "image/png");
  assert.equal(getIconMimeType("https://api.taxalphonic.com/uploads/icon.ico"), "image/x-icon");
  assert.equal(getIconMimeType("https://api.taxalphonic.com/uploads/icon.svg"), "image/svg+xml");
  assert.equal(getIconMimeType("https://api.taxalphonic.com/uploads/icon"), undefined);
});

test("buildSiteIcons constructs dynamic icons and falls back cleanly", () => {
  assert.deepEqual(
    buildSiteIcons({
      favicon: "https://api.taxalphonic.com/uploads/TAX LOGO-01-1794474330408.webp",
      appleTouchIcon: "https://api.taxalphonic.com/uploads/apple.png",
    }),
    {
      icon: [
        {
          url: "https://api.taxalphonic.com/uploads/TAX%20LOGO-01-1794474330408.webp",
          type: "image/webp",
        },
      ],
      apple: [{ url: "https://api.taxalphonic.com/uploads/apple.png", type: "image/png" }],
    }
  );

  assert.deepEqual(
    buildSiteIcons({
      favicon: "https://api.taxalphonic.com/uploads/mark.svg",
      appleTouchIcon: "",
    }),
    {
      icon: [
        {
          url: "https://api.taxalphonic.com/uploads/mark.svg",
          type: "image/svg+xml",
          sizes: "any",
        },
      ],
    }
  );

  assert.deepEqual(buildSiteIcons({}), {
    icon: [{ url: FALLBACK_FAVICON_PATH, type: "image/png" }],
  });
});
