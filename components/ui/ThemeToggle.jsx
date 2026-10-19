"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] transition-all duration-200 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
    >
      {theme === "light" ? "☾" : "☀"}
    </button>
  );
}