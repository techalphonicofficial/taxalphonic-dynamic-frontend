import { notFound } from "next/navigation";
import ThankYouPage from "@/components/tax-alphonic/landing/ThankYouPage";
import TrackingCode from "@/components/tax-alphonic/landing/TrackingCode";
import { isLandingLabel } from "@/lib/landingHost.mjs";
import { getLandingPage, getLandingThankYou } from "@/service/landingPageService";
import { getSiteSettings } from "@/service/siteSettingsService";

/*
 * Thank-you page after a landing form: services.taxalphonic.com/lp/thank-you?from=<label>
 * (CmsForm goes here on a landing page when it is switched on; a static segment, so it wins over
 * app/lp/[label], and "thank-you" can never be a landing label). One page for every landing page,
 * edited in the admin (Landing Pages → Thank-you page & tracking); ?from= only picks the colour
 * theme, header / footer and the "Back" link of that published landing page.
 * Tracking: the "every landing page" codes plus the thank-you codes (conversion events). Never indexed.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Thank you",
  robots: { index: false, follow: false },
};

export default async function LandingThankYouRoute({ searchParams }) {
  const { from } = await searchParams;
  const label = typeof from === "string" ? from.toLowerCase() : "";
  const [settings, source, { branding, contact }] = await Promise.all([
    getLandingThankYou(),
    isLandingLabel(label) ? getLandingPage(label) : null,
    getSiteSettings(),
  ]);
  if (!settings?.enabled) notFound();
  const page = source?.slug || "";

  return (
    <>
      <TrackingCode html={settings.allHead} page={page} where="head" />
      <TrackingCode html={settings.thanksHead} page={page} where="thanks-head" />
      <ThankYouPage settings={settings} source={source} branding={branding} contact={contact} />
      <TrackingCode html={settings.allBody} page={page} where="body" />
      <TrackingCode html={settings.thanksBody} page={page} where="thanks-body" />
    </>
  );
}
