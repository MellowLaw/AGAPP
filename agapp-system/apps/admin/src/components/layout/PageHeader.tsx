'use client';

import React from 'react';
import { StatusRow } from './StatusRow';

interface PageHeaderProps {
  /** Compact-variant title, or the hero's main serif headline. */
  title: string;
  /** Hero-only: small-caps mono line above the headline, e.g. "LILIW, LAGUNA — MUNICIPAL CONTROL CENTER" */
  kicker?: string;
  /** Hero-only: colored suffix rendered after the title, e.g. "Agapp Portal" */
  titleAccent?: string;
  /** Hero-only: supporting line under the headline. */
  subtitle?: string;
  action?: React.ReactNode;
  /** `hero` = the two main dashboards (kicker + large serif + subtitle).
   *  `compact` = every other page — a humble title, no kicker/subtitle. Default. */
  variant?: 'hero' | 'compact';
}

// Replaces the old sticky top Header bar AND DashboardHero — there is no
// header bar anymore (see Sidebar.tsx for the profile/notifications that used
// to live there). This renders inline at the top of each page's own content,
// with the SYS_LIVE/clock/theme-toggle row always in the same place.
export function PageHeader({ title, kicker, titleAccent, subtitle, action, variant = 'compact' }: PageHeaderProps) {
  if (variant === 'hero') {
    return (
      <div className="flex items-start justify-between gap-6 mb-8 flex-wrap">
        <div className="min-w-0">
          {kicker && (
            <p className="text-[11px] font-mono font-semibold tracking-[0.2em] text-accent uppercase mb-2">
              {kicker}
            </p>
          )}
          <h1 className="display-font font-serif italic text-4xl text-text-primary tracking-tight leading-tight">
            {title}
            {titleAccent && <span className="text-accent"> | {titleAccent}</span>}
          </h1>
          {subtitle && (
            <p className="text-sm text-text-muted mt-2 max-w-xl">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {action}
          <StatusRow />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-6 mb-6 flex-wrap">
      <h1 className="text-2xl font-serif italic text-text-primary">{title}</h1>
      <div className="flex items-center gap-3 shrink-0">
        {action}
        <StatusRow />
      </div>
    </div>
  );
}
