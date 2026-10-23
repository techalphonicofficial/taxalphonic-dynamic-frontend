import Link from "next/link";
import { ContentBlocks } from "../pages/ApiServicePage";
import { BlogViewCounter, ShareButtons, TableOfContents } from "./BlogClient";
import BlogEngagement from "./BlogEngagement";
import "../service-page.css";
import "./blog.css";

// Blog list (/blog) and post (/blog/[slug]). Inside .ta-svc so the reference tokens and blocks
// (crumb, eyebrow, blk, faq, ctastrip, svc-rich) apply; blog-only styles in blog.css (.ta-blog).
// List design: uirefrence.html "#/blog" view (loans-hero, blog-tabs, blog-grid, blog-card).

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const initials = (name) => String(name || "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("") || "TA";

function Avatar({ author, size = 32 }) {
  if (author?.avatar) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img className="blog-avatar" src={author.avatar} alt="" width={size} height={size} />;
  }
  return <span className="blog-avatar" style={{ width: size, height: size }}>{initials(author?.name)}</span>;
}

function Meta({ post, withAuthor = true }) {
  const date = formatDate(post.date);
  return (
    <div className="blog-meta">
      {withAuthor && post.author?.name && <span className="blog-meta-author"><Avatar author={post.author} size={26} />{post.author.name}</span>}
      {date && <span>📅 {date}</span>}
      <span>⏱ {post.readTime} min read</span>
    </div>
  );
}

function PostImage({ post, className }) {
  return (
    <div className={`blog-img ${className || ""}`.trim()}>
      {post.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.image} alt={post.title} loading="lazy" />
      ) : (
        <span className="blog-img-ph" aria-hidden="true">📝</span>
      )}
      {post.category?.name && <span className="blog-chip">{post.category.name}</span>}
    </div>
  );
}

export function BlogCard({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-card blog-card-img">
      <PostImage post={post} />
      <div className="blog-card-body">
        <span className="blog-read">⏱ {post.readTime} min read{formatDate(post.date) ? ` · ${formatDate(post.date)}` : ""}</span>
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <div className="blog-card-foot">
          {post.author?.name ? <span className="blog-meta-author"><Avatar author={post.author} size={24} />{post.author.name}</span> : <span />}
          <span className="blog-card-cta">Read article →</span>
        </div>
      </div>
    </Link>
  );
}

function FeaturedPost({ post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="blog-featured">
      <PostImage post={post} className="blog-featured-img" />
      <div className="blog-featured-body">
        <span className="eyebrow">⭐ Latest article</span>
        <h2>{post.title}</h2>
        {post.excerpt && <p>{post.excerpt}</p>}
        <Meta post={post} />
        <span className="btn-primary blog-featured-btn">Read article →</span>
      </div>
    </Link>
  );
}

