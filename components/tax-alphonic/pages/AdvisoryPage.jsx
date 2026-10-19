import { THEME } from "../theme";
import { SectionTitle, CardGrid, ContentBlock, FAQList } from "../ui";
import { Hero } from "../sections";

export default function AdvisoryPage({ page }) {
  const c = page.content || {};
  const items = c.services || c.practices || [];

  return (
    <>
      <Hero page={page} />
      <main id="page-content" className="mx-auto max-w-[1156px] px-6 py-10">
        {c.overview ? (
          <section className="mb-10">
            <SectionTitle eyebrow="Overview" title="Overview" />
            <p className="max-w-4xl text-[15px] leading-8" style={{ color: THEME.ink2 }}>{c.overview}</p>
          </section>
        ) : null}

        {c.heroDescription && page.type !== "advisory-service" ? (
          <p className="mb-8 max-w-4xl text-[15px] leading-8" style={{ color: THEME.muted }}>{c.heroDescription}</p>
        ) : null}

        <CardGrid
          items={items}
          defaultIcon="⚖️"
          getLabel={(item, i) => item.title || item.label || item.name || `Service ${i + 1}`}
          getHref={(item) => item.url || (item.slug ? `/advisory/${item.slug}` : "#")}
        />

        {c.approach ? <ContentBlock title="Our approach" value={c.approach} /> : null}
        {c.deliverables ? <ContentBlock title="Deliverables" value={c.deliverables} /> : null}
        {c.faqs ? <ContentBlock title="FAQs" value={<FAQList faqs={c.faqs} />} /> : null}
      </main>
    </>
  );
}
