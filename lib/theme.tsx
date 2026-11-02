"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
const STORAGE_KEY = "relief-care-theme";

const ThemeContext = createContext<{ theme: Theme; toggle: () => void } | null>(null);

// Runs before paint via the inline script in layout.tsx (see THEME_INIT_SCRIPT
// below) — this just keeps React state in sync with whatever that script
// already applied to <html data-theme>.
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme");
    if (current === "dark" || current === "light") {
      setTheme(current);
    } else {
      setTheme(window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable — theme still applies for this page view
    }
  }

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

// Inlined into <head> so the right theme applies before first paint — avoids
// a flash of the wrong theme. Kept as a plain string (not a component) since
// it must run as a blocking script, before React hydrates.
export const THEME_INIT_SCRIPT = `
(function(){
  try {
    var saved = localStorage.getItem("${STORAGE_KEY}");
    if (saved === "light" || saved === "dark") {
      document.documentElement.setAttribute("data-theme", saved);
    }
  } catch (e) {}
})();
`;
