import React, { createContext, useContext, useState, useEffect } from 'react';
import { TOKENS, ACCENT, softenColor } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  accent: string;
  setAccent: (color: string) => void;
  T: typeof TOKENS.light & { accent: string; accentSoft: string };
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkModeState] = useState(false);
  const [accent, setAccent] = useState(ACCENT);

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
  const T = { ...(isDarkMode ? TOKENS.dark : TOKENS.light), accent, accentSoft };

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, accent, setAccent, T }}>
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
