# Tax Alphonic – Componentized Dynamic Page

Zip ko apne Next.js project root me extract karo (folders merge ho jayenge).
`app/[[...slug]]/page.jsx` me us jagah ka path rakho jahan tumhara original page tha.

```
app/[[...slug]]/page.jsx          -> final slim page (sirf data resolve + render)
lib/tax-alphonic/utils.js         -> getSlugPath, prettyTitle, safeText
lib/tax-alphonic/resolvePage.js   -> JSON se page resolve karna
components/tax-alphonic/
  theme.js                        -> THEME colors
  renderPage.jsx                  -> page.type -> component mapping
  ui/        Card, SectionTitle, StringList, FAQList, Plans, DynamicValue,
             ContentBlock, ExpertCard, TemplateInfo, CardGrid
  sections/  Hero, Breadcrumb, NotFound, TextSection, BenefitsSection,
             DocsSection, ProcessSection
  pages/     HomePage, ServicePage, CategoryPage, AdvisoryPage,
             TaxpediaPage, ListingPage, GenericPage
```
