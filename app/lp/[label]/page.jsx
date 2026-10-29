import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import LandingPage from "@/components/tax-alphonic/landing/LandingPage";
import { regionMode, splitLandingSections } from "@/components/tax-alphonic/landing/landingBlockTypes";
import { LANDING_HEADER } from "@/lib/landingHost.mjs";
import JsonLd from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seoMetadata";
import { getLandingPage, getLandingThankYou } from "@/service/landingPageService";
import TrackingCode from "@/components/tax-alphonic/landing/TrackingCode";
import ThankYouRedirect from "@/components/tax-alphonic/landing/ThankYouRedirect";
import { LANDING_THANK_YOU_PATH } from "@/lib/landingHost.mjs";
import { getFooterNavigation, getHeaderNavigation } from "@/service/navigationService";
import { getSiteSettings } from "@/service/siteSettingsService";
import { withSeoConfig } from "@/service/seoConfigService";

/*
 * A landing page at /lp/<label> on the landing host (services.taxalphonic.com/lp/cbdt). proxy.js
 * passes that request on with the x-ta-landing header (no rewrite; /lp/<label> on the main site and
 * old <label>.taxalphonic.com addresses are redirected to the landing host); without that header
 * or without a published page for the label, it is a 404.
 * Only the published version is ever loaded (service/landingPageService.js).
 * SEO: the page's own SEO (Settings & SEO tab); an active SEO Config for this landing page
 * (admin SEO Configs, type "landing") wins field by field, empty config fields keep the page's own.
 */
export const dynamic = "force-dynamic";

async function load(params) {
  const { label } = await params;
  if ((await headers()).get(LANDING_HEADER) !== label) return null;
  return getLandingPage(label);
}

/** The page's own SEO with its SEO Config (if any) on top. */
async function seoOf(page) {
  const seo = page.seo || {};
  const own = {
    title: page.title,
    metaTitle: seo.metaTitle || page.title,
    metaDescription: seo.metaDescription || "",
    keywords: seo.keywords || "",
    robots: seo.robots || "",
    ogImage: seo.ogImage || "",
    canonicalUrl: page.url || "",
  };
  return page.recordId ? withSeoConfig(own, "landing", page.recordId) : own;
}

export async function generateMetadata({ params }) {
  const page = await load(params);
  if (!page) return { title: "Page not found", robots: { index: false, follow: false } };
  return createMetadata(await seoOf(page));
}

export default async function LandingHostPage({ params }) {
  const page = await load(params);
  if (!page) notFound();

  const { header, footer } = splitLandingSections(page.sections);
  const siteHeader = regionMode(header) === "site";
  const siteFooter = regionMode(footer) === "site";
  // The website's own header / footer only when a region uses it.
  const [navigation, footerMenu, { branding, contact }, thanks] = await Promise.all([
    siteHeader ? getHeaderNavigation() : null,
    siteFooter ? getFooterNavigation() : null,
    getSiteSettings(),
    getLandingThankYou(),
  ]);

  const seo = await seoOf(page);

  return (
    <>
      <JsonLd value={seo.schemaMarkup} />
      {/* Tracking for every landing page (admin: Landing Pages → Thank-you page & tracking). */}
      <TrackingCode html={thanks?.allHead} page={page.slug} where="head" />
      {thanks?.enabled && <ThankYouRedirect url={`${LANDING_THANK_YOU_PATH}?from=${page.slug}`} />}
      <LandingPage
        page={page}
        branding={branding}
        contact={contact}
        siteHeader={siteHeader ? <Header navigation={navigation} branding={branding} /> : null}
        siteFooter={siteFooter ? <Footer menu={footerMenu} branding={branding} contact={contact} /> : null}
      />
      <TrackingCode html={thanks?.allBody} page={page.slug} where="body" />
    </>
  );
}
