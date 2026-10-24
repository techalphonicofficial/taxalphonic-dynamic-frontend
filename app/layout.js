import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import FormPopupHost from "@/components/tax-alphonic/forms/FormPopupHost";
import { ThemeProvider } from "@/context/ThemeContext";
import { getFooterNavigation, getHeaderNavigation } from "@/service/navigationService";
import { getSiteSettings } from "@/service/siteSettingsService";
import { Sora, Inter } from "next/font/google";
import { headers } from "next/headers";
import { LANDING_HEADER } from "@/lib/landingHost.mjs";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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

export default async function RootLayout({ children }) {
  // Landing page subdomains (proxy.js sets this header; it can't come from the browser) render
  // their own header and footer regions (components/tax-alphonic/landing/LandingPage.jsx).
  if ((await headers()).get(LANDING_HEADER)) {
    return (
      <html lang="en">
        <body className={`${sora.variable} ${inter.variable}`}>
          <ThemeProvider>{children}</ThemeProvider>
        </body>
      </html>
    );
  }

  const [navigation, footerMenu, { branding, contact }] = await Promise.all([
    getHeaderNavigation(),
    getFooterNavigation(),
    getSiteSettings(),
  ]);

  return (
    <html lang="en">
      <body className={`${sora.variable} ${inter.variable}`}>
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
