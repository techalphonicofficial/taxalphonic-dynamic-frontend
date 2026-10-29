"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getBlogEngagement, loadBlogComments, postBlogComment, setBlogLike } from "@/service/blogEngagement";
import MathCaptcha from "../forms/MathCaptcha";

// Likes and comments under a blog post (styles: "Likes and comments" in blog.css).
// The visitor is anonymous: a random id in localStorage gives one like per browser per post.
// Comments load 10 at a time, newest first, as the reader scrolls the comment panel.

const VISITOR_KEY = "ta-visitor-id";
const PROFILE_KEY = "ta-comment-profile";

function readVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id || !/^[A-Za-z0-9_-]{8,64}$/.test(id)) {
      id = crypto.randomUUID().replace(/-/g, "");
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    // storage blocked: likes still work for this page view
    return `tmp${Math.random().toString(36).slice(2, 14)}`;
  }
}

const readProfile = () => {
  try {
    const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
    return { name: String(p.name || ""), email: String(p.email || "") };
  } catch {
    return { name: "", email: "" };
  }
};
const saveProfile = (profile) => {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // not remembered, fine
  }
};

const compact = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K` : String(n));

function timeAgo(value) {
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const units = [["y", 31536000], ["w", 604800], ["d", 86400], ["h", 3600], ["m", 60]];
  for (const [label, size] of units) if (seconds >= size) return `${Math.floor(seconds / size)}${label}`;
  return "just now";
}

const AVATAR_COLORS = ["#0e96ac", "#6c5ce7", "#e17055", "#00b894", "#d63384", "#fd7e14", "#0984e3", "#7b8a00"];
function CommentAvatar({ name }) {
  const text = String(name || "?").trim();
  const initials = text.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return <span className="bc-avatar" style={{ background: AVATAR_COLORS[hash % AVATAR_COLORS.length] }} aria-hidden="true">{initials}</span>;
}

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path
        d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.8 4.5c2.1 0 3.6 1.1 5.2 3 1.6-1.9 3.1-3 5.2-3 3.8 0 5.9 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
      <path d="M20.5 11.6a8.4 8.4 0 0 1-12.3 7.5L3.5 20.5l1.4-4.5a8.4 8.4 0 1 1 15.6-4.4z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}

function CommentSkeleton() {
  return (
    <li className="bc-item bc-skeleton" aria-hidden="true">
      <span className="bc-avatar" />
      <div className="bc-main"><span className="bc-line w40" /><span className="bc-line w90" /><span className="bc-line w60" /></div>
    </li>
  );
}

function CommentItem({ comment }) {
  return (
    <li className={`bc-item${comment.fresh ? " fresh" : ""}`}>
      <CommentAvatar name={comment.name} />
      <div className="bc-main">
        <div className="bc-head">
          <b>{comment.name}</b>
          <time dateTime={comment.createdAt} title={new Date(comment.createdAt).toLocaleString("en-IN")}>{timeAgo(comment.createdAt)}</time>
          {comment.pending && <span className="bc-pending">Awaiting review</span>}
        </div>
        <p>{comment.body}</p>
      </div>
    </li>
  );
}

export default function BlogEngagement({ slug, initialLikes = 0 }) {
  const visitorRef = useRef("");
  const [likes, setLikes] = useState(initialLikes);
  const [liked, setLiked] = useState(false);
  const [pop, setPop] = useState(0);
  const likeTimer = useRef(null);
  const sentLike = useRef(false);

  const [comments, setComments] = useState([]);
  const [total, setTotal] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | idle | more | done | error
  const loadingRef = useRef(false);

  const [form, setForm] = useState({ name: "", email: "", body: "", _hp: "" });
  const [expanded, setExpanded] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  // Arithmetic captcha: a new question after every post attempt the API refused on it, and after a post.
  const [captchaKey, setCaptchaKey] = useState(0);
  const [captchaReady, setCaptchaReady] = useState(false);

  const listRef = useRef(null);
  const textRef = useRef(null);

  const loadMore = useCallback(async (from) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setStatus(from ? "more" : "loading");
    const page = await loadBlogComments(slug, visitorRef.current, from || "");
    loadingRef.current = false;
    if (page.error) {
      setStatus("error");
      return;
    }
    setComments((prev) => {
      const seen = new Set(prev.map((c) => c.id));
      return [...prev, ...page.items.filter((c) => !seen.has(c.id))];
    });
    if (typeof page.total === "number") setTotal(page.total);
    setCursor(page.nextCursor);
    setStatus(page.nextCursor ? "idle" : "done");
  }, [slug]);

  // First load: visitor id, like state and the first page of comments.
  useEffect(() => {
    let alive = true;
    visitorRef.current = readVisitorId();
    (async () => {
      const profile = readProfile();
      const [engagement] = await Promise.all([getBlogEngagement(slug, visitorRef.current), loadMore("")]);
      if (!alive) return;
      setForm((f) => ({ ...f, name: f.name || profile.name, email: f.email || profile.email }));
      if (engagement) {
        setLikes(engagement.likeCount);
        setLiked(engagement.liked);
        sentLike.current = engagement.liked;
        setTotal((t) => (t === null ? engagement.commentCount : t));
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug, loadMore]);

  // Infinite scroll inside the comment panel: load the next page when the reader nears its end
  // (or straight away when the loaded comments don't fill the panel yet).
  useEffect(() => {
    const list = listRef.current;
    if (!list || status !== "idle" || !cursor) return undefined;
    const check = () => {
      if (list.scrollTop + list.clientHeight >= list.scrollHeight - 160) loadMore(cursor);
    };
    const frame = requestAnimationFrame(check);
    list.addEventListener("scroll", check, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      list.removeEventListener("scroll", check);
    };
  }, [status, cursor, loadMore]);

  useEffect(() => () => clearTimeout(likeTimer.current), []);

  // Optimistic like; the final state is sent once tapping stops, so double taps don't race.
  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    setLikes((n) => Math.max(0, n + (next ? 1 : -1)));
    if (next) setPop((p) => p + 1);
    clearTimeout(likeTimer.current);
    likeTimer.current = setTimeout(async () => {
      if (next === sentLike.current) return;
      const res = await setBlogLike(slug, visitorRef.current, next);
      if (res.ok) {
        sentLike.current = res.liked;
        setLikes(res.likeCount);
      } else {
        // not saved: show what the server has
        const fresh = await getBlogEngagement(slug, visitorRef.current);
        setLiked(fresh ? fresh.liked : sentLike.current);
        if (fresh) setLikes(fresh.likeCount);
      }
    }, 350);
  };

  const focusComposer = () => {
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth", block: "start" });
    setExpanded(true);
    setTimeout(() => textRef.current?.focus({ preventScroll: true }), 450);
  };

  const update = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
    if (fieldErrors[key]) setFieldErrors((errs) => ({ ...errs, [key]: undefined }));
    if (key === "body") {
      e.target.style.height = "auto";
      e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (sending) return;
    const errs = {};
    if (form.name.trim().length < 2) errs.name = "Please enter your name.";
    if (form.body.trim().length < 2) errs.body = "Please write a comment.";
    const data = new FormData(e.currentTarget);
    const captcha = { _captcha: String(data.get("_captcha") || ""), _captchaToken: String(data.get("_captchaToken") || "") };
    if (captchaReady && captcha._captchaToken && !captcha._captcha.trim()) errs._captcha = "Please answer the security question.";
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      setExpanded(true);
      return;
    }
    setSending(true);
    setNotice(null);
    const res = await postBlogComment(slug, visitorRef.current, { ...form, ...captcha });
    setSending(false);
    if (!res.ok) {
      setFieldErrors(res.fieldErrors || {});
      if (res.fieldErrors?._captcha) setCaptchaKey((k) => k + 1);
      setNotice({ tone: "error", text: res.message });
      return;
    }
    setFieldErrors({});
    setCaptchaKey((k) => k + 1);
    saveProfile({ name: form.name.trim(), email: form.email.trim() });
    setForm((f) => ({ ...f, body: "" }));
    if (textRef.current) textRef.current.style.height = "auto";
    if (res.comment) setComments((prev) => [{ ...res.comment, fresh: true }, ...prev.filter((c) => c.id !== res.comment.id)]);
    if (typeof res.total === "number") setTotal(res.total);
    setNotice(res.comment?.pending ? { tone: "info", text: res.message } : null);
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const count = total ?? 0;
  const empty = status !== "loading" && comments.length === 0;

  return (
    <section className="blog-engage" aria-label="Likes and comments">
      <div className="be-bar">
        <button type="button" className={`be-like${liked ? " on" : ""}`} onClick={toggleLike} aria-pressed={liked} aria-label={liked ? "Unlike this article" : "Like this article"}>
          <span className="be-heart" key={pop}><HeartIcon filled={liked} /></span>
          <span className="be-count">{compact(likes)}</span>
          <span className="be-label">{likes === 1 ? "like" : "likes"}</span>
        </button>
        <button type="button" className="be-comment" onClick={focusComposer}>
          <CommentIcon />
          <span className="be-count">{compact(count)}</span>
          <span className="be-label">{count === 1 ? "comment" : "comments"}</span>
        </button>
        <span className="be-hint">{liked ? "Thanks for the love! ❤️" : "Found this useful? Give it a like."}</span>
      </div>

      <div className="blog-comments" id="comments">
        <div className="bc-title">
          <h2>Comments</h2>
          <span>{compact(count)}</span>
        </div>

        <form className={`bc-form${expanded ? " open" : ""}`} onSubmit={submit} noValidate>
          <CommentAvatar name={form.name || "You"} />
          <div className="bc-form-main">
            <textarea
              ref={textRef}
              rows={1}
              placeholder="Add a comment…"
              value={form.body}
              maxLength={2000}
              onFocus={() => setExpanded(true)}
              onChange={update("body")}
              aria-label="Your comment"
              aria-invalid={Boolean(fieldErrors.body)}
            />
            {fieldErrors.body && <small className="bc-err">{fieldErrors.body}</small>}
            <div className="bc-form-extra" inert={!expanded}>
              <div className="bc-form-inner">
                <div className="bc-fields">
                  <label>
                    <input type="text" placeholder="Your name *" value={form.name} maxLength={80} onChange={update("name")} aria-label="Your name" aria-invalid={Boolean(fieldErrors.name)} autoComplete="name" />
                    {fieldErrors.name && <small className="bc-err">{fieldErrors.name}</small>}
                  </label>
                  <label>
                    <input type="email" placeholder="Email (optional, never shown)" value={form.email} maxLength={160} onChange={update("email")} aria-label="Your email" aria-invalid={Boolean(fieldErrors.email)} autoComplete="email" suppressHydrationWarning />
                    {fieldErrors.email && <small className="bc-err">{fieldErrors.email}</small>}
                  </label>
                  <input className="bc-hp" type="text" tabIndex={-1} autoComplete="off" value={form._hp} onChange={update("_hp")} aria-hidden="true" />
                </div>
                <MathCaptcha className="bc-captcha" resetKey={captchaKey} onReadyChange={setCaptchaReady} error={fieldErrors._captcha} />
                <div className="bc-actions">
                  <span className="bc-chars">{form.body.length > 1500 ? `${2000 - form.body.length} left` : ""}</span>
                  <button type="submit" className="btn-primary" disabled={sending || !captchaReady || form.body.trim().length < 2}>{sending ? "Posting…" : "Post"}</button>
                </div>
              </div>
            </div>
            {notice && <p className={`bc-notice ${notice.tone}`} role="status">{notice.text}</p>}
          </div>
        </form>

        <ul className="bc-list" ref={listRef} aria-busy={status === "loading" || status === "more"}>
          {comments.map((c) => <CommentItem key={c.id} comment={c} />)}
          {(status === "loading" || status === "more") && (
            <>
              <CommentSkeleton />
              <CommentSkeleton />
              {status === "loading" && <CommentSkeleton />}
            </>
          )}
          {empty && status !== "error" && (
            <li className="bc-empty">
              <span aria-hidden="true">💬</span>
              <b>No comments yet</b>
              <span>Start the conversation.</span>
            </li>
          )}
          {status === "error" && (
            <li className="bc-end">
              Couldn&apos;t load comments. <button type="button" onClick={() => loadMore(cursor || "")}>Try again</button>
            </li>
          )}
          {status === "done" && comments.length > 6 && <li className="bc-end">You&apos;re all caught up ✨</li>}
        </ul>
      </div>
    </section>
  );
}
