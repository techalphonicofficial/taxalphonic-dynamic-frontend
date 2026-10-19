"use server";

import { apiClient } from "@/service/apiClient";
import { getServiceCategory, mapService } from "@/service/servicePageService";
import { getServiceLocations } from "@/service/serviceLocationsService";
import { mapSection } from "@/service/homePageService";
import { attachModuleContent } from "@/service/homeContentService";

/**
 * Server Action behind /cms-preview: turns the CMS admin's unsaved service draft into the same
 * shape as GET /services/slug/:slug, so ApiServicePage renders it exactly like the live page.
 * Form and Packages blocks carry only ids in the admin, so they are resolved here from the
 * public form and package endpoints (what the backend's SectionHydrator does on save).
 */

async function loadForm(formId) {
  if (!formId) return null;
  try {
    const payload = await apiClient(`/api/v1/forms/public/${encodeURIComponent(formId)}`, { cache: "no-store" });
    return payload?.success ? payload.data : null;
  } catch {
    return null;
  }
}

async function loadPackage(packageId) {
  if (!packageId) return null;
  try {
    const payload = await apiClient(`/api/v1/packages/${encodeURIComponent(packageId)}`, { cache: "no-store" });
    const pkg = payload?.success ? payload.data : null;
    return pkg && pkg.status !== "inactive" ? pkg : null;
  } catch {
    return null;
  }
}

async function hydrateSection(section) {
  const payload = section?.payload && typeof section.payload === "object" ? section.payload : {};

  if (section.type === "Form") {
    return { ...section, payload: { ...payload, form: await loadForm(payload.formId) } };
  }

  if (section.type === "Packages") {
    const ids = Array.isArray(payload.packageIds) ? payload.packageIds.slice(0, 20) : [];
    const packages = (await Promise.all(ids.map(loadPackage))).filter(Boolean);
    return { ...section, payload: { ...payload, packages } };
  }

  return { ...section, payload };
}

export async function buildServicePreview(draft) {
  if (!draft || typeof draft !== "object") return null;

  const sections = await Promise.all(
    (Array.isArray(draft.sections) ? draft.sections.slice(0, 60) : []).map(hydrateSection)
  );

  const service = mapService({
    ...draft,
    id: draft.id || "preview",
    title: String(draft.title || ""),
    sections: sections.map((section, index) => ({
      id: section.id || `preview-${index}`,
      isActive: true,
      sortOrder: index,
      type: { componentKey: String(section.type || "") },
      config: section.config || {},
      data: { payload: section.payload },
    })),
  });

  if (!service) return null;
  // Saved services show their published location pages ("Locations We Serve"); a new one has none yet.
  const [category, locations] = await Promise.all([
    getServiceCategory(draft.categoryId),
    draft.id || draft.slug ? getServiceLocations(String(draft.id || draft.slug)) : [],
  ]);
  return { ...service, category, locations };
}

/**
 * Same for the Home Page Builder: the draft is { sections } as the admin stores them
 * ({ id, type, config, data: { payload } }). Forms are resolved from `payload.formId` and the
 * module blocks get their CMS records, exactly as on the live homepage.
 */
export async function buildHomePreview(draft) {
  const raw = Array.isArray(draft?.sections) ? draft.sections.slice(0, 80) : [];
  const sections = await Promise.all(
    raw.map(mapSection).filter(Boolean).map(async (section) => {
      const formId = section.payload?.formId;
      return formId ? { ...section, payload: { ...section.payload, form: await loadForm(formId) } } : section;
    })
  );
  return attachModuleContent(sections);
}

/** Same for a CMS page: { title, content, sections } as the Page form holds them. */
export async function buildPagePreview(draft) {
  if (!draft || typeof draft !== "object") return null;
  const raw = Array.isArray(draft.sections) ? draft.sections.slice(0, 60) : [];
  const sections = await Promise.all(raw.map(mapSection).filter(Boolean).map(hydrateSection));
  return {
    id: "preview",
    title: String(draft.title || "").trim() || "Untitled page",
    content: String(draft.content || ""),
    sections,
  };
}

