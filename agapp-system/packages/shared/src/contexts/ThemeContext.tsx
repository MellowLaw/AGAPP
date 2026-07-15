import React, { createContext, useContext, useState, useEffect } from 'react';
import { TOKENS, ACCENT, softenColor, contrastColor } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  accent: string;
  setAccent: (color: string) => void;
  setIconAccent: (color: string | null) => void;
  setDarkBg: (color: string | null) => void;
  T: typeof TOKENS.light & {
    accent: string;
    accentSoft: string;
    onAccent: string;
    onAccentSoft: string;
    iconAccent: string;
    onIconAccent: string;
  };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [accent, setAccent] = useState(ACCENT);
  // Both null = "not customized, fall back to the default". Distinct from
  // `accent` because the Home quick-action icons and the dark-mode background
  // are separately customizable per LGU — an admin can set one without the
  // other, so these can't just alias `accent`/`TOKENS.dark.bg`.
  const [iconAccentOverride, setIconAccent] = useState<string | null>(null);
  const [darkBgOverride, setDarkBg] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('isDarkMode').then(val => {
      if (val !== null) setIsDarkModeState(val === 'true');
    });
  }, []);

  const setIsDarkMode = async (val: boolean) => {
    setIsDarkModeState(val);
    await AsyncStorage.setItem('isDarkMode', String(val));
  };

  // Soft variant for large fills (tab bar pill, toggle tracks) — blended less
  // aggressively in dark mode so it doesn't lose contrast against the dark bg.
  const accentSoft = softenColor(accent, isDarkMode ? 0.3 : 0.45);
  // Text/icon color for anything drawn ON TOP of accent/accentSoft fills —
  // reacts to how light/dark the LGU's own color is, independent of whether
  // the app itself is in light or dark mode (an admin can pick a dark accent
  // while the app is in light mode, or vice versa; hardcoded ink would go
  // invisible in the former case).
  const onAccent = contrastColor(accent);
  const onAccentSoft = contrastColor(accentSoft);
  const iconAccent = iconAccentOverride || accent;
  const onIconAccent = contrastColor(iconAccent);

  const baseTokens = isDarkMode ? TOKENS.dark : TOKENS.light;
  // Custom dark-mode background only applies when actually in dark mode —
  // it's a per-LGU override of TOKENS.dark.bg, not a light-mode color.
  const bg = isDarkMode && darkBgOverride ? darkBgOverride : baseTokens.bg;
  const T = { ...baseTokens, bg, accent, accentSoft, onAccent, onAccentSoft, iconAccent, onIconAccent };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, accent, setAccent, setIconAccent, setDarkBg, T }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
