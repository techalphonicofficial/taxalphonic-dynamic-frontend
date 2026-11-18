"use client";

import { useEffect } from "react";
import { watchInlineLinks } from "@/lib/inlineLinks";

/** [words](url) in CMS text becomes a link anywhere on the page (lib/inlineLinks.js). */
export default function InlineLinksScanner() {
  useEffect(() => watchInlineLinks(document.body), []);
  return null;
}
