'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { PageHeader } from './PageHeader';


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

  return (
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
  );
};
