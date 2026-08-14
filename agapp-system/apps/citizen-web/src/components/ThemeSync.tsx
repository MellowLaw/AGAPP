'use client';

import React, { useEffect } from 'react';
import { useLgu } from '../contexts/LguContext';
import { useTheme, softenColor, contrastColor, lightenForDark } from '../contexts/ThemeContext';

export function ThemeSync() {
  const { activeLgu } = useLgu();
  const { isDarkMode, accent } = useTheme();

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const primaryColor = activeLgu?.primary_color || accent || '#F2E863';
    const secondaryColor = activeLgu?.secondary_color || '#1E3A8A';
    const iconColor = activeLgu?.icon_color || primaryColor;
    const darkBgColor = activeLgu?.dark_bg_color || '#1C1917';

    const softAccent = softenColor(primaryColor, isDarkMode ? 0.3 : 0.45);
    const onAccent = contrastColor(primaryColor);

    const rawOnAccentSoft = secondaryColor && secondaryColor !== '#ffffff'
      ? secondaryColor
      : contrastColor(softAccent);
    const onAccentSoft = !isDarkMode ? lightenForDark(rawOnAccentSoft) : rawOnAccentSoft;

    const resolvedIconAccent = isDarkMode ? lightenForDark(iconColor) : iconColor;

    root.style.setProperty('--accent', primaryColor);
    root.style.setProperty('--accent-secondary', secondaryColor);
    root.style.setProperty('--accent-soft', softAccent);
    root.style.setProperty('--accent-contrast', onAccent);
    root.style.setProperty('--accent-soft-contrast', onAccentSoft);
    root.style.setProperty('--icon-accent', resolvedIconAccent);

    if (isDarkMode) {
      root.style.setProperty('--bg-base', darkBgColor);
    } else {
      root.style.setProperty('--bg-base', '#FFFCF5');
    }

    // Update mobile browser status bar theme color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDarkMode ? darkBgColor : '#FFFCF5');
    }
  }, [activeLgu, isDarkMode, accent]);

  return null;
}
