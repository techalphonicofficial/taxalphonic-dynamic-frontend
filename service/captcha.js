"use server";

import { apiClient } from "@/service/apiClient";

/**
 * Server Action for MathCaptcha: a new arithmetic question from GET /api/v1/captcha.
 * → { question, token } | { off: true } (backend without captcha yet, 404) | null (could not load).
 * The answer is never sent to the browser: the backend checks it against the signed token.
 */
export async function getCaptcha() {
  try {
    const payload = await apiClient("/api/v1/captcha", { cache: "no-store" });
    const { question, token } = payload?.data || {};
    return question && token ? { question: String(question), token: String(token) } : null;
  } catch (error) {
    if (error.status === 404) return { off: true };
    console.error("Unable to load a captcha", error);
    return null;
  }
}
