'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { Eye, EyeSlash } from 'iconsax-react';

export default function LoginPage() {
  const router = useRouter();
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
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
      } else if (data?.user) {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-between px-6 py-12 max-w-md mx-auto animate-fade-in overflow-hidden">
      {/* Authentic Ribbons Background */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden flex items-center justify-center opacity-70 dark:opacity-20">
        <img
          src="/brand/ribbons.png"
          alt="Brand Ribbons"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Main Content */}
      <div className="space-y-8 pt-6">
        {/* Title */}
        <div className="space-y-3 text-center">
          <h1 className="text-3xl sm:text-4xl font-['Octarine-Bold'] text-text-primary tracking-tight">
            Welcome to agapp.
          </h1>
          <p className="text-xs sm:text-sm text-text-muted max-w-xs mx-auto leading-relaxed font-['Inter-Medium']">
            Enter your email to log-in to an existing account or instantly set up your new account
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-2xl font-['Inter-Medium']">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 text-xs font-['Inter-Medium']">
          <div className="space-y-1.5">
            <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 rounded-full bg-surface dark:bg-card border border-theme text-sm text-text-primary placeholder:text-text-muted shadow-xs focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-5 pr-12 py-3.5 rounded-full bg-surface dark:bg-card border border-theme text-sm text-text-primary placeholder:text-text-muted shadow-xs focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Pastel Rainbow Gradient Sign In Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              style={{
                background: 'linear-gradient(90deg, #C7D5C1 0%, #F2C4CB 50%, #EFE6BD 100%)',
              }}
              className="w-full py-4 rounded-full text-[#292929] font-['Octarine-Bold'] text-sm shadow-xs hover:opacity-95 transition flex items-center justify-center cursor-pointer"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Sub Links */}
          <div className="flex items-center justify-between text-xs pt-1">
            <Link href="/auth/register" className="font-['Octarine-Bold'] text-text-primary hover:underline">
              Create new account
            </Link>
            <Link href="/auth/otp" className="font-medium text-text-muted hover:text-text-primary">
              Forgot password?
            </Link>
          </div>
        </form>

        {/* Continue as Guest */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="text-xs font-['Octarine-Bold'] text-text-primary underline underline-offset-4 hover:opacity-80 transition"
          >
            Continue as Guest
          </Link>
        </div>
      </div>

      {/* Footer Terms & Conditions */}
      <div className="text-center text-[10px] text-text-muted leading-relaxed pt-8 font-['Inter-Medium']">
        By continuing, you agree to our{' '}
        <span className="font-bold text-text-primary underline">Terms & Conditions</span> and verify that you have read our{' '}
        <span className="font-bold text-text-primary underline">Privacy Policy</span>.
      </div>
    </div>
  );
}
