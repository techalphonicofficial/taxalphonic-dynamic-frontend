@AGENTS.md

# Tax Alphonic website (Next.js frontend)

Public website for Tax Alphonic. No database, auth or API routes of its own: all content comes from the CMS backend.

Related projects (same CMS, not git repos):
- Backend API: `C:\Users\Akash Deep Sharma\Downloads\TaxAlphonic\TaxAlphonic\cms-backend` (port 5000, see its CLAUDE.md)
- Admin panel: `C:\Users\Akash Deep Sharma\Downloads\TaxAlphonic\TaxAlphonic\cms-admin`
- `Desktop\tax\taxalphonic-backend` and `Desktop\taxalphonic-backend` are OLD copies. Ignore them.

## Stack and commands
- Next.js 16 App Router, React 19 (React Compiler on), Tailwind v4, plain JS, alias `@/*` = project root.
- `npm run dev` (port 3000), `npx eslint <paths>`. No tests.
- `.env`: `BASE_URL` (API origin) and `IMAGE_BASE_URL`. Both are server-only, so never use them in client code.

## Request flow
- `app/layout.js` fetches the header and footer menus (`service/navigationService.js`) and the site settings (`service/siteSettingsService.js`), and renders `Header` and `Footer`. A built-in "About" link is added unless the CMS menu already has one.
  - Logos come from Settings → Organization: `Header` shows `lightLogo` (or `darkLogo` when `ThemeContext` is dark), each falling back to `logo`, then `/logo.png`. Favicon / Apple touch icon go into `generateMetadata`.
  - Header dropdowns: a menu item's children become up to 3 columns (`toDropdownColumns` in `navigationService.js`); each link shows its `icon` (admin emoji or Media image, made absolute) in a soft tile (`MenuIcon` in `Header.jsx`), else `DEFAULT_MENU_ICON` (📄); the mobile drawer shows the same icons.
  - Header menu: the first five items (`topbarItemCount`) sit in the top bar beside search, the rest in the main row. Three levels: menu → link, or menu → column heading → links (`dropdownColumns`; a heading links only when its URL isn't `#`). A top-level item's icon (emoji/image) replaces the built-in lucide icon (`NavIcon`). The current "Main Header" menu and its ~500 services were seeded from uirefrence.html by the backend's `scripts/seed-reference-header.js`.
  - `components/layout/Footer.jsx` + `footer.css` is the uirefrence.html footer (`.ta-footer`). Links come from the active menu with location `footer`, three levels: main heading (`f-section-title`) → column heading → links; a top-level item with only links under it is a column under `linksTitle`; items with nothing under them fill up to three bottom-row columns; a link labelled `+…` gets the `f-more` style. The menu's `settings` (admin: Footer Display on that menu) switch each part on/off and set its text, over `footerDefaults.js`. Empty contact fields and the social icons come from the Contact / Address / Social Media settings.
- `app/page.js`: the homepage.
  - It renders the published CMS page with slug `home` (`service/homePageService.js`) through `components/tax-alphonic/home/HomeSections.jsx`, one `Home*` block per section.
  - The markup is the home view of `uirefrence.html`. CSS is extracted into `components/tax-alphonic/home/home-page.css` and scoped under `.ta-home`; local additions sit at the end of that file.
  - `HomeHero` right side: `payload.heroImage` (shown when set) else the dashboard SVG; `visualSize` sm | md | lg (default) | xl sets its size (`.hero-size-*` in `home-page.css`; xl also widens the column).
  - With no published home page (or no blocks), it falls back to `homeDefaults.js`, which holds the reference content.
  - `/home` redirects to `/`.
  - Block types and payload keys must match cms-admin `src/components/page-builder/homeBlocks.js` (`HOME_SCHEMAS`).
  - `homeDefaults.js` must stay identical in content to the admin's `homeDefaults.js`; both are generated from the same data.
  - `HomeForm` shows any CMS form in a card (hidden until a form is picked). It works full width or in a column.
  - The expert banner and newsletter blocks can also pick a CMS form (`payload.formId`). The backend hydrates it into `payload.form`, and it renders with `CmsForm`.
  - Module blocks: `service/homeContentService.js` (`attachModuleContent`, called in `app/page.js`) fills `payload.items` from the CMS modules' public list APIs, keeping only published/active records in display order.
    - `HomeTestimonials` reads Testimonials, `HomeFaq` reads FAQs (optional `category`), and `HomeClients` reads Partners & Clients. These three keep their own items when `source: "manual"`, or when the module has nothing published.
    - `HomeTeam`, `HomeBanners` (slider, respects start/end dates), `HomeBranches` and `HomeGlobalPresence` (countries) always read their module.
    - `HomePortfolio` (`Portfolio` in HomeSections, `.home-portfolio` / `.pf-*`): every published Portfolio item with an image (`group` = top-level category for the tabs); payload `show` ("hide" = section off), `categoryId` (a main category includes its children), `tabs`, `limit` (shown at first, "Show more" adds as many again), `imageFit` (cover | contain), `allLabel`, `moreLabel`, `button`. A card opens a full-size preview; items with a website URL get "Visit website".
  - Look: the reference grey (`--mist`) section bands are off; instead the page has a soft tint (`--home-page-bg`) and content blocks are white bordered cards ("Page tint and card blocks" at the end of `home-page.css`). Hero, strips, dark banners, the form card and the banner slider keep their own design. A new content block class must be added to those selectors to become a card.
  - Placement: `section.config.placement` is `full`, `main` or `sidebar`.
    - `PLACEMENT_RULES` in `HomeSections.jsx` lists which blocks may move, where, and the default. `HomeForm` defaults to `sidebar`, every other listed block to `main`, so the blocks around a form fill the left column like on service pages; `full` means always full width.
    - Unlisted blocks (hero, strips, sliders, wide banners) are always full width. Keep the map in sync with the admin's `HOME_PLACEMENT_RULES`.
    - A run of consecutive main/sidebar blocks becomes a two-column `.home-split`.
    - A run with only one side renders full width, and empty columns collapse via CSS `:has`.
- `app/about/page.jsx` reads `GET /api/v1/about-page` (`service/aboutPageService.js`) and renders `components/tax-alphonic/pages/AboutPage.jsx`.
- Blog: `/blog` (`app/blog/page.jsx`, `?category=<slug>&q=&page=`) and `/blog/<slug>` (`app/blog/[slug]/page.jsx`), from `service/blogService.js` → `GET /blogs/public`, `/blogs/public/categories`, `/blogs/public/:slug` (live posts only, so new posts appear on publish; data cached 60 s). UI: `components/tax-alphonic/blog/BlogPages.jsx` + `blog.css` (inside `.ta-svc.ta-blog`; list = uirefrence.html "#/blog" view). Post body = its Page Builder sections through `ContentBlocks` (exported from `ApiServicePage`; the admin `RichText` block maps to Overview), then FAQs, tags, author, share (`BlogClient.jsx`), related posts; a table of contents (`TableOfContents` in `BlogClient.jsx`) is built in the browser from the h2/h3 inside `#blog-content` (sidebar card on desktop, collapsible box above the content under 980px, smooth scroll, active heading highlighted, hidden under 2 headings); likes and comments (`BlogEngagement.jsx` after the author box, Server Actions in `service/blogEngagement.js`): anonymous visitor id in localStorage (`ta-visitor-id`, one like per browser per post, optimistic heart), comment panel scrolls inside itself and loads 10 more near its end (cursor paging), name/email remembered (`ta-comment-profile`), honeypot `_hp`; one view per session is counted via the Server Action `service/blogView.js`. SEO: post fields, then an SEO Config whose route is `/blog/<slug>` (or `/blog`); BlogPosting / FAQPage JSON-LD. Header and footer get a built-in "Blog" link (`navigationService.js`, like About) unless the CMS menu links to /blog.
- `app/[...slug]/page.jsx` (`resolvePath`): a multi-segment path is first looked up as a pSEO page by its full path; then the LAST segment is tried as `GET /services/slug/:slug`, then `GET /pages/slug/:slug`; a single segment that is neither is tried as a pSEO page; else `NotFound` (still HTTP 200).
- pSEO pages (admin SEO Pages, e.g. `/india/seo-services-noida`): `service/seoPageService.js` loads `GET /seo-pages/lookup?path=` (PUBLISHED only) and turns the AI HTML (`longDescription`, `<section data-section="hero|painPoints|solution|features|methodology|roi|faq|cta">`) into service blocks by content (cards → ServicesIncluded/WhyUs, phases → OurProcess, figures → `Stats`, details → Faq, aside/links → CallToAction, anything else → Overview with classes stripped). The page renders through `ApiServicePage` with the base service's Form, Packages, Highlights, Checklist, sidebar CTAs (and its FAQ if the AI has none); the hero keeps the service's buttons/image. `#…` AI links go to the form. `indexable` false → `noindex`. Breadcrumb = category / service / place (`service.breadcrumbs`).
- "Locations We Serve" (`LocationsServed` in `ApiServicePage`): links to the service's published location pages (`service/serviceLocationsService.js`, `/seo-pages/by-service/:slug`), on the service page and each of its location pages (current one highlighted). Added automatically first in the bottom area unless the Page Builder has the block (then its texts/position/show apply; defaults `LOCATIONS_DEFAULTS`). Hidden with no locations.
- CMS pages (`ApiPage.jsx`): a page with Page Builder blocks renders through `ApiServicePage` (same blocks, placements and sidebar as services; the API already hydrates Form and Packages), with its editor `content` as the first Overview block. A page without blocks stays a plain article.
- All API calls go through `service/apiClient.js`, which throws on non-2xx with `error.status` and `error.body`.
- SEO Configs (admin SEO Management): `service/seoConfigService.js` (`GET /seo/lookup?type=&id=&route=`) returns the override for the page being rendered; `applySeoConfig` puts every non-empty field over the record's own SEO. Used in `app/[...slug]/page.jsx` (types service / page / seo_page), `app/page.js` (static "home") and `app/about/page.jsx` (static "about"). Metadata comes from `lib/seoMetadata.js` (`createMetadata`; "other meta tags" keep only <meta name|property content> tags); JSON-LD renders through `components/seo/JsonLd.jsx`.
- Sitemap: `/sitemap.xml` (`app/sitemap.xml/route.js`) is an index of `/sitemaps/pages.xml`, `services.xml`, `blog.xml` (/blog + live posts) and `seo-pages-<n>.xml` (`app/sitemaps/[file]/route.js`, 45,000 URLs per file), built in `service/sitemapService.js` from `GET /api/v1/sitemap` (data cached 1 h). A URL is listed only if published, its robots (SEO Config first) has no noindex and its canonical (SEO Config first) is itself; slugs shadowed by a service are left out. `app/robots.js` blocks `/cms-preview` and points to the index. URLs use `SITE_URL` (.env, default https://taxalphonic.com).

## Service page (main feature)
- `components/tax-alphonic/pages/ApiServicePage.jsx` renders the sections from the CMS Page Builder. **Nothing on the page is hardcoded**: every heading, label, button and icon comes from a block, and blocks with no content render nothing.
- Each section's `config` (parsed in `servicePageService.js`) holds:
  - `placement`: `top` (full width under the hero), `main`, `sidebar` or `bottom` (full width).
  - `kicker`: the small label above the heading.
  - `anchorId`: the element id, for `#links`.
  - If `placement` is unset, `DEFAULT_PLACEMENT` decides: Faq bottom, Form sidebar, Checklist sidebar, Highlights top, CallToAction bottom, everything else main.
  - This map is duplicated in cms-admin `PageBuilder.jsx`; keep the two in sync.
- Layout collapses: no sidebar blocks means main is full width; no main blocks means sidebar blocks move into main; no hero image means the hero is one column. `hasContent()` filters out empty blocks.
- The switch is in `ServiceBlock`:
  - `HeroBanner` (always on top). Payload: `eyebrow` (else the category), `heading`, `highlight`, `subHeading`, `backgroundImage`, `price`, `primaryButton`/`secondaryButton` `{text,url}`, `badges[{icon,text}]`, `stats[{value,label}]`, `chips[{icon}]`, `showMeta`.
  - `Overview` (`heading` or `title`, `content`), `WhyUs` (`reasons`), `ServicesIncluded` (`services`), `OurProcess` (`steps[{title,description,duration}]`, `button`), `Faq`.
  - `Form`: `heading`, `subHeading`, `note`, plus the hydrated `form`. In the sidebar it renders as the lead-card, with anchor `enquiry` by default.
  - `Packages`: `components/tax-alphonic/packages/PackagesBlock.jsx`. Labels: `buttonText`, `buttonUrl`, `priceSuffix`, `bestValueLabel`, `featuresTitle`, `recommendedLabel`. Empty label = not shown.
  - `Highlights` (`items[{icon,title,text}]`, `variant` cards|tinted; renders as cred-strip, guarantee strip, or the side-trust grid in the sidebar).
  - `Checklist` (`title`, `items[{icon,text}]`; side-why in the sidebar).
  - `CallToAction` (`variant` dark|light|success, `icon`, `title`, `text`, `buttons[]`, `note`; renders as ctastrip, side-final-cta, lead-card or side-guarantee).
  - Unknown types fall back to `GenericBlock`.
- Icons: emoji, an image URL, or a legacy `bi-*`/`fa-*` class. Classes are mapped to emoji in `ICON_CLASSES`, else dropped. `servicePageService.js` only turns `icon`/`image` values into absolute URLs when they look like paths.
- Design is copied from `uirefrence.html` (1.4MB, the `#/service/...` view). CSS is extracted into `components/tax-alphonic/service-page.css` and scoped under `.ta-svc`. Reuse its classes (`blk`, `kicker`, `bcard`, `wc-item`, `proc2`, `plan`, ...) instead of Tailwind on these pages. Local additions sit at the end of that file.
- CMS forms: `components/tax-alphonic/forms/CmsForm.jsx` (client) submits through the Server Action `service/formSubmission.js` to `POST /api/v1/forms/public/:slug/submit`. It forwards `X-Forwarded-For` and sends the `_hp` honeypot. 422 responses come back as `errors: [{ field, message }]`.
- A new Page Builder block needs: admin `PageBuilder.jsx` `AVAILABLE_BLOCKS`, a backend section type (plus a `SectionHydrator` entry if it references other records), and a case in `BodyBlock` here.

## CMS live preview
- `app/cms-preview` (noindex) + `components/tax-alphonic/preview/ServicePreview.jsx`. The admin's Live Preview iframes it and posts `{ type: "ta-service-preview", service: draft }` (service page) `{ type: "ta-page-preview", service: { title, content, sections } }` (CMS page, rendered with `ApiPage`) or `{ type: "ta-home-preview", service: { sections } }` (Home Page Builder); the page answers `ta-service-preview-ready` when loaded.
- Only origins in `CMS_ADMIN_ORIGIN` (comma-separated, default `http://localhost:5173`) are accepted. Set it in production.
- Server Action `service/servicePreview.js`: `buildHomePreview` maps the home draft with `mapSection`, resolves any `payload.formId` and runs `attachModuleContent`, then it renders with `HomeSections`. `buildServicePreview` hydrates Form/Packages from `/forms/public/:id` and `/packages/:id`, then runs `mapService`, so the preview uses the exact live renderer.

## Gotchas
- `app/globals.css` is messy: unlayered `h1`/`h2`/`h3` sizes override Tailwind text classes (the footer headings render too big), and the last body font rule is Arial. The `a { color: inherit }` rule is inside `@layer base` on purpose, so Tailwind text colours on links win.
- Dead legacy code from the old static-JSON site: `components/tax-alphonic/renderPage.jsx`, `pages/{Home,Service,Category,Advisory,Taxpedia,Listing,Generic}Page.jsx`, most of `sections/` and `ui/`, `data/test.json`, `components/ContentBlock.jsx` and `DebugLabel.jsx` (both broken), and the empty `app/utils/pageCards.js`. The remaining ESLint errors come from these.
- `lib/sanitizeHtml.js` is a weak regex sanitizer for CMS HTML. Replace it before production.
- CMS icons are Font Awesome or Bootstrap class names, which this site doesn't load. They are mapped to emoji.
- Service API sample slugs: `digital-marketing-services` (Form + Packages), `seo-services`, `income-tax`.

## Verifying UI
No Playwright. Use headless Edge (`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe --headless=new --screenshot=... --window-size=W,H <url>`). For interaction, drive Edge over CDP with a small Node script (Node 24 has a global `WebSocket`). Edge renders at least 500px wide, so test mobile at 500–520px.
