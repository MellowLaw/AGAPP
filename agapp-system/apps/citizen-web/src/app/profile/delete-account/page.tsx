'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { 
  Danger, 
  Trash, 
  ArrowLeft, 
  ShieldCross, 
  Lock, 
  TickCircle 
} from 'iconsax-react';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const [step, setStep] = useState<'warn' | 'confirm'>('warn');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || !user?.email) {
      setErrorMsg('Please enter your password to authorize permanent deletion.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Re-verify user credentials
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: password,
      });

      if (signInErr) {
        setErrorMsg('Incorrect password. Re-authentication failed.');
        setLoading(false);
        return;
      }

      // 2. Delete user profile record under RA 10173 Right to Erasure
      const { error: deleteErr } = await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      if (deleteErr) throw deleteErr;

      // 3. Clear session and log out
      await signOut();
      router.push('/lgu-select');
    } catch (err: any) {
      console.error('Account erasure failed:', err);
      setErrorMsg(err?.message || 'Failed to complete account deletion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6 animate-fade-in pb-28">
      <Link href="/profile" className="inline-flex items-center text-text-primary hover:opacity-70 transition font-['Octarine-Bold'] text-xs">
        <ArrowLeft size={18} className="mr-1" />
        <span>Back to Profile</span>
      </Link>

      <div className="bg-surface dark:bg-card rounded-[32px] border border-red-200 dark:border-red-900/60 p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
        <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center">
          <Trash size={32} variant="Bold" />
        </div>

        <div className="space-y-1">
          <span className="text-[10px] font-['Octarine-Bold'] text-red-600 dark:text-red-400 uppercase tracking-wider">
            Republic Act No. 10173 · Right to Erasure
          </span>
          <h1 className="text-2xl font-['Octarine-Bold'] text-text-primary tracking-tight">
            Permanently Delete Citizen Account
          </h1>
          <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
            Deleting your account will permanently wipe your profile, personal contact details, verified resident badges, and ongoing municipal clearance applications. This action is immediate and cannot be undone.
          </p>
        </div>

        {step === 'warn' ? (
          <div className="space-y-4 pt-2">
            <div className="p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme space-y-2 text-xs text-text-muted font-['Inter-Medium']">
              <span className="font-['Octarine-Bold'] text-text-primary block">What happens when you delete:</span>
              <ul className="space-y-1.5 list-disc pl-4 text-text-muted">
                <li>All active Clearance & Permit applications will be terminated.</li>
                <li>Your PhilSys/Government ID verification record will be securely purged.</li>
                <li>Forum posts and comments will be anonymized.</li>
                <li>You will immediately lose access to digital claim tickets.</li>
              </ul>
            </div>

            <button
              onClick={() => setStep('confirm')}
              className="w-full py-3.5 rounded-full bg-red-600 text-white font-['Octarine-Bold'] text-xs hover:bg-red-700 transition shadow-sm"
            >
              I Understand, Continue with Deletion →
            </button>
          </div>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-4 pt-2 text-xs">
            {errorMsg && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl font-['Inter-Medium']">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="block font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                Confirm Password to Delete
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter your current password..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-surface-alt dark:bg-chip border border-theme text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-red-400 font-['Inter-Medium']"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStep('warn')}
                className="flex-1 py-3 rounded-full bg-surface-alt dark:bg-chip border border-theme text-text-primary font-['Octarine-Bold'] text-xs hover:bg-surface transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="flex-1 py-3 rounded-full bg-red-600 text-white font-['Octarine-Bold'] text-xs hover:bg-red-700 transition shadow-sm disabled:opacity-50"
              >
                {loading ? 'Deleting Account...' : 'Permanently Delete'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
