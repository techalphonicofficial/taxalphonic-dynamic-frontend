import ApiPage from "../pages/ApiPage";
import BlockBackground from "../blocks/BlockBackground";
import { LandingFooterBar, LandingHeaderBar } from "./LandingChrome";
import { regionMode, splitLandingSections } from "./landingBlockTypes";
import "./landing.css";

/**
 * A landing page (own subdomain): Header region, the body blocks rendered exactly like a CMS
 * page with blocks (ApiPage → ApiServicePage: hero, main | sidebar, Form, Packages, ...), and
 * the Footer region. Used by the live route (app/landing-host/[label]) and the admin preview.
 *
 * page: { id, title, sections } (sections mapped like a CMS page, Form / Packages hydrated)
 * branding / contact: getSiteSettings() (logos, phone, email, address, socials)
 * siteHeader / siteFooter: what "Website header / footer" (mode "site") shows: the live route
 *   passes the website's own Header and Footer; the admin preview a placeholder.
 */
export default function LandingPage({ page, branding = {}, contact = {}, siteHeader = null, siteFooter = null }) {
  const { header, body, footer } = splitLandingSections(page.sections);
  const headerMode = regionMode(header);
  const footerMode = regionMode(footer);

  return (
    <div className="ta-landing" id="top">
      {headerMode === "site" && siteHeader}
      {headerMode === "simple" && (
        <BlockBackground config={header.config} hero>
          <LandingHeaderBar payload={header.payload} branding={branding} contact={contact} />
        </BlockBackground>
      )}

      <ApiPage page={{ id: page.id, title: page.title, content: "", sections: body, hideBreadcrumbs: true }} />

      {footerMode === "site" && siteFooter}
      {footerMode === "simple" && (
        <BlockBackground config={footer.config} hero>
          <LandingFooterBar payload={footer.payload} branding={branding} contact={contact} />
        </BlockBackground>
      )}
    </div>
  );
}
