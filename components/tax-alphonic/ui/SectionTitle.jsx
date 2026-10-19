import { THEME } from "../theme";

export default function SectionTitle({ eyebrow, title, description }) {
  return (
    <div className="mb-7">
      {eyebrow ? (
        <div
          className="mb-2 text-xs font-bold uppercase tracking-[0.06em]"
          style={{ color: THEME.brand }}
        >
          {eyebrow}
        </div>
      ) : null}
      {title ? (
        <h2
          className="text-2xl font-extrabold tracking-tight sm:text-3xl"
          style={{ color: THEME.ink }}
        >
          {title}
        </h2>
      ) : null}
      {description ? (
        <p className="mt-2 max-w-3xl text-[15px] leading-7" style={{ color: THEME.muted }}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
