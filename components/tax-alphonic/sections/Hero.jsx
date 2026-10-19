import { THEME } from "../theme";

export default function Hero({ page }) {
  const content = page.content || {};
  const description =
    content.heroDescription ||
    content.description ||
    content.meta ||
    content.intro ||
    page.description ||
    "";

  return (
    <section className="relative overflow-hidden border-b" style={{ borderColor: THEME.line }}>
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(600px 300px at 80% -5%, rgba(14,150,172,.10), transparent), radial-gradient(500px 280px at 10% 30%, rgba(232,82,30,.08), transparent)",
        }}
      />
      <div className="mx-auto max-w-[1156px] px-6 py-14 sm:py-16">
        <div
          className="mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
          style={{ background: "rgba(14,150,172,.08)", color: THEME.brand }}
        >
          {page.icon || "◆"} {page.category || page.type || "Tax Alphonic"}
        </div>

        <h1
          className="max-w-4xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl"
          style={{ color: THEME.ink }}
        >
          {page.title || "Tax Alphonic"}
        </h1>

        {description ? (
          <p className="mt-5 max-w-3xl text-base leading-8 sm:text-lg" style={{ color: THEME.muted }}>
            {description}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap gap-3">
          <a
            href="/talk-to-expert"
            className="rounded-xl px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:-translate-y-0.5"
            style={{ background: THEME.brand }}
          >
            Talk to an Expert
          </a>
          <a
            href="#page-content"
            className="rounded-xl border bg-white px-6 py-3.5 text-sm font-semibold"
            style={{ borderColor: THEME.line, color: THEME.ink }}
          >
            Explore Details
          </a>
        </div>
      </div>
    </section>
  );
}
