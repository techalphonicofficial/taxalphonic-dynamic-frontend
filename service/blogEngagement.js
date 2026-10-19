"use server";

import { headers } from "next/headers";
import { apiClient } from "@/service/apiClient";

/**
 * Server Actions for blog likes and comments (BlogEngagement.jsx). They forward to
 * /api/v1/blogs/public/:slug/{engagement,like,comments} with the visitor's IP, so BASE_URL stays private.
 * `visitorId` is the anonymous id the browser keeps in localStorage (one like per visitor per post).
 */

const VISITOR_RE = /^[A-Za-z0-9_-]{8,64}$/;
const validSlug = (slug) => typeof slug === "string" && slug.length > 0 && slug.length <= 255;
const visitor = (id) => (VISITOR_RE.test(String(id || "")) ? String(id) : "");
const base = (slug) => `/api/v1/blogs/public/${encodeURIComponent(slug)}`;

async function forwardHeaders() {
  const h = await headers();
  const ip = h.get("x-forwarded-for") || h.get("x-real-ip");
  return { "Content-Type": "application/json", ...(ip ? { "X-Forwarded-For": ip } : {}) };
}

/** → { likeCount, liked, commentCount } or null */
export async function getBlogEngagement(slug, visitorId) {
  if (!validSlug(slug)) return null;
  try {
    const res = await apiClient(`${base(slug)}/engagement?visitorId=${encodeURIComponent(visitor(visitorId))}`, { cache: "no-store" });
    return res?.data || null;
  } catch {
    return null;
  }
}

/** Sets the like on or off → { ok, liked, likeCount, message? } */
export async function setBlogLike(slug, visitorId, liked) {
  if (!validSlug(slug) || !visitor(visitorId)) return { ok: false, message: "Could not save your like." };
  try {
    const res = await apiClient(`${base(slug)}/like`, {
      method: "POST",
      cache: "no-store",
      headers: await forwardHeaders(),
      body: JSON.stringify({ visitorId: visitor(visitorId), liked: Boolean(liked) }),
    });
    return { ok: true, ...res.data };
  } catch (error) {
    return { ok: false, message: error.body?.message || "Could not save your like." };
  }
}

/** One page of approved comments, newest first → { items, nextCursor, total? } */
export async function loadBlogComments(slug, visitorId, cursor = "") {
  if (!validSlug(slug)) return { items: [], nextCursor: null, error: true };
  const query = new URLSearchParams({ limit: "10", visitorId: visitor(visitorId) });
  if (cursor) query.set("cursor", String(cursor).slice(0, 200));
  try {
    const res = await apiClient(`${base(slug)}/comments?${query}`, { cache: "no-store" });
    return res?.data || { items: [], nextCursor: null };
  } catch {
    return { items: [], nextCursor: null, error: true };
  }
}

/** → { ok, comment?, total?, message, fieldErrors } */
export async function postBlogComment(slug, visitorId, input) {
  if (!validSlug(slug)) return { ok: false, message: "Comments are not available right now.", fieldErrors: {} };
  const body = {
    visitorId: visitor(visitorId),
    name: String(input?.name || "").slice(0, 120),
    email: String(input?.email || "").slice(0, 200),
    body: String(input?.body || "").slice(0, 2500),
    _hp: String(input?._hp || ""),
  };
  try {
    const res = await apiClient(`${base(slug)}/comments`, {
      method: "POST",
      cache: "no-store",
      headers: await forwardHeaders(),
      body: JSON.stringify(body),
    });
    return { ok: true, message: res.message, comment: res.data?.comment, total: res.data?.total, fieldErrors: {} };
  } catch (error) {
    const fieldErrors = {};
    (error.body?.errors || []).forEach((e) => {
      if (e?.field && !fieldErrors[e.field]) fieldErrors[e.field] = e.message;
    });
    return {
      ok: false,
      message: error.status === 429 ? error.body?.message || "Too many comments, please try again later." : error.body?.message || "Could not post your comment.",
      fieldErrors,
    };
  }
}
