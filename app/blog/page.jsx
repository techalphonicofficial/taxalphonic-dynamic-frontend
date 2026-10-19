import { BlogListPage } from "@/components/tax-alphonic/blog/BlogPages";
import { getBlogCategories, getBlogPosts } from "@/service/blogService";
import { applySeoConfig, getSeoConfig } from "@/service/seoConfigService";
import { createMetadata } from "@/lib/seoMetadata";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL } from "@/service/sitemapService";

// /blog?category=<slug>&q=<search>&page=<n>: every live post from the CMS (admin: Blog).

const one = (value) => (Array.isArray(value) ? value[0] : value) || "";

/** The list's own SEO, with an SEO Config for the URL /blog (admin: custom route) on top. */
async function getBlogSeo() {
  const own = {
    title: "Blog — Guides on tax, GST, compliance & business",
    metaDescription: "Straightforward, up-to-date articles from Tax Alphonic on registrations, tax filing, GST, compliance and growing your business in India.",
    canonicalUrl: `${SITE_URL}/blog`,
  };
  return applySeoConfig(own, await getSeoConfig(null, null, "/blog"));
}

export async function generateMetadata({ searchParams }) {
  const params = await searchParams;
  const seo = await getBlogSeo();
  const filtered = one(params.q) || one(params.category) || Number(one(params.page)) > 1;
  // Search / filter / later pages point Google at the main list.
  return createMetadata(filtered ? { ...seo, robots: seo.robots || "noindex, follow" } : seo);
}

export default async function BlogIndex({ searchParams }) {
  const params = await searchParams;
  const category = one(params.category).slice(0, 120);
  const search = one(params.q).trim().slice(0, 100);
  const page = Math.max(1, parseInt(one(params.page), 10) || 1);

  const [{ posts, pagination }, categories, seo] = await Promise.all([
    getBlogPosts({ page, limit: 12, category, search }),
    getBlogCategories(),
    getBlogSeo(),
  ]);

  const schema = seo.schemaMarkup || {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Tax Alphonic Blog",
    url: `${SITE_URL}/blog`,
    blogPost: posts.map((post) => ({ "@type": "BlogPosting", headline: post.title, url: `${SITE_URL}/blog/${post.slug}` })),
  };

  return (
    <>
      <JsonLd value={schema} />
      <BlogListPage posts={posts} pagination={pagination} categories={categories} category={category} search={search} />
    </>
  );
}
