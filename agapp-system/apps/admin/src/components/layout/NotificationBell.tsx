'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { lguNameFromId } from '@/lib/lgu';

interface NotificationRow {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  payload: Record<string, any> | null;
  created_at: string;
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Staff notification bell — reads the audience-targeted rows the admin
// triggers write (see supabase/schema.sql `notify_staff_*` functions). RLS
// already scopes SELECT to this user's role+lgu, so the query/subscription
// here has no manual role filtering to keep in sync.
export function NotificationBell() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [seenAt, setSeenAt] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [lguId, setLguId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || cancelled) return;
      setUserId(user.id);

      const { data: profile } = await supabase
        .from('users')
        .select('role, lgu_id, notifications_seen_at')
        .eq('id', user.id)
        .single();
      if (cancelled || !profile) return;
      setRole(profile.role);
      setLguId(profile.lgu_id);
      setSeenAt(profile.notifications_seen_at);

      const { data: rows } = await supabase
        .from('notifications')
        .select('id, type, title, body, payload, created_at')
        .not('audience', 'is', null)
        .order('created_at', { ascending: false })
        .limit(30);
      if (!cancelled) setItems(rows || []);
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`staff-notifications-${userId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload: any) => {
        const row = payload.new as NotificationRow & { audience: string | null };
        if (!row.audience) return; // citizen-targeted row, not for the staff bell
        setItems(prev => [row, ...prev].slice(0, 30));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const unreadCount = useMemo(() => {
    if (!seenAt) return items.length;
    const seenMs = new Date(seenAt).getTime();
    return items.filter(n => new Date(n.created_at).getTime() > seenMs).length;
  }, [items, seenAt]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    setSeenAt(now);
    await supabase.from('users').update({ notifications_seen_at: now }).eq('id', userId);
  }, [userId]);

  const linkFor = (n: NotificationRow): string | null => {
    const lguName = lguId ? lguNameFromId(lguId) : (params?.get('lguName') || '');
    const qs = lguName ? `?lguName=${encodeURIComponent(lguName)}` : '';

    if (role === 'SUPER_ADMIN') return '/super';

    if (role === 'LGU_PERSONNEL') {
      if (n.type === 'new_report') return `/personnel/reports${qs}`;
      if (n.type === 'new_service_request') return `/personnel/dashboard${qs}`;
      return null;
    }

    // LGU_ADMIN
    if (n.type === 'new_report') {
      const reportId = n.payload?.report_id;
      if (!reportId) return `/lgu/reports${qs}`;
      return `/lgu/reports${qs}${qs ? '&' : '?'}reportId=${reportId}`;
    }
    if (n.type === 'new_service_request') return `/lgu/services${qs}`;
    if (n.type === 'new_verification') return `/lgu/verifications${qs}`;
    if (n.type === 'forum_flagged') return `/lgu/forum${qs}`;
    return null;
  };

  const handleClick = (n: NotificationRow) => {
    const href = linkFor(n);
    setOpen(false);
    if (href) router.push(href);
  };

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        className="relative flex items-center justify-center w-6 h-6 text-text-muted hover:text-accent"
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-[3px] flex items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <React.Fragment>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute right-0 top-full mt-2 w-80 max-h-[420px] overflow-y-auto bg-surface border border-theme rounded-md shadow-lg z-50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
                <span className="text-sm font-semibold text-text-primary">Notifications</span>
                {items.length > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-mono text-accent hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              {items.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-text-muted">No notifications yet.</div>
              ) : (
                <ul>
                  {items.map(n => {
                    const isUnread = !seenAt || new Date(n.created_at).getTime() > new Date(seenAt).getTime();
                    return (
                      <li key={n.id}>
                        <button
                          onClick={() => handleClick(n)}
                          className="w-full text-left px-4 py-3 border-b border-theme last:border-b-0 hover:bg-surface-alt transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            {isUnread && <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />}
                            <div className={`min-w-0 ${isUnread ? '' : 'pl-3.5'}`}>
                              <p className="text-sm font-medium text-text-primary truncate">{n.title}</p>
                              <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.body}</p>
                              <p className="text-[10px] font-mono text-text-faint mt-1">{timeAgo(n.created_at)}</p>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
