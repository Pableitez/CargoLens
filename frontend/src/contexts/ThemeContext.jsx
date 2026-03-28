import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// Tema claro/oscuro; preferencia en localStorage y data-theme en <html>.
const STORAGE_KEY = "freightboard-theme";

const ThemeContext = createContext(null);

function readStoredTheme() {
  if (typeof window === "undefined") return null;
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === "light" || s === "dark") return s;
  } catch {
    // ignorar
  }
  return null;
}

function systemPrefersLight() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function getInitialTheme() {
  const stored = readStoredTheme();
  if (stored) return stored;
  return systemPrefersLight() ? "light" : "dark";
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme === "light" ? "light" : "dark";
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignorar
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute("content", theme === "light" ? "#f8fafc" : "#070a0e");
    }
  }, [theme]);

  const setTheme = useCallback((t) => {
    setThemeState(t === "light" ? "light" : "dark");
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}
