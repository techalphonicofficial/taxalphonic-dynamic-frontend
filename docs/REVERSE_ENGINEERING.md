# Tax Alphonic: Reverse Engineering Notes

_Date: 2026-10-14. Ye snapshot hai, code badlega to ye note purana ho jayega._

## 1. Ye project kya hai

Tax/compliance services website ka **frontend**. Ye ek headless CMS/backend API (`BASE_URL`) se data laata hai aur use Next.js server components me render karta hai. Is repo me na database hai, na auth, aur na hi koi API route. Saara data external backend se aata hai.

**Stack:** Next.js 16.3.6 (App Router, `reactCompiler: true`), React 19.2.8, Tailwind CSS v4 (PostCSS), lucide-react icons. Plain JavaScript hai, TypeScript nahi. Alias `@/*` project root ko point karta hai ([jsconfig.json](../jsconfig.json)).

**Env vars** ([.env](../.env)):
| Var | Kahan use hota hai |
|---|---|
| `BASE_URL` | [service/apiClient.js](../service/apiClient.js). Har API call ka base. Ye na ho to error throw hota hai. |
| `IMAGE_BASE_URL` | [service/servicePageService.js](../service/servicePageService.js). Relative image paths (`/uploads/...`) ko absolute banata hai. Na ho to `BASE_URL` use hota hai. |

Dono variables sirf server pe padhe jaate hain (`NEXT_PUBLIC_` prefix nahi hai), isliye browser bundle tak nahi pahunchte.

---

## 2. Request lifecycle

```
Browser request
   │
   ▼
app/layout.js  (server, har page pe)
   ├─ getHeaderNavigation() ─┐
   ├─ getFooterNavigation() ─┴─► GET /api/v1/menus?page=1&limit=50&sortBy=createdAt&sortOrder=ASC  (no-store)
   └─ <ThemeProvider><Header/> {children} <Footer/></ThemeProvider>
   │
   ├── "/"            → app/page.js          (client component, hardcoded marketing homepage)
   └── "/a/b/c..."    → app/[...slug]/page.jsx
                           slug = sirf LAST segment ("c")
                           1) GET /api/v1/services/slug/c  → mile to <ApiServicePage>
                           2) GET /api/v1/pages/slug/c     → mile to <ApiPage>
                           3) dono fail                    → <NotFound>
```

`generateMetadata` aur page component dono same lookup karte hain. `getServiceBySlug` aur `getPageBySlug` React `cache()` me wrapped hain, isliye ek request ke andar ye API calls dedupe ho jaati hain. Requests ke beech koi caching nahi hai (`cache: "no-store"`), yaani har page view pe backend hit hota hai.

---

## 3. Backend API contract (code se infer kiya hua)

Saare responses ka envelope `{ success: boolean, data: ... }` hai.

### 3.1 `GET /api/v1/menus?...`
`payload.data.data` ek array hai. Har menu kuch aisa dikhta hai:
```js
{ location: "header" | "footer", status: "active",
  items: [{ id, title, url, target, displayOrder,
            children: [{ id, title, url, target, displayOrder }] }] }
```
- **Header:** pehla `location:"header", status:"active"` wala menu liya jaata hai. Items `displayOrder` se sort hote hain. **Pehle 4 → `topbar`**, baaki `megabar` me jaate hain. Children 1 column me dikhte hain; 6 se zyada ho to 2 columns, 12 se zyada ho to 3 columns.
- **Footer:** `location:"footer"` wala menu. Ye na mile to hardcoded `footerFallback` dikhta hai (Services, Taxpedia, About, Contact).
- `javascript:` ya khaali URL ko `#` bana diya jaata hai.

### 3.2 `GET /api/v1/services/slug/:slug`
```js
{ id, title, slug, summary | shortDescription, bannerImage, thumbImage, gallery,
  metaTitle, metaDescription, canonicalUrl, robots, keywords,
  ogTitle, ogDescription, ogImage, twitterCard, schemaMarkup, deletedAt,
  sections: [{ id, isActive, sortOrder,
               type: { componentKey | name },
               data: { payload: <JSON string ya object> } }] }
```
- `deletedAt` set ho to service reject hoti hai. **Draft bhi render hota hai**, aur ye jaan-boojh ke kiya gaya hai (code comment dekho).
- Sections ko `isActive !== false` se filter karke `sortOrder` se sort kiya jaata hai. `payload` agar string hai to JSON parse hota hai.
- `normalizePayload` poore payload pe recursively chalta hai: jis key ke naam me `image|banner|thumb|gallery|icon` ho, uski value absolute URL ban jaati hai. `content` key ke HTML me `src="/uploads/..."` bhi absolute ho jaata hai.

### 3.3 `GET /api/v1/pages/slug/:slug`
```js
{ id, title, slug, content (HTML), status, metaTitle, metaDescription,
  canonicalUrl, robots, keywords, ogTitle, ogDescription, ogImage, twitterCard, schemaMarkup }
```
Sirf `status === "published"` wale pages render hote hain.

