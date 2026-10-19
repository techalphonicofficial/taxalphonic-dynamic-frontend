import { cache } from "react";
import { parse } from "node-html-parser";
import { apiClient } from "@/service/apiClient";
import { getServiceCategory, mapService } from "@/service/servicePageService";
import { getServiceLocations } from "@/service/serviceLocationsService";

// pSEO pages (CMS: SEO Pages / "pSEO Matrix"): a service × location (or industry, technology,
// problem) landing page, served at its own slug, e.g. /india/seo-services-noida.
// The backend only returns PUBLISHED pages with content.
//
// Their content (longDescription) is AI-written HTML: <section data-section="hero|painPoints|
// solution|features|methodology|roi|faq|cta">. It is turned into the service page's own blocks
// (by what each section contains, not by its classes), so the page renders through
// ApiServicePage exactly like a service page, with the base service's form, packages and
// sidebar blocks around it.

// AI icons are Bootstrap Icons classes, which this site doesn't load.
const ICONS = [
  [/cpu|chip|processor/, "🧠"],
  [/layer|stack|grid|columns|boxes|puzzle/, "🧩"],
  [/graph|chart|trending|bar-|pie/, "📈"],
  [/shield|security/, "🛡️"],
  [/lock|key/, "🔒"],
  [/gear|cog|tools|wrench/, "⚙️"],
  [/lightning|bolt|speed/, "⚡"],
  [/search|zoom/, "🔍"],
  [/code|terminal|braces/, "💻"],
  [/cloud/, "☁️"],
  [/palette|brush|pen|vector|easel/, "🎨"],
  [/people|person|team|users/, "👥"],
  [/rocket/, "🚀"],
  [/clock|stopwatch|hourglass|calendar/, "⏱️"],
  [/check|patch/, "✅"],
  [/star|award|trophy/, "🏆"],
  [/globe|geo|map|pin/, "🌐"],
  [/phone|mobile|tablet|laptop|display|window|browser/, "📱"],
  [/database|server|hdd/, "🗄️"],
  [/diagram|flow|bezier|signpost|compass/, "🧭"],
  [/lightbulb|idea/, "💡"],
  [/bullseye|target|crosshair/, "🎯"],
  [/cash|currency|coin|wallet|piggy/, "💰"],
  [/megaphone|broadcast|speaker/, "📣"],
  [/file|journal|book|document/, "📄"],
  [/chat|envelope|mail/, "💬"],
];

const clean = (value) => String(value || "").replace(/\s+/g, " ").trim();
const textOf = (node) => clean(node?.text);
const tagOf = (node) => String(node?.rawTagName || "").toLowerCase();
const elementsOf = (node) => (node?.childNodes || []).filter((child) => child.nodeType === 1);

function iconFrom(node) {
  const classes = String(node?.getAttribute?.("class") || "");
  if (!classes) return "";
  return ICONS.find(([pattern]) => pattern.test(classes))?.[1] || "✦";
}

function isInside(node, set, stop) {
  for (let current = node; current && current !== stop; current = current.parentNode) {
    if (set.has(current)) return true;
  }
  return false;
}

function hasAncestor(node, tags, stop) {
  for (let current = node.parentNode; current && current !== stop; current = current.parentNode) {
    if (tags.includes(tagOf(current))) return true;
  }
  return false;
}

/** "Phase 1: Brand Audit" → ["Phase 1", "Brand Audit"]. */
function splitStepTitle(title) {
  const match = title.match(/^((?:phase|step|stage|week|month|day)\s*\d+)\s*[:.\-–—]\s*(.+)$/i);
  return match ? [match[1], match[2]] : ["", title];
}

/**
 * Cards of a section: each heading (h3, else h4) with the largest wrapper that holds no other one,
 * plus its icon, its short label (e.g. "PHASE 1: DISCOVERY" or "+340%") and its text.
 */
function findCards(section, skip) {
  const byTag = (tag) => section
    .querySelectorAll(tag)
    .filter((h3) => h3 !== skip && !hasAncestor(h3, ["details", "li", "ul", "ol"], section))
    .map((h3) => {
      let card = h3;
      while (card.parentNode && card.parentNode !== section && card.parentNode.querySelectorAll(tag).length === 1) {
        card = card.parentNode;
      }

      const paragraphs = card
        .querySelectorAll("p")
        .map(textOf)
        .filter(Boolean);
      const description = paragraphs.join(" ");
      // A label is a text-only element of the card that is not the title or the description.
      const label = card
        .querySelectorAll("div, span, small, strong, b")
        .filter((node) => !elementsOf(node).length && !node.querySelector("h3") && !hasAncestor(node, ["p", "h3"], card))
        .map(textOf)
        .find((text) => text && text.length <= 40);

      return {
        node: card,
        paragraphs,
        title: textOf(h3),
        description: description || (card === h3 ? "" : clean(textOf(card).replace(textOf(h3), "").replace(label || "", ""))),
        icon: iconFrom(card.querySelector("i")),
        label: label || "",
        hasList: Boolean(card.querySelector("ul, ol")),
      };
    })
    .filter((card) => card.title);

  const cards = byTag("h3");
  if (cards.length >= 2) return cards;
  const minor = byTag("h4");
  return minor.length >= 2 ? minor : cards;
}

