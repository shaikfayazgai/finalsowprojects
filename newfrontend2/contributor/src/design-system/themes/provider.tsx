"use client";

/**
 * Meridian theme provider.
 *
 * Sets `data-theme="light" | "dark"` on the document root so every
 * CSS variable in tokens.css resolves to the correct theme value.
 * Persists the operator's choice to localStorage. Honors the OS-level
 * `prefers-color-scheme` for first-time visits.
 *
 * Use:
 *   <ThemeProvider>
 *     <App />
 *   </ThemeProvider>
 *
 * Read or change the theme anywhere:
 *   const { theme, setTheme, toggleTheme } = useTheme();
 */

import * as React from "react";

export type ThemeName = "light" | "dark";

interface ThemeContextValue {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  toggleTheme: () => void;
}

const STORAGE_KEY = "meridian-theme";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function readInitialTheme(): ThemeName {
  if (typeof window === "undefined") return "light";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* localStorage unavailable */
  }
  if (typeof window.matchMedia === "function") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return "light";
}

export function ThemeProvider({
  children,
  defaultTheme,
}: {
  children: React.ReactNode;
  /** Force a theme regardless of OS / storage — for screenshot pages. */
  defaultTheme?: ThemeName;
}) {
  const [theme, setThemeState] = React.useState<ThemeName>(
    defaultTheme ?? "light",
  );

  // Hydrate from storage / OS on mount (avoids SSR mismatch).
  React.useEffect(() => {
    if (defaultTheme) {
      setThemeState(defaultTheme);
      return;
    }
    setThemeState(readInitialTheme());
  }, [defaultTheme]);

  // Apply to document root + persist.
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () =>
        setThemeState((t) => (t === "light" ? "dark" : "light")),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
}
