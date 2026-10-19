import { THEME } from "../theme";
import { SectionTitle } from "../ui";

export default function ProcessSection({ items = [] }) {
  if (!items?.length) return null;
  return (
    <section className="mb-10">
      <SectionTitle eyebrow="Process" title="How it works" />
      <div className="space-y-4">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-[42px_1fr] gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ background: THEME.ink }}>
              {i + 1}
            </div>
            <div className="rounded-xl border p-4" style={{ borderColor: THEME.line }}>
              <p className="text-sm leading-7" style={{ color: THEME.ink2 }}>{item}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
