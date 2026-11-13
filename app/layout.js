import "./fonts/inter.css";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FormPopupHost from "@/components/tax-alphonic/forms/FormPopupHost";
import { ThemeProvider } from "@/context/ThemeContext";
import { getFooterNavigation, getHeaderNavigation } from "@/service/navigationService";
import { getSiteSettings } from "@/service/siteSettingsService";
import { preload } from "react-dom";
import { headers } from "next/headers";
import { LANDING_HEADER } from "@/lib/landingHost.mjs";

// Light type sitewide (2026-11-12): Inter comes from app/fonts/inter.css (files in public/fonts, served by
// the site since 2026-11-13: next/font/google broke `next dev` under Turbopack) with only the 300–500
// weights, so every font-weight 600 / 700 / 800 in the CSS shows as 500; globals.css turns off faux bold.
// Every page reads the CMS on each request (settings, menus). Without this the built-in 404 page was
// pre-rendered at build time, where the settings fetch (no-store) cannot run, so it came out without
// the site's logo / menus and the build logged "Dynamic server usage" errors (2026-11-13).
export const dynamic = "force-dynamic";

const fontPreload = () => preload("/fonts/inter-latin.woff2", { as: "font", type: "font/woff2", crossOrigin: "anonymous" });

// Favicon and Apple touch icon come from Settings → Organization when set.
export async function generateMetadata() {
  const { branding } = await getSiteSettings();
  const metadata = { title: branding.name || "Tax Alphonic", description: "Tax & Compliance Services" };
  const icons = {};
  if (branding.favicon) icons.icon = branding.favicon;
  if (branding.appleTouchIcon) icons.apple = branding.appleTouchIcon;
  if (Object.keys(icons).length) metadata.icons = icons;
  return metadata;
}

// Settings → Website Layout: page width / side space / section gap as :root variables.
// The CSS is built from numbers and known words only (siteSettingsService layoutCss).
function LayoutStyle({ css }) {
  return css ? <style id="ta-layout" dangerouslySetInnerHTML={{ __html: css }} /> : null;
}

export default async function RootLayout({ children }) {
  fontPreload();
  // Landing page subdomains (proxy.js sets this header; it can't come from the browser) render
  // their own header and footer regions (components/tax-alphonic/landing/LandingPage.jsx).
  if ((await headers()).get(LANDING_HEADER)) {
    const { layoutCss } = await getSiteSettings();
    return (
      <html lang="en">
        <body>
          <LayoutStyle css={layoutCss} />
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    );
  }

  const [navigation, footerMenu, { branding, contact, layoutCss }] = await Promise.all([
    getHeaderNavigation(),
    getFooterNavigation(),
    getSiteSettings(),
  ]);

  return (
    <html lang="en">
      <body>
        <LayoutStyle css={layoutCss} />
        <ThemeProvider>
          <Header navigation={navigation} branding={branding} />
          {children}
          <Footer menu={footerMenu} branding={branding} contact={contact} />
          {/* "#form-<id>" buttons open that form in a popup (landing pages mount their own). */}
          <FormPopupHost />
        </ThemeProvider>
      </body>
    </html>
  );
}
