import HomeSections from "@/components/tax-alphonic/home/HomeSections";
import { DEFAULT_HOME_SECTIONS } from "@/components/tax-alphonic/home/homeDefaults";
import { getHomePage } from "@/service/homePageService";
import { attachModuleContent } from "@/service/homeContentService";
import { applySeoConfig, getSeoConfig } from "@/service/seoConfigService";
import { createMetadata } from "@/lib/seoMetadata";
import JsonLd from "@/components/seo/JsonLd";

// Homepage = the published CMS page with slug "home" (built with the Home Page Builder).
// Until that page exists, or when it has no blocks, the default layout is shown.
// Blocks such as Testimonials or Team read their records from the CMS modules.

/** Homepage SEO: the home page's own fields, with the SEO Config "Homepage" (admin) on top. */
async function getHomeSeo() {
  const page = await getHomePage();
  const own = { title: "", metaTitle: page?.metaTitle || "", metaDescription: page?.metaDescription || "" };
  return applySeoConfig(own, await getSeoConfig("static", "home", "/"));
}

export async function generateMetadata() {
  const seo = await getHomeSeo();
  if (!seo.metaTitle && !seo.metaDescription && !seo.seoConfigId) return {};

  // Unset title / description keep the site defaults from app/layout.js.
  const metadata = createMetadata(seo);
  if (!metadata.title) {
    delete metadata.title;
    delete metadata.openGraph.title;
    delete metadata.twitter.title;
  }
  if (!metadata.description) {
    delete metadata.description;
    delete metadata.openGraph.description;
    delete metadata.twitter.description;
  }
  return metadata;
}

export default async function Home() {
  const page = await getHomePage();
  const sections = await attachModuleContent(page?.sections?.length ? page.sections : DEFAULT_HOME_SECTIONS);

  const seo = await getHomeSeo();

  return (
    <>
      <JsonLd value={seo.schemaMarkup} />
      <HomeSections sections={sections} />
    </>
  );
}
