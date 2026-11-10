/*
 * The inside of every CMS button ({ text, url, icon?, iconSide? } from the admin's ButtonField):
 * the text with an optional icon (emoji, or an image from Media) before it, or after it with
 * iconSide "right". No hooks, so server and client components can both use it. Styles: .ta-btn-ic
 * in app/globals.css.
 */
const isImage = (value) => /^(https?:|\/|data:)/i.test(value);

export default function ButtonLabel({ button }) {
  const text = String(button?.text ?? "");
  const icon = String(button?.icon ?? "").trim();
  if (!icon) return text;
  const right = button.iconSide === "right";
  const className = `ta-btn-ic ta-btn-ic-${right ? "right" : "left"}`;
  const mark = isImage(icon)
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={icon} alt="" className={`${className} ta-btn-ic-img`} />
    : <span className={className} aria-hidden="true">{icon}</span>;
  return right ? <>{text}{mark}</> : <>{mark}{text}</>;
}

// The admin's button "Look" (button.style): filled, outline, soft, gradient, dark, white or text link.
// Empty (and the older "primary" / "ghost") keeps the block's own design. Styles: blocks.css .ta-look-*.
const LOOKS = new Set(["solid", "outline", "soft", "gradient", "dark", "white", "link"]);

/** Extra class names for a CMS button element (" ta-look ta-look-outline"), or "". */
export function lookClass(button) {
  const style = String(button?.style || "").trim();
  return LOOKS.has(style) ? ` ta-look ta-look-${style}` : "";
}