const pageHref = ({ category, search, page }) => {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (search) params.set("q", search);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/blog?${query}` : "/blog";
};

function Pagination({ pagination, category, search }) {
  const total = Number(pagination?.totalPages) || 1;
  const current = Number(pagination?.currentPage) || 1;
  if (total <= 1) return null;
  const pages = Array.from({ length: total }, (_, i) => i + 1).filter((p) => p === 1 || p === total || Math.abs(p - current) <= 1);

  return (
    <nav className="blog-pages" aria-label="Blog pages">
      {current > 1 && <Link href={pageHref({ category, search, page: current - 1 })}>‹ Prev</Link>}
      {pages.map((p, i) => (
        <span key={p} className="blog-pages-item">
          {i > 0 && p - pages[i - 1] > 1 && <span className="blog-pages-gap">…</span>}
          {p === current ? <span className="on" aria-current="page">{p}</span> : <Link href={pageHref({ category, search, page: p })}>{p}</Link>}
        </span>
      ))}
      {current < total && <Link href={pageHref({ category, search, page: current + 1 })}>Next ›</Link>}
    </nav>
  );
}

function CtaStrip() {
  return (
    <div className="ctastrip blog-cta">
      <h2>Have a question about your business?</h2>
      <p>Talk to a Tax Alphonic expert — free, no obligation.</p>
      <Link href="/talk-to-expert" className="btn-primary">🎧 Talk to an expert</Link>
    </div>
  );
}

export function BlogListPage({ posts, pagination, categories, category, search }) {
  const active = categories.find((c) => c.slug === category);
  const total = Number(pagination?.totalItems) || posts.length;
  const showFeatured = !category && !search && (Number(pagination?.currentPage) || 1) === 1 && posts.length > 2;
  const [featured, ...rest] = showFeatured ? posts : [null, ...posts];

  return (
    <div className="ta-svc ta-blog">
      <div className="view">
        <div className="loans-hero">
          <div className="wrap">
            <span className="eyebrow">● Blogs &amp; Guides — Tax Alphonic</span>
            <h1>{active ? `${active.name} articles` : "Guides on tax, GST, compliance & business"}</h1>
            <p className="lead">Straightforward, up-to-date articles to help you understand registrations, tax filing, compliance and growing your business in India.</p>
            <form action="/blog" method="get" className="blog-search" role="search">
              {category && <input type="hidden" name="category" value={category} />}
              <span aria-hidden="true">🔍</span>
              <input type="search" name="q" defaultValue={search} placeholder="Search articles…" aria-label="Search articles" />
              <button type="submit" className="btn-primary">Search</button>
            </form>
          </div>
        </div>

        <div className="wrap loans-body">
          {categories.length > 0 && (
            <div className="blog-tabs">
              <Link href={search ? pageHref({ search }) : "/blog"} className={`blog-tab ${!category ? "on" : ""}`}>📚 All articles</Link>
              {categories.map((c) => (
                <Link key={c.slug} href={pageHref({ category: c.slug, search })} className={`blog-tab ${c.slug === category ? "on" : ""}`}>
                  {c.name} <span className="blog-tab-count">{c.count}</span>
                </Link>
              ))}
            </div>
          )}

          {search && (
            <p className="blog-result">
              {total} result{total === 1 ? "" : "s"} for <b>“{search}”</b> · <Link href={pageHref({ category })}>Clear search</Link>
            </p>
          )}

          {featured && <FeaturedPost post={featured} />}

          {rest.length > 0 ? (
            <>
              <h2 className="loans-sec-h">{featured ? "More articles" : active ? `${active.name} articles` : "Latest articles"}</h2>
              <div className="blog-grid">{rest.map((post) => <BlogCard key={post.id} post={post} />)}</div>
            </>
          ) : !featured && (
            <div className="blog-empty">
              <span aria-hidden="true">📝</span>
              <h3>{search ? "No articles match your search" : "No articles here yet"}</h3>
              <p>{search ? "Try a different word, or browse all articles." : "New guides are on their way. Check back soon."}</p>
              {(search || category) && <Link href="/blog" className="btn-ghost">See all articles</Link>}
            </div>
          )}

          <Pagination pagination={pagination} category={category} search={search} />
          <CtaStrip />
        </div>
      </div>
    </div>
  );
}

export function BlogPostPage({ post, url }) {
  const faqSection = post.faqs.length
    ? [{ id: "blog-faqs", type: "Faq", config: { kicker: "FAQ" }, payload: { title: "Frequently asked questions", faqs: post.faqs } }]
    : [];

  return (
    <div className="ta-svc ta-blog">
      <BlogViewCounter slug={post.slug} />
      <div className="view">
        <article className="wrap blog-post">
          <header className="blog-post-head">
            {post.category && <Link href={`/blog?category=${post.category.slug}`} className="eyebrow">● {post.category.name}</Link>}
            <h1>{post.title}</h1>
            {post.excerpt && <p className="lead">{post.excerpt}</p>}
            <Meta post={post} />
          </header>

          {post.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="blog-post-cover" src={post.image} alt={post.title} />
          )}

          <div className="blog-post-grid">
            <div className="blog-post-body">
              <TableOfContents variant="inline" />
              <div id="blog-content">
                <ContentBlocks sections={[...post.sections, ...faqSection]} />
              </div>

              {post.tags.length > 0 && (
                <div className="blog-tags">
                  <b>Tags:</b>
                  {post.tags.map((t) => <Link key={t.slug} href={`/blog?q=${encodeURIComponent(t.name)}`}>#{t.name}</Link>)}
                </div>
              )}

              {post.author?.name && (
                <div className="blog-author">
                  <Avatar author={post.author} size={56} />
                  <div>
                    <span className="blog-author-label">Written by</span>
                    <h3>{post.author.name}</h3>
                    {post.author.bio && <p>{post.author.bio}</p>}
                  </div>
                </div>
              )}

              <BlogEngagement slug={post.slug} initialLikes={post.likeCount} />
            </div>

            <aside className="blog-post-side">
              <TableOfContents />
              <div className="blog-side-card">
                <h3>Share this article</h3>
                <ShareButtons url={url} title={post.title} />
              </div>
              <div className="blog-side-card blog-side-cta">
                <h3>Need expert help?</h3>
                <p>Get a free consultation with a Tax Alphonic expert.</p>
                <Link href="/talk-to-expert" className="btn-primary">🎧 Talk to an expert</Link>
              </div>
            </aside>
          </div>
        </article>

        {post.related.length > 0 && (
          <div className="wrap loans-body blog-related">
            <h2 className="loans-sec-h">Keep reading</h2>
            <div className="blog-grid">{post.related.map((p) => <BlogCard key={p.id} post={p} />)}</div>
          </div>
        )}

        <div className="wrap loans-body"><CtaStrip /></div>
      </div>
    </div>
  );
}
