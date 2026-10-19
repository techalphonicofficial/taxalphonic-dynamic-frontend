import { THEME } from "../theme";
import { Card, SectionTitle } from "../ui";

export default function BenefitsSection({ items = [] }) {
  if (!items?.length) return null;
  return (
    <section className="mb-10">
      breadcrms
      <SectionTitle eyebrow="Benefits" title="Why choose this service" />
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => (
          <Card key={i}>
            {/* <div className="mb-2 text-lg" style={{ color: THEME.accent }}>✓</div> */}
            <p className="text-sm font-semibold" style={{ color: THEME.ink }}>{item}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
