'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLgu, getLguLogo } from '../../contexts/LguContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Building, 
  DocumentText, 
  Danger, 
  Messages1, 
  NotificationBing, 
  Location, 
  Call, 
  User, 
  MessageQuestion,
  ArrowDown2,
  LogoutCurve,
  ShieldSecurity,
  Book,
  CloseCircle
} from 'iconsax-react';

export function Navbar() {
  const pathname = usePathname();
  const { activeLgu, lgus, setActiveLgu } = useLgu();
  const { user, profile, signOut } = useAuth();
  const [lguModalOpen, setLguModalOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Home', icon: Building },
    { href: '/services', label: 'E-Services', icon: DocumentText },
    { href: '/report', label: 'Report Issue', icon: Danger },
    { href: '/tracking', label: 'Track Request', icon: Location },
    { href: '/forum', label: 'Forum', icon: Messages1 },
    { href: '/guides', label: 'Guides', icon: Book },
    { href: '/news', label: 'News', icon: NotificationBing },
    { href: '/emergency', label: 'Emergency', icon: Call },
    { href: '/chatbot', label: 'Assistant', icon: MessageQuestion },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-theme shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand & LGU Context Switcher */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                <img src="/brand/logo.png" alt="AGAPP" className="w-full h-full object-contain rounded-xl" />
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="font-bold text-lg text-text-primary tracking-tight">AGAPP</span>
                <span className="text-[10px] block font-semibold uppercase tracking-wider text-accent">Citizen Portal</span>
              </div>
            </Link>

            {/* Active LGU Chip */}
            <button
              onClick={() => setLguModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-alt hover:bg-accent/10 border border-theme text-xs font-medium text-text-primary transition"
            >
              <Location size={14} className="text-accent" variant="Bold" />
              <span className="font-semibold">{activeLgu?.name?.replace('Municipality of ', '') || 'Liliw'}</span>
              <span className="text-text-muted text-[11px] hidden md:inline">({activeLgu?.province || 'Laguna'})</span>
              <ArrowDown2 size={12} className="text-text-muted ml-0.5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium transition ${
                    isActive
                      ? 'bg-accent text-accent-contrast font-semibold shadow-xs'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface-alt'
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <Link
              href="/chatbot"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-alt hover:bg-accent/10 border border-theme text-xs font-medium text-text-primary transition"
            >
              <MessageQuestion size={16} className="text-accent" />
              <span>AI Guide</span>
            </Link>

            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-surface-alt transition"
                >
                  <div className="w-7 h-7 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold text-xs">
                    {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-text-primary hidden md:inline max-w-[120px] truncate">
                    {profile?.full_name || 'Resident'}
                  </span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-text-primary hover:bg-surface-alt transition"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-accent text-accent-contrast hover:opacity-90 shadow-sm transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* LGU Switcher Modal */}
      {lguModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface border border-theme rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-theme pb-3">
              <h3 className="font-bold text-text-primary text-base">Select Your Municipality</h3>
              <button
                onClick={() => setLguModalOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-alt text-text-muted hover:text-text-primary"
              >
                <CloseCircle size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {lgus.map((lgu) => {
                const isSelected = activeLgu?.id === lgu.id;
                return (
                  <button
                    key={lgu.id}
                    onClick={() => {
                      setActiveLgu(lgu);
                      setLguModalOpen(false);
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition ${
                      isSelected
                        ? 'border-accent bg-accent-soft ring-1 ring-accent'
                        : 'border-theme hover:bg-surface-alt'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                        <img src={getLguLogo(lgu)} alt={lgu.name} className="w-full h-full object-cover rounded-lg" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{lgu.name}</p>
                        <p className="text-xs text-text-muted">{lgu.province || 'Philippines'}</p>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="px-2 py-0.5 rounded-md bg-accent text-accent-contrast font-bold text-[10px]">
                        Active
                      </span>
                    )}
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
