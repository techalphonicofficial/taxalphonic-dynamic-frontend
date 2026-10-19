import { THEME } from "../theme";

/**
 * Premium glossy card grid. Items come from utils/pageCards.js:
 * { label, href?, icon?, description?, count?, countLabel?, meta? }
 * - no href  -> card renders as a non-clickable <div>
 * - no items -> renders nothing (caller decides the empty state)
 */
export default function CardGrid({
  items = [],
  getLabel = (item) => item.label,
  getHref = (item) => item.href,
  defaultIcon = "◆",
  showIcon = true,
  showCount = true,
  titleClass = "text-base sm:text-lg font-bold tracking-tight",
  descClass = "mt-2 text-sm leading-6 line-clamp-3",
}) {
  if (!Array.isArray(items) || !items.length) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {items.map((item, i) => {
        const href = getHref(item, i);
        const Tag = href ? "a" : "div";
        const hasCount = showCount && item.count !== undefined && item.count !== null && item.count !== "";

        return (
          <Tag
            key={href || `${getLabel(item, i)}-${i}`}
            {...(href ? { href } : {})}
            className={`group relative block rounded-2xl p-px transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 motion-reduce:transform-none ${
              href ? "hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/10" : ""
            }`}
            style={{ "--tw-ring-color": THEME.brand }}
          >
            <span aria-hidden className="absolute inset-0 rounded-2xl bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200" />
            {href ? (
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `linear-gradient(135deg, ${THEME.brand}, transparent 65%)` }}
              />
            ) : null}

            <div className="relative flex h-full flex-col overflow-hidden rounded-[15px] bg-gradient-to-br from-white to-slate-50 p-5 sm:p-6">
              <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent" />
              {href ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent opacity-0 transition duration-700 group-hover:translate-x-[450%] group-hover:opacity-100"
                />
              ) : null}

              <div className="relative flex flex-1 flex-col">
                {showIcon ? (
                  <div
                    className="relative mb-4 grid h-11 w-11 place-items-center overflow-hidden rounded-xl text-xl text-white shadow-md ring-1 ring-black/5 transition duration-300 group-hover:scale-105 sm:h-12 sm:w-12"
                    style={{ background: THEME.brand }}
                  >
                    <span aria-hidden className="absolute inset-0 bg-gradient-to-br from-white/35 via-transparent to-black/10" />
                    <span className="relative">{item.icon || defaultIcon}</span>
                  </div>
                ) : null}

                <h3 className={titleClass} style={{ color: THEME.ink }}>
                  {getLabel(item, i)}
                </h3>

                {item.description ? (
                  <p className={descClass} style={{ color: THEME.muted }}>
                    {item.description}
                  </p>
                ) : null}

                {item.meta ? (
                  <p className="mt-2 text-xs font-medium" style={{ color: THEME.muted }}>
                    {item.meta}
                  </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between pt-4">
                  {hasCount ? (
                    <span
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold ring-1 ring-slate-200"
                      style={{ color: THEME.brand }}
                    >
                      {item.count} {item.countLabel || "items"}
                    </span>
                  ) : (
                    <span />
                  )}
                  {href ? (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold transition-all duration-300 group-hover:gap-2"
                      style={{ color: THEME.brand }}
                    >
                      Explore
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden>
                        <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.69l-3.22-3.22a.75.75 0 1 1 1.06-1.06l4.5 4.5a.75.75 0 0 1 0 1.06l-4.5 4.5a.75.75 0 1 1-1.06-1.06l3.22-3.22H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
                      </svg>
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </Tag>
        );
      })}
    </div>
  );
}