/** Text-only pairs with no heading, e.g. <div><span>99.8%</span><span>Indexation Rate</span></div>. */
function findPairs(section) {
  return section
    .querySelectorAll("div, li")
    .filter((node) => {
      const children = elementsOf(node);
      return children.length === 2 && children.every((child) => !elementsOf(child).length && textOf(child));
    })
    .map((node) => {
      const [first, second] = elementsOf(node).map(textOf);
      return { first, second };
    });
}

/** Value/label pairs: a short figure, then its label. */
function findMetrics(section) {
  return findPairs(section)
    .filter((pair) => pair.first.length <= 24)
    .map((pair) => ({ value: pair.first, label: pair.second }));
}

const isFigure = (text) => text.length <= 16 && /\d/.test(text);
const PROCESS_ID = /method|process|roadmap|timeline|phase|step/;
const STEP_LABEL = /^(phase|step|stage|week|month|day)\s*\d/i;

function findFaqs(section) {
  return section.querySelectorAll("details").map((details) => {
    const summary = details.querySelector("summary");
    const answer = elementsOf(details)
      .filter((child) => child !== summary)
      .map(textOf)
      .filter(Boolean)
      .join(" ");
    return { question: textOf(summary), answer };
  }).filter((faq) => faq.question);
}

/** Section HTML without its heading, classes, styles, icons or tick glyphs, for a rich-text block. */
function cleanHtml(section, heading) {
  const copy = parse(section.toString()).firstChild;
  if (!copy) return "";
  copy.querySelectorAll("h1, h2").forEach((node) => {
    if (textOf(node) === textOf(heading)) node.remove();
  });
  copy.querySelectorAll("i, script, style, button").forEach((node) => node.remove());
  copy.querySelectorAll("span").forEach((node) => {
    if (/^[✓✔✅•·\-–—]$/.test(textOf(node))) node.remove();
  });
  copy.querySelectorAll("*").forEach((node) => {
    ["class", "style", "id", "data-section"].forEach((attribute) => node.removeAttribute(attribute));
  });
  return copy.innerHTML.trim();
}

function sectionBlock(section, index, context) {
  const id = clean(section.getAttribute("data-section") || section.getAttribute("id")).toLowerCase();
  // A CTA banner may use an h3 as its heading.
  const heading = section.querySelector("h1, h2") || (id === "cta" || section.querySelector("aside") ? section.querySelector("h3, h4") : null);
  const title = textOf(heading);
  const faqs = findFaqs(section);
  const cards = findCards(section, heading).filter((card) => !card.hasList);
  const cardNodes = new Set(cards.map((card) => card.node));
  const intro = section
    .querySelectorAll("p")
    .filter((p) => !isInside(p, cardNodes, section) && !hasAncestor(p, ["details", "li", "aside"], section))
    .map(textOf)
    .filter(Boolean);
  const config = { anchorId: id && /^[a-z][\w-]*$/i.test(id) ? `seo-${id}` : undefined };
  const block = (type, payload, placement) => ({
    id: `seo-${index}`,
    type,
    config: { ...config, ...(placement ? { placement } : {}) },
    payload,
  });

  if (id === "hero" || (index === 0 && section.querySelector("h1"))) {
    context.hero = {
      heading: textOf(section.querySelector("h1")) || title,
      paragraphs: intro,
      stats: findMetrics(section),
    };
    return null;
  }

  if (faqs.length) return block("Faq", { title, faqs }, "bottom");

  const links = section.querySelectorAll("a").map((a) => ({ text: textOf(a), url: clean(a.getAttribute("href")) })).filter((link) => link.text);
  if (id === "cta" || (section.querySelector("aside") && links.length && cards.length < 2)) {
    const aside = section.querySelector("aside") || section;
    const text = aside.querySelectorAll("p").map(textOf).filter(Boolean).join(" ");
    return block("CallToAction", { variant: "dark", title, text, buttons: links, fromSeo: true }, "bottom");
  }

  if (cards.length >= 2) {
    // Figure cards whose heading is the number itself ("<h3>65%</h3><p>Cost Reduction</p>").
    if (cards.every((card) => isFigure(card.title) && card.paragraphs.length)) {
      return block("Stats", {
        title,
        intro,
        items: cards.map((card) => ({ value: card.title, label: card.paragraphs[0], text: card.paragraphs.slice(1).join(" ") })),
      });
    }

    const isProcess = PROCESS_ID.test(id)
      || cards.every((card) => /phase|step|stage|week|day|month/i.test(card.label) || STEP_LABEL.test(card.title));
    const isMetric = /roi|impact|result|metric|benefit/.test(id) && cards.every((card) => /\d|zero|none/i.test(card.label) && card.label.length <= 16);

    if (isProcess) {
      return block("OurProcess", {
        title,
        intro,
        steps: cards.map((card) => {
          const [step, stepTitle] = splitStepTitle(card.title);
          return { title: stepTitle, description: card.description, duration: card.label || step };
        }),
      });
    }
    if (isMetric) {
      return block("Stats", { title, intro, items: cards.map((card) => ({ value: card.label, label: card.title, text: card.description })) });
    }
    if (cards.some((card) => card.icon) || /feature|capabilit|deliverable|service/.test(id)) {
      return block("WhyUs", { title, intro, reasons: cards.map((card) => ({ icon: card.icon || "✦", title: card.title, description: card.description })) });
    }
    return block("ServicesIncluded", { title, intro, services: cards.map((card) => ({ title: card.title, description: card.description })) });
  }

  // Steps without headings: <div>Phase 1: Audit</div><div>What happens…</div>.
  const pairs = findPairs(section);
  if (pairs.length >= 2 && (PROCESS_ID.test(id) || pairs.every((pair) => STEP_LABEL.test(pair.first)))) {
    return block("OurProcess", {
      title,
      intro,
      steps: pairs.map((pair) => {
        const [step, stepTitle] = splitStepTitle(pair.first);
        return { title: stepTitle, description: pair.second, duration: step };
      }),
    });
  }

  const metrics = findMetrics(section);
  if (metrics.length >= 2 && !section.querySelector("ul, ol")) {
    return block("Stats", { title, intro, items: metrics });
  }

  const content = cleanHtml(section, heading);
  return content ? block("Overview", { title, content }) : null;
}

