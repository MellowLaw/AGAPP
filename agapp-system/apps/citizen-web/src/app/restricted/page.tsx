'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useLgu } from '../../contexts/LguContext';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  Danger, 
  CloseCircle, 
  TickCircle, 
  Clock, 
  Send, 
  ShieldSecurity, 
  ArrowLeft,
  InfoCircle,
  Call
} from 'iconsax-react';

export default function RestrictedScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuth();
  const { activeLgu } = useLgu();

  const [appealText, setAppealText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingAppeal, setLoadingAppeal] = useState(true);
  const [existingAppeal, setExistingAppeal] = useState<any | null>(null);
  const [appealSuccessMsg, setAppealSuccessMsg] = useState<string | null>(null);

  // Auto-dismiss if account status changes back to 'active'
  useEffect(() => {
    if (profile && (profile as any).moderation_status === 'active') {
      router.push('/');
    }
  }, [profile, router]);

  // Load existing appeal
  const fetchAppeal = async () => {
    if (!user?.id) return;
    setLoadingAppeal(true);
    try {
      const { data, error } = await supabase
        .from('citizen_appeals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        setExistingAppeal(data[0]);
      } else {
        setExistingAppeal(null);
      }
    } catch (err) {
      console.error('[Restricted] Fetch appeal error:', err);
    } finally {
      setLoadingAppeal(false);
    }
  };

  // Realtime subscription for appeal changes
  useEffect(() => {
    fetchAppeal();
    if (!user?.id) return;

    const channel = supabase
      .channel(`realtime-restricted-appeals-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'citizen_appeals',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchAppeal();
          if (refreshProfile) refreshProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !appealText.trim()) return;

    setSubmitting(true);
    setAppealSuccessMsg(null);
    try {
      const { error } = await supabase.from('citizen_appeals').insert({
        user_id: user.id,
        lgu_id: activeLgu?.id || 'liliw-laguna',
        reason: appealText.trim(),
        status: 'pending',
      });

      if (error) throw error;
      setAppealSuccessMsg('Your appeal has been formally submitted to the LGU Community Moderation Board.');
      setAppealText('');
      fetchAppeal();
    } catch (err: any) {
      console.error('Error submitting appeal:', err);
      setAppealSuccessMsg('Appeal recorded. Our moderation desk will review your submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-fade-in pb-28">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center text-text-primary hover:opacity-70 transition font-['Octarine-Bold'] text-xs">
          <ArrowLeft size={18} className="mr-1" />
          <span>Back to Home</span>
        </Link>
        <StatusBadge status="Account Restricted" />
      </div>

      {/* Warning Card */}
      <div className="bg-surface dark:bg-card rounded-[32px] border border-red-200 dark:border-red-900/60 p-6 sm:p-8 shadow-sm space-y-4 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center">
          <Danger size={32} variant="Bold" />
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-['Octarine-Bold'] text-text-primary tracking-tight">
            Posting Privileges Restricted
          </h1>
          <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
            Your account has been temporarily restricted by the {activeLgu?.name || 'Municipal'} Moderation Desk due to flagged community guidelines violations. While restricted, you can still browse public announcements and access emergency hotlines.
          </p>
        </div>

        {/* Existing Appeal Status Banner */}
        {existingAppeal ? (
          <div className="p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-['Octarine-Bold'] text-text-primary">Active Appeal Status</span>
              <StatusBadge status={existingAppeal.status || 'Pending Review'} />
            </div>
            <p className="text-xs text-text-muted font-['Inter-Medium'] italic">
              &quot;{existingAppeal.reason}&quot;
            </p>
            <div className="text-[10px] text-text-muted flex items-center gap-1 pt-1 border-t border-theme">
              <Clock size={12} />
              <span>Submitted on {new Date(existingAppeal.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          /* Appeal Submission Form */
          <form onSubmit={handleSubmitAppeal} className="space-y-3.5 pt-2">
            <div className="space-y-1">
              <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                Submit a Moderation Appeal
              </label>
              <p className="text-[11px] text-text-muted font-['Inter-Medium']">
                Explain the context or reason why your posting privileges should be restored.
              </p>
              <textarea
                required
                rows={4}
                placeholder="Describe your explanation or appeal in detail..."
                value={appealText}
                onChange={(e) => setAppealText(e.target.value)}
                className="w-full p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent shadow-xs font-['Inter-Medium']"
              />
            </div>

            {appealSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs rounded-xl flex items-center gap-2">
                <TickCircle size={16} className="shrink-0" />
                <span>{appealSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !appealText.trim()}
              className="w-full py-3.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              <Send size={16} />
              <span>{submitting ? 'Submitting Appeal...' : 'Submit Appeal to Moderation Desk'}</span>
            </button>
          </form>
        )}

        {/* LGU Contact Info */}
        <div className="pt-3 border-t border-theme flex items-center justify-between text-xs text-text-muted">
          <span>Need immediate assistance?</span>
          <Link href="/emergency" className="text-red-500 dark:text-red-400 font-['Octarine-Bold'] hover:underline inline-flex items-center gap-1">
            <Call size={14} />
            <span>Emergency Contacts</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
