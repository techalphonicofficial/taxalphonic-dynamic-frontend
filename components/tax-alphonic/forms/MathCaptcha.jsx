"use client";

import { useEffect, useId, useState } from "react";
import { getCaptcha } from "@/service/captcha";
import "./math-captcha.css";

/*
 * Arithmetic captcha ("7 + 4 = ?") inside a form: posts `_captchaToken` (hidden) and `_captcha`
 * (the answer) with the form's own fields; the backend refuses a submission without the right
 * answer (422 on the "_captcha" field) and every token works once. Used by CmsForm (every CMS form,
 * popups and landing pages included) and the blog comment form.
 * - `resetKey`: change it to load a new question (after a "_captcha" error the old token is used up).
 * - `onReadyChange(ready)`: false while no question is shown, so the form keeps its submit button off.
 * - `error`: the "_captcha" message from the API.
 * A backend without the captcha endpoint (404) renders nothing and lets the form submit.
 */
export default function MathCaptcha({ resetKey = 0, onReadyChange, error = "", className = "field" }) {
  const id = useId();
  // Every question (and the answer typed for it) belongs to one request key: resetKey from the
  // form, `round` from the ↻ button. A new key shows "loading" until its question arrives.
  const [round, setRound] = useState(0);
  const key = `${resetKey}:${round}`;
  const [loaded, setLoaded] = useState({ key: null, status: "loading", question: "", token: "" });
  const [typed, setTyped] = useState({ key: null, value: "" });

  useEffect(() => {
    let live = true;
    getCaptcha().catch(() => null).then((res) => {
      if (!live) return;
      if (res?.off) setLoaded({ key, status: "off", question: "", token: "" });
      else if (res?.token) setLoaded({ key, status: "ready", question: res.question, token: res.token });
      else setLoaded({ key, status: "failed", question: "", token: "" });
    });
    return () => { live = false; };
  }, [key]);

  const state = loaded.key === key ? loaded : { status: "loading", question: "", token: "" };
  const answer = typed.key === key ? typed.value : "";
  const setAnswer = (value) => setTyped({ key, value });
  const load = () => setRound((r) => r + 1);

  useEffect(() => {
    onReadyChange?.(state.status === "ready" || state.status === "off");
  }, [state.status, onReadyChange]);

  if (state.status === "off") return null;

  const inputId = `${id}-answer`;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={`${className} ta-captcha${error ? " field-invalid" : ""}`}>
      <label htmlFor={inputId} className="cms-label">
        Security check<span className="cms-req"> *</span>
        {state.question && <span className="ta-captcha-sr">: what is {state.question}?</span>}
      </label>
      <div className="ta-captcha-row">
        <span className="ta-captcha-q" aria-hidden="true">
          {state.status === "ready" ? `${state.question} =` : state.status === "loading" ? "…" : "?"}
        </span>
        <input
          id={inputId}
          name="_captcha"
          className="ta-captcha-input"
          type="text"
          inputMode="numeric"
          pattern="-?[0-9]*"
          maxLength={4}
          autoComplete="off"
          required
          placeholder="?"
          value={answer}
          onChange={(e) => setAnswer(e.target.value.replace(/[^\d-]/g, ""))}
          disabled={state.status !== "ready"}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={errorId}
        />
        <button type="button" className="ta-captcha-new" onClick={load} disabled={state.status === "loading"} aria-label="New question" title="New question">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
          </svg>
        </button>
      </div>
      <input type="hidden" name="_captchaToken" value={state.token} />
      {state.status === "failed" && <small className="cms-error">Could not load the security question. Tap ↻ to try again.</small>}
      {error && <small id={errorId} className="cms-error">{error}</small>}
    </div>
  );
}
