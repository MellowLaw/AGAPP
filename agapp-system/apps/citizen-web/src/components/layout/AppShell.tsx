'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { DesktopSidebar } from './DesktopSidebar';
import { BottomNav } from './BottomNav';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthOrStandalone =
    pathname?.startsWith('/auth') ||
    pathname === '/lgu-select' ||
    pathname === '/banned';

  if (isAuthOrStandalone) {
    return <main className="min-h-screen w-full">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <DesktopSidebar className="hidden lg:flex" />
      <main className="flex-1 min-h-screen w-full relative lg:pl-[72px] pb-24 lg:pb-12">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
