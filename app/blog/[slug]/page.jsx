import { BlogPostPage } from "@/components/tax-alphonic/blog/BlogPages";
import { NotFound } from "@/components/tax-alphonic/sections";
import { getBlogPost } from "@/service/blogService";
import { createMetadata } from "@/lib/seoMetadata";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_URL } from "@/service/sitemapService";

// /blog/<slug>: one live post (drafts / scheduled / expired posts show "not found").

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return { title: "Article not found", robots: { index: false, follow: false } };

  const metadata = createMetadata({ ...post, canonicalUrl: post.canonicalUrl || `${SITE_URL}${post.path}` });
  return { ...metadata, openGraph: { ...metadata.openGraph, type: "article", publishedTime: post.date || undefined } };
}

export default async function BlogPost({ params }) {
  const { slug } = await params;
  const post = await getBlogPost(slug);
  if (!post) return <NotFound pathname={`/blog/${slug}`} />;

  const url = `${SITE_URL}${post.path}`;
  const schema = post.schemaMarkup || {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.image || undefined,
    datePublished: post.date || undefined,
    dateModified: post.updatedAt || undefined,
    author: post.author?.name ? { "@type": "Person", name: post.author.name } : { "@type": "Organization", name: "Tax Alphonic" },
    publisher: { "@type": "Organization", name: "Tax Alphonic" },
    mainEntityOfPage: url,
  };

  return (
    <>
      <JsonLd value={schema} />
      {post.faqs.length > 0 && (
        <JsonLd value={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: post.faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })),
        }} />
      )}
      <BlogPostPage post={post} url={url} />
    </>
  );
}
