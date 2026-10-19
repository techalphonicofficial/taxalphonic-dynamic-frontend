import { THEME } from "../theme";
import { Card, SectionTitle, TemplateInfo } from "../ui";
import { Hero } from "../sections";

export default function CategoryPage({ page }) {
  const services = page.services || [];
  const template = page.template || {};

  return (
    <>
      <Hero page={page} />
      <main id="page-content" className="mx-auto max-w-[1156px] px-6 py-10">
        <SectionTitle eyebrow="Services" title={`${page.title} services`} description={page.description} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <a key={index} href={`/service/${service.slug}`}>
              <Card className="h-full transition hover:-translate-y-1 hover:shadow-lg">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl" style={{ background: "rgba(14,150,172,.10)" }}>
                  {service.icon || "◆"}
                </div>
                <h3 className="text-base font-bold" style={{ color: THEME.ink }}>{service.label}</h3>
                <span className="mt-3 inline-block text-xs font-semibold" style={{ color: THEME.brand }}>Explore →</span>
              </Card>
            </a>
          ))}
        </div>
        <TemplateInfo template={template} variant="grid" />
      </main>
    </>
  );
}
