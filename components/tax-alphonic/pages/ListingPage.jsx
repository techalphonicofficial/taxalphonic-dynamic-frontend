import { SectionTitle, CardGrid, ContentBlock } from "../ui";
import { Hero } from "../sections";

export default function ListingPage({ page }) {
  const c = page.content || {};
  const list = c.cards || c.departments || c.banks || c.noticeTypes || c.actions || [];

  return (
    <>
      <Hero page={page} />
      <main id="page-content" className="mx-auto max-w-[1156px] px-6 py-10">
        {c.heroTitle && c.heroTitle !== page.title ? (
          <SectionTitle title={c.heroTitle} description={c.heroDescription || c.heroSub || c.description} />
        ) : null}

        <CardGrid
          items={Array.isArray(list) ? list : []}
          showCount
          getLabel={(item, i) => item.title || item.label || item.name || `Item ${i + 1}`}
          getHref={(item) => item.url || item.route || "#"}
        />

        {c.filters ? <ContentBlock title="Filters" value={c.filters} /> : null}
      </main>
    </>
  );
}
