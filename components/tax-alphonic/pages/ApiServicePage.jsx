import { Fragment } from "react";
import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitizeHtml";
import CmsForm from "../forms/CmsForm";
import PackagesBlock from "../packages/PackagesBlock";
import { HomeBlock } from "../home/HomeSections";
import CommonBlock from "../blocks/CommonBlocks";
import BlockBackground, { backgroundOf } from "../blocks/BlockBackground";
import { isCommonSection, isHomeSection } from "../blocks/commonBlockTypes";
import "../service-page.css";

// Markup and class names mirror the #/service/... view in uirefrence.html;
// service-page.css carries the matching styles scoped under .ta-svc.
//
// Every visible word comes from the CMS: each Page Builder section is a block, and its
// config sets where it goes (placement), its kicker label and its anchor id.
// Blocks with no content render nothing, and empty columns collapse.

// Where a block goes when its config has no placement.
// Keep in sync with DEFAULT_PLACEMENT in cms-admin layoutZones.js (homepage blocks default to "bottom").
const DEFAULT_PLACEMENT = {
  Faq: "bottom",
  FAQ: "bottom",
  Form: "sidebar",
  Checklist: "sidebar",
  Highlights: "top",
  CallToAction: "bottom",
  LocationsServed: "bottom",
};
const PLACEMENTS = ["top", "main", "sidebar", "bottom"];

// Older CMS items carry icon-font classes (Bootstrap / Font Awesome) that this site doesn't load.
const ICON_CLASSES = [
  [/check/, "✅"],
  [/star/, "⭐"],
  [/gear|cog/, "⚙️"],
  [/shield/, "🛡️"],
  [/bolt|lightning/, "⚡"],
  [/lock/, "🔒"],
];

/** Highlights `highlight` when the heading ends with it, else the last two words. */
export function splitHeading(heading, highlight) {
  const text = String(heading || "").trim();
  const marked = String(highlight || "").trim();

  if (marked && text.endsWith(marked)) return [text.slice(0, -marked.length).trim(), marked];

  const words = text.split(/\s+/);
  if (words.length < 3) return [text, ""];
  return [words.slice(0, -2).join(" "), words.slice(-2).join(" ")];
}

function formatReadingTime(value) {
  if (!value) return "";
  return /^\d+$/.test(String(value).trim()) ? `${value} min read` : String(value);
}

