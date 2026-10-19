
"use client";

import React from "react";
import { THEME } from "../theme";
import { prettyTitle } from "../../../lib/tax-alphonic/utils";

export default function Breadcrumb({ page }) {
  const path =
    String(page?.route || "")
      .replace(/^#/, "")
      .split("|")
      .filter(Boolean)
      .pop() || "/";

  const parts = path.split("/").filter(Boolean);

  const linkStyle = {
    color: THEME.muted,
    textDecoration: "none",
    fontSize: "13px",
    fontWeight: 500,
    transition: "color 0.2s ease",
    whiteSpace: "nowrap",
  };

  const separatorStyle = {
    color: THEME.muted,
    opacity: 0.55,
    fontSize: "13px",
    userSelect: "none",
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "1204px",
        margin: "0 auto",
        padding: "18px 24px 12px",
        boxSizing: "border-box",
      }}
    >
      <nav
        aria-label="Breadcrumb"
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "9px",
          fontFamily: "inherit",
          fontSize: "13px",
          lineHeight: 1.8,
        }}
      >
        <a
          href="/"
          style={linkStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = THEME.ink;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = THEME.muted;
          }}
        >
          Home
        </a>

        {parts.map((part, index) => {
          const isLast = index === parts.length - 1;

          return (
            <React.Fragment key={`${part}-${index}`}>
              <span aria-hidden="true" style={separatorStyle}>
                /
              </span>

              <span
                aria-current={isLast ? "page" : undefined}
                style={{
                  color: isLast ? THEME.ink : THEME.muted,
                  fontSize: "13px",
                  fontWeight: isLast ? 600 : 400,
                  letterSpacing: "0.1px",
                  overflowWrap: "anywhere",
                }}
              >
                {prettyTitle(part)}
              </span>
            </React.Fragment>
          );
        })}
      </nav>
    </div>
  );
}
