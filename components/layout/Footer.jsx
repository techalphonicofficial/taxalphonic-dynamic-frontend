import Link from "next/link";
import { FOOTER_DISPLAY_DEFAULTS } from "./footerDefaults";
import "./footer.css";

// Footer in the uirefrence.html design (#siteFooter). Links come from the Footer Menu (Menus &
// Navigation, location "footer"), up to three levels:
//   main heading (section title) → column heading → links      e.g. Business Services → 🚀 Startup → Proprietorship
//   a top-level link with only links under it is one column under the "linksTitle" heading
//   a top-level link with nothing under it goes to the bottom row.
// A link whose label starts with "+" (e.g. "+14 more →") is the blue "more" link. What else shows (logo, text, button, hiring strip, contact,
// social, copyright) is set in that menu's Footer Display options (menu.settings).

const has = (value) => String(value ?? "").trim() !== "";
const isWeb = (url) => /^(https?:)?\/\//i.test(url);

function FooterLink({ href, target, className, label, children }) {
  const url = String(href || "").trim();
  if (!url || url === "#") return <a className={className} aria-label={label}>{children}</a>;
  if (isWeb(url) || /^(mailto|tel):/i.test(url) || target === "_blank") {
    const blank = target === "_blank" || isWeb(url);
    return (
      <a href={url} className={className} aria-label={label} target={blank ? "_blank" : undefined} rel={blank ? "noopener noreferrer" : undefined}>
        {children}
      </a>
    );
  }
  return <Link href={url} className={className} aria-label={label}>{children}</Link>;
}

// Plain links fill up to three bottom columns of about six links (like Company / Legal / Support).
function chunk(items) {
  const count = Math.min(3, Math.max(1, Math.ceil(items.length / 6)));
  const size = Math.ceil(items.length / count);
  return Array.from({ length: count }, (_, i) => items.slice(i * size, (i + 1) * size)).filter((part) => part.length);
}

const LinkList = ({ items }) => items.map((item) => (
  <FooterLink key={item.id || `${item.label}-${item.url}`} href={item.url} target={item.target} className={item.label.trim().startsWith("+") ? "f-more" : undefined}>
    {item.label}
  </FooterLink>
));

const hasKids = (item) => item.children?.length > 0;

/**
 * Groups the top-level links into titled sections of columns. A link whose sub-links have their
 * own links is a section; consecutive links with plain sub-links are columns of one section
 * titled `linksTitle` (only the first such section gets the title).
 */
function toSections(items, linksTitle) {
  const sections = [];
  let titled = false;
  for (const item of items.filter(hasKids)) {
    if (item.children.some(hasKids)) {
      const columns = item.children.filter(hasKids);
      const loose = item.children.filter((child) => !hasKids(child));
      if (loose.length) columns.push({ id: `${item.id}-links`, label: "", url: "", children: loose });
      sections.push({ id: item.id, title: item.label, columns });
      continue;
    }
    const last = sections[sections.length - 1];
    if (last?.auto) last.columns.push(item);
    else {
      sections.push({ id: `auto-${item.id}`, title: titled ? "" : linksTitle, columns: [item], auto: true });
      titled = true;
    }
  }
  return sections;
}

function Column({ column }) {
  const heading = column.url && column.url !== "#"
    ? <FooterLink href={column.url} target={column.target} className="f-col-title">{column.label}</FooterLink>
    : column.label;
  return (
    <div className="f-col">
      {has(column.label) && <h5>{heading}</h5>}
      <LinkList items={column.children} />
    </div>
  );
}

