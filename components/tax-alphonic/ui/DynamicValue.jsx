import { THEME } from "../theme";
import { prettyTitle } from "../../../lib/tax-alphonic/utils";
import Card from "./Card";
import StringList from "./StringList";

export default function DynamicValue({ value, depth = 0 }) {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string" || typeof value === "number") {
    return <p className="text-[15px] leading-8" style={{ color: THEME.ink2 }}>{String(value)}</p>;
  }

  if (Array.isArray(value)) {
    const isSimple = value.every((x) => typeof x === "string" || typeof x === "number");
    if (isSimple) return <StringList items={value} />;

    return (
      <div className="space-y-4">
        {value.map((item, i) => (
          <Card key={i}><DynamicValue value={item} depth={depth + 1} /></Card>
        ))}
      </div>
    );
  }

  if (typeof value === "object") {
    return (
      <div className="space-y-6">
        {Object.entries(value).map(([key, item]) => {
          if (item === null || item === undefined || item === "") return null;
          return (
            <section key={key}>
              {depth < 2 ? (
                <h3 className="mb-3 text-lg font-bold" style={{ color: THEME.ink }}>
                  {prettyTitle(key)}
                </h3>
              ) : null}
              <DynamicValue value={item} depth={depth + 1} />
            </section>
          );
        })}
      </div>
    );
  }

  return null;
}
