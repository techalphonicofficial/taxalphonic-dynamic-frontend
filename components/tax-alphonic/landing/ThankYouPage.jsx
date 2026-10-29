import BlockBackground from "../blocks/BlockBackground";
import { LandingFooterBar, LandingHeaderBar } from "./LandingChrome";
import { regionMode, splitLandingSections } from "./landingBlockTypes";
import { landingThemeOf, landingThemeStyle } from "./landingThemes";
import "./landing.css";
import "./landing-themes.css";

const telHref = (phone) => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;

/**
 * The thank-you page after a landing form (app/lp/thank-you), shared by every landing page.
 * settings: getLandingThankYou() (texts from the admin). source: the landing page the visitor came
 * from (getLandingPage), or null: its colour theme and its own header / footer (logo, phone;
 * header links and buttons are left out, there is no form here) and a "Back to the page" link.
 */
export default function ThankYouPage({ settings, source = null, branding = {}, contact = {} }) {
  const { header, footer } = splitLandingSections(source?.sections || []);
  const theme = landingThemeOf(header);
  const themeAttr = theme === "default" ? undefined : theme;
  const steps = (Array.isArray(settings.steps) ? settings.steps : []).filter((step) => step?.text);
  const phone = String(contact.phone || "").trim();
  const headerPayload = { ...(header?.payload || {}), links: [], button: null, showPhone: "yes" };

  return (
    <div className="ta-landing lp-thanks-page" id="top" data-lp-theme={themeAttr} style={landingThemeStyle(header)}>
      {regionMode(header) !== "none" && (
        <BlockBackground config={header?.config} hero>
          <LandingHeaderBar payload={headerPayload} branding={branding} contact={contact} />
        </BlockBackground>
      )}

      <main className="lp-thanks">
        <div className="lp-thanks-card">
          {settings.icon && <div className="lp-thanks-icon" aria-hidden>{settings.icon}</div>}
          {settings.heading && <h1>{settings.heading}</h1>}
          {settings.message && <p className="lp-thanks-msg">{settings.message}</p>}

          {steps.length > 0 && (
            <div className="lp-thanks-steps">
              {settings.stepsTitle && <div className="lp-thanks-steps-title">{settings.stepsTitle}</div>}
              <ol>
                {steps.map((step, index) => <li key={index}><span>{index + 1}</span>{step.text}</li>)}
              </ol>
            </div>
          )}

          <div className="lp-thanks-actions">
            {settings.showCall && phone && (
              <a href={telHref(phone)} className="lp-thanks-btn solid">📞 {settings.callText || phone}</a>
            )}
            {source && settings.backText && (
              <a href={`/lp/${source.slug}`} className="lp-thanks-btn">← {settings.backText}</a>
            )}
          </div>
        </div>
      </main>

      {source && regionMode(footer) === "simple" && (
        <BlockBackground config={footer.config} hero>
          <LandingFooterBar payload={footer.payload} branding={branding} contact={contact} />
        </BlockBackground>
      )}
    </div>
  );
}
