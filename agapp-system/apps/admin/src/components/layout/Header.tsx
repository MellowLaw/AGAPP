'use client';

import React from 'react';
import { Bell } from '@phosphor-icons/react';
import { UserMenu } from './UserMenu';
import { useToast } from '@/components/ui/Toast';

interface HeaderProps {
  title: string;
  action?: React.ReactNode;
  showNotifications?: boolean;
  role?: 'lgu-admin' | 'super-admin' | 'lgu-personnel';
}

export const Header: React.FC<HeaderProps> = ({ 
  title, 
  action,
  showNotifications = true,
  role = 'lgu-admin',
}) => {
  const { showToast, ToastContainer } = useToast();

  return (
    <header className="h-16 bg-white border-b border-[#e5e5e5] flex items-center justify-between px-6 sticky top-0 z-10">
      <h1 className="text-xl font-semibold text-[#1a1a1a]">{title}</h1>
      
      <div className="flex items-center gap-3">
        {action}
        
        {showNotifications && (
          <button 
            onClick={() => showToast('Notifications panel coming soon', 'info')}
            className="relative p-2 text-[#737373] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] rounded-md transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#dc2626] rounded-full" />
          </button>
        )}
        
        <UserMenu role={role} />
        <ToastContainer />
      </div>
    </header>
  );
};
