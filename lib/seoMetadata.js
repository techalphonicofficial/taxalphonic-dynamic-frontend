// Next.js metadata from a record's SEO fields (service, CMS page, pSEO page, homepage, about page),
// after its SEO Config was applied (service/seoConfigService.js).

function getRobots(robotsValue) {
  if (!robotsValue) return undefined;

  const directives = robotsValue.toLowerCase().split(",").map((value) => value.trim());
  return {
    index: !directives.includes("noindex"),
    follow: !directives.includes("nofollow"),
  };
}

function getKeywords(keywords) {
  if (Array.isArray(keywords)) return keywords;
  return String(keywords || "").split(",").map((keyword) => keyword.trim()).filter(Boolean);
}

function decodeEntities(value) {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * "Other meta tags" from the admin: only <meta name|property="…" content="…"> tags are used
 * (rendered by Next as <meta name content>); scripts, links and anything else are ignored.
 */
export function parseMetaTags(html) {
  const tags = {};
  const source = String(html || "");

  for (const [tag] of source.matchAll(/<meta\b[^>]*>/gi)) {
    const attribute = (name) => tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
    const key = attribute("name") || attribute("property");
    const content = attribute("content");
    const keyValue = key && (key[1] ?? key[2] ?? key[3]);
    const contentValue = content && (content[1] ?? content[2] ?? content[3]);
    if (keyValue && contentValue !== undefined && contentValue !== null) {
      tags[decodeEntities(keyValue).trim()] = decodeEntities(contentValue);
    }
  }

  return tags;
}

export function createMetadata(record) {
  const title = record.metaTitle || record.title;
  const description = record.metaDescription || record.summary || "";
  const ogTitle = record.ogTitle || title;
  const ogDescription = record.ogDescription || description;
  const image = record.ogImage || record.bannerImage || record.thumbImage;
  const metadata = {
    title,
    description,
    keywords: getKeywords(record.keywords),
    robots: getRobots(record.robots),
    openGraph: {
      type: "website",
      title: ogTitle,
      description: ogDescription,
    },
    twitter: {
      card: record.twitterCard || (image ? "summary_large_image" : "summary"),
      title: ogTitle,
      description: ogDescription,
    },
  };

  if (record.canonicalUrl) {
    metadata.alternates = { canonical: record.canonicalUrl };
    metadata.openGraph.url = record.canonicalUrl;
  }

  if (image) {
    metadata.openGraph.images = [{ url: image }];
    metadata.twitter.images = [image];
  }

  const other = parseMetaTags(record.otherMetaTags);
  if (Object.keys(other).length) metadata.other = other;

  return metadata;
}
