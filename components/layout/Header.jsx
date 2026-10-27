"use client";

import Link from "next/link";
import {
  Search,
  ChevronDown,
  Menu,
  X,
  BookOpen,
  Landmark,
  Zap,
  Bell,
  Rocket,
  ClipboardList,
  Tag,
  Receipt,
  FileText,
  Building2,
  ShieldCheck,
  BriefcaseBusiness,
  Scale,
  Globe2,
  Package,
  HandCoins,
  Calculator,
  FileCheck2,
  ScrollText,
  Gavel,
  Newspaper,
  Megaphone,
  CircleHelp,
  Download,
  Video,
  CalendarDays,
  Clock3,
  MessageCircle,
  Factory,
  Users,
  CreditCard,
  BadgeCheck,
  Copyright,
} from "lucide-react";

import { createElement, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";   // sahi
import { blockLandingNavigation } from "@/lib/landingLinks";
import { useTheme } from "@/context/ThemeContext";

/* =========================================================
   TEAL COLOR PALETTE
   =========================================================
   Primary Dark   : #0F766E
   Deep Teal      : #115E59
   Medium Teal    : #0D9488
   Light Teal     : #CCFBF1
   Very Light     : #F0FDFA
   Text Teal      : #134E4A
   ========================================================= */


/* =========================================================
   ICONS
   ========================================================= */

const iconMap = {
  taxpedia: BookOpen,
  "gem-services": Landmark,
  "quick-update": Zap,
  "government-notices": Bell,

  startup: Rocket,
  registrations: ClipboardList,
  trademark: Tag,
  gst: Receipt,
  "income-tax": FileText,
  mca: Building2,
  compliance: ShieldCheck,
  "business-advisory": BriefcaseBusiness,
  "lawyer-services": Scale,
  global: Globe2,
  products: Package,
  budget: Calculator,
  "business-loan": HandCoins,
};

const labelIconMap = [
  [/registration/i, ClipboardList],
  [/gst/i, Receipt],
  [/income tax/i, FileText],
  [/tax/i, FileText],
  [/director/i, Users],
  [/company/i, Building2],
  [/llp/i, Scale],
  [/legal/i, Scale],
  [/trademark/i, Tag],
  [/copyright/i, Copyright],
  [/patent/i, BadgeCheck],
  [/compliance/i, ShieldCheck],
  [/government/i, Landmark],
  [/notice/i, Bell],
  [/news/i, Newspaper],
  [/article/i, ScrollText],
  [/judiciary|court/i, Gavel],
  [/notification/i, Megaphone],
  [/circular/i, FileCheck2],
  [/download/i, Download],
  [/video/i, Video],
  [/calendar/i, CalendarDays],
  [/due date/i, Clock3],
  [/expert/i, MessageCircle],
  [/loan/i, HandCoins],
  [/credit/i, CreditCard],
  [/business/i, BriefcaseBusiness],
  [/factory/i, Factory],
];


/* =========================================================
   HELPERS
   ========================================================= */

function getIdIcon(id) {
  return iconMap[id] || Package;
}

function getLabelIcon(label = "") {
  const match = labelIconMap.find(([regex]) => regex.test(label));
  return match?.[1] || FileText;
}

function cleanUrl(url) {
  if (!url) return "/";

  if (url.includes("|")) {
    return url.split("|").pop();
  }

  if (url.startsWith("#/")) {
    return url.slice(1);
  }

  return url;
}


/* =========================================================
   DROPDOWN ITEM
   ========================================================= */

// Shown when a CMS menu item has no icon of its own (admin: Menus & Navigation → item → Icon).
const DEFAULT_MENU_ICON = "📄";

function isImageIcon(value) {
  return /^(https?:|\/|data:)/i.test(value) || /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(value);
}

/** A menu item's icon in a soft tile: its emoji or image, else DEFAULT_MENU_ICON. */
function MenuIcon({ value, small = false }) {
  const icon = String(value || "").trim() || DEFAULT_MENU_ICON;

  return (
    <span
      aria-hidden
      className={`
        flex
        shrink-0
        items-center
        justify-center
        rounded-lg
        border
        border-slate-200/80
        bg-slate-50
        transition
        duration-150
        group-hover/item:border-[#0F766E]/25
        group-hover/item:bg-white
        ${small ? "h-7 w-7 text-[13px]" : "h-8 w-8 text-[15px]"}
      `}
    >
      {isImageIcon(icon) ? (
        // CMS media can live on any host, so next/image remotePatterns can't cover it.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className={small ? "h-4 w-4 object-contain" : "h-[18px] w-[18px] object-contain"} />
      ) : (
        <span className="leading-none">{icon}</span>
      )}
    </span>
  );
}

/** Icon of a top-level menu: the CMS icon (emoji or image) when set, else the built-in one. */
function NavIcon({ item, size = 14 }) {
  const icon = String(item.icon || "").trim();
  if (!icon) return createElement(getIdIcon(item.id), { size, strokeWidth: 1.8 });
  if (isImageIcon(icon)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={icon} alt="" aria-hidden style={{ width: size + 2, height: size + 2 }} className="shrink-0 object-contain" />;
  }
  return <span aria-hidden className="shrink-0 leading-none" style={{ fontSize: size }}>{icon}</span>;
}

function DropdownItem({ item }) {
  return (
    <Link
      href={cleanUrl(item.url)}
      target={item.target}
      className="
        group/item
        flex
        min-w-0
        items-center
        gap-3
        rounded-xl
        px-2.5
        py-2
        text-left
        transition-all
        duration-150
        hover:bg-[#0F766E]/[0.06]
      "
    >
      <MenuIcon value={item.icon} />

      <span className="min-w-0 flex-1">
        <span
          className="
            line-clamp-2
            whitespace-normal
            wrap-break-word
            text-[13.5px]
            font-medium
            leading-5
            text-slate-700
            transition-colors
            duration-150
            group-hover/item:text-[#0F766E]
          "
        >
          {item.label}
        </span>

        {item.desc && (
          <span className="mt-0.5 block text-[10px] leading-4 text-slate-400">
            {item.desc}
          </span>
        )}
      </span>

      {item.badge && (
        <span
          className="
            shrink-0
            rounded-full
            bg-[#0F766E]/10
            px-1.5
            py-0.5
            text-[9px]
            font-semibold
            text-[#0F766E]
          "
        >
          {item.badge}
        </span>
      )}
    </Link>
  );
}
/* =========================================================
   GLOBAL NAVIGATION SEARCH
   ========================================================= */

function buildSearchItems(data) {
  const results = [];
  const seen = new Set();

  const add = (item, context = "") => {
    if (!item?.label || !item?.url) return;

    const url = cleanUrl(item.url);

    if (!url || url === "#" || url === "javascript:void(0)") {
      return;
    }

    const key = `${item.label}::${url}`;

    if (seen.has(key)) return;

    seen.add(key);

    results.push({
      label: item.label,
      desc: item.desc || "",
      context,
      url,
      icon: getLabelIcon(item.label),
    });
  };

  const walkSection = (section, parentContext = "") => {
    if (!section) return;

    const sectionContext =
      section.text ||
      section.title ||
      parentContext;

    section.columns?.forEach((column) => {
      const context =
        column.title || sectionContext || "";

      if (column.title && column.url) {
        add(
          {
            label: column.title,
            url: column.url,
          },
          sectionContext
        );
      }

      column.items?.forEach((item) => {
        add(item, context);
      });
    });

    section.links?.forEach((item) => {
      add(item, sectionContext);
    });

    if (section.link) {
      add(
        {
          label: section.link.label,
          url: section.link.url,
          desc: section.text || "",
        },
        sectionContext
      );
    }
  };

  data?.topbar?.forEach((item) => {
    if (item.enabled === false) return;

    add(item, "Navigation");

    item.dropdown?.sections?.forEach((section) => {
      walkSection(section, item.label);
    });
  });

  data?.megabar?.forEach((item) => {
    if (item.enabled === false) return;

    add(item, "Navigation");

    item.dropdown?.sections?.forEach((section) => {
      walkSection(section, item.label);
    });
  });

  Object.values(data?.drawerOnly || {}).forEach((item) => {
    if (item?.enabled === false) return;

    add(item, "Navigation");

    item.dropdown?.sections?.forEach((section) => {
      walkSection(section, item.label);
    });
  });

  return results;
}


function NavigationSearch({
  navigation,
  placeholder = "Search services & Taxpedia...",
}) {
  const routerItems = useMemo(
    () => buildSearchItems(navigation),
    [navigation]
  );
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizedQuery = query.trim().toLowerCase();

  const results = useMemo(() => {
    if (!normalizedQuery) return [];

    const words = normalizedQuery
      .split(/\s+/)
      .filter(Boolean);

    return routerItems
      .map((item) => {
        const searchable = [
          item.label,
          item.desc,
          item.context,
        ]
          .join(" ")
          .toLowerCase();

        const label = item.label.toLowerCase();
        const desc = item.desc.toLowerCase();
        const context = item.context.toLowerCase();

        const matchesAll = words.every((word) =>
          searchable.includes(word)
        );

        if (!matchesAll) return null;

        let score = 0;

        if (label === normalizedQuery) {
          score += 100;
        }

        if (label.startsWith(normalizedQuery)) {
          score += 60;
        }

        if (label.includes(normalizedQuery)) {
          score += 40;
        }

        if (desc.includes(normalizedQuery)) {
          score += 15;
        }

        if (context.includes(normalizedQuery)) {
          score += 10;
        }

        words.forEach((word) => {
          if (label.startsWith(word)) {
            score += 8;
          } else if (label.includes(word)) {
            score += 4;
          }
        });

        return {
          ...item,
          score,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [normalizedQuery, routerItems]);


  const navigateTo = (item) => {
    if (!item?.url) return;
    if (blockLandingNavigation(item.url, item.title)) return; // website header on a landing page

    router.push(item.url);
    setQuery("");
    setActiveIndex(0);
  };

  const handleKeyDown = (event) => {
    if (!results.length) {
      if (event.key === "Escape") {
        setQuery("");
      }

      return;
    }

    // DOWN
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        current >= results.length - 1
          ? 0
          : current + 1
      );

      return;
    }

    // UP
    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        current <= 0
          ? results.length - 1
          : current - 1
      );

      return;
    }

    // ENTER
    if (event.key === "Enter") {
      event.preventDefault();

      const selected =
        results[activeIndex] || results[0];

      if (selected) {
        navigateTo(selected);
      }

      return;
    }

    // ESC
    if (event.key === "Escape") {
      event.preventDefault();

      setQuery("");
      setActiveIndex(0);
    }
  };

  const handleChange = (event) => {
    setQuery(event.target.value);
    setActiveIndex(0);
  };

  return (
    <div className="relative">
      <Search
        size={16}
        strokeWidth={1.8}
        className="
          absolute
          left-3
          top-1/2
          -translate-y-1/2
          text-[#0F766E]
        "
      />

      <input
        type="search"
        value={query}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="
          h-[38px]
          w-full
          rounded-lg
          border
          border-slate-200
          bg-slate-50
          pl-9
          pr-3
          text-[12px]
          text-slate-700
          outline-none
          transition-all
          duration-200
          placeholder:text-slate-400
          focus:border-[#0F766E]
          focus:bg-white
          focus:ring-2
          focus:ring-[#0F766E]/10
        "
      />

      {normalizedQuery && (
        <div
          className="
            absolute
            left-0
            right-0
            top-[calc(100%+8px)]
            z-[1200]
            overflow-hidden
            rounded-xl
            border
            border-slate-200
            bg-white
            shadow-[0_18px_45px_rgba(15,23,42,0.16)]
          "
        >
          {results.length > 0 ? (
            <div className="max-h-[360px] overflow-y-auto p-1.5">
              {results.map((item, index) => {
                const Icon = item.icon;

                return (
                  <button
                    key={`${item.label}-${item.url}-${index}`}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      navigateTo(item);
                    }}
                    onMouseEnter={() => {
                      setActiveIndex(index);
                    }}
                    className={`
                      group
                      flex
                      w-full
                      items-center
                      gap-3
                      rounded-lg
                      px-2.5
                      py-2.5
                      text-left
                      transition-colors
                      ${activeIndex === index
                        ? "bg-[#F0FDFA]"
                        : "hover:bg-[#F0FDFA]"
                      }
                    `}
                  >
                    <span
                      className="
                        flex
                        h-8
                        w-8
                        shrink-0
                        items-center
                        justify-center
                        rounded-lg
                        bg-[#0F766E]/[0.09]
                        text-[#0F766E]
                      "
                    >
                      <Icon
                        size={14}
                        strokeWidth={1.8}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span
                        className="
                          block
                          truncate
                          text-[12px]
                          font-semibold
                          text-slate-700
                          group-hover:text-[#0F766E]
                        "
                      >
                        {item.label}
                      </span>

                      <span
                        className="
                          mt-0.5
                          block
                          truncate
                          text-[10px]
                          text-slate-400
                        "
                      >
                        {item.desc || item.context}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-5 text-center">
              <div className="text-[12px] font-semibold text-slate-600">
                No results found
              </div>

              <div className="mt-1 text-[10px] text-slate-400">
                Try another service or Taxpedia keyword
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   SEARCH SECTION
   ========================================================= */

function SearchSection({ section }) {
  return (
    <div className="shrink-0 border-b border-slate-100 p-3">
      <div className="relative">
        <Search
          size={15}
          strokeWidth={1.8}
          className="
            absolute
            left-3
            top-1/2
            -translate-y-1/2
            text-[#0D9488]
          "
        />

        <input
          type="search"
          placeholder={section.placeholder || "Search..."}
          className="
            h-10
            w-full
            rounded-lg
            border
            border-slate-200
            bg-slate-50
            pl-9
            pr-3
            text-xs
            text-slate-700
            outline-none
            transition-all
            duration-200
            placeholder:text-slate-400
            focus:border-[#0F766E]
            focus:bg-white
            focus:ring-2
            focus:ring-[#0F766E]/10
          "
        />
      </div>
    </div>
  );
}


/* =========================================================
   HEADING
   ========================================================= */

function DropdownHeading({ section }) {
  return (
    <div className="shrink-0 border-b border-slate-100 px-5 py-3">
      <div className="text-[12px] font-bold text-[#115E59]">
        {section.text}
      </div>
    </div>
  );
}


/* =========================================================
   COLUMN SECTION
   ========================================================= */

function ColumnSection({ section }) {
  const count = section.columns?.length || 1;

  let gridClass = "grid-cols-1";

  if (count === 2) {
    gridClass = "grid-cols-2";
  } else if (count === 3) {
    gridClass = "grid-cols-3";
  } else if (count === 4) {
    gridClass = "grid-cols-4";
  } else if (count >= 5) {
    gridClass = "grid-cols-5";
  }

  return (
    <div
      className={`
        grid
        ${gridClass}
        gap-x-6
        gap-y-5
        px-4
        py-4
      `}
    >
      {section.columns?.map((column, columnIndex) => (
        <div
          key={columnIndex}
          className="min-w-0"
        >
          {column.title && (() => {
            const className = `
              mb-2.5
              flex
              items-center
              gap-1.5
              border-b
              border-slate-100
              pb-2
              text-[11px]
              font-bold
              uppercase
              tracking-wide
              text-slate-800
            `;
            const content = (
              <>
                {column.icon && !isImageIcon(column.icon) && <span aria-hidden className="text-[13px] normal-case">{column.icon}</span>}
                <span className="line-clamp-2">{column.title}</span>
              </>
            );
            // A column heading is a link only when the CMS gave it a real URL.
            return column.url ? (
              <Link href={cleanUrl(column.url)} className={`${className} transition-colors hover:text-[#0F766E]`}>{content}</Link>
            ) : (
              <div className={className}>{content}</div>
            );
          })()}

          <div className="space-y-1">
            {column.items?.map((item, itemIndex) => (
              <DropdownItem
                key={itemIndex}
                item={item}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}


/* =========================================================
   LINKS SECTION
   ========================================================= */

function LinksSection({ section }) {
  const links = section.links || [];

  return (
    <div
      className={`
        shrink-0
        px-5
        py-4
        ${section.title ? "border-t border-slate-100" : ""}
      `}
    >
      {section.title && (
        <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          {section.title}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1">
        {links.map((link, index) => {
          const Icon = getLabelIcon(link.label);

          return (
            <Link
              key={index}
              href={cleanUrl(link.url)}
              target={link.target}
              className="
                group/link
                flex
                min-w-0
                items-center
                gap-2
                rounded-lg
                px-2
                py-2
                transition
                duration-150
                hover:bg-[#0F766E]/[0.07]
              "
            >
              <span
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-md
                  bg-[#0F766E]/[0.09]
                  text-[#0F766E]
                  transition
                  duration-150
                  group-hover/link:bg-[#0F766E]/[0.15]
                "
              >
                <Icon
                  size={13}
                  strokeWidth={1.8}
                />
              </span>

              <span className="min-w-0">
                <span className="block truncate text-[11px] font-medium text-slate-600 group-hover/link:text-[#0F766E]">
                  {link.label}
                </span>

                {link.desc && (
                  <span className="mt-0.5 block truncate text-[9px] text-slate-400">
                    {link.desc}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}


/* =========================================================
   NOTE SECTION
   ========================================================= */

function NoteSection({ section }) {
  return (
    <div className="shrink-0 border-t border-slate-100 bg-[#F0FDFA] px-5 py-2.5 text-[11px]">
      <strong className="mr-1 text-[#0F766E]">
        {section.bold}
      </strong>

      <span className="text-slate-500">
        {section.text}
      </span>

      {section.link && (
        <Link
          href={cleanUrl(section.link.url)}
          className="ml-2 font-semibold text-[#115E59] hover:underline"
        >
          {section.link.label}
        </Link>
      )}
    </div>
  );
}


/* =========================================================
   DROPDOWN CONTENT
   ========================================================= */

function DropdownContent({ item }) {
  return (
    <>
      {item.dropdown?.sections?.map((section, index) => {
        if (section.type === "search") {
          return (
            <SearchSection
              key={index}
              section={section}
            />
          );
        }

        if (section.type === "heading") {
          return (
            <DropdownHeading
              key={index}
              section={section}
            />
          );
        }

        if (section.type === "columns") {
          return (
            <ColumnSection
              key={index}
              section={section}
            />
          );
        }

        if (section.type === "links") {
          return (
            <LinksSection
              key={index}
              section={section}
            />
          );
        }

        if (section.type === "note") {
          return (
            <NoteSection
              key={index}
              section={section}
            />
          );
        }

        return null;
      })}
    </>
  );
}

function getDropdownOptionCount(item) {
  return item?.dropdown?.sections?.reduce((count, section) => (
    count
    + (section.columns || []).reduce(
      (columnCount, column) => columnCount + (column.items?.length || 0),
      0
    )
    + (section.links?.length || 0)
  ), 0) || 0;
}

function getDropdownColumnCount(item) {
  return item?.dropdown?.sections?.reduce(
    (count, section) => Math.max(count, section.columns?.length || 0),
    0
  ) || 1;
}

function getDropdownWidthClass(item) {
  const columnCount = getDropdownColumnCount(item);

  if (columnCount === 1) return "w-[min(360px,calc(100vw-24px))]";
  if (columnCount === 2) return "w-[min(620px,calc(100vw-24px))]";
  if (columnCount === 3) return "w-[min(880px,calc(100vw-24px))]";
  return "w-[min(1200px,calc(100vw-32px))]";
}

function filterDropdownItem(item, query) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return item;

  return {
    ...item,
    dropdown: {
      ...item.dropdown,
      sections: item.dropdown?.sections?.map((section) => ({
        ...section,
        columns: section.columns?.map((column) => ({
          ...column,
          items: column.items?.filter((entry) =>
            entry.label?.toLowerCase().includes(normalizedQuery)
          ),
        })).filter((column) => column.items?.length),
        links: section.links?.filter((entry) =>
          entry.label?.toLowerCase().includes(normalizedQuery)
        ),
      })),
    },
  };
}

function DropdownFilter({ value, onChange }) {
  return (
    <div className="shrink-0 border-b border-slate-100 p-3">
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0D9488]" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Search in this menu..."
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-700 outline-none transition focus:border-[#0F766E] focus:bg-white focus:ring-2 focus:ring-[#0F766E]/10"
        />
      </div>
    </div>
  );
}


/* =========================================================
   DESKTOP DROPDOWN
   ========================================================= */

function DesktopDropdown({
  item,
  mega = false,
  open = false,
  alignRight = false,
}) {
  const [query, setQuery] = useState("");
  const dropdownRef = useRef(null);
  const [horizontalOffset, setHorizontalOffset] = useState(0);
  const optionCount = getDropdownOptionCount(item);
  const widthClass = getDropdownWidthClass(item);
  const showFilter = optionCount >= 10;
  const filteredItem = useMemo(
    () => filterDropdownItem(item, query),
    [item, query]
  );
  const hasResults = getDropdownOptionCount(filteredItem) > 0;

  // Horizontal placement: the panel is centred under its menu item, then pushed back inside the
  // viewport (16px margin, scrollbar excluded) when it would cross an edge. Measured from the
  // panel's natural position, i.e. with the current offset removed.
  const offsetRef = useRef(0);

  useLayoutEffect(() => {
    if (!open) return undefined;

    const place = () => {
      const panel = dropdownRef.current;
      const anchor = panel?.parentElement;
      if (!panel || !anchor) return;

      const margin = 16;
      const viewport = document.documentElement.clientWidth;
      const itemRect = anchor.getBoundingClientRect();
      // Layout box (offsetLeft / offsetWidth), not the bounding rect: the open/close animation
      // scales the panel, which would skew the measurement.
      const width = Math.min(panel.offsetWidth, viewport - margin * 2);
      const naturalLeft = itemRect.left + panel.offsetLeft;
      const desired = itemRect.left + itemRect.width / 2 - width / 2;
      // Stay within the header's content column (data-nav-bounds) when the panel fits in it,
      // so it lines up with the menu row; otherwise within the viewport.
      const bounds = anchor.closest("[data-nav-bounds]")?.getBoundingClientRect();
      const fitsBounds = bounds && width <= bounds.width;
      const min = fitsBounds ? Math.max(bounds.left, margin) : margin;
      const max = fitsBounds ? Math.min(bounds.right, viewport - margin) - width : viewport - margin - width;
      const left = Math.min(Math.max(desired, min), max);
      const next = Math.round(left - naturalLeft);

      if (next !== offsetRef.current) {
        offsetRef.current = next;
        setHorizontalOffset(next);
      }
    };

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  if (!item?.dropdown) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      style={{
        transform: `translate(${horizontalOffset}px, ${open ? 0 : mega ? 8 : 4}px) scale(${open ? 1 : 0.985})`,
      }}
      className={`
        ${open ? "pointer-events-auto visible opacity-100" : "pointer-events-none invisible opacity-0"}
        absolute
        top-full
        z-[999]
        overflow-hidden
        rounded-2xl
        border
        border-slate-200/80
        bg-white
        shadow-[0_18px_50px_rgba(15,23,42,0.14)]
        transition-all
        duration-200
        ease-out

        ${mega
          ? `
              ${widthClass}
              ${alignRight ? "right-0 origin-top-right" : "left-0 origin-top-left"}
            `
          : `
              ${widthClass}
              ${alignRight ? "right-0 origin-top-right" : "left-0 origin-top-left"}
            `
        }
      `}
    >
      {showFilter && <DropdownFilter value={query} onChange={setQuery} />}

      <div
        className="
          max-h-[calc(100vh-145px)]
          overflow-y-auto
          overscroll-contain

          [&::-webkit-scrollbar]:w-1.5
          [&::-webkit-scrollbar-track]:bg-slate-100
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:bg-[#99F6E4]
          hover:[&::-webkit-scrollbar-thumb]:bg-[#0D9488]
        "
      >
        {hasResults ? (
          <DropdownContent item={filteredItem} />
        ) : (
          <p className="px-5 py-6 text-center text-sm text-slate-500">No matching services found.</p>
        )}
      </div>
      <ViewAllLink item={item} />
    </div>
  );
}

/** "View all <item> (n) →" under a dropdown: the item's explore page (navigationService exploreUrl). */
function ViewAllLink({ item, onClick, mobile = false }) {
  if (!item?.exploreUrl) return null;
  const count = getDropdownOptionCount(item);
  return (
    <Link
      href={item.exploreUrl}
      onClick={onClick}
      className={mobile
        ? "mt-1 flex items-center justify-between rounded-lg bg-[#F0FDFA] px-3 py-2 text-xs font-semibold text-[#0F766E]"
        : "flex items-center justify-between border-t border-slate-100 bg-[#F8FAFC] px-5 py-2.5 text-[12.5px] font-semibold text-[#0F766E] transition-colors hover:bg-[#F0FDFA]"}
    >
      <span>View all {item.label}{count ? ` (${count})` : ""}</span>
      <span aria-hidden>→</span>
    </Link>
  );
}


/* =========================================================
   TOPBAR ITEM
   ========================================================= */

function TopbarItem({ item, alignRight }) {
  const [open, setOpen] = useState(false);
  const hasDropdown = Boolean(item.dropdown);

  return (
    <div
      className="group relative flex h-9 items-center"
      onMouseEnter={() => hasDropdown && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClickCapture={(e) => {
        if (e.target.closest("a")) setOpen(false);
      }}
    >
      {hasDropdown ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="menu"
          className={`
            flex
            h-9
            shrink-0
            items-center
            gap-1.5
            rounded-lg
            px-2 xl:px-3
            text-[12px]
            font-medium
            transition-all
            duration-200

            ${item.id === "taxpedia"
              ? "bg-[#CCFBF1] text-[#115E59] hover:bg-[#99F6E4]"
              : item.id === "gem-services"
                ? "bg-[#DFF7F3] text-[#0F766E] hover:bg-[#C8EFE9]"
                : item.id === "quick-update"
                  ? "bg-[#E6F7F5] text-[#0D9488] hover:bg-[#CFF0EC]"
                  : "text-slate-700 hover:bg-[#F0FDFA] hover:text-[#0F766E]"
            }
          `}
        >
          <NavIcon item={item} size={14} />
          <span className="whitespace-nowrap">{item.label}</span>
          <ChevronDown size={11} strokeWidth={2} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
      ) : (
      <Link
        href={cleanUrl(item.url)}
        target={item.target}
        className={`
          flex
          h-9
          shrink-0
          items-center
          gap-1.5
          rounded-lg
          px-2 xl:px-3
          text-[12px]
          font-medium
          transition-all
          duration-200

          ${item.id === "taxpedia"
            ? "bg-[#CCFBF1] text-[#115E59] hover:bg-[#99F6E4]"
            : item.id === "gem-services"
              ? "bg-[#DFF7F3] text-[#0F766E] hover:bg-[#C8EFE9]"
              : item.id === "quick-update"
                ? "bg-[#E6F7F5] text-[#0D9488] hover:bg-[#CFF0EC]"
                : "text-slate-700 hover:bg-[#F0FDFA] hover:text-[#0F766E]"
          }
        `}
      >
        <NavIcon item={item} size={14} />

        <span className="whitespace-nowrap">
          {item.label}
        </span>

      </Link>
      )}

      <DesktopDropdown item={item} open={open} alignRight={alignRight} />
    </div>
  );
}


/* =========================================================
   MAIN NAV ITEM
   ========================================================= */

function MainNavItem({ item, alignRight }) {
  const Icon = getIdIcon(item.id);
  const [open, setOpen] = useState(false);
  const hasDropdown = Boolean(item.dropdown);

  return (
    <div
      className="group relative flex h-full shrink-0 items-center"
      onMouseEnter={() => hasDropdown && setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClickCapture={(e) => {
        if (e.target.closest("a")) setOpen(false);
      }}
    >
      {hasDropdown ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-haspopup="menu"
        className="
          relative
          flex
          h-full
          shrink-0
          items-center
          gap-1
          whitespace-nowrap
          border-b-2
          border-transparent
          px-1.5 xl:px-2.5
          text-[13px]
          font-semibold
          text-[#134E4A]
          transition-all
          duration-200
          hover:border-[#0F766E]
          hover:text-[#0F766E]
        "
      >
        {item.showIconInBar && createElement(Icon, { size: 13 })}

        <span>
          {item.label}
        </span>

        <ChevronDown size={10} strokeWidth={2} className={`shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      ) : (
      <Link
        href={cleanUrl(item.url)}
        target={item.target}
        className="
          relative
          flex
          h-full
          shrink-0
          items-center
          gap-1
          whitespace-nowrap
          border-b-2
          border-transparent
          px-1.5 xl:px-2.5
          text-[13px]
          font-semibold
          text-[#134E4A]
          transition-all
          duration-200
          hover:border-[#0F766E]
          hover:text-[#0F766E]
        "
      >
        {item.showIconInBar && createElement(Icon, { size: 13 })}
        <span>{item.label}</span>
      </Link>
      )}

      <DesktopDropdown
        item={item}
        mega
        open={open}
        alignRight={alignRight}
      />
    </div>
  );
}


/* =========================================================
   MOBILE SECTION
   ========================================================= */

function MobileSection({
  item,
  closeMenu,
}) {
  const [query, setQuery] = useState("");
  const showFilter = getDropdownOptionCount(item) >= 10;
  const filteredItem = useMemo(
    () => filterDropdownItem(item, query),
    [item, query]
  );
  const hasResults = getDropdownOptionCount(filteredItem) > 0;

  return (
    <div className="space-y-4">
      {showFilter && <DropdownFilter value={query} onChange={setQuery} />}

      {hasResults ? filteredItem.dropdown?.sections?.map(
        (section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.columns?.map(
              (column, columnIndex) => (
                <div
                  key={columnIndex}
                  className="mb-4"
                >
                  {column.title && (
                    <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-[#0F766E]">
                      {column.title}
                    </div>
                  )}

                  {column.items?.map(
                    (subItem, subIndex) => (
                      <Link
                        key={subIndex}
                        href={cleanUrl(subItem.url)}
                        target={subItem.target}
                        onClick={closeMenu}
                        className="
                          group/item
                          flex
                          items-center
                          gap-2.5
                          rounded-lg
                          px-2
                          py-1.5
                          text-xs
                          text-slate-600
                          transition
                          hover:bg-white
                          hover:text-[#0F766E]
                        "
                      >
                        <MenuIcon value={subItem.icon} small />
                        <span className="min-w-0 truncate">{subItem.label}</span>
                      </Link>
                    )
                  )}
                </div>
              )
            )}

            {section.links?.map(
              (link, linkIndex) => (
                <Link
                  key={linkIndex}
                  href={cleanUrl(link.url)}
                  target={link.target}
                  onClick={closeMenu}
                  className="
                    block
                    rounded-lg
                    px-2
                    py-2
                    text-xs
                    text-slate-600
                    transition
                    hover:bg-white
                    hover:text-[#0F766E]
                  "
                >
                  {link.label}
                </Link>
              )
            )}
          </div>
        )
      ) : (
        <p className="px-2 py-3 text-center text-xs text-slate-500">No matching services found.</p>
      )}
      <ViewAllLink item={item} onClick={closeMenu} mobile />
    </div>
  );
}


/* =========================================================
   MOBILE ITEM
   ========================================================= */

function MobileMenuItem({
  item,
  expanded,
  setExpanded,
  closeMenu,
}) {

  return (
    <div className="border-b border-slate-100">
      <div className="flex items-center">
        {item.dropdown ? (
          <button
            type="button"
            onClick={() => setExpanded(expanded ? null : item.id)}
            aria-expanded={expanded}
            aria-controls={`mobile-menu-${item.id}`}
            className="flex min-w-0 flex-1 items-center gap-3 px-5 py-3.5 text-left text-sm font-semibold text-slate-700"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#CCFBF1] text-[#0F766E]"
            >
              <NavIcon item={item} size={16} />
            </span>
            <span className="truncate">{item.label}</span>
            <ChevronDown
              size={16}
              className={`ml-auto shrink-0 text-slate-400 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        ) : (
        <Link
          href={cleanUrl(item.url)}
          target={item.target}
          onClick={() => {
            closeMenu();
          }}
          className="
            flex
            min-w-0
            flex-1
            items-center
            gap-3
            px-5
            py-3.5
            text-sm
            font-semibold
            text-slate-700
          "
        >
          <span
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              bg-[#CCFBF1]
              text-[#0F766E]
            "
          >
            <NavIcon item={item} size={16} />
          </span>

          <span className="truncate">
            {item.label}
          </span>
        </Link>
        )}
      </div>

      <div
        className={`
          grid
          transition-all
          duration-300
          ${expanded
            ? "grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
          }
        `}
      >
        <div id={`mobile-menu-${item.id}`} className="overflow-hidden">
          <div className="bg-[#F0FDFA] px-5 py-3">
            <MobileSection
              item={item}
              closeMenu={closeMenu}
            />
          </div>
        </div>
      </div>
    </div>
  );
}


/* =========================================================
   HEADER
   ========================================================= */

export default function Header({ navigation = {}, branding = {} }) {
  // Logo from Settings → Organization: the dark-mode logo when the site is in dark mode.
  const { theme } = useTheme() || {};
  const logo = (theme === "dark" ? branding.darkLogo : branding.lightLogo) || branding.logo || "/logo.png";
  const logoAlt = branding.name || "Tax Alphonic";

  const [mobileOpen, setMobileOpen] =
    useState(false);

  const [mobileExpanded, setMobileExpanded] =
    useState(null);

  const topbarItems =
    navigation?.topbar?.filter(
      (item) =>
        item.enabled !== false
    ) || [];

  const megaItems =
    navigation?.megabar?.filter(
      (item) =>
        item.enabled !== false
    ) || [];

  const drawerOrder =
    navigation?.drawer?.order || [];

  const allItems = [
    ...topbarItems,
    ...megaItems,
    ...(navigation?.drawerOnly
      ? Object.values(
        navigation.drawerOnly
      )
      : []),
  ];

  const drawerItems =
    drawerOrder
      .map((id) =>
        allItems.find(
          (item) =>
            item.id === id
        )
      )
      .filter(Boolean);

  return (
    <>
      {/* =====================================================
          DESKTOP HEADER
      ===================================================== */}

      <header
        className="
          relative
          z-[900]
          w-full
          border-t
          border-[#CCFBF1]
          bg-white
          shadow-sm
        "
      >
        {/* ================================================
            TOP ROW
        ================================================= */}

        <div className="border-b border-[#E6F7F5] bg-white">
          <div
            data-nav-bounds
            className="
              mx-auto
              flex
              min-h-[72px]
              max-w-[1280px]
              items-center
              gap-3
              px-3
            "
          >
            {/* LOGO */}

            <Link
              href="/"
              className="flex shrink-0 items-center"
            >
              <img
                src={logo}
                alt={logoAlt}
                className="h-[52px] w-auto max-w-[118px] object-contain"
              />
            </Link>

            {/* SEARCH */}

            <div
              className="
                relative
                hidden
                min-w-[140px]
                max-w-[390px]
                flex-1
                md:block
              "
            >
              <Search
                size={16}
                strokeWidth={1.8}
                className="
                  absolute
                  left-3
                  top-1/2
                  -translate-y-1/2
                  text-[#0F766E]
                "
              />

              <NavigationSearch navigation={navigation} />
            </div>

            {/* TOPBAR: keeps its natural width so long labels squeeze the search box instead of overlapping it */}

            <nav
              className="
                ml-auto
                hidden
                shrink-0
                items-center
                justify-end
                gap-1
                lg:flex
              "
            >
              {topbarItems.map(
                (item, index) => (
                  <TopbarItem
                    key={item.id}
                    item={item}
                    alignRight={index >= Math.ceil(topbarItems.length / 2)}
                  />
                )
              )}
            </nav>

            {/* MOBILE MENU BUTTON */}

            <button
              type="button"
              onClick={() =>
                setMobileOpen(true)
              }
              className="
                ml-auto
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-slate-200
                text-slate-700
                transition
                hover:border-[#0F766E]
                hover:text-[#0F766E]
                lg:hidden
              "
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        {/* ================================================
            MAIN NAV
        ================================================= */}

        <div
          className="
            hidden
            border-b
            border-[#99F6E4]
            bg-[#E6F7F5]
            lg:block
          "
        >
          <div
            data-nav-bounds
            className="
              mx-auto
              max-w-[1280px]
              px-3
            "
          >
            <nav
              className="
                flex
                h-[52px]
                items-center
                gap-0
                overflow-visible
                whitespace-nowrap
              "
            >
              {megaItems.map(
                (item, index) => (
                  <MainNavItem
                    key={item.id}
                    item={item}
                    alignRight={index >= Math.ceil(megaItems.length / 2)}
                  />
                )
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* =====================================================
          MOBILE BACKDROP
      ===================================================== */}

      <div
        onClick={() =>
          setMobileOpen(false)
        }
        className={`
          fixed
          inset-0
          z-[1000]
          bg-slate-950/40
          backdrop-blur-[2px]
          transition-opacity
          duration-300
          lg:hidden
          ${mobileOpen
            ? "visible opacity-100"
            : "invisible opacity-0"
          }
        `}
      />

      {/* =====================================================
          MOBILE DRAWER
      ===================================================== */}

      <aside
        className={`
          fixed
          right-0
          top-0
          z-[1010]
          flex
          h-dvh
          w-[88vw]
          max-w-[390px]
          flex-col
          bg-white
          shadow-2xl
          transition-transform
          duration-300
          ease-out
          lg:hidden
          ${mobileOpen
            ? "translate-x-0"
            : "translate-x-full"
          }
        `}
      >
        {/* Drawer Header */}

        <div
          className="
            flex
            h-[64px]
            shrink-0
            items-center
            justify-between
            border-b
            border-slate-100
            px-4
          "
        >
          <Link
            href="/"
            onClick={() =>
              setMobileOpen(false)
            }
          >
            <img
              src={logo}
              alt={logoAlt}
              className="h-11 w-auto"
            />
          </Link>

          <button
            type="button"
            onClick={() =>
              setMobileOpen(false)
            }
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-lg
              bg-[#F0FDFA]
              text-[#115E59]
              transition
              hover:bg-[#CCFBF1]
              hover:text-[#0F766E]
            "
          >
            <X size={19} />
          </button>
        </div>

        {/* Mobile Search */}

        <div className="shrink-0 border-b border-slate-100 p-3">
          <div className="relative">
            <Search
              size={15}
              className="
                absolute
                left-3
                top-1/2
                -translate-y-1/2
                text-[#0F766E]
              "
            />

            <NavigationSearch
              navigation={navigation}
              placeholder="Search services & Taxpedia..."
            />
          </div>
        </div>

        {/* Mobile Nav — SCROLLABLE */}

        <div
          className="
            min-h-0
            flex-1
            overflow-y-auto
            overscroll-contain

            [&::-webkit-scrollbar]:w-1.5
            [&::-webkit-scrollbar-track]:bg-slate-100
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-[#99F6E4]
          "
        >
          {drawerItems.map(
            (item) => (
              <MobileMenuItem
                key={item.id}
                item={item}
                expanded={
                  mobileExpanded ===
                  item.id
                }
                setExpanded={
                  setMobileExpanded
                }
                closeMenu={() =>
                  setMobileOpen(false)
                }
              />
            )
          )}
        </div>
      </aside>
    </>
  );
}
