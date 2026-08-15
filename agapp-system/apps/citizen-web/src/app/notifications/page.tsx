'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLgu } from '../../contexts/LguContext';
import { supabase } from '../../lib/supabase';
import { getRelativeTime } from '../../lib/timeAgo';
import { 
  NotificationBing, 
  TickCircle, 
  ArrowLeft2,
  Notification,
  Danger,
  DocumentText,
  Clock
} from 'iconsax-react';
import { SkeletonList } from '../../components/common/Skeleton';

export default function NotificationsPage() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { activeLgu } = useLgu();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = useCallback(async () => {
    if (!profile?.id && !user?.id) {
      setLoading(false);
      return;
    }
    const userId = profile?.id || user?.id;
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (data && !error && data.length > 0) {
        setNotifications(data);
      } else {
        setNotifications([
          {
            id: 'notif-1',
            title: 'Welcome to AGAPP Citizen Portal',
            body: `Your citizen account is registered with the ${activeLgu?.name || 'Municipality of Liliw'}. Submit clearance requests and track municipal services online.`,
            type: 'info',
            created_at: new Date().toISOString(),
            is_read: false,
          },
        ]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [profile?.id, user?.id, activeLgu?.name]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const markAllAsRead = async () => {
    const userId = profile?.id || user?.id;
    if (!userId) return;
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      console.warn('Error marking all as read:', e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-theme pb-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-alt dark:bg-chip border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition shadow-2xs"
        >
          <ArrowLeft2 size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-heading text-text-primary">Notifications</h1>
          <p className="text-[10px] text-text-muted font-['Inter-Medium']">
            {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>

        {unreadCount > 0 ? (
          <button
            onClick={markAllAsRead}
            className="text-[11px] font-['Octarine-Bold'] text-accent hover:underline"
          >
            Mark read
          </button>
        ) : (
          <div className="w-9 h-9" />
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-3 pt-1">
        {loading ? (
          <SkeletonList count={4} />
        ) : notifications.length === 0 ? (
          <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-10 text-center space-y-2">
            <NotificationBing size={32} className="text-text-muted mx-auto" />
            <p className="text-xs text-text-muted font-['Inter-Medium']">
              No notifications at this time.
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-[24px] border border-theme hover:border-accent/40 transition space-y-1.5 shadow-xs ${
                n.is_read
                  ? 'bg-surface dark:bg-card'
                  : 'bg-surface-alt dark:bg-chip'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-accent shrink-0" />
                  )}
                  <span className="font-['Octarine-Bold'] text-xs text-text-primary truncate">
                    {n.title}
                  </span>
                </div>
                <span className="text-[10px] text-text-muted font-['Inter-Medium'] shrink-0">
                  {getRelativeTime(n.created_at)}
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed font-['Inter-Medium'] pl-4">
                {n.body || n.content || n.message}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
