'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';
import { Eye, EyeSlash, ArrowRight } from 'iconsax-react';

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        showToast(error.message || 'Failed to sign in.', 'error');
      } else if (data?.user) {
        showToast('Welcome back to AGAPP!', 'success');
        router.push('/');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to sign in.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#1C1A17] text-text-primary transition-colors duration-200">
      {/* Left Column: Login Form */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between px-8 py-10 sm:px-12 sm:py-12 lg:px-14 lg:py-16 xl:px-20 xl:py-20 min-h-screen bg-white dark:bg-[#1E1B18] z-10">
        {/* Top Mini Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-10 h-10 rounded-2xl overflow-hidden flex items-center justify-center bg-[#FFFDF8] dark:bg-[#25221E] border border-theme/70 p-1 shadow-2xs group-hover:scale-105 transition-transform">
              <img src="/brand/logo.png" alt="AGAPP Logo" className="w-full h-full object-contain" />
            </div>
            <div className="leading-tight">
              <span className="font-['Octarine-Bold'] text-lg tracking-tight text-text-primary block">
                agapp
              </span>
              <span className="text-[10px] block font-['Octarine-Bold'] uppercase tracking-wider text-accent font-bold">
                Citizen Portal
              </span>
            </div>
          </Link>
        </div>

        {/* Center Form Container with Generous Spacing */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-6">
          {/* Header Title with Generous Bottom Margin */}
          <div className="space-y-2.5 mb-8">
            <h1 className="text-3xl sm:text-4xl font-['Octarine-Bold'] text-text-primary tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-text-muted leading-relaxed font-['Inter-Medium']">
              Sign in to your citizen account to manage applications and reports.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-2xl font-['Inter-Medium'] animate-fade-in">
              {errorMsg}
            </div>
          )}

          {/* Form with Clean Spacing Between Groups */}
          <form onSubmit={handleLogin} className="space-y-6 text-xs font-['Inter-Medium']">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                Email Address
              </label>
              <input
                type="email"
                required
                maxLength={255}
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-[#FAFAFA] dark:bg-card border border-theme text-sm text-text-primary placeholder:text-text-muted shadow-2xs focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                  Password
                </label>
                <Link href="/auth/otp" className="text-[11px] text-text-muted hover:text-text-primary transition font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  maxLength={128}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-5 pr-12 py-4 rounded-2xl bg-[#FAFAFA] dark:bg-card border border-theme text-sm text-text-primary placeholder:text-text-muted shadow-2xs focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1.5 cursor-pointer"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button with Pastel Rainbow Gradient & Generous Height */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: 'linear-gradient(90deg, #C7D5C1 0%, #F2C4CB 50%, #EFE6BD 100%)',
                }}
                className="w-full py-4 rounded-full text-[#292929] font-['Octarine-Bold'] text-sm shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{loading ? 'Signing in...' : 'Sign In to Account'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>
            </div>

            {/* Links Section with Clean Separation */}
            <div className="pt-5 border-t border-theme/60 space-y-3.5 text-center">
              <div className="text-xs">
                <span className="text-text-muted">Don&apos;t have an account yet? </span>
                <Link href="/auth/register" className="font-['Octarine-Bold'] text-accent hover:underline ml-1">
                  Register here &rarr;
                </Link>
              </div>

              <div>
                <Link
                  href="/"
                  className="text-xs font-['Octarine-Bold'] text-text-muted hover:text-text-primary transition underline underline-offset-4"
                >
                  Continue Browsing as Guest
                </Link>
              </div>
            </div>
          </form>
        </div>

        {/* Footer Copyright */}
        <div className="text-[11px] text-text-muted leading-relaxed pt-8 font-['Inter-Medium'] max-w-[400px] mx-auto text-center lg:text-left mt-6">
          © 2026 Agapp. Local Government Digital Platform.
        </div>
      </div>

      {/* Right Column: Desktop Brand Showcase */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center items-center p-12 xl:p-20 bg-[#FFFDF8] dark:bg-[#141210] border-l border-[#EBE7DE] dark:border-theme/40 relative overflow-hidden">
        {/* Background Swirls (Top Right & Bottom Left) */}
        <img
          src="/brand/swirl.png"
          alt=""
          className="pointer-events-none absolute -top-12 -right-12 w-88 h-88 xl:w-96 xl:h-96 object-contain opacity-40 dark:opacity-15 select-none"
        />
        <img
          src="/brand/swirl.png"
          alt=""
          className="pointer-events-none absolute -bottom-12 -left-12 w-88 h-88 xl:w-96 xl:h-96 object-contain opacity-40 dark:opacity-15 select-none rotate-180"
        />

        {/* Center Hero Artwork & Typography */}
        <div className="flex flex-col items-center gap-8 relative z-10 max-w-[460px] text-center my-auto">
          {/* Official AGAPP Brand Logo */}
          <div className="w-56 h-56 sm:w-60 sm:h-60 rounded-[48px] overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] border border-theme/40 shrink-0">
            <img
              src="/brand/logo.png"
              alt="AGAPP Logo"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-3 pt-2">
            <h2 className="font-['Octarine-Bold'] text-3xl xl:text-4xl tracking-tight text-text-primary">
              Discover your town.
            </h2>
            <p className="text-sm xl:text-base leading-relaxed text-text-muted font-['Inter-Medium'] max-w-[400px] mx-auto">
              Access local government certificates, real-time community hazard reports, and digital QR passes — all in one unified platform.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
