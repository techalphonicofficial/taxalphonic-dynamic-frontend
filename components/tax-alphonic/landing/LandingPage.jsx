import ApiPage from "../pages/ApiPage";
import BlockBackground from "../blocks/BlockBackground";
import FormPopupHost from "../forms/FormPopupHost";
import { LandingFooterBar, LandingHeaderBar } from "./LandingChrome";
import LandingLinkGuard from "./LandingLinkGuard";
import { regionMode, splitLandingSections } from "./landingBlockTypes";
import { landingThemeOf, landingThemeStyle } from "./landingThemes";
import "./landing.css";
import "./landing-themes.css";

/**
 * A landing page (taxalphonic.com/lp/<label>): Header region, the body blocks rendered exactly like a CMS
 * page with blocks (ApiPage → ApiServicePage: hero, main | sidebar, Form, Packages, ...), and
 * the Footer region. Used by the live route (app/landing-host/[label]) and the admin preview.
 *
 * page: { id, title, sections } (sections mapped like a CMS page, Form / Packages hydrated)
 * branding / contact: getSiteSettings() (logos, phone, email, address, socials)
 * siteHeader / siteFooter: what "Website header / footer" (mode "site") shows: the live route
 *   passes the website's own Header and Footer; the admin preview a placeholder.
 * Links never lead away from the page (lib/landingLinks.js): LandingLinkGuard turns any outbound
 * link into the form popup; the block payloads are already locked by service/landingPageService.js.
 */
export default function LandingPage({ page, branding = {}, contact = {}, siteHeader = null, siteFooter = null }) {
  const { header, body, footer } = splitLandingSections(page.sections);
  const headerMode = regionMode(header);
  const footerMode = regionMode(footer);
  // Colour theme picked in the admin (Header block payload.pageTheme); "default" = the stylesheets' colours.
  const theme = landingThemeOf(header);
  const themeAttr = theme === "default" ? undefined : theme;
  // A custom theme brings its colours as CSS variables (landingThemes.js).
  const themeStyle = landingThemeStyle(header);
  // "#form" buttons (header "Enquire now", hero, ...) open the page's first form in a popup.
  const formBlock = body.find((s) => s.type === "Form" && s.payload?.form?.fields?.length);
  const defaultForm = formBlock ? { form: formBlock.payload.form, heading: formBlock.payload.heading, subHeading: formBlock.payload.subHeading } : null;

  return (
    <div className="ta-landing" id="top" data-lp-theme={themeAttr} style={themeStyle}>
      {headerMode === "site" && siteHeader}
      {headerMode === "simple" && (
        <BlockBackground config={header.config} hero>
          <LandingHeaderBar payload={header.payload} branding={branding} contact={contact} />
        </BlockBackground>
      )}

      <ApiPage page={{ id: page.id, title: page.title, content: "", sections: body, hideBreadcrumbs: true }} />

      {/* Before FormPopupHost: its click listener must run first. */}
      <LandingLinkGuard />
      <FormPopupHost defaultForm={defaultForm} theme={themeAttr} themeStyle={themeStyle} />

      {footerMode === "site" && siteFooter}
      {footerMode === "simple" && (
        <BlockBackground config={footer.config} hero>
          <LandingFooterBar payload={footer.payload} branding={branding} contact={contact} />
        </BlockBackground>
      )}
    </div>
  );
}
