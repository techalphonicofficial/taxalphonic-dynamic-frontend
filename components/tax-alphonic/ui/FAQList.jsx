import { THEME } from "../theme";

export default function FAQList({ faqs = [] }) {
  if (!Array.isArray(faqs) || !faqs.length) return null;

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const question = Array.isArray(faq) ? faq[0] : faq.question || faq.q || `Question ${index + 1}`;
        const answer = Array.isArray(faq) ? faq[1] : faq.answer || faq.a || "";

        return (
          <details
            key={index}
            className="overflow-hidden rounded-xl border bg-white"
            style={{ borderColor: THEME.line }}
          >
            <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold" style={{ color: THEME.ink }}>
              {question}
            </summary>
            <div className="px-5 pb-5 text-sm leading-7" style={{ color: THEME.muted }}>
              {answer}
            </div>
          </details>
        );
      })}
    </div>
  );
}
