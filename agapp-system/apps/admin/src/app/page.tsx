'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError || !data.user) {
      setError(authError?.message ?? 'Login failed. Check your credentials.');
      setLoading(false);
      return;
    }

    // Fetch the user's role from the users table to determine which portal to open
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError || !profile) {
      setError('Account found but no portal profile exists. Contact your administrator.');
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    if (profile.role === 'SUPER_ADMIN') {
      router.push('/super');
    } else if (profile.role === 'LGU_ADMIN' || profile.role === 'LGU_PERSONNEL') {
      router.push('/lgu');
    } else {
      setError('This portal is for LGU administrators only. Please use the mobile app.');
      await supabase.auth.signOut();
      setLoading(false);
    }
  };

  const handleQuickLogin = (role: 'super' | 'lgu') => {
    if (role === 'super') {
      setEmail('superadmin@agapp.gov.ph');
      setPassword('password123');
    } else {
      setEmail('admin@liliw.gov.ph');
      setPassword('password123');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e8e7e5] p-6 dark:bg-[#1A1A1A]">
      <div className="w-full max-w-md rounded-2xl border border-[#dbdad7] bg-white p-8 dark:border-[#333] dark:bg-[#222]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F497A2]/10 text-[#F497A2]">
            <Shield size={28} weight="light" />
          </div>
          <h1 className="logo-font text-3xl font-extrabold text-[#1A1A1A] dark:text-[#e8e7e5]">
            Agapp<span className="text-[#F497A2]">.</span>
          </h1>
          <p className="mt-1 text-sm text-[#5a5a5a] dark:text-[#a0a0a0]">
            Municipal & Portal Administration Desk
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/20 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a] dark:text-[#666]">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 rounded-xl border border-[#dbdad7] px-3 text-sm outline-none transition-all focus:border-[#F497A2] dark:border-[#333] dark:bg-[#1e1e1e] dark:text-[#e8e7e5]"
              placeholder="admin@liliw.gov.ph"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-[#8a8a8a] dark:text-[#666]">
              Security Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 rounded-xl border border-[#dbdad7] px-3 text-sm outline-none transition-all focus:border-[#F497A2] dark:border-[#333] dark:bg-[#1e1e1e] dark:text-[#e8e7e5]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-xl bg-[#1A1A1A] text-sm font-semibold text-white border border-white/10 hover:bg-black transition-colors"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 border-t border-[#dbdad7] pt-4 dark:border-[#333]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8a8a8a] dark:text-[#666]">
            Demo Quick Login
          </span>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleQuickLogin('super')}
              className="h-10 rounded-xl border border-[#dbdad7] text-xs font-semibold text-[#1A1A1A] hover:bg-[#f4f3f0] dark:border-[#333] dark:text-[#e8e7e5] dark:hover:bg-[#2d2d2d]"
            >
              Super Admin
            </button>
            <button
              onClick={() => handleQuickLogin('lgu')}
              className="h-10 rounded-xl border border-[#dbdad7] text-xs font-semibold text-[#1A1A1A] hover:bg-[#f4f3f0] dark:border-[#333] dark:text-[#e8e7e5] dark:hover:bg-[#2d2d2d]"
            >
              LGU Liliw Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
