'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'agapp-admin-theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Start light on the server and the very first client render so markup
  // matches (avoids a hydration mismatch); the real preference is applied
  // right after mount in the effect below.
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = stored ? stored === 'dark' : prefersDark;
    setIsDark(initial);
    document.documentElement.classList.toggle('dark', initial);
    setMounted(true);
  }, []);

  // Kept so a rapid double-toggle doesn't let the first timer strip the class
  // out from under the second switch.
  const transitionTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      const root = document.documentElement;

      // Cross-fade every themed surface together for the duration of the
      // switch, then drop the class so it can't interfere with normal
      // component transitions. See `.theme-transition` in globals.css.
      root.classList.add('theme-transition');
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
      transitionTimer.current = setTimeout(() => {
        root.classList.remove('theme-transition');
        transitionTimer.current = null;
      }, 220);

      root.classList.toggle('dark', next);
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  useEffect(() => () => {
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
  }, []);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden' }}>{children}</div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
