'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLgu } from './LguContext';

export const TOKENS = {
  light: {
    bg: '#FFFCF5',
    bgAlt: '#F7F3EA',
    card: '#FFFFFF',
    cardAlt: '#FFFDF7',
    text: '#292929',
    textMuted: '#8A8781',
    border: '#E9E4DA',
    chip: '#F1ECE1',
  },
  dark: {
    bg: '#1C1917',
    bgAlt: '#141210',
    card: '#292524',
    cardAlt: '#23201E',
    text: '#FFFCF5',
    textMuted: '#A8A29E',
    border: '#3D3835',
    chip: '#383330',
  },
};

// Blends hex toward white
export function softenColor(hex: string, amount = 0.45): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `#${[mix(r), mix(g), mix(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Lightens dark colors so they stand out in dark mode
export function lightenForDark(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance >= 0.72) return hex;
  const target = 0.80;
  const mix = Math.min(1, (target - luminance) / (1 - luminance + 0.001));
  const lift = (c: number) => Math.round(c + (255 - c) * mix);
  return `#${[lift(r), lift(g), lift(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

// Contrast calculation
export function contrastColor(hex: string): '#292929' | '#FFFCF5' {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#292929';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#292929' : '#FFFCF5';
}

export type ThemeTokens = typeof TOKENS.light & {
  accent: string;
  accentSoft: string;
  onAccent: string;
  onAccentSoft: string;
  iconAccent: string;
  onIconAccent: string;
};

interface ThemeContextType {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  toggleDarkMode: () => void;
  accent: string;
  setAccent: (color: string) => void;
  T: ThemeTokens;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { activeLgu } = useLgu();
  const [isDarkMode, setIsDarkModeState] = useState<boolean>(false);
  const [accent, setAccent] = useState<string>('#F2E863');

  // Sync from localStorage or OS theme on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem('agapp_dark_mode');
      if (saved !== null) {
        setIsDarkModeState(saved === 'true');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkModeState(prefersDark);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Update accent from active LGU
  useEffect(() => {
    if (activeLgu?.primary_color) {
      setAccent(activeLgu.primary_color);
    }
  }, [activeLgu?.primary_color]);

  // Apply dark mode class and dynamic CSS variables to html document
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }

    const effectiveAccent = activeLgu?.primary_color || '#F2E863';
    root.style.setProperty('--accent', effectiveAccent);
    const onAcc = contrastColor(effectiveAccent);
    root.style.setProperty('--accent-contrast', onAcc);

    const effectiveIconAccent = activeLgu?.icon_color || activeLgu?.primary_color || '#E11D48';
    const resolvedIconColor = isDarkMode ? lightenForDark(effectiveIconAccent) : effectiveIconAccent;
    root.style.setProperty('--accent-icon', resolvedIconColor);

    if (isDarkMode && activeLgu?.dark_bg_color) {
      root.style.setProperty('--bg-base', activeLgu.dark_bg_color);
    } else {
      root.style.removeProperty('--bg-base');
    }
  }, [isDarkMode, activeLgu]);

  const setIsDarkMode = useCallback((val: boolean) => {
    setIsDarkModeState(val);
    try {
      localStorage.setItem('agapp_dark_mode', String(val));
    } catch {}
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode, setIsDarkMode]);

  // Computed dynamic tokens
  const accentSoft = softenColor(accent, isDarkMode ? 0.3 : 0.45);
  const onAccent = contrastColor(accent);
  const rawOnAccentSoft = activeLgu?.secondary_color && activeLgu.secondary_color !== '#ffffff'
    ? activeLgu.secondary_color
    : contrastColor(accentSoft);
  const onAccentSoft = !isDarkMode ? lightenForDark(rawOnAccentSoft) : rawOnAccentSoft;

  const iconAccentRaw = activeLgu?.icon_color || accent;
  const iconAccent = isDarkMode ? lightenForDark(iconAccentRaw) : iconAccentRaw;
  const onIconAccent = contrastColor(iconAccent);

  const baseTokens = isDarkMode ? TOKENS.dark : TOKENS.light;
  const bg = isDarkMode && activeLgu?.dark_bg_color ? activeLgu.dark_bg_color : baseTokens.bg;

  const T: ThemeTokens = {
    ...baseTokens,
    bg,
    accent,
    accentSoft,
    onAccent,
    onAccentSoft,
    iconAccent,
    onIconAccent,
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        setIsDarkMode,
        toggleDarkMode,
        accent,
        setAccent,
        T,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
}
