import { THEME } from "../theme";
import { Card } from "../ui";

export default function HomePage({ page }) {
  const hero = page.content?.hero || {};
  const stats = page.content?.stats || [];

  return (
    <main>
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(600px 300px at 80% -5%, rgba(14,150,172,.10), transparent), radial-gradient(500px 280px at 10% 30%, rgba(232,82,30,.08), transparent)",
          }}
        />
        <div className="mx-auto max-w-[1156px] px-6 py-20 sm:py-24">
          <div className="max-w-4xl">
            <div className="mb-5 inline-flex rounded-full px-3 py-1.5 text-xs font-semibold" style={{ background: "rgba(14,150,172,.08)", color: THEME.brand }}>
              {hero.eyebrow}
            </div>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl" style={{ color: THEME.ink }}>
              {hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8" style={{ color: THEME.muted }}>{hero.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="/talk-to-expert" className="rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg" style={{ background: THEME.brand }}>Talk to an Expert</a>
              <a href="/category/startup" className="rounded-xl border bg-white px-6 py-3.5 text-sm font-semibold" style={{ borderColor: THEME.line }}>Explore Services</a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1156px] px-6 pb-16">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {stats.map((stat, i) => (
            <Card key={i} className="text-center">
              <div className="text-2xl font-extrabold" style={{ color: THEME.ink }}>{stat.value}{stat.suffix}</div>
              <div className="mt-1 text-xs" style={{ color: THEME.muted }}>{stat.label}</div>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