export default function Footer({ menu = {}, branding = {}, contact = {} }) {
  const d = { ...FOOTER_DISPLAY_DEFAULTS, ...(menu.settings || {}) };
  const items = Array.isArray(menu.items) ? menu.items : [];
  const sections = d.showLinks ? toSections(items, d.linksTitle) : [];
  const quickLinks = items.filter((item) => !hasKids(item));

  // Empty contact fields use Settings → Address / Contact / Social Media.
  const address = d.showAddress ? (has(d.address) ? d.address : contact.address) : "";
  const phone = d.showPhone ? (has(d.phone) ? d.phone : contact.phone) : "";
  const email = d.showEmail ? (has(d.email) ? d.email : contact.email) : "";
  const socials = d.showSocial ? contact.socials || [] : [];
  const showContact = d.showContact && (has(d.contactTitle) || has(address) || has(phone) || has(email) || socials.length > 0);

  const logo = d.showLogo ? branding.lightLogo || branding.logo : "";
  const showHead = logo || (d.showIntro && has(d.intro)) || (d.showButton && has(d.buttonText));
  const showHiring = d.showHiring && (has(d.hiringTitle) || has(d.hiringText));
  const showLinks = sections.length > 0;
  const showBottom = quickLinks.length > 0 || showContact;
  const copyright = d.showCopyright ? String(d.copyright || "").replace("{year}", String(new Date().getFullYear())) : "";

  return (
    <footer id="siteFooter" className="ta-footer">
      {(showHead || showHiring || showLinks) && (
        <div className="f-mega"><div className="wrap">
          {showHead && (
            <div className="f-mega-head">
              {/* Logo from Settings → Organization; on its white badge, so the light-mode logo. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {logo && <img className="footer-logo" src={logo} alt={branding.tagline ? `${branding.name} — ${branding.tagline}` : branding.name || "Logo"} />}
              {d.showIntro && has(d.intro) && <p>{d.intro}</p>}
              {d.showButton && has(d.buttonText) && <FooterLink href={d.buttonUrl} className="btn-primary">{d.buttonText}</FooterLink>}
            </div>
          )}

          {showHiring && (
            <div className="f-hiring">
              <div className="f-hiring-left">
                {has(d.hiringEmoji) && <span className="f-hiring-emoji">{d.hiringEmoji}</span>}
                <div>{has(d.hiringTitle) && <b>{d.hiringTitle}</b>}{has(d.hiringText) && <span>{d.hiringText}</span>}</div>
              </div>
              {has(d.hiringButtonText) && <FooterLink href={d.hiringButtonUrl} className="f-hiring-btn">{d.hiringButtonText}</FooterLink>}
            </div>
          )}

          {sections.map((section) => (
            <div key={section.id}>
              {has(section.title) && <div className="f-section-title">{section.title}</div>}
              <div className="f-grid">
                {section.columns.map((column) => <Column key={column.id || column.label} column={column} />)}
              </div>
            </div>
          ))}
        </div></div>
      )}

      {(showBottom || has(copyright)) && (
        <div className="f-bottom"><div className="wrap">
          {showBottom && (
            <div className="f-bcols">
              {chunk(quickLinks).map((part, i) => (
                <div key={i}>
                  {has(d.quickLinksTitle) && <h6 aria-hidden={i > 0 || undefined}>{i === 0 ? d.quickLinksTitle : " "}</h6>}
                  <LinkList items={part} />
                </div>
              ))}
              {showContact && (
                <div className="f-contact">
                  {has(d.contactTitle) && <h6>{d.contactTitle}</h6>}
                  {has(address) && <p>📍 {address}</p>}
                  {has(phone) && <p>📞 <a className="f-inline" href={`tel:${phone.split(",")[0].replace(/[^\d+]/g, "")}`}>{phone}</a></p>}
                  {has(email) && <p>✉️ <a className="f-inline" href={`mailto:${email}`}>{email}</a></p>}
                  {socials.length > 0 && (
                    <div className="f-social">
                      {socials.map((social) => (
                        <FooterLink key={social.url} href={social.url} label={social.name || social.label}>{social.label}</FooterLink>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {has(copyright) && <div className="fbot">{copyright}</div>}
        </div></div>
      )}
    </footer>
  );
}
