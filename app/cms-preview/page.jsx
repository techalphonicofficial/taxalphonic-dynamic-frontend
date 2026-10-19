import ServicePreview from "@/components/tax-alphonic/preview/ServicePreview";

// Draft preview for the CMS admin (see ServicePreview). Never indexed.
export const metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

// Admin origins allowed to send drafts; comma-separated in CMS_ADMIN_ORIGIN.
const allowedOrigins = (process.env.CMS_ADMIN_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

export default function CmsPreviewPage() {
  return <ServicePreview allowedOrigins={allowedOrigins} />;
}
