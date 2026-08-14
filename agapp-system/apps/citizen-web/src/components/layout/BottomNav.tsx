'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home2, 
  Briefcase, 
  TrendUp, 
  Messages2, 
  User,
  Messages1
} from 'iconsax-react';

export function BottomNav() {
  const pathname = usePathname();

  // Hide BottomNav on auth and onboarding pages
  if (
    pathname?.startsWith('/auth') ||
    pathname === '/lgu-select' ||
    pathname === '/banned'
  ) {
    return null;
  }

  const tabs = [
    { href: '/', label: 'Home', icon: Home2 },
    { href: '/services', label: 'Services', icon: Briefcase },
    { href: '/report', label: 'Reports', icon: TrendUp },
    { href: '/forum', label: 'Forum', icon: Messages2 },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-md">
      {/* Floating AI Assistant Companion Button (Only on Home screen) */}
      {pathname === '/' && (
        <Link
          href="/chatbot"
          className="absolute -top-11 left-3 z-50 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/85 dark:bg-[#282422]/90 text-text-primary border border-white/60 dark:border-white/15 shadow-[0_8px_20px_rgba(0,0,0,0.12)] hover:scale-105 transition font-['Octarine-Bold'] text-[11px] backdrop-blur-xl"
          style={{
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          <Messages1 size={15} variant="Bold" className="text-accent" />
          <span>Ask Assistant</span>
        </Link>
      )}

      {/* Main Floating Apple Liquid Glass Bar */}
      <nav
        className="relative rounded-[36px] px-2 py-2 flex items-center justify-around transition-all duration-300 bg-white/75 dark:bg-[#24211F]/80 border border-white/70 dark:border-white/15 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.15),0_0_0_1px_rgba(255,255,255,0.5)_inset,0_1px_2px_rgba(255,255,255,0.9)_inset] dark:shadow-[0_20px_45px_-8px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.12)_inset,0_1px_2px_rgba(255,255,255,0.18)_inset]"
        style={{
          backdropFilter: 'blur(28px) saturate(190%)',
          WebkitBackdropFilter: 'blur(28px) saturate(190%)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || (tab.href !== '/' && pathname?.startsWith(tab.href));
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center transition-all duration-200 select-none ${
                isActive
                  ? 'px-4 py-1.5 rounded-full bg-accent text-accent-contrast shadow-sm font-heading'
                  : 'px-3 py-1.5 text-stone-700 dark:text-stone-200 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 rounded-full font-medium'
              }`}
            >
              <Icon size={22} variant={isActive ? 'Bold' : 'Outline'} />
              <span className={`text-[10.5px] mt-0.5 tracking-tight ${isActive ? 'font-bold' : 'font-semibold'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
