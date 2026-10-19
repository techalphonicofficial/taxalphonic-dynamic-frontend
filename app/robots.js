import { SITE_URL } from "@/service/sitemapService";

// /robots.txt: everything may be crawled except the CMS live preview; points to the sitemap index.
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/cms-preview"] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
