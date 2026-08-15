'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import { Home, DocumentText, Danger, Book, MessageSquare, Setting2, Building, Logout, Personalcard, Location, Scroll, InfoCircle, People, Chart2 } from 'iconsax-react';
import { AgappLogo } from '@/components/ui/AgappLogo';
import { useToast } from '@/components/ui/Toast';
import { useNavBadges, NavSection } from './NavBadgeContext';
import { lguIdFromName } from '@/lib/lgu';
import type { AdminModule } from '@/lib/modules';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

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
  /** Module an LGU_PERSONNEL must hold to see this entry. */
  module?: AdminModule;
  /** Hidden from personnel regardless of their granted modules. */
  adminOnly?: boolean;
}

interface SidebarProps {
  role: 'lgu-admin' | 'super-admin' | 'lgu-personnel';
  lguName?: string;
}

// One nav list for both LGU roles. An LGU_ADMIN sees everything; an
// LGU_PERSONNEL sees only the entries whose `module` their account was granted
// (users.module_permissions). This is UX only — the actual boundary is
// staff_can('<module>') inside the RLS policies.
const LGU_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/lgu/dashboard', icon: Home, module: 'dashboard' },
  { label: 'Service Requests', href: '/lgu/services', icon: DocumentText, section: 'services', module: 'services' },
  { label: 'eServices Catalog', href: '/lgu/eservices-catalog', icon: Scroll, module: 'eservices-catalog' },
  { label: 'Issue Reports', href: '/lgu/reports', icon: Danger, section: 'reports', module: 'reports' },
  { label: 'Community', href: '/lgu/news', icon: Book, module: 'news' },
  { label: 'Forum', href: '/lgu/forum', icon: MessageSquare, section: 'forum', module: 'forum' },
  { label: 'Facilities', href: '/lgu/facilities', icon: Location, module: 'facilities' },
  { label: 'Citizen Guide', href: '/lgu/citizen-guide', icon: InfoCircle, module: 'citizen-guide' },
  { label: 'Citizens & Moderation', href: '/lgu/citizens', icon: People, section: 'citizens', module: 'citizens' },
  { label: 'Verifications', href: '/lgu/verifications', icon: Personalcard, section: 'verifications', module: 'verifications' },
  // Branding + staff management are never delegated to personnel.
  { label: 'Settings', href: '/lgu/settings', icon: Setting2, adminOnly: true },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard', href: '/super', icon: Home },
  { label: 'LGU Directory', href: '/super/lgus', icon: Building },
  // /super/analytics had no inbound link anywhere in the app — it existed but
  // was reachable only by typing the URL. Found while charting the flows.
  { label: 'Analytics', href: '/super/analytics', icon: Chart2 },
  { label: 'Settings', href: '/super/settings', icon: Setting2 },
];

// Personnel keep their own profile page — they must never reach /lgu/settings.
const PERSONNEL_PROFILE_NAV: NavItem = { label: 'Settings', href: '/personnel/settings', icon: Setting2 };

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
        className="relative flex items-center gap-6 pl-6 pr-4 py-2.5 text-[15px]"
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

  const { profile, effectiveRole, modules, signOut } = useAdminAuth();
  const { showToast, ToastContainer } = useToast();
  const { counts } = useNavBadges();
  const [lguLogo, setLguLogo] = useState<string | null>(null);

  useEffect(() => {
    if (!lguParam) return;
    const fetchLguLogo = async () => {
      try {
        const targetId = lguIdFromName(lguParam);
        const { data: lgu } = await supabase
          .from('lgus')
          .select('logo')
          .eq('id', targetId)
          .single();
        if (lgu?.logo) {
          setLguLogo(lgu.logo);
        } else {
          setLguLogo(null);
        }
      } catch (err) {
        console.warn('Failed to fetch LGU logo', err);
      }
    };
    fetchLguLogo();
  }, [lguParam]);

  const isPersonnel = effectiveRole === 'lgu-personnel';

  const navItems = React.useMemo(() => {
    if (effectiveRole === 'super-admin') return SUPER_ADMIN_NAV;
    if (isPersonnel) {
      // Only the granted modules, plus their own profile settings.
      return [
        ...LGU_NAV.filter(i => !i.adminOnly && i.module && modules.includes(i.module)),
        PERSONNEL_PROFILE_NAV,
      ];
    }
    return LGU_NAV;
  }, [effectiveRole, isPersonnel, modules]);

  const isActive = (href: string) => {
    if (pathname === href) return true;
    const hasChild = navItems.some(n => n.href !== href && n.href.startsWith(`${href}/`));
    if (hasChild) return false; // avoid base route (e.g., /super) being active on nested
    return pathname.startsWith(`${href}/`);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <aside className="group w-[72px] hover:w-[512px] transition-all duration-300 ease-in-out h-screen bg-gradient-to-r from-[#f6f4f1] via-[#f6f4f1]/95 via-[#f6f4f1]/75 to-transparent dark:from-[#292929] dark:via-[#292929]/95 dark:via-[#292929]/75 dark:to-transparent flex flex-col fixed left-0 top-0 z-40 overflow-hidden">
      {/* Logo */}
      <div className="flex flex-col justify-center pl-6 pr-4 py-5 border-b border-transparent group-hover:border-theme/50 transition-colors shrink-0">
        <AgappLogo size={44} textClassName="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap" />
        <p className="text-xs font-serif italic text-accent mt-1.5 ml-[1px] pl-[52px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
          {ROLE_LABEL[effectiveRole]}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto min-h-0 sidebar-nav-scroll">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const href = (effectiveRole === 'lgu-admin' || effectiveRole === 'lgu-personnel') && lguParam
            && item.href.startsWith('/lgu')
            ? `${item.href}?lguName=${encodeURIComponent(lguParam)}`
            : item.href;

          return <NavLink key={item.href} item={item} active={active} href={href} count={item.section ? counts[item.section] : undefined} />;
        })}
      </nav>

      {/* User Section */}
      <div className="p-3 mt-auto border-t border-transparent group-hover:border-theme/50 transition-colors shrink-0">
        <div className="flex items-center gap-2 pl-6 py-2">
          <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-accent-soft flex items-center justify-center">
            {lguLogo ? (
              <img src={lguLogo} alt="LGU Seal" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-accent">{initials(profile?.name || '?')}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <p className="text-sm font-semibold text-text-primary truncate">{profile?.name || 'Admin User'}</p>
            <p className="text-xs font-mono text-text-muted truncate" title={profile?.email || ''}>{profile?.email || ''}</p>
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
