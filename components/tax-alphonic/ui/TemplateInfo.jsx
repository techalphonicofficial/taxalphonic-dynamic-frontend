import { THEME } from "../theme";
import { prettyTitle, safeText } from "../../../lib/tax-alphonic/utils";
import Card from "./Card";

/** variant="list" -> sidebar key/value list, variant="grid" -> centered stat cards */
export default function TemplateInfo({ template = {}, variant = "list" }) {
  const entries = Object.entries(template || {});
  if (!entries.length) return null;

  if (variant === "grid") {
    return (
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {entries.map(([key, value]) => (
          <Card key={key} className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: THEME.muted }}>{prettyTitle(key)}</div>
            <div className="mt-2 text-sm font-bold" style={{ color: THEME.ink }}>{safeText(value)}</div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Card>
      {entries.map(([key, value]) => (
        <div key={key} className="border-b py-3 last:border-0" style={{ borderColor: THEME.line }}>
          <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: THEME.muted }}>{prettyTitle(key)}</div>
          <div className="mt-1 text-sm font-semibold" style={{ color: THEME.ink }}>{safeText(value)}</div>
        </div>
      ))}
    </Card>
  );
}