---

## 4. Service page rendering ([ApiServicePage.jsx](../components/tax-alphonic/pages/ApiServicePage.jsx))

Ye section `type` (backend ka `componentKey`) ke hisaab se component chunta hai:

| `type` | Component | Payload fields |
|---|---|---|
| `HeroBanner` | Top hero (list se alag nikala jaata hai) | `heading`, `subHeading`, `backgroundImage` |
| `Overview` | RichTextSection | `title`, `content` (HTML) |
| `WhyUs` | CardsSection | `title`, `reasons[]` |
| `ServicesIncluded` | CardsSection | `title`, `services[]` |
| `OurProcess` | ProcessSection | `title`, `steps[] {title, description}` |
| `Faq` / `FAQ` | FaqSection | `faqs[] {question, answer}` |
| _koi aur_ | GenericSection | `title/heading`, `description/subHeading/summary`, `content`, aur **pehla non-empty array** cards ban jaata hai |

Hero ke liye fallback order: `hero.heading → service.title`, `hero.subHeading → service.summary`, `hero.backgroundImage → bannerImage → thumbImage`.

**Naya section type add karna ho** to `ServiceSection` ke switch me ek case jodo.

## 5. SEO ([app/[...slug]/page.jsx](../app/[...slug]/page.jsx))

`createMetadata(record)` ye mapping karta hai:
- `title`: `metaTitle || title`. `description`: `metaDescription || summary`.
- `robots` string (`"noindex, nofollow"`) ko `{index, follow}` me badalta hai.
- `keywords` ko comma-separated string se array banata hai.
- OG/Twitter: image ka order `ogImage → bannerImage → thumbImage`. Image ho to card `summary_large_image`, warna `summary`.
- `canonicalUrl` set ho to `alternates.canonical` aur `og:url` me jaata hai.
- `schemaMarkup` ko JSON-LD `<script>` ke roop me inject kiya jaata hai (page body me).
- 404 pe `noindex, nofollow` lagta hai.

---

## 6. UI shell

### Header ([components/layout/Header.jsx](../components/layout/Header.jsx), ~1900 lines, client component)
- Ye `navigation = { topbar, megabar, drawer: { order }, drawerOnly }` leta hai.
- Desktop pe topbar items search ke bagal me dikhte hain, aur megabar main nav row hai. Dropdowns ke andar filter box hai, aur screen ke edge pe dropdown ko shift karne wala logic bhi hai.
- `NavigationSearch` saare menu items (children samet) ko flatten karke client-side search karta hai.
- Mobile drawer `drawer.order` ke hisaab se items dikhata hai.
- `cleanUrl` purane JSON formats (`"#/path"`, `"label|/path"`) bhi handle karta hai. Ye purane static-data system se bacha hua hai.
- Section types `search`, `columns`, `links`, `note` render hote hain. API mapping abhi sirf `columns` banati hai, baaki purane JSON ke liye the.

### Footer ([components/layout/Footer.jsx](../components/layout/Footer.jsx))
Footer items 4 columns tak me bante hain. Column titles hardcoded hain: "Explore", **"Development services", "Marketing services"**, "More services". Ye tax business pe fit nahi baithte, lagta hai kisi aur template se aaye hain.

### Homepage ([app/page.js](../app/page.js))
- Poora page `"use client"` hai. Categories, journey, tools, industries, bundles, FAQs aur press jaisa saara content **hardcoded** hai, API se kuch nahi aata.
- Search sirf in hardcoded lists pe chalta hai.
- Purana header aur footer `{false && (...)}` se band kiye gaye hain, phir bhi bundle me shaamil hain.
- Newsletter "Subscribe" button kuch karta nahi (koi handler nahi hai).
- Homepage ke links `/category/*`, `/tools/*`, `/journey/*`, `/industries/*`, `/talk-to-expert`, `/login`, `/products`, `/advisory`, `/loan/government` pe jaate hain. Ye sab `[...slug]` me last segment (jaise `gst`, `startup`) se lookup karte hain. Backend me us slug ki service ya page na ho to **NotFound** milega.

### Theme ([context/ThemeContext.jsx](../context/ThemeContext.jsx))
Light/dark state `localStorage` me save hoti hai aur `<html>` pe `.dark` class lagti hai. CSS variables [globals.css](../app/globals.css) me hain. Lekin **`ThemeToggle` kahin use nahi hota** aur zyaadatar components hardcoded colors use karte hain. Isliye dark mode practically kaam nahi karta.

---

## 7. Dead / legacy code

Ek purana system tha jo `data/test.json` (363KB, `schemaVersion`, `routeManifest`, `catalogs`, `pages["#/home"]` …) se pages resolve karta tha, phir `renderPage(page.type)` se render karta tha. Ab ye system wire nahi hai:

