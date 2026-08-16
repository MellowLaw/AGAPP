'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building,
  DocumentText,
  Danger,
  Messages1,
  Location,
  NotificationBing,
  Book,
  MessageQuestion,
  LogoutCurve,
  Moon,
  Sun1,
  ArrowDown2,
  CloseCircle,
  TickCircle,
  Clock,
  ShieldSecurity,
  User
} from 'iconsax-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLgu, getLguLogo } from '../../contexts/LguContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<any>;
}

const CITIZEN_NAV: NavItem[] = [
  { label: 'Home', href: '/', icon: Building },
  { label: 'E-Services', href: '/services', icon: DocumentText },
  { label: 'Report Issue', href: '/report', icon: Danger },
  { label: 'Community Forum', href: '/forum', icon: Messages1 },
  { label: 'Town Map', href: '/map', icon: Location },
  { label: 'News & Advisories', href: '/news', icon: NotificationBing },
  { label: 'Citizen Guides', href: '/guides', icon: Book },
  { label: 'AI Assistant', href: '/chatbot', icon: MessageQuestion },
];

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

function NavLink({ item, active, href }: { item: NavItem; active: boolean; href: string }) {
  const Icon = item.icon;
  const [hovering, setHovering] = useState(false);

  return (
    <Link href={href} onMouseEnter={() => setHovering(true)} onMouseLeave={() => setHovering(false)}>
      <motion.div
        className="relative flex items-center gap-6 pl-6 pr-4 py-2.5 text-[14px]"
        animate={{ scale: active ? 1.01 : 1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <span className="relative inline-flex shrink-0">
          <Icon
            className={`relative w-6 h-6 transition-colors duration-200 ${
              active ? 'text-accent' : hovering ? 'text-text-primary' : 'text-text-muted'
            }`}
            variant="Bold"
          />
        </span>
        <span
          className={`relative transition-all duration-300 whitespace-nowrap opacity-0 group-hover:opacity-100 ${
            active ? 'text-accent font-["Octarine-Bold"]' : hovering ? 'text-text-primary font-["Inter-Medium"]' : 'text-text-muted font-["Inter-Medium"]'
          }`}
        >
          {item.label}
        </span>
      </motion.div>
    </Link>
  );
}

export function DesktopSidebar({ className = '' }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();
  const { activeLgu, lgus, setActiveLgu } = useLgu();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [lguModalOpen, setLguModalOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const isVerified = profile?.verification_status === 'verified';
  const isPending = profile?.verification_status === 'pending';

  return (
    <>
      <aside
        className={`group w-[72px] hover:w-[512px] transition-all duration-300 ease-in-out h-screen bg-gradient-to-r from-[#f6f4f1] via-[#f6f4f1]/95 via-[#f6f4f1]/75 to-transparent dark:from-[#292929] dark:via-[#292929]/95 dark:via-[#292929]/75 dark:to-transparent flex flex-col fixed left-0 top-0 z-40 overflow-hidden ${className}`}
      >
        {/* Brand & Active LGU Header */}
        <div className="flex flex-col justify-center pl-6 pr-4 py-5 border-b border-transparent group-hover:border-theme/40 transition-colors shrink-0">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-accent/20">
              <img src="/brand/logo.png" alt="AGAPP" className="w-full h-full object-contain" />
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap leading-tight">
              <span className="font-['Octarine-Bold'] text-base tracking-tight text-text-primary block">AGAPP</span>
              <span className="text-[10px] block font-['Inter-Medium'] uppercase tracking-wider text-accent font-bold">
                Citizen Portal
              </span>
            </div>
          </Link>

          {/* Active LGU Chip */}
          <button
            onClick={() => setLguModalOpen(true)}
            className="mt-3 flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-[11px] font-['Inter-Medium'] text-text-primary transition hover:border-accent w-fit opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          >
            <Location size={14} className="text-accent shrink-0" variant="Bold" />
            <span className="font-['Octarine-Bold'] truncate max-w-[150px]">
              {activeLgu?.name?.replace('Municipality of ', '') || 'Liliw'}
            </span>
            <ArrowDown2 size={12} className="text-text-muted shrink-0" />
          </button>
        </div>

        {/* Navigation Stream */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto min-h-0 sidebar-nav-scroll">
          {CITIZEN_NAV.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} href={item.href} />
          ))}
        </nav>

        {/* Footer & User Section */}
        <div className="p-3 mt-auto border-t border-transparent group-hover:border-theme/40 transition-colors shrink-0 space-y-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center gap-6 pl-6 pr-4 py-2 text-xs text-text-muted hover:text-text-primary rounded-xl hover:bg-surface-alt dark:hover:bg-chip transition max-w-[260px]"
            title="Toggle theme"
          >
            {isDarkMode ? (
              <Sun1 size={22} className="text-amber-400 shrink-0" variant="Bold" />
            ) : (
              <Moon size={22} className="text-text-muted shrink-0" variant="Bold" />
            )}
            <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-['Inter-Medium']">
              {isDarkMode ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {user ? (
            <div className="space-y-1">
              <Link
                href="/profile"
                className="flex items-center gap-3 pl-6 py-2 rounded-2xl hover:bg-surface-alt dark:hover:bg-chip transition max-w-[260px]"
              >
                <div className="w-8 h-8 shrink-0 rounded-full overflow-hidden bg-accent/20 text-accent flex items-center justify-center font-['Octarine-Bold'] text-xs border border-accent/40">
                  {initials(profile?.full_name || user.email || '?')}
                </div>
                <div className="min-w-0 flex-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 leading-tight">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-['Octarine-Bold'] text-text-primary truncate">
                      {profile?.full_name || 'Resident'}
                    </p>
                    {isVerified && <TickCircle size={13} className="text-green-500 shrink-0" variant="Bold" />}
                    {isPending && <Clock size={13} className="text-amber-500 shrink-0" variant="Bold" />}
                  </div>
                  <p className="text-[10px] text-text-muted font-['Inter-Medium'] truncate">
                    {profile?.barangay ? `Brgy. ${profile.barangay}` : (user.email || 'Resident Account')}
                  </p>
                </div>
              </Link>

              <motion.button
                onClick={handleSignOut}
                className="w-full flex items-center gap-6 pl-6 py-2 text-xs text-text-muted hover:text-rose-500 transition-colors max-w-[260px]"
                whileTap={{ scale: 0.98 }}
              >
                <LogoutCurve size={20} className="shrink-0" />
                <span className="whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-['Inter-Medium']">
                  Sign Out
                </span>
              </motion.button>
            </div>
          ) : (
            <div className="space-y-2 pt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pl-6 pr-4 max-w-[260px]">
              <Link
                href="/auth/login"
                className="w-full py-2 px-4 rounded-xl bg-surface-alt dark:bg-chip border border-theme text-xs font-['Octarine-Bold'] text-text-primary hover:bg-surface text-center block transition shadow-xs"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="w-full py-2 px-4 rounded-xl bg-accent text-accent-contrast text-xs font-['Octarine-Bold'] hover:opacity-90 text-center block shadow-xs transition"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* LGU Switcher Modal */}
      {lguModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface dark:bg-card border border-theme rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <div className="flex items-center gap-2">
                <Location size={20} className="text-accent" variant="Bold" />
                <h3 className="font-['Octarine-Bold'] text-text-primary text-base">Select Municipality</h3>
              </div>
              <button
                onClick={() => setLguModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-alt dark:hover:bg-chip text-text-muted hover:text-text-primary"
              >
                <CloseCircle size={20} />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {lgus.map((lgu) => {
                const isSelected = activeLgu?.id === lgu.id;
                return (
                  <button
                    key={lgu.id}
                    onClick={() => {
                      setActiveLgu(lgu);
                      setLguModalOpen(false);
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center gap-3 transition ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-xs'
                        : 'border-theme bg-surface-alt dark:bg-chip hover:border-text-muted'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-surface dark:bg-card shrink-0 flex items-center justify-center border border-theme">
                      <img src={getLguLogo(lgu)} alt={lgu.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-['Octarine-Bold'] text-sm text-text-primary truncate">{lgu.name}</div>
                      <div className="text-xs text-text-muted font-['Inter-Medium']">{lgu.province || 'Laguna'}</div>
                    </div>
                    {isSelected && <TickCircle size={18} className="text-accent shrink-0" variant="Bold" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
