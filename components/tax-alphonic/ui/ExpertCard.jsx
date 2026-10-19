import { THEME } from "../theme";
import Card from "./Card";

export default function ExpertCard() {
  return (
    <Card className="mb-4">
      <h3 className="text-lg font-bold" style={{ color: THEME.ink }}>Need expert help?</h3>
      <p className="mt-2 text-sm leading-6" style={{ color: THEME.muted }}>
        Get support from the Tax Alphonic team for this service.
      </p>
      <a
        href="/talk-to-expert"
        className="mt-4 block rounded-xl px-4 py-3 text-center text-sm font-semibold text-white"
        style={{ background: THEME.brand }}
      >
        Talk to an Expert
      </a>
    </Card>
  );
}
