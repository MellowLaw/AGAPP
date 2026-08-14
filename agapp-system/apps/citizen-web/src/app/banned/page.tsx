'use client';

import React, { useState, useEffect } from 'react';
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
  LogoutCurve, 
  ShieldSecurity,
  Call,
  Sms
} from 'iconsax-react';

export default function BannedScreen() {
  const router = useRouter();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { activeLgu } = useLgu();

  const [appealMessage, setAppealMessage] = useState('');
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
      console.error('[Banned] Fetch appeal error:', err);
    } finally {
      setLoadingAppeal(false);
    }
  };

  // Realtime subscription for appeal review & unban
  useEffect(() => {
    fetchAppeal();
    if (!user?.id) return;

    const channel = supabase
      .channel(`realtime-banned-appeals-${user.id}`)
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
    if (!user?.id || !appealMessage.trim()) return;

    setSubmitting(true);
    setAppealSuccessMsg(null);
    try {
      const { error } = await supabase.from('citizen_appeals').insert({
        user_id: user.id,
        lgu_id: activeLgu?.id || 'liliw-laguna',
        reason: appealMessage.trim(),
        status: 'pending',
      });

      if (error) throw error;
      setAppealSuccessMsg('Formal appeal submitted to the LGU Administrator & Legal Office.');
      setAppealMessage('');
      fetchAppeal();
    } catch (err: any) {
      console.error('Error submitting appeal:', err);
      setAppealSuccessMsg('Appeal recorded. Our administration desk will review your statement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8 max-w-xl mx-auto animate-fade-in">
      <div className="bg-surface dark:bg-card rounded-[32px] border-2 border-red-300 dark:border-red-900/60 p-6 sm:p-10 shadow-xl space-y-6 w-full transition-colors">
        {/* Ban Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center shadow-xs">
            <Danger size={36} variant="Bold" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-red-600 text-white font-['Octarine-Bold'] text-[10px] uppercase tracking-wider">
            Account Permanently Suspended
          </span>
          <h1 className="text-2xl sm:text-3xl font-['Octarine-Bold'] text-text-primary tracking-tight">
            Access to AGAPP Suspended
          </h1>
          <p className="text-xs text-text-muted font-['Inter-Medium'] max-w-sm mx-auto leading-relaxed">
            Your citizen account has been suspended by the {activeLgu?.name || 'Local Government Unit'} for severe terms of service or code of conduct violations.
          </p>
        </div>

        {/* Existing Appeal or Appeal Form */}
        {existingAppeal ? (
          <div className="p-5 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-['Octarine-Bold'] text-text-primary">Legal Appeal Status</span>
              <StatusBadge status={existingAppeal.status || 'Under Legal Review'} />
            </div>
            <p className="text-xs text-text-muted font-['Inter-Medium'] italic">
              &quot;{existingAppeal.reason}&quot;
            </p>
            <div className="text-[10px] text-text-muted flex items-center gap-1 pt-1 border-t border-theme">
              <Clock size={12} />
              <span>Filed on {new Date(existingAppeal.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitAppeal} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="block font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                Submit Reinstatement Appeal
              </label>
              <textarea
                required
                rows={4}
                placeholder="State your formal justification and defense for account restoration..."
                value={appealMessage}
                onChange={(e) => setAppealMessage(e.target.value)}
                className="w-full p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-red-400 font-['Inter-Medium']"
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
              disabled={submitting || !appealMessage.trim()}
              className="w-full py-3.5 rounded-full bg-red-600 text-white font-['Octarine-Bold'] text-xs hover:bg-red-700 transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Send size={16} />
              <span>{submitting ? 'Submitting...' : 'Transmit Reinstatement Petition'}</span>
            </button>
          </form>
        )}

        {/* Sign Out Button */}
        <div className="pt-2 border-t border-theme flex items-center justify-between">
          <button
            type="button"
            onClick={signOut}
            className="w-full py-3 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-primary font-['Octarine-Bold'] text-xs hover:bg-surface transition flex items-center justify-center gap-2"
          >
            <LogoutCurve size={16} />
            <span>Sign Out Current Account</span>
          </button>
        </div>
      </div>
    </div>
  );
}
