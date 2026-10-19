import { THEME } from "../theme";
import Card from "./Card";
import StringList from "./StringList";

export default function Plans({ plans = [] }) {
  if (!Array.isArray(plans) || !plans.length) return null;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {plans.map((plan, index) => (
        <Card key={index} className={plan.popular ? "ring-2" : ""}>
          {plan.popular ? (
            <div className="mb-3 inline-block rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: THEME.brand }}>
              Popular
            </div>
          ) : null}
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: THEME.muted }}>
            {plan.name || `Plan ${index + 1}`}
          </div>
          <div className="mt-2 text-3xl font-extrabold" style={{ color: THEME.ink }}>
            {plan.price || ""}
          </div>
          {plan.feeNote ? <div className="text-xs" style={{ color: THEME.muted }}>{plan.feeNote}</div> : null}
          <div className="my-4"><StringList items={plan.features || []} /></div>
          <a
            href="/talk-to-expert"
            className="block rounded-xl px-4 py-3 text-center text-sm font-semibold"
            style={{ background: THEME.brand, color: "#fff" }}
          >
            Get Started
          </a>
        </Card>
      ))}
    </div>
  );
}
