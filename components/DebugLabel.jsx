
import React from "react";

const DEBUG = import.meta.env.DEV;

export function DebugLabel({ name }) {
  if (!DEBUG) return null;

  return (
    <span
      style={{
        display: "block",
        width: "fit-content",
        color: "#536078",
        fontSize: "12px",
        fontWeight: 700,
        fontFamily: "Arial, sans-serif",
        marginBottom: "6px",
        lineHeight: 1.5,
      }}
    >
      {name}
    </span>
  );
}

export function DebugSection({ name, children }) {
  return (
    <section>
      <DebugLabel name={name} />
      {children}
    </section>
  );
}
