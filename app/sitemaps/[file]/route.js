import { getSitemapFiles, urlsetResponse } from "@/service/sitemapService";

// /sitemaps/pages.xml, /sitemaps/services.xml, /sitemaps/blog.xml, /sitemaps/seo-pages-<n>.xml (listed in /sitemap.xml).
export async function GET(request, { params }) {
  const { file } = await params;
  const match = (await getSitemapFiles()).find(({ name }) => name === file);

  if (!match) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain" } });
  return urlsetResponse(match.entries);
}
