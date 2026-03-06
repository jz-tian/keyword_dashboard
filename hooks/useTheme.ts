"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "bloomberg" | "apple";

const STORAGE_KEY = "trend-dashboard-theme";
const DEFAULT_THEME: Theme = "bloomberg";

export function useTheme(): [Theme, (t: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(DEFAULT_THEME);

  // On mount, read from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
      if (stored === "bloomberg" || stored === "apple") {
        setThemeState(stored);
        applyTheme(stored);
      } else {
        applyTheme(DEFAULT_THEME);
      }
    } catch {
      applyTheme(DEFAULT_THEME);
    }
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }
  }, []);

  return [theme, setTheme];
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove("bloomberg", "apple");
  html.classList.add(theme);
}
