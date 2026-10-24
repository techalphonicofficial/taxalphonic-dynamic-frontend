"use server";

import { headers } from "next/headers";
import { apiClient } from "@/service/apiClient";

/**
 * Server Action for CMS forms: forwards a submission to
 * POST /api/v1/forms/public/:identifier/submit, which validates it and saves it as a CRM lead.
 * Runs on the server so BASE_URL stays private.
 */
export async function submitCmsForm(identifier, _prevState, formData) {
  if (!identifier) return { status: "error", message: "This form is not available right now.", fieldErrors: {} };

  const body = {};
  for (const key of new Set(formData.keys())) {
    if (key.startsWith("$ACTION")) continue;
    const values = formData.getAll(key).map(String);
    body[key] = values.length > 1 ? values : values[0];
  }

  // The backend records the visitor's IP on the lead; pass it through instead of this server's.
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for") || requestHeaders.get("x-real-ip");

  try {
    const payload = await apiClient(`/api/v1/forms/public/${encodeURIComponent(identifier)}/submit`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {}),
      },
      body: JSON.stringify(body),
    });

    return {
      status: "success",
      message: payload?.message || "Thank you! Your submission has been received.",
      redirectUrl: payload?.data?.redirectUrl || "",
    };
  } catch (error) {
    const fieldErrors = {};
    (error.body?.errors || []).forEach((item) => {
      if (item?.field && !fieldErrors[item.field]) fieldErrors[item.field] = item.message;
    });

    if (!error.status || error.status >= 500) console.error(`Form submission failed for ${identifier}`, error);

    return {
      status: "error",
      message: error.body?.message || "Something went wrong. Please try again in a moment.",
      fieldErrors,
    };
  }
}

/**
 * Server Action for form popups (FormPopupHost): an active CMS form by id or slug, as
 * GET /api/v1/forms/public/:identifier returns it, or null.
 */
export async function loadPublicForm(identifier) {
  const id = String(identifier ?? "").trim();
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null;
  try {
    const payload = await apiClient(`/api/v1/forms/public/${encodeURIComponent(id)}`, { next: { revalidate: 60 } });
    return payload?.success ? payload.data : null;
  } catch (error) {
    if (error.status !== 404) console.error(`Unable to load form ${id} for a popup`, error);
    return null;
  }
}
