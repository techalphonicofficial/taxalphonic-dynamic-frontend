"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import ApiServicePage from "../pages/ApiServicePage";
import HomeSections from "../home/HomeSections";
import ApiPage from "../pages/ApiPage";
import { buildHomePreview, buildPagePreview, buildServicePreview } from "@/service/servicePreview";

// Draft kinds the admin can send: a service page, a CMS page, or the homepage (Home Page Builder).
const BUILDERS = {
  "ta-service-preview": buildServicePreview,
  "ta-home-preview": buildHomePreview,
  "ta-page-preview": buildPagePreview,
};

/**
 * Live preview for the CMS admin. The admin embeds /cms-preview in an iframe and posts
 * { type: "ta-service-preview" | "ta-page-preview" | "ta-home-preview", service: draft } whenever the draft
 * changes; this page renders it with the real ApiServicePage, ApiPage or HomeSections. Messages from
 * any other origin are ignored.
 */
export default function ServicePreview({ allowedOrigins }) {
  const [preview, setPreview] = useState(null);
  const [status, setStatus] = useState("waiting");
  const [, startTransition] = useTransition();
  const latest = useRef(0);

  useEffect(() => {
    const onMessage = (event) => {
      if (!allowedOrigins.includes(event.origin)) return;
      const build = BUILDERS[event.data?.type];
      if (!build) return;

      const kind = event.data.type;
      const request = ++latest.current;
      startTransition(async () => {
        try {
          const data = await build(event.data.service);
          // Drop stale responses when the editor typed again in the meantime.
          if (request !== latest.current) return;
          const empty = !data || (Array.isArray(data) && !data.length);
          setPreview(empty ? null : { kind, data });
          setStatus(empty ? "empty" : "ready");
        } catch {
          if (request === latest.current) setStatus("error");
        }
      });
    };

    window.addEventListener("message", onMessage);
    // Tell the admin we're listening, so it sends the current draft straight away.
    window.parent?.postMessage({ type: "ta-service-preview-ready" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, [allowedOrigins]);

  if (!preview) {
    return (
      <div className="cms-preview-note">
        {status === "error" ? "Preview failed to load. Check that the CMS backend is running." :
          status === "empty" ? "Nothing to preview yet. Add a block." : "Waiting for the CMS editor…"}
      </div>
    );
  }

  if (preview.kind === "ta-home-preview") return <HomeSections sections={preview.data} />;
  if (preview.kind === "ta-page-preview") return <ApiPage page={preview.data} />;
  return <ApiServicePage service={preview.data} />;
}
