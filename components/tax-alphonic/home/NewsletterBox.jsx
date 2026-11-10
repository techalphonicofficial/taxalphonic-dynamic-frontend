"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/service/formSubmission";

/**
 * The Newsletter block's own email box (used when no CMS form is picked): sends the address to the
 * backend's newsletter list (admin: Newsletter Subscribers). Hidden honeypot field against bots.
 */
export default function NewsletterBox({ placeholder, buttonText }) {
  const [email, setEmail] = useState("");
  const [hp, setHp] = useState("");
  const [state, setState] = useState({ status: "idle", message: "" });

  const submit = async (event) => {
    event.preventDefault();
    if (state.status === "sending") return;
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(address)) {
      setState({ status: "error", message: "Please enter a valid email address." });
      return;
    }
    setState({ status: "sending", message: "" });
    const result = await subscribeNewsletter({ email: address, source: window.location.pathname, _hp: hp });
    setState(result);
    if (result.status === "success") setEmail("");
  };

  return (
    <form className="news-form" onSubmit={submit} noValidate>
      <input
        type="email"
        name="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (state.status === "error") setState({ status: "idle", message: "" }); }}
        placeholder={placeholder || ""}
        aria-label={placeholder || "Email address"}
        aria-invalid={state.status === "error" || undefined}
      />
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input type="text" name="_hp" value={hp} onChange={(e) => setHp(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="news-hp" />
      <button type="submit" className="btn-primary" disabled={state.status === "sending"}>
        {state.status === "sending" ? "…" : buttonText}
      </button>
      {state.message && (
        <p className={`news-msg ${state.status === "success" ? "is-ok" : "is-err"}`} role={state.status === "success" ? "status" : "alert"}>{state.message}</p>
      )}
    </form>
  );
}
