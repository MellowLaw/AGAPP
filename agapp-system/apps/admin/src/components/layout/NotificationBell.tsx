'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { lguNameFromId } from '@/lib/lgu';
import { fetchImportantNotices, ImportantNotice } from '@/lib/importantNotices';
import { timeAgo } from '@/lib/timeAgo';

interface NotificationRow {
  id: string;
  type: string;
  title: string | null;
  body: string | null;
  payload: Record<string, any> | null;
  created_at: string;
}

// Staff notification bell — IMPORTANT NOTICES ONLY. Two sources:
// 1. Stored, event-driven rows (audience-targeted `notifications`, see
//    supabase/schema.sql `notify_staff_*` functions) — now just verification
//    pending + forum flagged. RLS scopes SELECT to this user's role+lgu.
// 2. Computed, time-driven "needs attention" items — overdue/abandoned
//    reports and requests (see lib/importantNotices.ts). Not stored rows, so
//    they aren't affected by "mark all read": they persist while the
//    underlying problem is still true.
// Routine "new report" / "new service request" volume lives in the nav
// badges (NavBadgeContext.tsx) instead of here.
export function NotificationBell() {
  const router = useRouter();
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [needsAttention, setNeedsAttention] = useState<ImportantNotice[]>([]);
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

      if (profile.lgu_id) {
        const notices = await fetchImportantNotices(profile.lgu_id);
        if (!cancelled) setNeedsAttention(notices);
      }
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

  // Refresh the computed "needs attention" set each time the panel opens —
  // cheap (two small LGU-scoped queries) and keeps aging thresholds accurate
  // without polling in the background.
  useEffect(() => {
    if (!open || !lguId) return;
    fetchImportantNotices(lguId).then(setNeedsAttention);
  }, [open, lguId]);

  const unreadCount = useMemo(() => {
    const storedUnread = !seenAt
      ? items.length
      : items.filter(n => new Date(n.created_at).getTime() > new Date(seenAt).getTime()).length;
    return storedUnread + needsAttention.length;
  }, [items, seenAt, needsAttention]);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    const now = new Date().toISOString();
    setSeenAt(now);
    await supabase.from('users').update({ notifications_seen_at: now }).eq('id', userId);
  }, [userId]);

  const lguQs = useMemo(() => {
    const lguName = lguId ? lguNameFromId(lguId) : (params?.get('lguName') || '');
    return lguName ? `?lguName=${encodeURIComponent(lguName)}` : '';
  }, [lguId, params]);

  const linkForNotice = (n: NotificationRow): string | null => {
    if (role === 'SUPER_ADMIN') return '/super';
    if (role === 'LGU_ADMIN') {
      if (n.type === 'new_verification') return `/lgu/verifications${lguQs}`;
      if (n.type === 'forum_flagged') return `/lgu/forum${lguQs}`;
    }
    return null;
  };

  const linkForAttention = (n: ImportantNotice): string => {
    const reportsBase = role === 'LGU_PERSONNEL' ? '/personnel/reports' : '/lgu/reports';
    const servicesBase = role === 'LGU_PERSONNEL' ? '/personnel/dashboard' : '/lgu/services';
    if (n.reportId) {
      return `${reportsBase}${lguQs}${lguQs ? '&' : '?'}reportId=${n.reportId}`;
    }
    return `${servicesBase}${lguQs}`;
  };

  const handleClickNotice = (n: NotificationRow) => {
    const href = linkForNotice(n);
    setOpen(false);
    if (href) router.push(href);
  };

  const handleClickAttention = (n: ImportantNotice) => {
    setOpen(false);
    router.push(linkForAttention(n));
  };

  const hasAny = items.length > 0 || needsAttention.length > 0;

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
              className="absolute right-0 top-full mt-2 w-80 max-h-[480px] overflow-y-auto bg-surface border border-theme rounded-md shadow-lg z-50"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-theme">
                <span className="text-sm font-semibold text-text-primary">Notifications</span>
                {items.length > 0 && (
                  <button onClick={markAllRead} className="text-[11px] font-mono text-accent hover:underline">
                    Mark all read
                  </button>
                )}
              </div>

              {!hasAny ? (
                <div className="px-4 py-8 text-center text-sm text-text-muted">No notifications yet.</div>
              ) : (
                <>
                  {needsAttention.length > 0 && (
                    <>
                      <p className="px-4 pt-3 pb-1 text-[10px] font-mono font-semibold tracking-widest text-text-faint uppercase">
                        Needs attention
                      </p>
                      <ul>
                        {needsAttention.map(n => (
                          <li key={n.id}>
                            <button
                              onClick={() => handleClickAttention(n)}
                              className="w-full text-left px-4 py-3 border-b border-theme last:border-b-0 hover:bg-surface-alt transition-colors"
                            >
                              <div className="flex items-start gap-2">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-text-primary truncate">{n.title}</p>
                                  <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{n.body}</p>
                                  <p className="text-[10px] font-mono text-text-faint mt-1">{timeAgo(n.timestamp)}</p>
                                </div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {items.length > 0 && (
                    <>
                      <p className="px-4 pt-3 pb-1 text-[10px] font-mono font-semibold tracking-widest text-text-faint uppercase">
                        Recent notices
                      </p>
                      <ul>
                        {items.map(n => {
                          const isUnread = !seenAt || new Date(n.created_at).getTime() > new Date(seenAt).getTime();
                          return (
                            <li key={n.id}>
                              <button
                                onClick={() => handleClickNotice(n)}
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
                    </>
                  )}
                </>
              )}
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
    </div>
  );
}
