import React, { createContext, useContext, useState, useEffect } from 'react';
import { TOKENS } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeContextType = {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  T: typeof TOKENS.light;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkModeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('isDarkMode').then(val => {
      if (val !== null) setIsDarkModeState(val === 'true');
    });
  }, []);

  const setIsDarkMode = async (val: boolean) => {
    setIsDarkModeState(val);
    await AsyncStorage.setItem('isDarkMode', String(val));
  };

  const T = isDarkMode ? TOKENS.dark : TOKENS.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, setIsDarkMode, T }}>
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
