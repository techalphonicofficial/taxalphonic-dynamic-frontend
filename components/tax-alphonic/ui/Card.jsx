
import React from "react";
import { THEME } from "../theme";

export default function Card({
  children,
  className = "",
  hover = true,
  padding = "default",
}) {
  const paddingClasses = {
    compact: "p-5 sm:p-6",
    default: "p-6 sm:p-7",
    large: "p-7 sm:p-8",
  };

  return (
    <div
      className={`
        group relative w-full min-w-0
        overflow-hidden rounded-2xl
        border border-slate-200/80
        bg-white
        ${paddingClasses[padding] || paddingClasses.default}
        shadow-[0_4px_18px_rgba(15,23,42,0.035)]
        ${
          hover
            ? "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-orange-200 hover:shadow-[0_14px_32px_rgba(15,23,42,0.09)]"
            : ""
        }
        ${className}
      `}
      style={{ borderColor: THEME.line }}
    >
      {/* Subtle top accent */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 top-0 h-[2px] rounded-full bg-gradient-to-r from-transparent via-orange-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <div className="relative flex min-w-0 items-start gap-4">
        {/* Premium check icon */}
        <div
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-xl border border-orange-100
            bg-orange-50 text-orange-600
            transition-all duration-300
            group-hover:border-orange-200
            group-hover:bg-orange-100
            group-hover:scale-105
          "
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-5 w-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m5 12 4 4L19 6" />
          </svg>
        </div>

        {/* Card content */}
        <div className="min-w-0 flex-1 pt-1.5 text-[15px] font-semibold leading-6 tracking-[-0.2px] text-slate-900 sm:text-base">
          {children}
        </div>
      </div>
    </div>
  );
}
