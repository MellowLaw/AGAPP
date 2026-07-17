'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Home, DocumentText, Danger, Book, MessageSquare, Setting2, Building, Logout, Personalcard, Location, Scroll, InfoCircle } from 'iconsax-react';
import { AgappLogo } from '@/components/ui/AgappLogo';
import { useToast } from '@/components/ui/Toast';
import { useNavBadges, NavSection } from './NavBadgeContext';

const ROLE_LABEL: Record<SidebarProps['role'], string> = {
  'lgu-admin': 'LGU Admin',
  'super-admin': 'Super Admin',
  'lgu-personnel': 'Personnel',
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
  /** "New since last visit" badge section, if this tab shows one. */
  section?: NavSection;
}

interface SidebarProps {
  role: 'lgu-admin' | 'super-admin' | 'lgu-personnel';
  lguName?: string;
}

const LGU_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/lgu/dashboard', icon: Home },
  { label: 'Service Requests', href: '/lgu/services', icon: DocumentText, section: 'services' },
  { label: 'eServices Catalog', href: '/lgu/eservices-catalog', icon: Scroll },
  { label: 'Issue Reports', href: '/lgu/reports', icon: Danger, section: 'reports' },
  { label: 'News', href: '/lgu/news', icon: Book },
  { label: 'Forum', href: '/lgu/forum', icon: MessageSquare, section: 'forum' },
  { label: 'Facilities', href: '/lgu/facilities', icon: Location },
  { label: 'Citizen Guide', href: '/lgu/citizen-guide', icon: InfoCircle },
  { label: 'Verifications', href: '/lgu/verifications', icon: Personalcard, section: 'verifications' },
  { label: 'Settings', href: '/lgu/settings', icon: Setting2 },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/super', icon: Home },
  { label: 'LGU Directory', href: '/super/lgus', icon: Building },
  { label: 'Settings', href: '/super/settings', icon: Setting2 },
];

const LGU_PERSONNEL_NAV: NavItem[] = [
  { label: 'My Queue', href: '/personnel/dashboard', icon: DocumentText, section: 'services' },
  { label: 'Issue Reports', href: '/personnel/reports', icon: Danger, section: 'reports' },
  { label: 'Settings', href: '/personnel/settings', icon: Setting2 },
];

// Active: soft accent-tinted backdrop (no hard fill), bolded rose text, +2%
// scale. Hover: a faint 2%-opacity wash, never a hard-edged box. Both are
// plain divs behind the label rather than a filled pill, so there's no rigid
// container line at any state.
function NavLink({ item, active, href, count }: { item: NavItem; active: boolean; href: string; count?: number }) {
  const Icon = item.icon;
  const [hovering, setHovering] = useState(false);

  return (
    <Link href={href} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <motion.div
        className="relative flex items-center gap-6 pl-6 pr-4 py-3 text-[15px]"
        animate={{ scale: active ? 1.01 : 1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <span className="relative inline-flex shrink-0">
          <Icon
            className={`relative w-6 h-6 transition-colors duration-200 ${
              active ? 'text-accent-icon' : hovering ? 'text-text-primary' : 'text-text-muted'
            }`}
            variant="Bold"
          />
          {!!count && (
            <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-[3px] flex items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white leading-none">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </span>
        <span
          className={`relative transition-all duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100 ${
            active ? 'text-accent font-semibold' : hovering ? 'text-text-primary font-medium' : 'text-text-muted font-medium'
          }`}
        >
          {item.label}
        </span>
      </motion.div>
    </Link>
  );
}

export const Sidebar: React.FC<SidebarProps> = ({ role, lguName }) => {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const lguParam = (lguName || params?.get('lguName') || '').toString();

  const [userProfile, setUserProfile] = useState<{ name: string; email: string } | null>(null);
  const { showToast, ToastContainer } = useToast();
  const { counts } = useNavBadges();

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
    <aside className="group w-[72px] hover:w-[512px] transition-all duration-300 ease-in-out h-screen bg-gradient-to-r from-[#f6f4f1] via-[#f6f4f1]/95 via-[#f6f4f1]/75 to-transparent dark:from-[#292929] dark:via-[#292929]/95 dark:via-[#292929]/75 dark:to-transparent flex flex-col fixed left-0 top-0 z-40 overflow-hidden">
      {/* Logo */}
      <div className="flex flex-col justify-center pl-6 pr-4 py-5 border-b border-transparent group-hover:border-theme/50 transition-colors">
        <AgappLogo size={44} textClassName="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap" />
        <p className="text-xs font-serif italic text-accent mt-1.5 ml-[1px] pl-[52px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          {ROLE_LABEL[role]}
        </p>
      </div>

      {/* LGU Name (if applicable) */}
      {(role === 'lgu-admin' || role === 'lgu-personnel') && (lguName || params?.get('lguName')) && (
        <div className="pl-[76px] pr-4 py-3 bg-transparent group-hover:bg-surface-alt/50 transition-colors whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 duration-300">
          <p className="text-[10px] font-mono text-text-faint uppercase tracking-widest">Municipality</p>
          <p className="text-sm font-medium text-text-primary truncate">{lguName || params?.get('lguName') || ''}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const href = (role === 'lgu-admin' || role === 'lgu-personnel') && lguParam
            ? `${item.href}?lguName=${encodeURIComponent(lguParam)}`
            : item.href;

          return <NavLink key={item.href} item={item} active={active} href={href} count={item.section ? counts[item.section] : undefined} />;
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 mt-auto border-t border-transparent group-hover:border-theme/50 transition-colors">
        <div className="flex items-center gap-2 pl-6 py-2">
          <div className="w-8 h-8 shrink-0 rounded-full bg-accent-soft flex items-center justify-center">
            <span className="text-xs font-bold text-accent">{initials(userProfile?.name || '?')}</span>
          </div>
          <div className="min-w-0 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-sm font-semibold text-text-primary truncate">{userProfile?.name || 'Loading...'}</p>
            <p className="text-xs font-mono text-text-muted truncate" title={userProfile?.email || ''}>{userProfile?.email || 'Please wait'}</p>
          </div>
        </div>
        <motion.button
          onClick={handleSignOut}
          className="w-full flex items-center gap-4 pl-6 py-2 text-sm text-text-muted hover:text-text-primary rounded-none mt-1 transition-colors duration-300"
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Logout className="w-6 h-6 shrink-0" />
          <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">Sign Out</span>
        </motion.button>
      </div>
      <ToastContainer />
    </aside>
  );
};
