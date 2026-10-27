// 404 of a landing page address (/lp/<label>) with no published page (or /landing-host/... opened directly).
const MAIN_SITE = String(process.env.SITE_URL || "https://taxalphonic.com").replace(/\/$/, "");

export const metadata = { title: "Page not found", robots: { index: false, follow: false } };

export default function LandingNotFound() {
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "48px 24px", fontFamily: "var(--font-inter), Inter, system-ui, sans-serif", textAlign: "center" }}>
      <div>
        <p style={{ color: "#0e96ac", fontWeight: 700, letterSpacing: ".08em", fontSize: 13, margin: 0 }}>404</p>
        <h1 style={{ fontFamily: "var(--font-sora), Sora, sans-serif", fontSize: 30, margin: "10px 0 8px", color: "#0a0e1a" }}>This page isn&apos;t available</h1>
        <p style={{ color: "#5b6478", margin: "0 0 22px" }}>The page you are looking for does not exist or is no longer published.</p>
        <a href={MAIN_SITE} style={{ display: "inline-block", padding: "11px 20px", borderRadius: 10, background: "#0e96ac", color: "#fff", fontWeight: 700, textDecoration: "none" }}>
          Go to Tax Alphonic
        </a>
      </div>
    </main>
  );
}
