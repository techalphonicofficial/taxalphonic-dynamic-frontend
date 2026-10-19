import { THEME } from "../theme";
import { safeText } from "../../../lib/tax-alphonic/utils";

export default function StringList({ items = [], ordered = false }) {
  if (!Array.isArray(items) || !items.length) return null;
  const Tag = ordered ? "ol" : "ul";

  return (
    <Tag className={`space-y-2 ${ordered ? "list-decimal pl-6" : ""}`}>
      {items.map((item, index) => (
        <li key={index} className="text-[15px] leading-7" style={{ color: THEME.ink2 }}>
          {!ordered ? (
            <span className="mr-2 font-bold" style={{ color: THEME.accent }}>✓</span>
          ) : null}
          {safeText(item)}
        </li>
      ))}
    </Tag>
  );
}
