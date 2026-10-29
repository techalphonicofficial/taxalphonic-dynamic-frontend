"use client";

import { useState } from "react";

// Renders a "Packages" service section with the reference "Pick a plan" styles
// (.pgrid / .plan / .price / .pbtn from uirefrence.html), driven by CMS package data.

function parseJson(value, fallback) {
  if (!value) return fallback;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function formatAmount(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  return /^[₹$€£]/.test(text) ? text : `₹${text}`;
}

/**
 * A plan's details (admin: the plan's "Details" box, saved as plan.keywords). One line = plain
 * text; several lines = a ticked list, one point per line.
 */
function PlanDetails({ text, className = "pkg-extra" }) {
  const lines = String(text || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;
  if (lines.length === 1) return <div className={className}>{lines[0]}</div>;
  return (
    <ul className={`${className} pkg-extra-list`}>
      {lines.map((line, index) => <li key={index}>{line.replace(/^[-•*✓✔✅]\s*/u, "")}</li>)}
    </ul>
  );
}

function linkProps(href) {
  return /^https?:\/\//i.test(href) ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
}

/** Tiers ("30 Keywords" -> plans) when the package uses them, otherwise one unnamed tier. */
function getTiers(pkg) {
  const tiers = parseJson(pkg.keywordTiers, []);
  if (Array.isArray(tiers) && tiers.some((tier) => tier?.pricingPlans?.length)) {
    return tiers
      .filter((tier) => tier?.pricingPlans?.length)
      .map((tier) => ({ label: tier.label || "", plans: tier.pricingPlans.filter((plan) => plan?.monthlyPrice) }));
  }

  const plans = parseJson(pkg.pricingPlans, []);
  return [{ label: "", plans: Array.isArray(plans) ? plans.filter((plan) => plan?.monthlyPrice) : [] }];
}

/** CMS button label + link; no label or no link means no button. */
function PlanButton({ labels, plan, className }) {
  const href = plan?.link || labels.buttonUrl;
  if (!labels.buttonText || !href) return null;
  return <a className={className} {...linkProps(href)}>{labels.buttonText}</a>;
}

function getFeatureSections(pkg) {
  const features = parseJson(pkg.features, {});
  const sections = Array.isArray(features?.sections) ? features.sections.filter((section) => section?.items?.length) : [];
  return { sections, collapsedCount: Number(features?.collapsedCount) || 3 };
}

/** Feature sections; the first `collapsedCount` show, the rest sit behind a toggle (admin setting). */
function FeatureSections({ sections, collapsedCount, className }) {
  const [expanded, setExpanded] = useState(false);
  if (!sections.length) return null;

  const visibleSections = expanded ? sections : sections.slice(0, collapsedCount);
  const hiddenCount = sections.length - visibleSections.length;

  return (
    <>
      <div className={className}>
        {visibleSections.map((section, index) => (
          <div key={`${section.title}-${index}`} className="pkg-section">
            {section.title && <div className="pkg-section-title">{section.title}</div>}
            <ul>
              {section.items.filter((item) => item?.text).map((item, itemIndex) => (
                <li key={`${item.text}-${itemIndex}`} className={item.included === false ? "pkg-no" : undefined}>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {sections.length > collapsedCount && (
        <button type="button" className="pkg-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Show fewer features" : `Show all features (+${hiddenCount})`}
        </button>
      )}
    </>
  );
}

/**
 * Bundle packages: the services the package includes (admin Packages → Services in this package,
 * resolved by the backend into includedServices [{ title, note, url }]). A published service links
 * to its page; a custom item, a draft service or a locked landing link ("#form") is plain text.
 */
function IncludedServices({ pkg, title }) {
  const items = (Array.isArray(pkg.includedServices) ? pkg.includedServices : []).filter((item) => item?.title);
  if (!items.length) return null;

  return (
    <div className="pkg-includes">
      {title && <div className="pkg-includes-title">{title}</div>}
      <ul>
        {items.map((item, index) => (
          <li key={`${item.title}-${index}`}>
            <span className="pkg-inc-name">
              {/^\/[^/]/.test(item.url || "") ? <a href={item.url}>{item.title}</a> : item.title}
            </span>
            {item.note && <span className="pkg-inc-note">{item.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TierPicker({ pkg, tiers, value, onChange }) {
  if (tiers.length < 2) return null;

  return (
    <select className="pkg-tier" aria-label={`${pkg.name} tier`} value={value} onChange={(event) => onChange(Number(event.target.value))}>
      {tiers.map((item, index) => <option key={`${item.label}-${index}`} value={index}>{item.label || `Option ${index + 1}`}</option>)}
    </select>
  );
}

/**
 * The usual case: one package with several pricing plans. Each plan gets its own column so the
 * block fills the width, and the features are listed once underneath.
 */
function SinglePackage({ pkg, labels }) {
  const tiers = getTiers(pkg);
  const [tierIndex, setTierIndex] = useState(0);
  const plans = (tiers[tierIndex] || tiers[0])?.plans || [];
  const { sections, collapsedCount } = getFeatureSections(pkg);

  // Highlight the plan with the biggest saving, straight from the CMS percentages.
  const savings = plans.map((plan) => Number(String(plan.savePercentage || "").replace(/[^\d.]/g, "")) || 0);
  const topSaving = Math.max(0, ...savings);
  const bestIndex = plans.length > 1 && topSaving > 0 ? savings.indexOf(topSaving) : -1;

  return (
    <div className="pkg-single">
      <div className="pkg-head">
        <div>
          <div className="pkg-name">{pkg.name}</div>
          {pkg.description && <p className="pkg-desc">{pkg.description}</p>}
        </div>
        <TierPicker pkg={pkg} tiers={tiers} value={tierIndex} onChange={setTierIndex} />
      </div>

      <IncludedServices pkg={pkg} title={labels.includesTitle} />

      {plans.length > 0 && (
        <div className="pkg-plans">
          {plans.map((plan, index) => (
            <div key={`${plan.duration}-${index}`} className={`pkg-plan${index === bestIndex ? " best" : ""}`}>
              {index === bestIndex && labels.bestValueLabel && <span className="tag">{labels.bestValueLabel}</span>}
              <div className="pn">{plan.duration || `Plan ${index + 1}`}</div>
              <div className="price">{formatAmount(plan.monthlyPrice)}{labels.priceSuffix && <small>{labels.priceSuffix}</small>}</div>
              <div className="pkg-meta">
                {plan.originalTotal && <s>{formatAmount(plan.originalTotal)}</s>}
                {plan.savePercentage && <span className="pkg-save">Save {String(plan.savePercentage).replace(/%$/, "")}%</span>}
              </div>
              <PlanDetails text={plan.keywords} />
              <PlanButton labels={labels} plan={plan} className={`pbtn ${index === bestIndex ? "solid" : "outline"}`} />
            </div>
          ))}
        </div>
      )}

      {sections.length > 0 && (
        <div className="pkg-features">
          {labels.featuresTitle && <div className="pkg-features-title">{labels.featuresTitle}</div>}
          <FeatureSections sections={sections} collapsedCount={collapsedCount} className="pkg-feature-cols" />
        </div>
      )}
    </div>
  );
}

/** One card per package (reference .plan card) with a duration switch, for pages with several packages. */
function PackageCard({ pkg, labels }) {
  const tiers = getTiers(pkg);
  const [tierIndex, setTierIndex] = useState(0);
  const [planIndex, setPlanIndex] = useState(0);

  const tier = tiers[tierIndex] || tiers[0];
  const plan = tier?.plans[planIndex] || tier?.plans[0];
  const { sections, collapsedCount } = getFeatureSections(pkg);

  return (
    <div className={`plan${pkg.isRecommended ? " pop" : ""}`}>
      {pkg.isRecommended && labels.recommendedLabel && <span className="tag">{labels.recommendedLabel}</span>}
      <div className="pn">{pkg.name}</div>

      {plan && (
        <>
          <div className="price">{formatAmount(plan.monthlyPrice)}{labels.priceSuffix && <small>{labels.priceSuffix}</small>}</div>
          {(plan.originalTotal || plan.savePercentage) && (
            <div className="pkg-meta">
              {plan.originalTotal && <s>{formatAmount(plan.originalTotal)}</s>}
              {plan.savePercentage && <span className="pkg-save">Save {String(plan.savePercentage).replace(/%$/, "")}%</span>}
            </div>
          )}
          <PlanDetails text={plan.keywords} className="pkg-extra pkg-card-extra" />
        </>
      )}

      {pkg.description && <p className="pkg-desc">{pkg.description}</p>}

      <IncludedServices pkg={pkg} title={labels.includesTitle} />

      <TierPicker pkg={pkg} tiers={tiers} value={tierIndex} onChange={(index) => { setTierIndex(index); setPlanIndex(0); }} />

      {tier?.plans.length > 1 && (
        <div className="pkg-durations" role="group" aria-label={`${pkg.name} duration`}>
          {tier.plans.map((item, index) => (
            <button
              key={`${item.duration}-${index}`}
              type="button"
              className={index === planIndex ? "on" : undefined}
              aria-pressed={index === planIndex}
              onClick={() => setPlanIndex(index)}
            >
              {item.duration || `Plan ${index + 1}`}
            </button>
          ))}
        </div>
      )}

      <FeatureSections sections={sections} collapsedCount={collapsedCount} />

      <PlanButton labels={labels} plan={plan} className={`pbtn ${pkg.isRecommended ? "solid" : "outline"}`} />
    </div>
  );
}

export default function PackagesBlock({ payload, config = {}, ctaHref = "" }) {
  const packages = (Array.isArray(payload?.packages) ? payload.packages : [])
    .filter((pkg) => pkg?.name)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
  if (!packages.length) return null;

  // Every label comes from the Packages block in the CMS; empty means "don't show".
  const labels = {
    buttonText: payload.buttonText || "",
    buttonUrl: payload.buttonUrl || ctaHref,
    priceSuffix: payload.priceSuffix || "",
    bestValueLabel: payload.bestValueLabel || "",
    featuresTitle: payload.featuresTitle || "",
    recommendedLabel: payload.recommendedLabel || "",
    includesTitle: payload.includesTitle || "",
  };
  const heading = payload.heading || payload.title;

  return (
    <div className="blk" id={config.anchorId || "pricing"}>
      {config.kicker && <div className="kicker">{config.kicker}</div>}
      {heading && <h2>{heading}</h2>}
      {payload.subHeading && <p>{payload.subHeading}</p>}
      {packages.length === 1 ? (
        <SinglePackage pkg={packages[0]} labels={labels} />
      ) : (
        <div className="pgrid pgrid-fit">
          {packages.map((pkg) => <PackageCard key={pkg.id || pkg.name} pkg={pkg} labels={labels} />)}
        </div>
      )}
    </div>
  );
}
