import { SITE_URL, getSitemapFiles, indexResponse } from "@/service/sitemapService";

// /sitemap.xml: the sitemap index (see service/sitemapService.js). Submit this URL in Search Console.
export async function GET() {
  const files = await getSitemapFiles();

  return indexResponse(files.map(({ name, entries }) => ({
    loc: `${SITE_URL}/sitemaps/${name}`,
    lastmod: entries.reduce((max, entry) => (entry.lastmod && (!max || entry.lastmod > max) ? entry.lastmod : max), undefined),
  })));
}
