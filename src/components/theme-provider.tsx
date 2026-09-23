"use client";

import * as React from "react";

type Theme = "dark" | "light";
const STORAGE_KEY = "netbox_theme";

interface Ctx {
  theme: Theme;
  toggle: () => void;
}

const ThemeContext = React.createContext<Ctx | null>(null);

/**
 * Simpler Theme-Provider. Dark ist Default. Die Klasse wird am <html> gesetzt;
 * ein Inline-Script im Layout verhindert das Aufblitzen des falschen Themes.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>("dark");

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored) setTheme(stored);
    } catch {
      /* ignore */
    }
  }, []);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const toggle = React.useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): Ctx {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme muss innerhalb von ThemeProvider stehen");
  return ctx;
}