| File / folder | Status |
|---|---|
| `components/tax-alphonic/renderPage.jsx` | Kahin import nahi hota |
| `pages/` me `HomePage, ServicePage, CategoryPage, AdvisoryPage, TaxpediaPage, ListingPage, GenericPage` | Sirf `renderPage` use karta hai, isliye dead |
| `components/tax-alphonic/sections/*` (NotFound ko chhod ke), `ui/*`, `theme.js` | Sirf dead pages use karte hain (`NotFound` `theme.js` use karta hai) |
| `data/test.json` | Kahin import nahi hota |
| `components/ContentBlock.jsx` | **Broken**: `./SectionTitle` aur `./DynamicValue` import karta hai, jo `components/` me hain hi nahi |
| `components/DebugLabel.jsx` | **Broken**: `import.meta.env.DEV` Vite ka syntax hai, Next.js me nahi chalta |
| `components/ui/ThemeToggle.jsx` | Unused |
| `app/utils/pageCards.js` | Khaali file |
| `lib/tax-alphonic/resolvePage.js` | README me iska zikr hai, lekin file exist nahi karti |

README bhi purana hai: wo `app/[[...slug]]` (optional catch-all) batata hai, jabki asal route `app/[...slug]` hai.

---

## 8. Issues (priority order)

### High
1. **Regex HTML sanitizer** ([lib/sanitizeHtml.js](../lib/sanitizeHtml.js)): CMS HTML `dangerouslySetInnerHTML` se render hota hai. Regex wala sanitizer `<iframe>`, `<object>`, `<embed>`, `<style>`, `<form>`, bina quotes wala `href=javascript:...`, `data:` URLs aur nested/broken tags (`<scr<script>ipt>`) ko nahi rokta. Upar se ye pehle `&lt;` jaise entities decode karta hai, to escaped text bhi live HTML ban jaata hai. Agar CMS editor trusted nahi hai to ye stored XSS hai. **Fix:** `sanitize-html` ya `isomorphic-dompurify` jaisi library, allowlist ke saath.
2. **JSON-LD injection:** `JSON.stringify(schema)` `</script>` ko escape nahi karta, isliye CMS ka `schemaMarkup` script tag tod sakta hai. **Fix:** `.replace(/</g, "\\u003c")`.
3. **Draft services public hain:** koi bhi draft slug URL se khul sakta hai. Backend ko rokna chahiye, ya frontend pe `status` check lagao.

### Medium
4. **`console.log("service payload", payload)`** [servicePageService.js](../service/servicePageService.js) me reh gaya hai. Ye har request pe poora payload server logs me likhta hai.
5. **Menus API 2 baar call hoti hai** (header aur footer dono same URL `no-store` ke saath maangte hain). Ek hi call karke dono menus usi se nikal lo.
6. **Koi caching nahi hai:** har page view pe 3-4 backend calls hoti hain. `next: { revalidate: N }` ya cache tags lagane se backend load aur TTFB dono kam honge.
7. **Sirf last slug segment use hota hai:** `/x/y/gst-registration` aur `/gst-registration` same content dete hain, jo duplicate content hai. Prefix validate karo ya canonical hamesha set karo.
8. **Service aur page lookup sequential hain:** service 404 hone ke baad hi page lookup hota hai. Dono `Promise.all` me chal sakte hain.
9. **Fonts ka mess:** `layout.js` me `next/font` se Sora aur Inter load hote hain, lekin unke CSS vars (`--font-sora`, `--font-inter`) kahin use nahi hote. `globals.css` me Google Fonts ke 2 `@import` hain (Poppins, Inter, Plus Jakarta Sans), aur body font 3 baar override hota hai. Aakhri rule `font-family: Arial` jeet jaata hai. Matlab 4-5 font families download hoti hain aur body me Arial dikhta hai. `@import "tailwindcss"` bhi file ke beech me hai.

### Low
10. ESLint: **12 errors, 2 warnings.**
    - `react-hooks/error-boundaries`: `JsonLd` me JSX try/catch ke andar banta hai (ApiPage, ApiServicePage). Parse ko try ke andar rakho aur JSX bahar banao.
    - `react-hooks/set-state-in-effect` ThemeContext me. Isse light theme ka flash bhi hota hai.
    - `<a>` ki jagah `<Link>` chahiye (zyaadatar dead code me hai).
    - Header me `<img>` hai, `next/image` use karo.
11. Footer column titles ("Development/Marketing services") galat hain.
12. Header.jsx 1900 lines ka hai, aur usme purane JSON formats ka handling bhi hai. Ise todna chahiye.
13. Project git repo nahi hai, isliye version control nahi hai.

---

## 9. Suggested next steps
1. `git init` karke current state commit karo.
2. Security fixes: sanitizer library, JSON-LD escape, aur `console.log` hatao.
3. Dead code delete karo (section 7). Isse codebase lagbhag aadha ho jayega.
4. Menus ek baar fetch karo, `revalidate` lagao, aur service/page lookup parallel karo.
5. Fonts aur globals.css saaf karo.
6. Homepage ka content CMS se lao (agar backend support karta hai).
7. README update karo.
