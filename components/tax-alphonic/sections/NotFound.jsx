import { THEME } from "../theme";

export default function NotFound({ pathname }) {
  return (
    <main className="min-h-[70vh] bg-white px-6 py-20">
      <div className="mx-auto max-w-3xl rounded-2xl border bg-white p-10 text-center shadow-sm" style={{ borderColor: THEME.line }}>
        <div className="text-4xl">🔎</div>
        <h1 className="mt-4 text-3xl font-extrabold" style={{ color: THEME.ink }}>Page not found</h1>
        <p className="mt-3 text-sm" style={{ color: THEME.muted }}>
          No page data is mapped for <strong>{pathname}</strong>.
        </p>
        <a href="/" className="mt-6 inline-block rounded-xl px-5 py-3 text-sm font-semibold text-white" style={{ background: THEME.brand }}>
          Back to Home
        </a>
      </div>
    </main>
  );
}
