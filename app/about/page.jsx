import AboutPage from "@/components/tax-alphonic/pages/AboutPage";
import { NotFound } from "@/components/tax-alphonic/sections";
import { getAboutPage } from "@/service/aboutPageService";
import { applySeoConfig, getSeoConfig } from "@/service/seoConfigService";
import { createMetadata } from "@/lib/seoMetadata";
import JsonLd from "@/components/seo/JsonLd";

/** About page SEO: its hero texts and image, with the SEO Config "About page" (admin) on top. */
async function getAboutSeo(about) {
  const own = { title: about.heroTitle, metaTitle: about.heroTitle, metaDescription: about.heroSubtitle, ogImage: about.aboutImage };
  return applySeoConfig(own, await getSeoConfig("static", "about", "/about"));
}

export async function generateMetadata() {
  const about = await getAboutPage();
  if (!about) return { title: "About", robots: { index: false, follow: false } };

  return createMetadata(await getAboutSeo(about));
}

export default async function About() {
  const about = await getAboutPage();
  if (!about) return <NotFound pathname="/about" />;

  const seo = await getAboutSeo(about);

  return (
    <>
      <JsonLd value={seo.schemaMarkup} />
      <AboutPage about={about} />
    </>
  );
}
