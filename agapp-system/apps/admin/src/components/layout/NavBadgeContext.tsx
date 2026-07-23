'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export type NavSection = 'reports' | 'services' | 'forum' | 'verifications' | 'citizens';
export type AdminRole = 'lgu-admin' | 'super-admin' | 'lgu-personnel';

const SECTION_TABLE: Record<NavSection, string> = {
  reports: 'reports',
  services: 'service_requests',
  forum: 'forum_posts',
  verifications: 'verification_requests',
  citizens: 'citizen_appeals',
};

// Which nav badges apply per role — mirrors the nav items Sidebar.tsx renders
// for each role. Super admin has no per-LGU badges in v1 (cross-LGU rollup is
// deferred — see Docs/Planning/Plan-Admin-Notifications.md).
export const ROLE_SECTIONS: Record<AdminRole, NavSection[]> = {
  'lgu-admin': ['reports', 'services', 'forum', 'verifications', 'citizens'],
  'lgu-personnel': ['reports', 'services'],
  'super-admin': [],
};

// Route prefix -> badge section, used to auto-clear a badge the instant its
// page becomes active. Kept in sync with the href values in Sidebar.tsx.
const PATH_SECTIONS: [string, NavSection][] = [
  ['/lgu/reports', 'reports'],
  ['/personnel/reports', 'reports'],
  ['/lgu/services', 'services'],
  ['/personnel/dashboard', 'services'],
  ['/lgu/forum', 'forum'],
  ['/lgu/verifications', 'verifications'],
  ['/lgu/citizens', 'citizens'],
];

function sectionForPath(pathname: string): NavSection | undefined {
  const hit = PATH_SECTIONS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return hit?.[1];
}

interface NavBadgeContextValue {
  counts: Partial<Record<NavSection, number>>;
}

const NavBadgeContext = createContext<NavBadgeContextValue>({ counts: {} });

export function useNavBadges() {
  return useContext(NavBadgeContext);
}

// Nav "new since last visit" badges: per-admin, per-section last-seen store
// (users.nav_seen jsonb). A badge count = rows newer than nav_seen[section],
// scoped to the admin's LGU. The active route's section is marked "seen" as
// part of the same load that computes counts (not a separate effect calling
// back into this one) — that keeps "mark seen" and "compute count" from
// racing each other, since whichever ran last would win and clobber the
// other's result.
export function NavBadgeProvider({ role, children }: { role: AdminRole; children: React.ReactNode }) {
  const sections = ROLE_SECTIONS[role];
  const pathname = usePathname();
  const activeSection = pathname ? sectionForPath(pathname) : undefined;
  const [counts, setCounts] = useState<Partial<Record<NavSection, number>>>({});

  useEffect(() => {
    if (sections.length === 0) return;
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const { data: profile } = await supabase
        .from('users')
        .select('lgu_id, nav_seen')
        .eq('id', user.id)
        .single();
      if (cancelled || !profile?.lgu_id) return;

      const lguId: string = profile.lgu_id;
      const navSeen: Record<string, string> = { ...(profile.nav_seen || {}) };

      if (activeSection && sections.includes(activeSection)) {
        navSeen[activeSection] = new Date().toISOString();
        // supabase-js query builders are lazily thenable — the request only
        // actually fires once awaited/then'd, so this must not be fire-and-forget.
        await supabase.from('users').update({ nav_seen: navSeen }).eq('id', user.id);
      }

      const results = await Promise.all(sections.map(async (section) => {
        let query = supabase
          .from(SECTION_TABLE[section])
          .select('id', { count: 'exact', head: true })
          .eq('lgu_id', lguId);
        const seenAt = navSeen[section];
        if (seenAt) query = query.gt('created_at', seenAt);
        const { count } = await query;
        return [section, count ?? 0] as const;
      }));
      if (cancelled) return;
      setCounts(Object.fromEntries(results));

      channel = supabase.channel(`nav-badges-${lguId}`);
      sections.forEach(section => {
        channel!.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: SECTION_TABLE[section], filter: `lgu_id=eq.${lguId}` },
          () => {
            if (section === activeSection) return; // this page already reflects new rows
            setCounts(prev => ({ ...prev, [section]: (prev[section] ?? 0) + 1 }));
          }
        );
      });
      channel.subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <NavBadgeContext.Provider value={{ counts }}>
      {children}
    </NavBadgeContext.Provider>
  );
}
