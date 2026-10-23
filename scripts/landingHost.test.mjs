// node --test scripts/landingHost.test.mjs  (npm run test:landing)
import test from "node:test";
import assert from "node:assert/strict";
import { isLandingLabel, landingBaseDomains, landingLabelFromHost } from "../lib/landingHost.mjs";

const domains = ["taxalphonic.com", "localhost"];

test("landing hosts resolve to their label", () => {
  assert.equal(landingLabelFromHost("cbdt.taxalphonic.com", domains), "cbdt");
  assert.equal(landingLabelFromHost("GST.taxalphonic.com:443", domains), "gst");
  assert.equal(landingLabelFromHost("itr-filing.taxalphonic.com.", domains), "itr-filing");
  assert.equal(landingLabelFromHost("cbdt.localhost:3000", domains), "cbdt");
  // LiteSpeed may repeat a header value: the first one counts.
  assert.equal(landingLabelFromHost("cbdt.taxalphonic.com, cbdt.taxalphonic.com", domains), "cbdt");
});

test("the main site, reserved and foreign hosts are not landing pages", () => {
  for (const host of [
    "taxalphonic.com", "www.taxalphonic.com", "frontend.taxalphonic.com", "admin.taxalphonic.com", "api.taxalphonic.com",
    "localhost:3000", "127.0.0.1:3000", "a.b.taxalphonic.com", "cbdt.taxalphonic.com.evil.com", "cbdt.eviltaxalphonic.com",
    "cbdt.example.com", "-x.taxalphonic.com", "xn--abc.taxalphonic.com", "", null,
  ]) {
    assert.equal(landingLabelFromHost(host, domains), null, String(host));
  }
});

test("labels and base domains", () => {
  assert.equal(isLandingLabel("cbdt", ""), true);
  assert.equal(isLandingLabel("crm", "partners, crm"), false);
  assert.equal(isLandingLabel("www", ""), false);
  assert.deepEqual(landingBaseDomains(" TaxAlphonic.com , .staging.example.com. "), ["taxalphonic.com", "staging.example.com"]);
  assert.deepEqual(landingBaseDomains(""), ["taxalphonic.com", "localhost"]);
});
