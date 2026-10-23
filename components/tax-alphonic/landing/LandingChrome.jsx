"use client";

import { useState } from "react";

/*
 * Page-specific header and footer of a landing page ("Simple" style of the LandingHeader /
 * LandingFooter blocks, admin: landingBlocks.js). Empty fields fall back to Settings
 * (Organization logo, Contact phone / email / address, Social links); empty texts hide their
 * element. Links: "#anchor" scrolls on the page, "/path" opens the main website (proxy.js),
 * https / mailto / tel work as usual; anything else (javascript:, data:) is dropped.
 */

const text = (value) => String(value ?? "").trim();
const list = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

/** A link target that is safe to render, or "". */
export function safeHref(value) {
  const url = text(value);
  if (!url) return "";
  if (url.startsWith("#") || /^\/(?!\/)/.test(url)) return url;
  if (/^(https?:\/\/|mailto:|tel:)/i.test(url)) return url;
  return "";
}

const isExternal = (url) => /^https?:\/\//i.test(url);
const telHref = (phone) => `tel:${text(phone).replace(/[^\d+]/g, "")}`;

function Anchor({ href, className, children, onClick }) {
  const url = safeHref(href);
  if (!url) return <span className={className}>{children}</span>;
  return (
    <a href={url} className={className} onClick={onClick} {...(isExternal(url) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {children}
    </a>
  );
}

export function LandingHeaderBar({ payload = {}, branding = {}, contact = {} }) {
  const [open, setOpen] = useState(false);
  const logo = text(payload.logo) || branding.lightLogo || branding.logo;
  const logoDark = text(payload.logo) || branding.darkLogo || logo;
  const links = list(payload.links).filter((l) => text(l.text));
  const phone = text(payload.phone) || (payload.showPhone === "yes" ? text(contact.phone) : "");
  const button = text(payload.button?.text) ? payload.button : null;
  const dark = payload.theme === "dark";

  return (
    <header className={`lp-header${dark ? " lp-dark" : ""}${payload.sticky === "no" ? "" : " lp-sticky"}`}>
      <div className="lp-wrap lp-header-row">
        <a href="#top" className="lp-logo" aria-label={branding.name || "Home"}>
          {/* CMS images come from arbitrary hosts, so next/image remotePatterns can't cover them. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={dark ? logoDark : logo} alt={text(payload.logoAlt) || branding.name || ""} /> : <b>{branding.name}</b>}
        </a>
        {links.length > 0 && (
          <nav className={`lp-nav${open ? " lp-open" : ""}`} aria-label="Page sections">
            {links.map((link, i) => (
              <Anchor key={`${link.text}-${i}`} href={link.url} className="lp-nav-link" onClick={() => setOpen(false)}>{link.text}</Anchor>
            ))}
          </nav>
        )}
        <div className="lp-actions">
          {phone && <a href={telHref(phone)} className="lp-phone">📞 <span>{phone}</span></a>}
          {button && <Anchor href={button.url} className="lp-btn">{button.text}</Anchor>}
          {links.length > 0 && (
            <button type="button" className="lp-burger" aria-expanded={open} aria-label="Menu" onClick={() => setOpen((v) => !v)}>
              <span /><span /><span />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export function LandingFooterBar({ payload = {}, branding = {}, contact = {} }) {
  const logo = text(payload.logo) || branding.darkLogo || branding.logo;
  const links = list(payload.links).filter((l) => text(l.text));
  const legal = list(payload.legalLinks).filter((l) => text(l.text));
  const showContact = payload.showContact !== "no";
  const phone = text(payload.phone) || (showContact ? text(contact.phone) : "");
  const email = text(payload.email) || (showContact ? text(contact.email) : "");
  const address = text(payload.address) || (showContact ? text(contact.address) : "");
  const socials = payload.showSocial === "no" ? [] : list(contact.socials).filter((s) => safeHref(s.url));
  const year = String(new Date().getFullYear());
  const copyright = text(payload.copyright || "© {year} {company}. All rights reserved.")
    .replace(/\{year\}/g, year)
    .replace(/\{company\}/g, branding.name || "Tax Alphonic");
  const light = payload.theme === "light";

  return (
    <footer className={`lp-footer${light ? " lp-footer-light" : ""}`}>
      <div className="lp-wrap lp-footer-grid">
        <div className="lp-footer-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo && <img src={light ? branding.lightLogo || logo : logo} alt={branding.name || ""} className="lp-footer-logo" />}
          {text(payload.about) && <p>{payload.about}</p>}
        </div>
        {links.length > 0 && (
          <div>
            {text(payload.linksTitle) && <h4>{payload.linksTitle}</h4>}
            <ul>{links.map((link, i) => <li key={`${link.text}-${i}`}><Anchor href={link.url}>{link.text}</Anchor></li>)}</ul>
          </div>
        )}
        {(phone || email || address) && (
          <div>
            {text(payload.contactTitle) && <h4>{payload.contactTitle}</h4>}
            <ul className="lp-contact">
              {phone && <li><a href={telHref(phone)}>📞 {phone}</a></li>}
              {email && <li><a href={`mailto:${email}`}>✉️ {email}</a></li>}
              {address && <li>📍 {address}</li>}
            </ul>
          </div>
        )}
      </div>
      <div className="lp-wrap lp-footer-bottom">
        <span>{copyright}</span>
        {legal.length > 0 && <span className="lp-legal">{legal.map((link, i) => <Anchor key={`${link.text}-${i}`} href={link.url}>{link.text}</Anchor>)}</span>}
        {socials.length > 0 && (
          <span className="lp-social">
            {socials.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}>{s.label}</a>)}
          </span>
        )}
      </div>
    </footer>
  );
}
