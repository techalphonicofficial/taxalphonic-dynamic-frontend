import { DynamicValue } from "../ui";
import { Hero } from "../sections";

export default function GenericPage({ page }) {
  return (
    <>
      <Hero page={page} />
      <main id="page-content" className="mx-auto max-w-[var(--ta-page-max)] px-[var(--ta-gutter)] py-10">
        <DynamicValue value={page.content || {}} />
      </main>
    </>
  );
}
