import { SectionTitle, CardGrid, ContentBlock, FAQList } from "../ui";
import { Hero } from "../sections";
import { safeText } from "../../../lib/tax-alphonic/utils";

export default function TaxpediaPage({ page }) {
  const c = page.content || {};
  const topics = c.topics || c.categories || [];

  return (
    <>
      <Hero page={page} />
      <main id="page-content" className="mx-auto max-w-[1156px] px-6 py-10">
        {c.meta ? <ContentBlock title="About this topic" value={c.meta} /> : null}
        {c.introduction ? <ContentBlock title="Introduction" value={c.introduction} /> : null}
        {c.detailedExplanation ? <ContentBlock title="Detailed explanation" value={c.detailedExplanation} /> : null}
        {c.legalReferences ? <ContentBlock title="Legal references" value={c.legalReferences} /> : null}
        {c.latestAmendments ? <ContentBlock title="Latest amendments" value={c.latestAmendments} /> : null}

        {Array.isArray(topics) && topics.length ? (
          <section className="mt-10">
            <SectionTitle eyebrow="Explore" title="Related topics" />
            <CardGrid
              items={topics}
              showIcon={false}
              titleClass="text-sm font-bold"
              descClass="mt-2 text-xs leading-6"
              getLabel={(item) => item.title || item.label || item.name || safeText(item)}
              getHref={(item) => item.url || item.route || "#"}
            />
          </section>
        ) : null}

        {c.faqs?.length ? <ContentBlock title="Frequently asked questions" value={<FAQList faqs={c.faqs} />} /> : null}
      </main>
    </>
  );
}
