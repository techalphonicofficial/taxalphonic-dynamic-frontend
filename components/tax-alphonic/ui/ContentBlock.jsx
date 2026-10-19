import SectionTitle from "./SectionTitle";
import DynamicValue from "./DynamicValue";

export default function ContentBlock({ title, value }) {
  if (!value) return null;
  return (
    <section className="mt-10">
      <SectionTitle title={title} />
      <DynamicValue value={value} />
    </section>
  );
}