/** AI HTML → { hero, blocks[] } in the service page's block format. */
export function parseSeoContent(html) {
  const source = String(html || "").trim();
  const context = { hero: null };
  if (!source) return { hero: null, blocks: [] };

  let root;
  try {
    root = parse(source, { comment: false });
  } catch {
    return { hero: null, blocks: [{ id: "seo-0", type: "Overview", config: {}, payload: { content: source } }] };
  }

  const sections = root.querySelectorAll("section").filter((section) => !hasAncestor(section, ["section"], root));
  // Content without <section> wrappers is shown as one article.
  if (!sections.length) return { hero: null, blocks: [{ id: "seo-0", type: "Overview", config: {}, payload: { content: source } }] };

  const blocks = sections.map((section, index) => sectionBlock(section, index, context)).filter(Boolean);
  return { hero: context.hero, blocks };
}

function wordCount(html) {
  return String(html || "").replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
}

function toTitleCase(value) {
  const text = clean(value);
  // Titles built from an upper-case service name ("GRAPHIC DESIGN SERVICES in Noida").
  const letters = text.replace(/[^a-z]/gi, "");
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return letters && upper / letters.length > 0.6
    ? text.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\b(In|For|And|Of|The|To)\b/g, (word) => word.toLowerCase())
    : text;
}

function placeName(raw) {
  return clean(raw.location?.name || raw.industry?.name || raw.technology?.name || raw.problem?.name);
}

