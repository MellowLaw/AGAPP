'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, SignOut, Gear, Bell } from '@phosphor-icons/react';
import { useToast } from '@/components/ui/Toast';

interface UserMenuProps {
  role: 'lgu-admin' | 'super-admin' | 'lgu-personnel';
}

export const UserMenu: React.FC<UserMenuProps> = ({ role }) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const { showToast, ToastContainer } = useToast();

  const handleSignOut = () => {
    router.push('/');
  };

  const getSettingsPath = () => {
    if (role === 'super-admin') return '/super/settings';
    if (role === 'lgu-personnel') return '/personnel/settings';
    return '/lgu/settings';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 text-[#737373] hover:text-[#1a1a1a] hover:bg-[#f5f5f5] rounded-md transition-colors"
      >
        <div className="w-8 h-8 bg-[#1a1a1a] rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#e5e5e5] rounded-lg shadow-lg z-50 py-2">
            <div className="px-4 py-3 border-b border-[#e5e5e5]">
              <p className="font-medium text-[#1a1a1a]">Admin User</p>
              <p className="text-sm text-[#737373]">
                {role === 'super-admin' ? 'Super Admin' : 
                 role === 'lgu-admin' ? 'LGU Admin' : 'LGU Personnel'}
              </p>
            </div>

            <button
              onClick={() => {
                const base = getSettingsPath();
                const lguParam = params?.get('lguName');
                const href = (role === 'lgu-admin' || role === 'lgu-personnel') && lguParam
                  ? `${base}?lguName=${encodeURIComponent(lguParam)}`
                  : base;
                router.push(href);
                setIsOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5]"
            >
              <Gear className="w-4 h-4" />
              Settings
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                showToast('Notifications panel coming soon', 'info');
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#1a1a1a] hover:bg-[#f5f5f5]"
            >
              <Bell className="w-4 h-4" />
              Notifications
            </button>

            <div className="border-t border-[#e5e5e5] mt-2 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-[#dc2626] hover:bg-[#fee2e2]"
              >
                <SignOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
            <ToastContainer />
          </div>
        </>
      )}
    </div>
  );
};
