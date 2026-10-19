import { THEME } from "../theme";
import { SectionTitle } from "../ui";

export default function DocsSection({ items = [] }) {
  if (!items?.length) return null;
  return (
    <section className="mb-10">
      <SectionTitle eyebrow="Documents" title="Documents required" />
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item, i) => (
          <div key={i} className="flex gap-3 rounded-xl p-4" style={{ background: THEME.mist }}>
            <span style={{ color: THEME.accent }}>✓</span>
            <span className="text-sm" style={{ color: THEME.ink2 }}>{item}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
