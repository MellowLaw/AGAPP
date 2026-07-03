'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { lguNameFromId } from '@/lib/lgu';

// Demo quick-login buttons call POST /api/demo-login, which signs in
// server-side using non-public env vars — passwords never reach this client.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UnifiedLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

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
        setError(authError?.message || 'Invalid email or password. Please try again.');
        setIsLoading(false);
        return;
      }

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

  const handleDemoLogin = async (role: string) => {
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
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <span className="font-bold text-xl text-[#1a1a1a]">AGAPP</span>
        </div>

        <div className="bg-white border border-[#e5e5e5] rounded-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-[#1a1a1a]">Admin Portal</h1>
            <p className="text-[#737373] mt-2">Sign in to your account</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-[#fee2e2] border border-[#fecaca] rounded-md text-sm text-[#dc2626]">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-[#737373] mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-[#1a1a1a] placeholder-[#a3a3a3] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                placeholder="you@lgu.gov.ph"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#737373] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-[#e5e5e5] rounded-md text-[#1a1a1a] placeholder-[#a3a3a3] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="flex items-center justify-end">
              <a href="#" className="text-sm text-[#2563eb] hover:underline">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white font-medium rounded-md hover:bg-[#333] focus:outline-none focus:ring-2 focus:ring-[#1a1a1a] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Demo Quick Login */}
          <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
            <p className="text-xs text-[#737373] text-center mb-3">Demo Quick Login</p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('SUPER_ADMIN')}
                className="text-left px-3 py-2 text-sm text-[#737373] hover:bg-[#f5f5f5] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium text-[#1a1a1a]">Super Admin</span>
                <span className="text-xs block">superadmin@agapp.gov.ph</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('LGU_ADMIN')}
                className="text-left px-3 py-2 text-sm text-[#737373] hover:bg-[#f5f5f5] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium text-[#1a1a1a]">LGU Admin</span>
                <span className="text-xs block">admin@liliw.gov.ph</span>
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleDemoLogin('LGU_PERSONNEL')}
                className="text-left px-3 py-2 text-sm text-[#737373] hover:bg-[#f5f5f5] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="font-medium text-[#1a1a1a]">LGU Personnel</span>
                <span className="text-xs block">personnel@liliw.gov.ph</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-[#737373] mt-6">
          © 2026 AGAPP. Local Government Digital Platform.
        </p>
      </div>
    </div>
  );
}
