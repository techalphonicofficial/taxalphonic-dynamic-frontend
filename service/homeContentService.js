import { apiClient } from "@/service/apiClient";
import { normalizeAssetUrl } from "@/service/servicePageService";
import { cache } from "react";
import { getPageBySlug } from "@/service/pageService";

// Records from the CMS content modules (Testimonials, Team Members, FAQs, Banners,
// Branches, Partners & Clients, Global Presence, Portfolio) for the homepage blocks that show them.

function rows(payload) {
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  return [];
}

const byOrder = (a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0);

/** Published/active records of one module, in display order. Never throws. */
const loadModule = cache(async function loadModule(path, status) {
  try {
    const payload = await apiClient(`/api/v1/${path}?status=${status}&limit=200`, { cache: "no-store" });
    return rows(payload).filter((row) => row && row.status === status).sort(byOrder);
  } catch (error) {
    console.error(`Unable to load ${path} for the homepage.`, error);
    return [];
  }
});

const asset = (url) => (url ? normalizeAssetUrl(url) : "");

function isLive(banner, now) {
  const start = banner.startDate ? new Date(banner.startDate) : null;
  const end = banner.endDate ? new Date(banner.endDate) : null;
  return (!start || start <= now) && (!end || end >= now);
}

/** Published portfolio items (admin: Portfolio) in their order, newest first within the same order. */
const loadPortfolio = cache(async function loadPortfolio() {
  try {
    const payload = await apiClient("/api/v1/portfolio-items?status=published&limit=500&sortBy=sortOrder&sortOrder=ASC", { cache: "no-store" });
    return rows(payload).filter((row) => row && row.status === "published" && row.image);
  } catch (error) {
    console.error("Unable to load portfolio items for the homepage.", error);
    return [];
  }
});

// Each loader returns items in the shape the matching block renders.
const LOADERS = {
  testimonials: async () => (await loadModule("testimonials", "published")).map((t) => ({
    quote: t.content || "",
    name: t.authorName || "",
    role: [t.authorRole, t.company].filter(Boolean).join(", "),
    rating: String(t.rating ?? 5),
    avatar: asset(t.avatarUrl),
  })),
  faqs: async () => (await loadModule("faqs", "published")).map((f) => ({
    question: f.question || "",
    answer: f.answer || "",
    category: f.category || "",
  })),
  partners: async () => (await loadModule("partners", "active")).map((p) => ({
    name: p.name || "",
    logo: asset(p.logoUrl),
    url: p.websiteUrl || "",
  })),
  team: async () => (await loadModule("team", "published")).map((m) => ({
    name: m.name || "",
    role: m.role || "",
    bio: m.bio || "",
    image: asset(m.imageUrl),
  })),
  banners: async () => {
    const now = new Date();
    return (await loadModule("banners", "published")).filter((b) => b.imageUrl && isLive(b, now)).map((b) => ({
      title: b.title || "",
      subtitle: b.subtitle || "",
      text: b.description || "",
      image: asset(b.imageUrl),
      mobileImage: asset(b.mobileImageUrl),
      buttonText: b.buttonText || "",
      url: b.linkUrl || "",
      newTab: b.linkTarget === "_blank",
      align: b.textAlignment || "left",
      theme: b.textColorTheme || "light",
    }));
  },
  branches: async () => (await loadModule("branches", "active")).map((b) => ({
    name: b.name || "",
    address: [b.address, b.city, b.state, b.pincode].filter(Boolean).join(", "),
    country: b.country || "",
    phone: b.phone || "",
    email: b.email || "",
    manager: b.managerName || "",
    hours: b.openingHours || "",
    isHeadOffice: Boolean(b.isHeadOffice),
  })),
  // group = the top-level category (e.g. Website Development), used for the filter tabs.
  portfolio: async () => (await loadPortfolio()).map((p) => {
    const group = p.category?.parent || p.category || null;
    return {
      title: p.title || "",
      image: asset(p.image),
      url: p.websiteUrl || "",
      client: p.clientName || "",
      category: p.category ? { id: p.category.id, name: p.category.name } : null,
      group: group ? { id: group.id, name: group.name } : null,
    };
  }),
  countries: async () => (await loadModule("countries", "active")).map((c) => ({
    name: c.name || "",
    flag: asset(c.flagUrl),
  })),
};

// Block type -> module. Blocks marked `optional` also accept hand-written items
// (payload.source === "manual"); the module-only blocks always use the module.
const MODULE_BLOCKS = {
  HomeTestimonials: { module: "testimonials", optional: true },
  HomeFaq: { module: "faqs", optional: true },
  HomeClients: { module: "partners", optional: true },
  HomeTeam: { module: "team" },
  HomeBanners: { module: "banners" },
  HomeBranches: { module: "branches" },
  HomeGlobalPresence: { module: "countries" },
  HomePortfolio: { module: "portfolio" },
};

const limitItems = (items, limit) => {
  const n = parseInt(limit, 10);
  return n > 0 ? items.slice(0, n) : items;
};

/**
 * Fills `payload.items` of module-backed blocks with live CMS records. An optional block
 * keeps its own items when set to "manual", or when the module has nothing published,
 * so the section never turns up empty.
 */
/**
 * Free Tool blocks (CommonTool, source "page"): the calculator and settings of the chosen
 * published tool page (its ToolCalculator block) as payload.tool; null when that page is not live.
 */
const toolSlugOf = (section) => String(section.payload.toolSlug).split("/").filter(Boolean).join("/");

async function attachTools(sections) {
  const slugs = [...new Set(sections
    .filter((s) => s.type === "CommonTool" && s.payload?.source !== "calculator" && s.payload?.toolSlug)
    .map((s) => toolSlugOf(s)))];
  if (!slugs.length) return sections;
  const tools = Object.fromEntries(await Promise.all(slugs.map(async (slug) => {
    const page = await getPageBySlug(slug).catch(() => null);
    const calc = page?.sections?.find((s) => s.type === "ToolCalculator")?.payload;
    return [slug, calc?.calculator ? { calculator: calc.calculator, settings: calc.settings || {}, title: page.title } : null];
  })));
  return sections.map((s) => (s.type === "CommonTool" && s.payload?.source !== "calculator" && s.payload?.toolSlug
    ? { ...s, payload: { ...s.payload, tool: tools[toolSlugOf(s)] || null } }
    : s));
}

export async function attachModuleContent(rawSections) {
  const sections = await attachTools(rawSections);
  const needed = new Set(
    sections
      .map((s) => MODULE_BLOCKS[s.type])
      .filter(Boolean)
      .map((b) => b.module)
  );
  const loaded = Object.fromEntries(await Promise.all([...needed].map(async (m) => [m, await LOADERS[m]()])));

  return sections.map((section) => {
    const block = MODULE_BLOCKS[section.type];
    if (!block) return section;
    const payload = section.payload || {};
    if (block.optional && payload.source === "manual") return section;

    let items = loaded[block.module] || [];
    if (section.type === "HomeFaq" && payload.category) {
      items = items.filter((f) => f.category === payload.category);
    }
    if (section.type === "HomePortfolio") {
      // Switched off in the admin: no items, so the block renders nothing.
      if (payload.show === "hide") return { ...section, payload: { ...payload, items: [] } };
      if (payload.categoryId) items = items.filter((p) => p.group?.id === payload.categoryId || p.category?.id === payload.categoryId);
      // "limit" is how many show at first (the block has a Show more button), so every item is sent.
      return { ...section, payload: { ...payload, items } };
    }
    items = limitItems(items, payload.limit);
    if (!items.length && block.optional) return section;
    return { ...section, payload: { ...payload, items } };
  });
}
