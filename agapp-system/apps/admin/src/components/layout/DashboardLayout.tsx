'use client';

import React from 'react';
import { useSearchParams } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: 'lgu-admin' | 'super-admin' | 'lgu-personnel';
  lguName?: string;
  title: string;
  action?: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  role,
  lguName,
  title,
  action,
}) => {
  const params = useSearchParams();
  const lguParam = lguName || params?.get('lguName') || undefined;
  const displayTitle = (role === 'lgu-admin' || role === 'lgu-personnel') && lguParam
    ? `${title} — ${lguParam}`
    : title;
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Sidebar role={role} lguName={lguName} />
      
      <div className="ml-60">
        <Header title={displayTitle} action={action} role={role} />
        
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