/** JSON-LD: the service with its area served, and the FAQs. */
function buildSchema({ title, description, serviceTitle, location, faqs }) {
  const graph = [{
    "@type": "Service",
    name: title,
    description,
    serviceType: serviceTitle || undefined,
    ...(location ? {
      areaServed: {
        "@type": "City",
        name: location.name,
        ...(location.state || location.country ? {
          containedInPlace: { "@type": location.state ? "State" : "Country", name: location.state || location.country },
        } : {}),
      },
    } : {}),
  }];

  if (faqs.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

// Base service blocks the SEO page keeps; its own content (overview, why us, process, ...) is
// replaced by the page's AI content.
const KEPT_SERVICE_BLOCKS = ["Form", "Packages", "Highlights", "Checklist", "CallToAction", "LocationsServed", "Faq", "FAQ"];

/** Maps the lookup response to the record ApiServicePage renders. */
export function mapSeoPage(raw, { category = null, locations = [] } = {}) {
  if (!raw || raw.deletedAt) return null;

  const service = mapService(raw.service);
  const { hero: aiHero, blocks } = parseSeoContent(raw.longDescription);
  const place = placeName(raw);
  const location = raw.location ? {
    name: clean(raw.location.name),
    state: clean(raw.location.stateMaster?.name),
    country: clean(raw.location.countryMaster?.name),
  } : null;

  const title = toTitleCase(aiHero?.heading || raw.title);
  const serviceSections = service?.sections || [];
  const serviceHero = serviceSections.find((section) => section.type === "HeroBanner");
  const aiFaq = blocks.some((block) => block.type === "Faq");
  const aiCta = blocks.some((block) => block.type === "CallToAction");
  const form = serviceSections.find((section) => section.type === "Form");
  const formAnchor = form ? `#${form.config?.anchorId || "enquiry"}` : "";

  // AI buttons point at anchors that don't exist on the page: send them to the enquiry form.
  const aiBlocks = blocks.map((block) => {
    if (block.type !== "CallToAction") return block;
    const buttons = block.payload.buttons
      .map((button) => (button.url.startsWith("#") || !button.url ? (formAnchor ? { ...button, url: formAnchor } : null) : button))
      .filter(Boolean);
    return { ...block, payload: { ...block.payload, buttons } };
  });

  const kept = serviceSections.filter((section) => {
    if (!KEPT_SERVICE_BLOCKS.includes(section.type)) return false;
    if ((section.type === "Faq" || section.type === "FAQ") && aiFaq) return false;
    // Keep sidebar CTAs; a full-width one would repeat the page's own CTA.
    if (section.type === "CallToAction" && aiCta && section.config?.placement !== "sidebar") return false;
    return true;
  });

  const heroPayload = {
    ...(serviceHero?.payload || {}),
    heading: title,
    highlight: place && title.endsWith(place) ? place : (serviceHero?.payload?.highlight && title.endsWith(serviceHero.payload.highlight) ? serviceHero.payload.highlight : ""),
    eyebrow: location
      ? `📍 ${[location.name, location.state].filter(Boolean).join(", ")}`
      : (service?.title || serviceHero?.payload?.eyebrow || ""),
    subHeading: aiHero?.paragraphs?.[0] || raw.metaDescription || serviceHero?.payload?.subHeading || "",
    stats: aiHero?.stats?.length ? aiHero.stats : serviceHero?.payload?.stats || [],
  };

  // Hero paragraphs after the first become the opening overview.
  const extraIntro = (aiHero?.paragraphs || []).slice(1);
  const overview = extraIntro.length
    ? [{ id: "seo-intro", type: "Overview", config: { anchorId: "overview" }, payload: { content: extraIntro.map((text) => `<p>${escapeHtml(text)}</p>`).join("") } }]
    : [];

  const faqs = aiBlocks.filter((block) => block.type === "Faq").flatMap((block) => block.payload.faqs);
  const description = raw.metaDescription || heroPayload.subHeading;
  const minutes = Math.max(1, Math.ceil(wordCount(raw.longDescription) / 200));

  return {
    ...(service || {}),
    id: raw.id,
    kind: "seo",
    path: raw.slug,
    title,
    summary: description,
    readingTime: minutes,
    updatedAt: raw.updatedAt || null,
    publishedAt: raw.publishedAt || null,
    metaTitle: raw.metaTitle || title,
    metaDescription: description,
    canonicalUrl: raw.canonicalUrl || "",
    // Admin "Allow search engines to index" switch (SEO page `indexable`).
    robots: raw.indexable ? "index, follow" : "noindex, follow",
    keywords: service?.keywords || "",
    ogTitle: "",
    ogDescription: "",
    schemaMarkup: buildSchema({ title, description, serviceTitle: service?.title, location, faqs }),
    category,
    breadcrumbs: [
      ...(category?.name ? [{ label: category.name }] : []),
      ...(service ? [{ label: service.title, href: `/${service.slug}` }] : []),
      { label: place || title },
    ],
    locationsFor: service?.title || "",
    locations,
    sections: [
      { id: "seo-hero", type: "HeroBanner", config: {}, payload: heroPayload },
      ...overview,
      ...aiBlocks,
      ...kept,
    ],
  };
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Loads a published pSEO page by its full path ("india/seo-services-noida"). */
export const getSeoPageByPath = cache(async function getSeoPageByPath(path) {
  const slug = String(path || "").replace(/^\/+|\/+$/g, "").toLowerCase();
  if (!slug) return null;

  try {
    const payload = await apiClient(`/api/v1/seo-pages/lookup?path=${encodeURIComponent(slug)}`, { cache: "no-store" });
    const raw = payload?.success ? payload.data : null;
    if (!raw) return null;

    const [category, locations] = await Promise.all([
      getServiceCategory(raw.service?.categoryId),
      raw.service ? getServiceLocations(raw.service.slug || raw.service.id) : [],
    ]);
    return mapSeoPage(raw, { category, locations });
  } catch (error) {
    if (error.status !== 404) console.error(`Unable to load SEO page: ${slug}`, error);
    return null;
  }
});
