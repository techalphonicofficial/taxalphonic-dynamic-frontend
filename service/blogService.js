import { cache } from "react";
import { apiClient } from "@/service/apiClient";
import { normalizeAssetUrl, normalizePayload, parsePayload } from "@/service/servicePageService";
import { getSeoConfig, applySeoConfig } from "@/service/seoConfigService";

// Blog (admin: Blog → All Blogs). Only live posts come back from /api/v1/blogs/public
// (published, publish date passed, not expired), so a new post shows here as soon as it is
// published, with no code change. Pages: app/blog/page.jsx and app/blog/[slug]/page.jsx.

const REVALIDATE = 60;

const author = (a) => (a ? { name: a.name || "", bio: a.bio || "", avatar: normalizeAssetUrl(a.avatar) } : null);

/** A post card: list fields only, absolute image URLs. */
export function mapCard(post) {
  return {
    id: post.id,
    title: post.title?.trim() || "Untitled post",
    slug: post.slug,
    excerpt: post.excerpt || "",
    image: normalizeAssetUrl(post.featuredImage),
    readTime: Number(post.readTime) || 1,
    date: post.date || post.publishDate || post.createdAt || null,
    isPinned: Boolean(post.isPinned),
    isFeatured: Boolean(post.isFeatured),
    category: post.category ? { name: post.category.name, slug: post.category.slug } : null,
    author: author(post.author),
    tags: (post.tags || []).map((t) => ({ name: t.name, slug: t.slug })),
  };
}

/** Page Builder sections of a post. The admin's RichText block becomes an Overview (same renderer as services). */
function mapSections(sections) {
  return (Array.isArray(sections) ? sections : []).map((section, index) => {
    const payload = normalizePayload(parsePayload(section.data?.payload ?? section.payload));
    const type = section.type === "RichText" ? "Overview" : section.type;
    return { id: section.id || `sec-${index}`, type, config: parsePayload(section.config), payload };
  });
}

/** { posts, pagination } for one page of the list. Never throws (an empty list on error). */
export async function getBlogPosts({ page = 1, limit = 12, category = "", tag = "", search = "" } = {}) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (category) params.set("category", category);
  if (tag) params.set("tag", tag);
  if (search) params.set("search", search);

  try {
    const payload = await apiClient(`/api/v1/blogs/public?${params}`, { next: { revalidate: REVALIDATE } });
    return {
      posts: (payload?.data || []).map(mapCard),
      pagination: payload?.pagination || { currentPage: 1, totalPages: 1, totalItems: 0 },
    };
  } catch (error) {
    console.error("Unable to load blog posts", error);
    return { posts: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 }, error: true };
  }
}

export const getBlogCategories = cache(async function getBlogCategories() {
  try {
    const payload = await apiClient("/api/v1/blogs/public/categories", { next: { revalidate: REVALIDATE } });
    return payload?.data || [];
  } catch (error) {
    console.error("Unable to load blog categories", error);
    return [];
  }
});

/** The full post (null when it does not exist or is not live), with its SEO Config (matched by URL) applied. */
export const getBlogPost = cache(async function getBlogPost(slug) {
  let post;
  try {
    const payload = await apiClient(`/api/v1/blogs/public/${encodeURIComponent(slug)}`, { next: { revalidate: REVALIDATE } });
    post = payload?.success ? payload.data : null;
  } catch (error) {
    if (error.status !== 404) console.error(`Unable to load blog post ${slug}`, error);
    return null;
  }
  if (!post) return null;

  const card = mapCard(post);
  // Legacy posts keep HTML in content instead of Page Builder sections.
  const sections = Array.isArray(post.sections)
    ? mapSections(post.sections)
    : post.content ? mapSections([{ id: "legacy", type: "Overview", payload: { content: post.content } }]) : [];

  const record = {
    ...card,
    sections,
    faqs: (post.faqs || []).filter((f) => f.question),
    related: (post.related || []).map(mapCard),
    updatedAt: post.updatedAt,
    likeCount: Number(post.likeCount) || 0,
    path: `/blog/${post.slug}`,
    metaTitle: post.metaTitle || post.title,
    metaDescription: post.metaDescription || card.excerpt,
    keywords: post.keywords || "",
    canonicalUrl: post.canonicalUrl || "",
    robots: "",
    ogTitle: post.ogTitle || "",
    ogDescription: post.ogDescription || "",
    ogImage: normalizeAssetUrl(post.ogImage) || card.image,
    twitterCard: post.twitterCard || "",
    schemaMarkup: post.schemaMarkup || "",
  };

  return applySeoConfig(record, await getSeoConfig(null, null, record.path));
});
