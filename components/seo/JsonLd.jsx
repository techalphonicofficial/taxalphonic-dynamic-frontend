/** Structured data (JSON-LD) from the CMS: a JSON string or object; invalid JSON renders nothing. */
export default function JsonLd({ value }) {
  if (!value) return null;

  let schema = value;
  if (typeof value === "string") {
    try {
      schema = JSON.parse(value);
    } catch {
      return null;
    }
  }

  // Escape "<" so CMS-provided schema can never close the script tag early.
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