function formatPrice(value) {
  if (value === undefined || value === null || value === "") return "";
  const amount = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(amount) && amount > 0 ? `₹${amount.toLocaleString("en-IN")}` : String(value);
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function toCardItems(items) {
  return list(items).map((item) => {
    if (typeof item === "string") return { title: item, description: "", icon: "" };
    return {
      title: item?.title || item?.heading || item?.name || item?.question || "",
      description: item?.description || item?.subHeading || item?.answer || item?.content || item?.text || "",
      icon: item?.icon || "",
    };
  }).filter((item) => item.title || item.description);
}

/** Normalises a CMS button ({ text, url }) and drops it when it has no text. */
function toButton(value) {
  const text = String(value?.text || "").trim();
  return text ? { text, url: String(value?.url || "").trim() || "#" } : null;
}

function parseSchema(value) {
  if (!value) return null;
  if (typeof value === "object") return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function JsonLd({ value }) {
  const schema = parseSchema(value);
  if (!schema) return null;

  // Escape "<" so CMS-provided schema can never close the script tag early.
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

export function RichContent({ html }) {
  if (!html) return null;
  // Tables get their own scrolling box so a wide table never widens the page.
  const clean = sanitizeHtml(html)
    .replace(/<table\b/gi, '<div class="svc-table-wrap"><table')
    .replace(/<\/table>/gi, "</table></div>");
  return <div className="svc-rich" dangerouslySetInnerHTML={{ __html: clean }} />;
}

/** CMS icon: an image URL, an emoji/text, or a legacy icon-font class (mapped or dropped). */
function Icon({ value, className }) {
  const icon = String(value || "").trim();
  if (!icon) return null;

  if (/^(https?:|\/|data:)/i.test(icon)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <span className={className}><img src={icon} alt="" className="svc-icon-img" /></span>;
  }

  if (/^(bi|fa[srb]?|fa-solid|fa-regular)[\s-]/.test(icon)) {
    const emoji = ICON_CLASSES.find(([pattern]) => pattern.test(icon))?.[1];
    return emoji ? <span className={className}>{emoji}</span> : null;
  }

  return <span className={className}>{icon}</span>;
}

/** A link styled as a reference button; external links open in a new tab. */
function CmsButton({ button, className }) {
  if (!button) return null;
  const external = /^https?:\/\//i.test(button.url);
  const internal = button.url.startsWith("/") && !button.url.startsWith("//");

  if (internal) return <Link href={button.url} className={className}>{button.text}</Link>;
  return (
    <a href={button.url} className={className} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {button.text}
    </a>
  );
}

function Buttons({ buttons, className = "hh-cta", fullWidth = false }) {
  const items = list(buttons).map(toButton).filter(Boolean);
  if (!items.length) return null;

  return (
    <div className={className}>
      {items.map((button, index) => (
        <CmsButton
          key={`${button.text}-${index}`}
          button={button}
          className={`${index === 0 ? "btn-primary" : "btn-ghost"}${fullWidth ? " svc-btn-block" : ""}`}
        />
      ))}
    </div>
  );
}

/** Standard content block: optional kicker (config), heading and intro paragraphs, then children. */
function Block({ config, defaultId, title, intro, className = "", children }) {
  const paragraphs = list(intro).filter(Boolean);

  return (
    <div className={`blk ${className}`.trim()} id={config.anchorId || defaultId}>
      {config.kicker && <div className="kicker">{config.kicker}</div>}
      {title && <h2>{title}</h2>}
      {paragraphs.map((text, index) => <p key={index}>{text}</p>)}
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------------

function Hero({ service, hero, config }) {
  const heading = hero.heading || service.title;
  const [lead, highlight] = splitHeading(heading, hero.highlight);
  const eyebrow = hero.eyebrow || service.category?.name;
  const description = hero.subHeading || service.summary;
  // Right-side image (admin: Hero → "Right-side image"): "none" hides it, "custom" uses only the
  // hero's own image. "auto" falls back to the service banner/thumbnail, except when the hero has
  // its own background (Background panel): then the thumbnail would sit on top of it.
  const mode = hero.imageMode || "auto";
  const ownImage = hero.image || hero.backgroundImage;
  const fallback = mode === "auto" && !backgroundOf(config) ? service.bannerImage || service.thumbImage : "";
  const image = mode === "none" ? "" : ownImage || fallback;
  const price = formatPrice(hero.price);
  const showMeta = hero.showMeta !== false;
  const readingTime = showMeta ? formatReadingTime(service.readingTime) : "";
  const badges = list(hero.badges)
    .map((badge) => (typeof badge === "string" ? { text: badge } : badge))
    .filter((badge) => badge?.text);
  const stats = list(hero.stats).filter((stat) => stat?.value);
  const chips = list(hero.chips).filter((chip) => chip?.icon);

  // Older heroes stored ctaText/ctaUrl instead of primaryButton.
  const primary = toButton(hero.primaryButton || { text: hero.ctaText, url: hero.ctaUrl });
  const secondary = toButton(hero.secondaryButton);
  if (primary && price) primary.text = `${primary.text} — ${price}`;

  // Hero → "Text on the hero": "hide" shows only the background (an image with its own text),
  // "buttons" only the buttons on it. The heading stays in the page for search engines / screen readers.
  const textMode = hero.textMode === "hide" || hero.textMode === "buttons" ? hero.textMode : "show";
  if (textMode !== "show") {
    const height = ["sm", "md", "lg", "xl", "r31", "r169"].includes(hero.height) ? hero.height : "md";
    const align = ["left", "center", "right"].includes(hero.buttonsAlign) ? hero.buttonsAlign : "center";
    return (
      <div className={`svc-hero svc-hero-bare svc-hero-h-${height} svc-hero-btns-${align}`}>
        <h1 className="svc-sr-only">{heading}</h1>
        {textMode === "buttons" && (primary || secondary) && (
          <div className="hh-cta">
            <CmsButton button={primary} className="btn-primary" />
            <CmsButton button={secondary} className="btn-ghost" />
          </div>
        )}
      </div>
    );
  }

  // Hero → "Text alignment" (centre suits a hero without an image or on a background image),
  // "Image side" (left puts the image before the text) and "Hero height" (auto = by content).
  const align = hero.align === "center" ? "center" : "left";
  const imageLeft = image && hero.imageSide === "left";
  const tall = ["sm", "md", "lg", "xl"].includes(hero.height) ? ` svc-hero-tall svc-hero-h-${hero.height}` : "";
  return (
    <div className={`svc-hero svc-hero-align-${align}${imageLeft ? " svc-hero-img-left" : ""}${tall}`}>
      <div className={`svc-hero-grid${image ? "" : " svc-hero-solo"}`}>
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>
            {lead}{lead && highlight ? " " : ""}
            {highlight && <em>{highlight}</em>}
          </h1>
          {(readingTime || badges.length > 0) && (
            <div className="nl9-meta">
              {readingTime && <span>⏱ {readingTime}</span>}
              {badges.map((badge, index) => (
                <span key={`${badge.text}-${index}`}><Icon value={badge.icon} className="svc-inline-ic" /> {badge.text}</span>
              ))}
            </div>
          )}
          {description && <p className="lede">{description}</p>}
          {(primary || secondary) && (
            <div className="hh-cta">
              <CmsButton button={primary} className="btn-primary" />
              <CmsButton button={secondary} className="btn-ghost" />
            </div>
          )}
          {stats.length > 0 && (
            <div className="trust-row">
              {stats.map((stat, index) => <div key={`${stat.value}-${index}`}><b>{stat.value}</b>{stat.label}</div>)}
            </div>
          )}
        </div>
        {image && (
          <div className="mt-hero-visual">
            <div className="svc-hero-media">
              <div className="svc-hero-img">
                {/* CMS images come from arbitrary hosts, so next/image remotePatterns can't cover them. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={heading} />
              </div>
              {chips.slice(0, 4).map((chip, index) => (
                <i key={index} aria-hidden className="svc-hero-chip"><Icon value={chip.icon} /></i>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

function OverviewBlock({ payload, config, first }) {
  return (
    <Block config={config} defaultId={first ? "overview" : undefined} title={payload.title || payload.heading}>
      <RichContent html={payload.content} />
    </Block>
  );
}

function WhyUsBlock({ payload, config }) {
  const items = toCardItems(payload.reasons);

  return (
    <Block config={config} defaultId="whychoose" title={payload.title} intro={payload.intro}>
      <div className="wc-grid">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="wc-item">
            <Icon value={item.icon} className="wc-ic" />
            <div>
              {item.title && <b>{item.title}</b>}
              {item.description && <p>{item.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </Block>
  );
}

function CardGrid({ items }) {
  return (
    <div className="bgrid">
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className="bcard">
          <Icon value={item.icon} className="ic" />
          {item.title && <h4>{item.title}</h4>}
          {item.description && <p>{item.description}</p>}
        </div>
      ))}
    </div>
  );
}

function ProcessBlock({ payload, config }) {
  const steps = list(payload.steps).filter((step) => step?.title || step?.description);
  const button = toButton(payload.button);

  return (
    <Block config={config} defaultId="process" title={payload.title} intro={payload.intro}>
      <div className="proc2">
        {steps.map((step, index) => {
          const duration = step.duration || step.day;

          return (
            <div key={`${step.title}-${index}`} className="proc2-step">
              <div className="proc2-num-col">
                <div className="proc2-num">{index + 1}</div>
                {index < steps.length - 1 && <div className="proc2-line" />}
              </div>
              <div className="proc2-body">
                {(step.title || duration) && (
                  <div className="proc2-top">
                    {step.title && <b>{step.title}</b>}
                    {duration && <span className="proc2-day">{duration}</span>}
                  </div>
                )}
                {step.description && <p>{step.description}</p>}
              </div>
            </div>
          );
        })}
      </div>
      {button && (
        <div className="proc2-cta">
          <CmsButton button={button} className="btn-primary" />
        </div>
      )}
    </Block>
  );
}

function FaqBlock({ payload, config }) {
  const faqs = list(payload.faqs).filter((faq) => faq?.question);

  return (
    <Block config={config} defaultId="faqs" title={payload.title} intro={payload.intro}>
      {faqs.map((faq, index) => (
        <details key={`${faq.question}-${index}`} className="faq" open={index === 0}>
          <summary>{faq.question}</summary>
          <p>{faq.answer}</p>
        </details>
      ))}
    </Block>
  );
}

function FormSection({ payload, config, placement }) {
  const form = payload.form;
  const anchorId = config.anchorId || "enquiry";

  if (placement === "sidebar") {
    return (
      <div className="lead-card" id={anchorId}>
        {config.kicker && <div className="kicker">{config.kicker}</div>}
        {payload.heading && <h3>{payload.heading}</h3>}
        {payload.subHeading && <p className="csub">{payload.subHeading}</p>}
        <CmsForm form={form} compact />
        {payload.note && <p className="lead-note">{payload.note}</p>}
      </div>
    );
  }

  return (
    <Block config={{ ...config, anchorId }} title={payload.heading}>
      {payload.subHeading && <p>{payload.subHeading}</p>}
      <CmsForm form={form} />
      {payload.note && <p className="lead-note">{payload.note}</p>}
    </Block>
  );
}

function HighlightsBlock({ payload, config, placement }) {
  const items = list(payload.items).filter((item) => item?.title || item?.text);

  if (placement === "sidebar") {
    return (
      <div className="side-trust" id={config.anchorId || undefined}>
        {payload.title && <b>{payload.title}</b>}
        <div className="side-trust-grid">
          {items.map((item, index) => (
            <div key={`${item.title}-${index}`} className="side-trust-item">
              <Icon value={item.icon} />{item.title || item.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const tinted = payload.variant === "tinted";
  const strip = (
    <div className={tinted ? "guarantee" : "cred-strip"}>
      {items.map((item, index) => (
        <div key={`${item.title}-${index}`} className={tinted ? "g-item" : "cred-item"}>
          <Icon value={item.icon} className={tinted ? undefined : "cred-ic"} />
          <div>
            {item.title && <b>{item.title}</b>}
            {item.text && <span>{item.text}</span>}
          </div>
        </div>
      ))}
    </div>
  );

  if (!payload.title && !config.kicker) return <div id={config.anchorId || undefined}>{strip}</div>;
  return <Block config={config} title={payload.title} className="svc-plain">{strip}</Block>;
}

function ChecklistBlock({ payload, config, placement }) {
  const items = list(payload.items).filter((item) => item?.text);

  if (placement === "sidebar") {
    return (
      <div className="side-why" id={config.anchorId || undefined}>
        {payload.title && <b>{payload.title}</b>}
        <ul>
          {items.map((item, index) => (
            <li key={`${item.text}-${index}`}>
              <Icon value={item.icon} />
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <Block config={config} title={payload.title}>
      <div className="benefit-list">
        {items.map((item, index) => (
          <div key={`${item.text}-${index}`} className="benefit-item">
            {item.icon ? <Icon value={item.icon} className="chk" /> : <span className="chk">✓</span>}
            <span>{item.text}</span>
          </div>
        ))}
      </div>
    </Block>
  );
}

function CallToActionBlock({ payload, config, placement }) {
  const variant = payload.variant || "dark";
  const id = config.anchorId || undefined;
  const sidebar = placement === "sidebar";

  if (variant === "success") {
    return (
      <div className="side-guarantee" id={id}>
        <Icon value={payload.icon} className="side-g-ic" />
        {payload.title && <b>{payload.title}</b>}
        {payload.text && <p>{payload.text}</p>}
        <Buttons buttons={payload.buttons} className="svc-cta-buttons" fullWidth={sidebar} />
        {payload.note && <p className="lead-note">{payload.note}</p>}
      </div>
    );
  }

  if (variant === "light") {
    return (
      <div className={sidebar ? "lead-card" : "blk svc-cta-light"} id={id}>
        {config.kicker && <div className="kicker">{config.kicker}</div>}
        <Icon value={payload.icon} className="svc-cta-icon" />
        {payload.title && (sidebar ? <h3>{payload.title}</h3> : <h2>{payload.title}</h2>)}
        {payload.text && <p className={sidebar ? "csub" : undefined}>{payload.text}</p>}
        <Buttons buttons={payload.buttons} className={sidebar ? "svc-cta-buttons" : "hh-cta"} fullWidth={sidebar} />
        {payload.note && <p className="lead-note">{payload.note}</p>}
      </div>
    );
  }

  if (sidebar) {
    return (
      <div className="side-final-cta" id={id}>
        <Icon value={payload.icon} className="svc-cta-icon" />
        {payload.title && <b>{payload.title}</b>}
        {payload.text && <p>{payload.text}</p>}
        <Buttons buttons={payload.buttons} className="svc-cta-buttons" fullWidth />
        {payload.note && <p className="svc-cta-note">{payload.note}</p>}
      </div>
    );
  }

  return (
    <div className="ctastrip" id={id}>
      <Icon value={payload.icon} className="svc-cta-icon" />
      {payload.title && <h2>{payload.title}</h2>}
      {payload.text && <p>{payload.text}</p>}
      <Buttons buttons={payload.buttons} className="svc-cta-buttons svc-cta-center" />
      {payload.note && <p className="svc-cta-note">{payload.note}</p>}
    </div>
  );
}

/** Figures with a label and optional text (pSEO "impact / ROI" sections). */
function StatsBlock({ payload, config }) {
  const items = list(payload.items).filter((item) => item?.value);

  return (
    <Block config={config} title={payload.title} intro={payload.intro}>
      <div className="svc-stats">
        {items.map((item, index) => (
          <div key={`${item.value}-${index}`} className="svc-stat">
            <b>{item.value}</b>
            {item.label && <span>{item.label}</span>}
            {item.text && <p>{item.text}</p>}
          </div>
        ))}
      </div>
    </Block>
  );
}

// Defaults of the "Locations We Serve" block; the admin block (LocationsServed) overrides them.
// {service} is the service name, {count} the number of locations.
export const LOCATIONS_DEFAULTS = {
  title: "Locations We Serve",
  subHeading: "Explore localized {service} across target cities & hubs",
  countLabel: "{count} Available",
};

function withService(text, serviceTitle) {
  const parts = String(text || "").split("{service}");
  return parts.map((part, index) => (
    <span key={index}>
      {part}
      {index < parts.length - 1 && serviceTitle && <strong className="loc-service">{serviceTitle}</strong>}
    </span>
  ));
}

/** Links to the service's published location pages (pSEO), A-Z, the current one marked. */
function LocationsBlock({ payload, config, locations, currentPath, serviceTitle }) {
  const items = list(locations);
  const title = String(payload.title || "").trim() || LOCATIONS_DEFAULTS.title;
  const subHeading = String(payload.subHeading || "").trim() || LOCATIONS_DEFAULTS.subHeading;
  const countLabel = (String(payload.countLabel || "").trim() || LOCATIONS_DEFAULTS.countLabel).replace("{count}", items.length);
  const current = currentPath ? `/${String(currentPath).replace(/^\/+/, "")}` : "";

  return (
    <div className="blk svc-locations" id={config.anchorId || "locations"}>
      <div className="loc-head">
        <div>
          {config.kicker && <div className="kicker">{config.kicker}</div>}
          <h2>{title}</h2>
          <p className="loc-sub">{withService(subHeading, serviceTitle)}</p>
        </div>
        {payload.showCount !== "no" && <span className="loc-count">{countLabel}</span>}
      </div>
      <ul className="loc-grid">
        {items.map((item) => {
          const active = item.href === current;
          return (
            <li key={item.href}>
              <Link href={item.href} className={`loc-chip${active ? " is-current" : ""}`} aria-current={active ? "page" : undefined}>
                <span aria-hidden className="loc-pin">📍</span>
                {item.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function GenericBlock({ section }) {
  const payload = section.payload || {};
  const description = payload.description || payload.subHeading || payload.summary;
  const collection = Object.values(payload).find((value) => Array.isArray(value) && value.length);

  return (
    <Block config={section.config} title={payload.title || payload.heading}>
      {description && <p>{description}</p>}
      <RichContent html={payload.content} />
      <CardGrid items={toCardItems(collection)} />
    </Block>
  );
}

/** Whether a section has anything to show, so empty blocks never leave a gap or an empty column. */
function hasContent(section, locations) {
  const p = section.payload || {};

  switch (section.type) {
    case "Stats":
      return list(p.items).some((item) => item?.value);
    case "LocationsServed":
      return p.show !== "no" && list(locations).length > 0;
    case "Overview":
      return Boolean(p.content);
    case "WhyUs":
      return toCardItems(p.reasons).length > 0;
    case "ServicesIncluded":
      return toCardItems(p.services).length > 0;
    case "OurProcess":
      return list(p.steps).some((step) => step?.title || step?.description);
    case "Faq":
    case "FAQ":
      return list(p.faqs).some((faq) => faq?.question);
    case "Form":
      return list(p.form?.fields).length > 0;
    case "Packages":
      return list(p.packages).some((pkg) => pkg?.name);
    case "Highlights":
      return list(p.items).some((item) => item?.title || item?.text);
    case "Checklist":
      return list(p.items).some((item) => item?.text);
    case "CallToAction":
      return Boolean(p.title || p.text || list(p.buttons).some((button) => button?.text));
    default:
      return Object.values(p).some((value) => (Array.isArray(value) ? value.length : Boolean(value)));
  }
}

function ServiceBlock({ section, placement, firstOverviewId, packageCtaHref, locations, currentPath, serviceTitle }) {
  const payload = section.payload || {};
  const config = section.config || {};

  switch (section.type) {
    case "Overview":
      return <OverviewBlock payload={payload} config={config} first={section.id === firstOverviewId} />;
    case "WhyUs":
      return <WhyUsBlock payload={payload} config={config} />;
    case "ServicesIncluded":
      return (
        <Block config={config} title={payload.title} intro={payload.intro}>
          <CardGrid items={toCardItems(payload.services)} />
        </Block>
      );
    case "Stats":
      return <StatsBlock payload={payload} config={config} />;
    case "LocationsServed":
      return <LocationsBlock payload={payload} config={config} locations={locations} currentPath={currentPath} serviceTitle={serviceTitle} />;
    case "OurProcess":
      return <ProcessBlock payload={payload} config={config} />;
    case "Faq":
    case "FAQ":
      return <FaqBlock payload={payload} config={config} />;
    case "Form":
      return <FormSection payload={payload} config={config} placement={placement} />;
    case "Packages":
      return <PackagesBlock payload={payload} config={config} ctaHref={packageCtaHref} />;
    case "Highlights":
      return <HighlightsBlock payload={payload} config={config} placement={placement} />;
    case "Checklist":
      return <ChecklistBlock payload={payload} config={config} placement={placement} />;
    case "CallToAction":
      return <CallToActionBlock payload={payload} config={config} placement={placement} />;
    default:
      // Homepage blocks and the general-purpose blocks can be placed on any page.
      if (isHomeSection(section)) return <HomeBlock section={section} />;
      if (isCommonSection(section)) return <CommonBlock section={section} />;
      return <GenericBlock section={section} />;
  }
}

function placementOf(section) {
  const placement = section.config?.placement;
  // Homepage blocks are full-width designs: below the columns unless placed elsewhere.
  return PLACEMENTS.includes(placement) ? placement : DEFAULT_PLACEMENT[section.type] || (isHomeSection(section) ? "bottom" : "main");
}

// "Locations We Serve" on a service (or location page) whose Page Builder has no such block:
// first in the full-width bottom area, with the default texts.
const AUTO_LOCATIONS = { id: "auto-locations", type: "LocationsServed", config: { placement: "bottom" }, payload: {} };

export default function ApiServicePage({ service }) {
  const locations = list(service.locations);
  const heroSection = service.sections.find((section) => section.type === "HeroBanner");
  const hero = heroSection?.payload || {};
  const sections = service.sections.filter((section) => section.type !== "HeroBanner" && hasContent(section, locations));
  const hasLocationsBlock = service.sections.some((section) => section.type === "LocationsServed");

  const groups = { top: [], main: [], sidebar: [], bottom: [] };
  sections.forEach((section) => groups[placementOf(section)].push(section));
  if (!hasLocationsBlock && hasContent(AUTO_LOCATIONS, locations)) groups.bottom.unshift(AUTO_LOCATIONS);
  // Sidebar-only content with nothing in main: let it use the full width instead.
  if (!groups.main.length) {
    groups.main = groups.sidebar;
    groups.sidebar = [];
  }

  const firstOverviewId = sections.find((section) => section.type === "Overview")?.id;
  const firstForm = sections.find((section) => section.type === "Form");
  // Plan buttons without their own link jump to the page's enquiry form, when there is one.
  const packageCtaHref = firstForm ? `#${firstForm.config?.anchorId || "enquiry"}` : "";

  // Every block may have its own background (admin: the block's Background panel).
  const render = (section, placement) => (
    <Fragment key={section.id}>
      <BlockBackground config={section.config}>
        <ServiceBlock
          section={section}
          placement={placement}
          firstOverviewId={firstOverviewId}
          packageCtaHref={packageCtaHref}
          locations={locations}
          currentPath={service.path}
          serviceTitle={service.locationsFor || service.title}
        />
      </BlockBackground>
    </Fragment>
  );

  // No visible breadcrumb on any page (removed on request, 2026-10-23).
  return (
    <div className="ta-svc">
      <JsonLd value={service.schemaMarkup} />
      <div className="view">
        <div className="svc">
          <div className="wrap">
            <BlockBackground config={heroSection?.config} hero><Hero service={service} hero={hero} config={heroSection?.config} /></BlockBackground>

            {groups.top.length > 0 && <div className="svc-top">{groups.top.map((section) => render(section, "top"))}</div>}

            {groups.main.length > 0 && (
              <div className={`svc-body${groups.sidebar.length ? "" : " svc-body-full"}`} id="details">
                <div>{groups.main.map((section) => render(section, "main"))}</div>
                {groups.sidebar.length > 0 && (
                  <aside className="side">{groups.sidebar.map((section) => render(section, "sidebar"))}</aside>
                )}
              </div>
            )}

            {groups.bottom.length > 0 && (
              <div className="svc-full svc-bottom">{groups.bottom.map((section) => render(section, "bottom"))}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Page Builder blocks in one column, with the service-page renderers (used by blog posts).
 * Needs a `.ta-svc` ancestor for the styles. HeroBanner and empty blocks are skipped.
 */
export function ContentBlocks({ sections }) {
  const items = list(sections).filter((section) => section.type !== "HeroBanner" && hasContent(section, []));
  const firstOverviewId = items.find((section) => section.type === "Overview")?.id;
  const firstForm = items.find((section) => section.type === "Form");
  const packageCtaHref = firstForm ? `#${firstForm.config?.anchorId || "enquiry"}` : "";

  return items.map((section) => (
    <Fragment key={section.id}>
      <BlockBackground config={section.config}>
        <ServiceBlock
          section={section}
          placement="main"
          firstOverviewId={firstOverviewId}
          packageCtaHref={packageCtaHref}
          locations={[]}
        />
      </BlockBackground>
    </Fragment>
  ));
}
