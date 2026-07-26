'use client';

import React, { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { PageHeader } from './PageHeader';
import { NavBadgeProvider } from './NavBadgeContext';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'lgu-admin' | 'super-admin' | 'lgu-personnel';
  lguName?: string;
  title: string;
  action?: React.ReactNode;
  /**
   * Opt-in editorial hero (serif headline + kicker + live status row)
   * instead of the compact title — used by the main Dashboard pages.
   * Pass `heroKicker` to enable it; other pages get the compact PageHeader.
   */
  heroKicker?: string;
  heroTitleAccent?: string;
  heroSubtitle?: string;
}

interface BrandPalette {
  color: string;
  secondaryColor: string;
  customIconColor: string | null;
  customDarkBg: string | null;
}

// The LGU's brand colours don't change when you flip the theme, but resolving
// them costs up to three Supabase round-trips. Cached at module scope, keyed by
// what actually determines them, so toggling dark/light repaints from memory
// instead of waiting on the network. See the effect below for why that matters.
let brandCache: { key: string; palette: BrandPalette } | null = null;

// No standalone header bar — the sidebar owns logo/profile/notifications
// (see Sidebar.tsx), and PageHeader renders inline at the top of each page's
// own content instead of a separate sticky chrome element.
export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  role,
  lguName,
  title,
  action,
  heroKicker,
  heroTitleAccent,
  heroSubtitle,
}) => {
  const params = useSearchParams();
  const lguParam = lguName || params?.get('lguName') || undefined;
  const displayTitle = (role === 'lgu-admin' || role === 'lgu-personnel') && lguParam
    ? `${title} — ${lguParam}`
    : title;
  const { isDark } = useTheme();

  useEffect(() => {
    const adjustColorContrast = (hex: string, forDark: boolean): string => {
      const clean = hex.replace('#', '');
      if (clean.length !== 6) return hex;
      let r = parseInt(clean.slice(0, 2), 16);
      let g = parseInt(clean.slice(2, 4), 16);
      let b = parseInt(clean.slice(4, 6), 16);

      // Relative luminance calculation
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

      if (forDark && luminance < 0.45) {
        // Lighten dark colors for dark mode (blend 50% with white)
        r = Math.min(255, Math.floor(r + (255 - r) * 0.5));
        g = Math.min(255, Math.floor(g + (255 - g) * 0.5));
        b = Math.min(255, Math.floor(b + (255 - b) * 0.5));
      } else if (!forDark && luminance > 0.75) {
        // Darken very bright colors for light mode (blend 40% with dark grey)
        r = Math.max(0, Math.floor(r * 0.6));
        g = Math.max(0, Math.floor(g * 0.6));
        b = Math.max(0, Math.floor(b * 0.6));
      }

      const rs = r.toString(16).padStart(2, '0');
      const gs = g.toString(16).padStart(2, '0');
      const bs = b.toString(16).padStart(2, '0');
      return `#${rs}${gs}${bs}`;
    };

    const cacheKey = `${role}|${lguParam ?? ''}`;

    const updateThemeAccent = async () => {
      // Paint the theme's base background FIRST, before any await. This inline
      // style on :root overrides the `.dark` class rule in globals.css, so the
      // class flipped instantly while the background sat on the old colour
      // until the Supabase calls below resolved — that was the slow fade.
      // A custom per-LGU dark background (if any) refines this a moment later.
      document.documentElement.style.setProperty('--bg-base', isDark ? '#292929' : '#fffcf5');

      let color = '#d62a53'; // fallback pink
      let secondaryColor = '#ffffff'; // fallback white
      let customIconColor: string | null = null;
      let customDarkBg: string | null = null;

      if (role === 'super-admin') {
        color = isDark ? '#fffcf5' : '#292929';
        secondaryColor = color;
      } else if (brandCache?.key === cacheKey) {
        // Already resolved — repaint synchronously so a theme toggle is instant.
        ({ color, secondaryColor, customIconColor, customDarkBg } = brandCache.palette);
      } else {
        // First try fetching based on logged-in user profile LGU connection
        const { data: { user } } = await supabase.auth.getUser();
        let fetchedLguId: string | null = null;
        
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('lgu_id')
            .eq('id', user.id)
            .single();
          if (profile?.lgu_id) {
            fetchedLguId = profile.lgu_id;
          }
        }
        
        if (fetchedLguId) {
          const { data: lgu } = await supabase
            .from('lgus')
            .select('primary_color, secondary_color, feature_flags')
            .eq('id', fetchedLguId)
            .single();
          if (lgu?.primary_color) {
            color = lgu.primary_color;
          }
          if (lgu?.secondary_color) {
            secondaryColor = lgu.secondary_color;
          }
          const flags = lgu?.feature_flags as any;
          if (flags?.iconColor) customIconColor = flags.iconColor;
          if (flags?.darkBgColor) customDarkBg = flags.darkBgColor;
        } else if (lguParam) {
          // Fallback to name query if user is not loaded yet
          const { data: lgu } = await supabase
            .from('lgus')
            .select('primary_color, secondary_color, feature_flags')
            .ilike('name', lguParam)
            .single();
          if (lgu?.primary_color) {
            color = lgu.primary_color;
          }
          if (lgu?.secondary_color) {
            secondaryColor = lgu.secondary_color;
          }
          const flags = lgu?.feature_flags as any;
          if (flags?.iconColor) customIconColor = flags.iconColor;
          if (flags?.darkBgColor) customDarkBg = flags.darkBgColor;
        }
      }

      // Remember what we resolved so the next theme toggle repaints from
      // memory rather than re-running the queries above.
      if (role !== 'super-admin') {
        brandCache = { key: cacheKey, palette: { color, secondaryColor, customIconColor, customDarkBg } };
      }

      // Adjust color contrasts for accessibility
      const adjustedColor = adjustColorContrast(color, isDark);
      const adjustedSecColor = adjustColorContrast(secondaryColor, isDark);
      const adjustedIconColor = customIconColor 
        ? adjustColorContrast(customIconColor, isDark)
        : adjustedColor;
      
      // Calculate luminance of adjusted color to decide contrasting text color
      const cleanColor = adjustedColor.replace('#', '');
      let contrastVal = '#ffffff';
      if (cleanColor.length === 6) {
        const rc = parseInt(cleanColor.slice(0, 2), 16);
        const gc = parseInt(cleanColor.slice(2, 4), 16);
        const bc = parseInt(cleanColor.slice(4, 6), 16);
        const lum = (0.299 * rc + 0.587 * gc + 0.114 * bc) / 255;
        if (lum > 0.65) contrastVal = '#1f1f1f'; // dark text for very light accent
      }
      
      document.documentElement.style.setProperty('--accent', adjustedColor);
      document.documentElement.style.setProperty('--accent-contrast', contrastVal);
      document.documentElement.style.setProperty('--accent-secondary', adjustedSecColor);
      document.documentElement.style.setProperty('--accent-icon', adjustedIconColor);

      // Handle dark mode background override
      if (isDark) {
        document.documentElement.style.setProperty('--bg-base', customDarkBg || '#292929');
      } else {
        document.documentElement.style.setProperty('--bg-base', '#fffcf5');
      }
      
      const clean = adjustedColor.replace('#', '');
      if (clean.length === 6) {
        const r = parseInt(clean.slice(0, 2), 16);
        const g = parseInt(clean.slice(2, 4), 16);
        const b = parseInt(clean.slice(4, 6), 16);
        document.documentElement.style.setProperty('--accent-soft', `rgba(${r}, ${g}, ${b}, 0.08)`);
      } else {
        document.documentElement.style.setProperty('--accent-soft', 'rgba(0, 0, 0, 0.08)');
      }

      const cleanSec = adjustedSecColor.replace('#', '');
      if (cleanSec.length === 6) {
        const r = parseInt(cleanSec.slice(0, 2), 16);
        const g = parseInt(cleanSec.slice(2, 4), 16);
        const b = parseInt(cleanSec.slice(4, 6), 16);
        document.documentElement.style.setProperty('--accent-secondary-soft', `rgba(${r}, ${g}, ${b}, 0.08)`);
      } else {
        document.documentElement.style.setProperty('--accent-secondary-soft', 'rgba(0, 0, 0, 0.08)');
      }
    };
    
    updateThemeAccent();
  }, [role, lguParam, isDark]);

  return (
    <NavBadgeProvider role={role}>
      <div className="min-h-screen bg-bg">
        <Sidebar role={role} lguName={lguName} />

        <div className="ml-[72px]">
          <main className={heroKicker ? 'p-8' : 'p-6'}>
            {heroKicker ? (
              <PageHeader variant="hero" kicker={heroKicker} title={title} titleAccent={heroTitleAccent} subtitle={heroSubtitle} action={action} />
            ) : (
              <PageHeader variant="compact" title={displayTitle} action={action} />
            )}
            {children}
          </main>
        </div>

      </div>
    </NavBadgeProvider>
  );
};
