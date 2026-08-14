'use client';

import React from 'react';
import { useLgu } from '../contexts/LguContext';
import { useTheme } from '../contexts/ThemeContext';

export function ScreenBackground({ children }: { children: React.ReactNode }) {
  const { activeLgu } = useLgu();
  const { isDarkMode, accent } = useTheme();
  const accentColor = activeLgu?.secondary_color || activeLgu?.primary_color || accent || '#F2E863';

  return (
    <div className="relative min-h-screen w-full bg-bg text-text-primary overflow-x-hidden transition-colors duration-200">
      {/* Soft diagonal wash from top-right */}
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-500"
        style={{
          background: isDarkMode
            ? `radial-gradient(ellipse at 85% 10%, ${accentColor}25 0%, ${accentColor}10 40%, rgba(28,25,23,0) 80%)`
            : `radial-gradient(ellipse at 85% 10%, ${accentColor}40 0%, ${accentColor}18 45%, rgba(255,252,245,0) 80%)`,
        }}
      />

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
