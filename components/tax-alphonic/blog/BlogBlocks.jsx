import { CmsButton, toButton } from "../pages/ApiServicePage";
import { ShareButtons, TableOfContents } from "./BlogClient";

// The blog's own blocks (admin Blog → Page Builder, blogBlocks.js): "On this page", "Share this
// article" and the expert help card. Each can sit in the sidebar or in the article (main / top /
// bottom). Empty texts fall back to the defaults in blogLayout.js only when the field was never set.

const text = (value, fallback) => (value === undefined || value === null ? fallback : String(value));

export function BlogBlock({ section, placement, post, url }) {
  const p = section.payload || {};
  const inSide = placement === "sidebar";

  switch (section.type) {
    case "BlogToc":
      return (
        <TableOfContents
          title={text(p.title, "On this page")}
          icon={text(p.icon, "📑")}
          levels={p.levels === "h2" ? "h2" : "h2h3"}
          variant={inSide ? "side" : "main"}
        />
      );
    case "BlogShare": {
      const title = text(p.title, "Share this article");
      return (
        <div className={`blog-side-card blog-share-card${inSide ? "" : " blog-share-wide"}`}>
          {title && <h3>{title}</h3>}
          <ShareButtons url={url} title={post.title} copyLink={p.copyLink !== "no"} />
        </div>
      );
    }
    case "BlogExpertCta": {
      const heading = text(p.heading, "Need expert help?");
      const body = text(p.text, "");
      const button = toButton(p.button);
      if (!heading && !body && !button) return null;
      return (
        <div className={`blog-side-card blog-side-cta${inSide ? "" : " blog-cta-wide"}`}>
          <div className="blog-side-cta-text">
            {heading && <h3>{heading}</h3>}
            {body && <p>{body}</p>}
          </div>
          {button && <CmsButton button={button} className="btn-primary" />}
        </div>
      );
    }
    default:
      return null;
  }
}
