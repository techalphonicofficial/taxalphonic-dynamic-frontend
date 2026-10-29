import { SectionTitle, StringList, Plans, FAQList, ExpertCard, TemplateInfo } from "../ui";
import { Hero, TextSection, BenefitsSection, DocsSection, ProcessSection } from "../sections";

export default function ServicePage({ page }) {
  const c = page.content || {};

  return (
    <>
      <Hero page={page} />
      <main id="page-content" className="mx-auto max-w-[1210px] px-6 py-10">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <TextSection eyebrow="Overview" title="What is it?" text={c.whatIs} />
            <TextSection eyebrow="Introduction" title="About this service" text={c.intro} />
            <BenefitsSection items={c.benefits} />

            {c.who?.length ? (
              <section className="mb-10">
                <SectionTitle eyebrow="Who is it for?" title="Suitable for" />
                <StringList items={c.who} />
              </section>
            ) : null}

            <DocsSection items={c.docs} />
            <ProcessSection items={c.process} />

            {c.whyChooseTaxAlphonic?.length ? (
              <section className="mb-10">
                <SectionTitle eyebrow="Tax Alphonic" title="Why choose us" />
                <StringList items={c.whyChooseTaxAlphonic} />
              </section>
            ) : null}

            {c.plans?.length ? (
              <section className="mb-10">
                <SectionTitle eyebrow="Pricing" title="Choose your plan" />
                <Plans plans={c.plans} />
              </section>
            ) : null}

            {c.faqs?.length ? (
              <section className="mb-4">
                <SectionTitle eyebrow="FAQs" title="Frequently asked questions" />
                <FAQList faqs={c.faqs} />
              </section>
            ) : null}
          </div>

          <aside className="self-start lg:sticky lg:top-[calc(var(--ta-header-h,0px)+24px)]">
            <ExpertCard />
            {page.template ? <TemplateInfo template={page.template} variant="list" /> : null}
          </aside>
        </div>
      </main>
    </>
  );
}
