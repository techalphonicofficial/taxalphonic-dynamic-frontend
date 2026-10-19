import { sanitizeHtml } from "@/lib/sanitizeHtml";
import ApiServicePage from "./ApiServicePage";
import JsonLd from "@/components/seo/JsonLd";

/**
 * A CMS page with Page Builder blocks renders in the service-page layout (hero, main content,
 * right sidebar, Form, Packages, ...), with its editor content as the first Overview block.
 * A page without blocks (privacy policy, terms) stays a simple article.
 */
export default function ApiPage({ page }) {
  if (page.sections?.length) {
    const content = page.content?.replace(/<[^>]*>/g, "").trim()
      ? [{ id: `${page.id}-content`, type: "Overview", config: {}, payload: { content: page.content } }]
      : [];
    return <ApiServicePage service={{ ...page, summary: "", category: null, sections: [...content, ...page.sections] }} />;
  }

  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <JsonLd value={page.schemaMarkup} />
      <article className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12">
        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">{page.title}</h1>
        <div
          className="mt-8 text-[15px] leading-7 text-slate-600 [&_a]:font-semibold [&_a]:text-[#0f766e] [&_a]:underline [&_h2]:mt-9 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-slate-900 [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_ol]:my-4 [&_ol]:list-decimal [&_p]:mb-4 [&_strong]:font-bold [&_ul]:my-4"
          dangerouslySetInnerHTML={{ __html: sanitizeHtml(page.content) }}
        />
      </article>
    </main>
  );
}
