import React, { createContext, useContext, useState, useEffect } from 'react';
import { TOKENS, ACCENT, softenColor, contrastColor, lightenForDark } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  accent: string;
  setAccent: (color: string) => void;
  setSecondaryAccent: (color: string | null) => void;
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
  const [secondaryAccentOverride, setSecondaryAccent] = useState<string | null>(null);
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

  const accentSoft = softenColor(accent, isDarkMode ? 0.3 : 0.45);
  const onAccent = contrastColor(accent);
  
  // Use secondaryAccentOverride if explicitly provided by LGU admin, otherwise calculate contrast from accentSoft
  const rawOnAccentSoft = secondaryAccentOverride && secondaryAccentOverride !== '#ffffff' 
    ? secondaryAccentOverride 
    : contrastColor(accentSoft);
  const onAccentSoft = !isDarkMode ? lightenForDark(rawOnAccentSoft) : rawOnAccentSoft;

  const iconAccentRaw = iconAccentOverride || accent;
  const iconAccent = isDarkMode ? lightenForDark(iconAccentRaw) : iconAccentRaw;
  const onIconAccent = contrastColor(iconAccent);

  const baseTokens = isDarkMode ? TOKENS.dark : TOKENS.light;
  const bg = isDarkMode && darkBgOverride ? darkBgOverride : baseTokens.bg;
  const T = { ...baseTokens, bg, accent, accentSoft, onAccent, onAccentSoft, iconAccent, onIconAccent };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, accent, setAccent, setSecondaryAccent, setIconAccent, setDarkBg, T }}>
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
