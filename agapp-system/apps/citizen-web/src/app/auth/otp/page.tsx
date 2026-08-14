'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Sms, Key, ArrowRight, TickCircle } from 'iconsax-react';

export default function EmailOtpPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setStep('otp');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email,
        token: otpCode.trim(),
        type: 'email',
      });

      if (error) {
        setErrorMsg(error.message || 'Invalid or expired OTP code.');
      } else if (data?.session) {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 animate-fade-in">
      <div className="bg-surface border border-theme rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center overflow-hidden shrink-0">
            <img src="/brand/logo.png" alt="AGAPP Logo" className="w-full h-full object-contain rounded-2xl" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Passwordless Email Sign In</h1>
          <p className="text-xs text-text-muted">
            Receive a secure 6-digit one-time passcode directly in your inbox.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-text-primary mb-1">Enter Your Email Address</label>
              <div className="relative">
                <Sms size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  required
                  placeholder="citizen@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-alt dark:bg-chip border border-theme text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-accent text-accent-contrast font-bold text-sm hover:opacity-90 shadow-md transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Sending Code...' : 'Send Verification OTP'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-text-primary mb-1">Enter 6-Digit Passcode sent to {email}</label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  required
                  maxLength={8}
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-alt dark:bg-chip border border-theme font-mono text-center tracking-widest text-base font-bold text-text-primary focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !otpCode.trim()}
              className="w-full py-3 rounded-xl bg-accent text-accent-contrast font-bold text-sm hover:opacity-90 shadow-md transition flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Verifying...' : 'Verify & Sign In'}</span>
              <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-center text-xs text-text-muted hover:text-text-primary"
            >
              Use a different email address
            </button>
          </form>
        )}

        <div className="text-center text-xs text-text-muted pt-2 border-t border-theme">
          Prefer password login?{' '}
          <Link href="/auth/login" className="font-bold text-accent hover:underline">
            Sign In with Password
          </Link>
        </div>
      </div>
    </div>
  );
}
