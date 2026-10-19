import { THEME } from "../theme";
import { SectionTitle } from "../ui";

export default function TextSection({ eyebrow, title, text }) {
  if (!text) return null;
  return (
    <section className="mb-10">
      <SectionTitle eyebrow={eyebrow} title={title} />
      <p className="text-[15px] leading-8" style={{ color: THEME.ink2 }}>{text}</p>
    </section>
  );
}
