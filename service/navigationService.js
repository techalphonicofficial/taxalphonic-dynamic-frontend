import { apiClient } from "@/service/apiClient";
import { normalizeAssetUrl } from "@/service/servicePageService";

const headerMenuPath = "/api/v1/menus?page=1&limit=50&sortBy=createdAt&sortOrder=ASC";
// The first five header menu items sit in the top bar beside search (Taxpedia, GeM Services,
// Quick Update, Government Notices, Loan Bazar in the reference); the rest form the main nav row.
const topbarItemCount = 5;
const emptyNavigation = {
  topbar: [],
  megabar: [],
  drawer: { order: [] },
  drawerOnly: {},
};

function sortByDisplayOrder(items = []) {
  return [...items].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

function cleanMenuUrl(url) {
  const value = String(url || "").trim();
  return !value || /^javascript:/i.test(value) ? "#" : value;
}

function toDropdownColumns(items) {
  const columnCount = items.length > 12 ? 3 : items.length > 6 ? 2 : 1;
  const size = Math.ceil(items.length / columnCount);

  return Array.from({ length: columnCount }, (_, index) => ({
    items: items.slice(index * size, (index + 1) * size),
  })).filter((column) => column.items.length);
}

/** Menu item icon (admin: emoji or Media image); image paths become absolute URLs. */
function menuIcon(value) {
  const icon = String(value || "").trim();
  if (!icon) return "";
  return /^(\/|uploads\/)/i.test(icon) || /\.(png|jpe?g|webp|gif|svg|avif)(\?.*)?$/i.test(icon) ? normalizeAssetUrl(icon) : icon;
}

function toLink(item) {
  return {
    id: item.id,
    label: item.title?.trim() || "Untitled",
    url: cleanMenuUrl(item.url),
    target: item.target || "_self",
    icon: menuIcon(item.icon),
  };
}

/**
 * Dropdown columns of a header item. Two levels (menu → links): the links are split into up to
 * three columns. Three levels (menu → column heading → links): one titled column per heading;
 * links placed directly under the menu form one untitled column first.
 */
function dropdownColumns(children) {
  const nested = children.some((child) => child.children?.length);
  if (!nested) return toDropdownColumns(children.map(toLink));

  const loose = children.filter((child) => !child.children?.length).map(toLink);
  return [
    ...(loose.length ? [{ items: loose }] : []),
    ...children.filter((child) => child.children?.length).map((child) => {
      const heading = toLink(child);
      return {
        title: heading.label,
        url: heading.url !== "#" ? heading.url : "",
        icon: heading.icon,
        items: sortByDisplayOrder(child.children).map(toLink),
      };
    }),
  ];
}

function mapMenuItem(item) {
  const children = sortByDisplayOrder(Array.isArray(item.children) ? item.children : []);

  return {
    ...toLink(item),
    enabled: true,
    dropdown: children.length
      ? {
          sections: [{
            type: "columns",
            columns: dropdownColumns(children),
          }],
        }
      : undefined,
  };
}

const aboutLink = { id: "about", label: "About", url: "/about", target: "_self", enabled: true };

function isAboutItem(item) {
  return item.url?.replace(/\/+$/, "") === "/about" || /^about( us)?$/i.test(item.label?.trim() || "");
}

/** Points a CMS "About"/"About Us" item at the built-in /about page instead of adding a second one. */
function pointAboutItems(items) {
  return items.map((item) => (isAboutItem(item) && !item.dropdown ? { ...item, url: aboutLink.url } : item));
}

/** Appends the built-in About page to the end of the main nav unless the CMS already has one. */
function withHeaderAbout(navigation) {
  const withAbout = [...navigation.topbar, ...navigation.megabar].some(isAboutItem)
    ? { ...navigation, topbar: pointAboutItems(navigation.topbar), megabar: pointAboutItems(navigation.megabar) }
    : { ...navigation, megabar: [...navigation.megabar, aboutLink], drawer: { order: [...navigation.drawer.order, aboutLink.id] } };
  return withHeaderBlog(withAbout);
}

function withFooterAbout(items) {
  const withAbout = items.some(isAboutItem) ? pointAboutItems(items) : [...items, aboutLink];
  return withAbout.some(isBlogItem) ? withAbout : [...withAbout, blogLink];
}

// The blog (/blog) is built in too: added after About unless the CMS menu already links to it.
const blogLink = { id: "blog", label: "Blog", url: "/blog", target: "_self", enabled: true };

function isBlogItem(item) {
  return /^\/blogs?\/?$/.test(item.url || "") || (/^blogs?$/i.test(item.label?.trim() || "") && !item.dropdown);
}

function withHeaderBlog(navigation) {
  if ([...navigation.topbar, ...navigation.megabar].some(isBlogItem)) return navigation;
  return {
    ...navigation,
    megabar: [...navigation.megabar, blogLink],
    drawer: { order: [...navigation.drawer.order, blogLink.id] },
  };
}

function mapHeaderMenu(payload) {
  const menus = payload?.data?.data;
  const headerMenu = Array.isArray(menus)
    ? menus.find((menu) => menu.location === "header" && menu.status === "active")
    : null;

  if (!headerMenu || !Array.isArray(headerMenu.items)) return emptyNavigation;

  const items = sortByDisplayOrder(headerMenu.items);

  return {
    // First five API-ordered menus sit beside search; the rest stay in the main nav row.
    topbar: items.slice(0, topbarItemCount).map(mapMenuItem),
    megabar: items.slice(topbarItemCount).map(mapMenuItem),
    drawer: { order: items.map((item) => item.id) },
    drawerOnly: {},
  };
}

const footerFallback = [
  { id: "services", label: "Services", url: "/directory/services", target: "_self" },
  { id: "taxpedia", label: "Taxpedia", url: "/taxpedia", target: "_self" },
  { id: "about", label: "About Us", url: "/about", target: "_self" },
  { id: "contact", label: "Contact", url: "/contact", target: "_self" },
];

function mapFooterMenu(payload) {
  const menus = payload?.data?.data;
  const footerMenu = Array.isArray(menus)
    ? menus.find((menu) => menu.location === "footer" && menu.status === "active")
    : null;

  if (!footerMenu || !Array.isArray(footerMenu.items)) return { items: footerFallback, settings: null };

  // Up to three levels: main heading → column heading → link (see components/layout/Footer.jsx).
  const toLink = (item) => ({
    id: item.id,
    label: item.title?.trim() || "Untitled",
    url: cleanMenuUrl(item.url),
    target: item.target || "_self",
    children: sortByDisplayOrder(Array.isArray(item.children) ? item.children : []).map(toLink),
  });

  return {
    items: sortByDisplayOrder(footerMenu.items).map(toLink),
    // Footer Display options saved on the menu (see components/layout/footerDefaults.js).
    settings: parseSettings(footerMenu.settings),
  };
}

function parseSettings(value) {
  if (value && typeof value === "object") return value;
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

/** Fetches the active `location: header` menu and maps its nested items to Header.jsx. */
export async function getHeaderNavigation() {
  try {
    const payload = await apiClient(headerMenuPath, {
      cache: "no-store",
    });
    return withHeaderAbout(mapHeaderMenu(payload));
  } catch (error) {
    console.error("Unable to load header menu.", error);
    return withHeaderAbout(emptyNavigation);
  }
}

/** Fetches the active `location: footer` menu: its links (with sub-links) and Footer Display settings. */
export async function getFooterNavigation() {
  try {
    const payload = await apiClient(headerMenuPath, {
      cache: "no-store",
    });
    const menu = mapFooterMenu(payload);
    return { ...menu, items: withFooterAbout(menu.items) };
  } catch (error) {
    console.error("Unable to load footer menu; using local footer fallback.", error);
    return { items: withFooterAbout(footerFallback), settings: null };
  }
}
