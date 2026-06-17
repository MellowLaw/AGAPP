'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  House,
  FileText,
  Warning,
  Newspaper,
  ChatCircle,
  Gear,
  Building,
  Users,
  ChartBar,
  SignOut,
} from '@phosphor-icons/react';
import { AgappLogo } from '@/components/ui/AgappLogo';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface SidebarProps {
  role: 'lgu-admin' | 'super-admin' | 'lgu-personnel';
  lguName?: string;
}

const LGU_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/lgu/dashboard', icon: House },
  { label: 'Service Requests', href: '/lgu/services', icon: FileText },
  { label: 'Issue Reports', href: '/lgu/reports', icon: Warning },
  { label: 'News', href: '/lgu/news', icon: Newspaper },
  { label: 'Forum', href: '/lgu/forum', icon: ChatCircle },
  { label: 'Settings', href: '/lgu/settings', icon: Gear },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/super', icon: House },
  { label: 'LGU Directory', href: '/super/lgus', icon: Building },
  { label: 'Settings', href: '/super/settings', icon: Gear },
];

const LGU_PERSONNEL_NAV: NavItem[] = [
  { label: 'My Queue', href: '/personnel/dashboard', icon: FileText },
  { label: 'Issue Reports', href: '/personnel/reports', icon: Warning },
  { label: 'Settings', href: '/personnel/settings', icon: Gear },
];

export const Sidebar: React.FC<SidebarProps> = ({ role, lguName }) => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const lguParam = (lguName || params?.get('lguName') || '').toString();
  
  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const { data: profile } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', authUser.id)
          .single();
        
        setUserProfile({
          name: profile?.name || authUser.user_metadata?.name || 'Admin User',
          email: profile?.email || authUser.email || 'admin@lgu.gov.ph',
        });
      }
    };
    fetchUser();
  }, []);

  const navItems = role === 'super-admin' 
    ? SUPER_ADMIN_NAV 
    : role === 'lgu-personnel'
    ? LGU_PERSONNEL_NAV
    : LGU_ADMIN_NAV;
  
  const isActive = (href: string) => {
    if (pathname === href) return true;
    const hasChild = navItems.some(n => n.href !== href && n.href.startsWith(`${href}/`));
    if (hasChild) return false; // avoid base route (e.g., /super) being active on nested
    return pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  return (
    <aside className="w-60 h-screen bg-white border-r border-[#e5e5e5] flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-[#e5e5e5]">
        <AgappLogo size={32} />
      </div>
      
      {/* LGU Name (if applicable) */}
      {(role === 'lgu-admin' || role === 'lgu-personnel') && (lguName || params?.get('lguName')) && (
        <div className="px-6 py-3 bg-[#f5f5f5]">
          <p className="text-xs text-[#737373] uppercase tracking-wide">Municipality</p>
          <p className="text-sm font-medium text-[#1a1a1a] truncate">{lguName || params?.get('lguName') || ''}</p>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const href = (role === 'lgu-admin' || role === 'lgu-personnel') && lguParam
            ? `${item.href}?lguName=${encodeURIComponent(lguParam)}`
            : item.href;
          
          return (
            <Link
              key={item.href}
              href={href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-md text-sm
                transition-colors
                ${active 
                  ? 'bg-[#1a1a1a] text-white font-medium' 
                  : 'text-[#737373] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${active ? 'text-white' : ''}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      
      {/* User Section */}
      <div className="p-3 border-t border-[#e5e5e5]">
        <div className="px-3 py-2">
          <p className="text-sm font-semibold text-[#1a1a1a] truncate">{userProfile?.name || 'Loading...'}</p>
          <p className="text-xs text-[#737373] truncate" title={userProfile?.email || ''}>{userProfile?.email || 'Please wait'}</p>
        </div>
        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#737373] hover:bg-[#f5f5f5] hover:text-[#dc2626] rounded-md transition-colors mt-1"
        >
          <SignOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};
