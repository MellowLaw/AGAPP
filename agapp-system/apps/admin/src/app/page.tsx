'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Manrope } from 'next/font/google';
import { ArrowRight, Eye, EyeSlash } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { lguNameFromId } from '@/lib/lgu';
import { AgappLogo } from '@/components/ui/AgappLogo';

// Scoped to this page only — the rest of the admin app uses Plus Jakarta Sans
// (see app/layout.tsx). Login is the one surface that follows the approved
// brand mockup's Manrope/Sora pairing directly.
const bodyFont = Manrope({ subsets: ['latin'], weight: ['400', '500', '700'], display: 'swap' });

// Demo quick-login buttons call POST /api/demo-login, which signs in
// server-side using non-public env vars — passwords never reach this client.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEMO_ACCOUNTS = [
  { role: 'SUPER_ADMIN', label: 'Super Admin', email: 'superadmin@agapp.gov.ph' },
  { role: 'LGU_ADMIN', label: 'LGU Admin', email: 'admin@liliw.gov.ph' },
  { role: 'LGU_PERSONNEL', label: 'LGU Personnel', email: 'personnel@liliw.gov.ph' },
];

// Client-side brute-force friction: after this many failed attempts, lock
// the form for a cooldown. This is UX friction, not the security boundary —
// Supabase Auth applies its own server-side rate limiting to password
// verification regardless of what this component allows through.
const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 30;

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resetStatus, setResetStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!lockedUntil) return;
    const tick = () => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setFailedAttempts(0);
        setSecondsLeft(0);
      } else {
        setSecondsLeft(remaining);
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const isLocked = lockedUntil !== null && secondsLeft > 0;

  // Shared by both the real login form and the demo quick-login buttons —
  // looks up the just-authenticated user's role/LGU and routes them to the
  // right dashboard. Returns an error message on failure, or null on success.
  const redirectByRole = async (userId: string): Promise<string | null> => {
    const { data: profile, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (dbError || !profile) {
      return 'User profile not found. Please contact your LGU administrator.';
    }

    if (profile.role === 'SUPER_ADMIN') {
      router.push('/super');
    } else if (profile.role === 'LGU_ADMIN') {
      const lguName = lguNameFromId(profile.lgu_id);
      router.push(`/lgu/dashboard?lguName=${encodeURIComponent(lguName)}`);
    } else if (profile.role === 'LGU_PERSONNEL') {
      router.push('/personnel/dashboard');
    } else {
      await supabase.auth.signOut();
      return 'Access denied: Citizens must use the mobile application.';
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResetStatus(null);

    if (isLocked) return;

    // Frontend validation — catches obviously malformed input before making a
    // network call. This is a UX nicety, not the security boundary: the real
    // credential check happens server-side in Supabase Auth below, which is
    // the only place that can actually verify a password.
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // Server-side validation: Supabase Auth verifies the email/password
      // against the real password hash — this call is the actual security
      // boundary, not anything on the client. A wrong password always fails
      // here regardless of what the frontend checks let through.
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError || !authData.user) {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        if (nextAttempts >= MAX_ATTEMPTS) {
          setLockedUntil(Date.now() + LOCKOUT_SECONDS * 1000);
          setError(`Too many failed attempts. Try again in ${LOCKOUT_SECONDS}s.`);
        } else {
          setError(authError?.message || 'Invalid email or password. Please try again.');
        }
        setIsLoading(false);
        return;
      }

      setFailedAttempts(0);
      const redirectError = await redirectByRole(authData.user.id);
      if (redirectError) {
        setError(redirectError);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  // "Forgot password?" — reuses the email already typed into the login form
  // above. Frontend validation here is the same UX nicety as handleLogin's:
  // Supabase Auth is still the source of truth on the server side.
  const handleForgotPassword = async () => {
    if (resetLoading || isLoading || isLocked) return;
    setError('');

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setResetStatus({ type: 'error', text: 'Enter your email address above first, then click "Forgot password?".' });
      return;
    }

    setResetStatus(null);
    setResetLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
      if (resetError) {
        setResetStatus({ type: 'error', text: resetError.message || 'Could not send the reset link. Please try again.' });
      } else {
        setResetStatus({ type: 'success', text: 'Password reset link sent — check your email.' });
      }
    } catch (err: any) {
      setResetStatus({ type: 'error', text: err?.message || 'An unexpected error occurred.' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleDemoLogin = async (role: string) => {
    if (isLocked) return;
    setError('');
    setIsLoading(true);

    try {
      // Server-side validation happens here too: /api/demo-login signs in
      // with supabase.auth.signInWithPassword on the server, same as the
      // manual form — the password never reaches this client code.
      const res = await fetch('/api/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || 'Demo login failed.');
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Demo login failed: no session returned.');
        setIsLoading(false);
        return;
      }

      const redirectError = await redirectByRole(user.id);
      if (redirectError) {
        setError(redirectError);
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`${bodyFont.className} min-h-screen grid grid-cols-1 md:grid-cols-2 bg-white text-[#262223]`}>
      {/* Left: form */}
      <div className="flex flex-col justify-center items-center px-6 py-16 md:px-12">
        <div className="w-full max-w-[400px] flex flex-col">
          <div className="mb-10">
            <AgappLogo size={40} />
          </div>

          <h1
            style={{ fontFamily: 'var(--font-brand)' }}
            className="font-extrabold text-[32px] md:text-[40px] tracking-[-0.03em] mb-2.5 text-[#262223]"
          >
            Welcome back
          </h1>
          <p className="text-[15px] leading-relaxed text-[#8A8482] mb-10">
            Sign in to the admin portal to continue.
          </p>

          {(error || resetStatus) && (
            <div
              className={`mb-5 px-4 py-3 border rounded-[10px] text-sm ${
                error || resetStatus?.type === 'error'
                  ? 'bg-[#FDF1F0] border-[#F6D6D3] text-[#B3261E]'
                  : 'bg-[#EEF7F0] border-[#CBE8D3] text-[#1E7A3C]'
              }`}
              role="alert"
            >
              {error || resetStatus?.text}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col" autoComplete="on">
            <div className="flex flex-col gap-2 mb-5">
              <label htmlFor="email" className="text-[13px] font-bold text-[#262223] tracking-[0.01em]">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLocked}
                required
                placeholder="you@lgu.gov.ph"
                className="h-12 px-4 border-[1.5px] border-[#E4E0DD] rounded-[10px] text-[15px] text-[#262223] placeholder-[#B4AFAC] bg-white outline-none focus:border-[#262223] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              />
            </div>

            <div className="flex flex-col gap-2 mb-4">
              <label htmlFor="password" className="text-[13px] font-bold text-[#262223] tracking-[0.01em]">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLocked}
                  required
                  placeholder="••••••••"
                  className="h-12 w-full pl-4 pr-11 border-[1.5px] border-[#E4E0DD] rounded-[10px] text-[15px] text-[#262223] placeholder-[#B4AFAC] bg-white outline-none focus:border-[#262223] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  tabIndex={0}
                  className="absolute right-0 top-0 h-12 w-11 flex items-center justify-center text-[#8A8482] hover:text-[#262223] transition-colors"
                >
                  {showPassword ? <EyeSlash className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end items-center mb-7">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={resetLoading}
                className="text-[13.5px] font-bold text-[#262223] no-underline hover:text-[#F27983] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resetLoading ? 'Sending…' : 'Forgot password?'}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || isLocked}
              className="h-[50px] border-none rounded-[10px] bg-[#262223] text-white font-bold text-[15px] tracking-[0.01em] flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isLocked ? (
                `Try again in ${secondsLeft}s`
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Quick Login */}
          <div className="mt-9">
            <div className="flex items-center gap-3.5 mb-5">
              <div className="flex-1 h-px bg-[#ECE8E5]" />
              <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-[#B4AFAC]">
                Demo quick login
              </span>
              <div className="flex-1 h-px bg-[#ECE8E5]" />
            </div>

            <div className="flex flex-col gap-2">
              {DEMO_ACCOUNTS.map((acct) => (
                <button
                  key={acct.role}
                  type="button"
                  disabled={isLoading || isLocked}
                  onClick={() => handleDemoLogin(acct.role)}
                  className="flex justify-between items-center gap-3 px-4 py-3 border-[1.5px] border-[#ECE8E5] rounded-[10px] bg-[#FBFAF9] text-left hover:border-[#262223] hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span className="text-[13.5px] font-bold text-[#262223]">{acct.label}</span>
                  <span className="text-[13px] text-[#8A8482]">{acct.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-11 text-[12.5px] text-[#B4AFAC]">
            © 2026 Agapp. Local Government Digital Platform.
          </p>
        </div>
      </div>

      {/* Right: brand panel */}
      <div className="hidden md:flex flex-col justify-between p-12 bg-[#EDE9E6] relative overflow-hidden">
        <div className="flex justify-end">
          <span className="text-xs font-bold tracking-[0.14em] uppercase text-[#A39D99]">
            Admin Portal
          </span>
        </div>

        <div className="flex flex-col items-center gap-9">
          <Image
            src="/agapp-icon.png"
            alt=""
            width={240}
            height={240}
            className="rounded-[48px]"
            style={{ boxShadow: '0 24px 60px rgba(38,34,35,0.14)' }}
            priority
          />
          <div className="flex flex-col items-center gap-2.5 max-w-[380px] text-center">
            <span
              style={{ fontFamily: 'var(--font-brand)' }}
              className="font-extrabold text-[26px] tracking-[-0.02em] text-[#262223]"
            >
              One platform for your LGU.
            </span>
            <span className="text-[15px] leading-relaxed text-[#8A8482]">
              Manage services, personnel, and records for your local government — all in one place.
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-[13px] font-semibold text-[#A39D99]">agapp.gov.ph</span>
          <div className="flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#262223]" />
            <span className="w-2 h-2 rounded-full bg-[#F27983]" />
            <span className="w-2 h-2 rounded-full bg-[#C9C3BF]" />
          </div>
        </div>
      </div>
    </div>
  );
}
