'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import { Sms, Key, ArrowRight, TickCircle } from 'iconsax-react';

export default function EmailOtpPage() {
  const router = useRouter();
  const { showToast } = useToast();
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
        email: email.trim(),
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        setErrorMsg(error.message);
        showToast(error.message, 'error');
      } else {
        setStep('otp');
        showToast('6-digit OTP code sent to your email.', 'success');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to send OTP code.';
      setErrorMsg(msg);
      showToast(msg, 'error');
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
        email: email.trim(),
        token: otpCode.trim(),
        type: 'email',
      });

      if (error) {
        const msg = error.message || 'Invalid or expired OTP code.';
        setErrorMsg(msg);
        showToast(msg, 'error');
      } else if (data?.session) {
        showToast('Signed in successfully!', 'success');
        router.push('/');
      }
    } catch (err: any) {
      const msg = err.message || 'Verification error.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#1C1A17] text-text-primary transition-colors duration-200">
      {/* Left Column: OTP Form */}
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

        {/* Content Container */}
        <div className="w-full max-w-[400px] mx-auto my-auto py-6">
          <div className="space-y-2.5 mb-8">
            <h1 className="text-3xl sm:text-4xl font-['Octarine-Bold'] text-text-primary tracking-tight">
              {step === 'email' ? 'Passcode Sign In' : 'Enter 6-Digit Code'}
            </h1>
            <p className="text-sm text-text-muted leading-relaxed font-['Inter-Medium']">
              {step === 'email'
                ? 'Receive a secure one-time passcode directly in your registered email.'
                : `We sent a 6-digit code to ${email}. Enter it below to sign in.`}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-2xl font-['Inter-Medium'] animate-fade-in">
              {errorMsg}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleSendOtp} className="space-y-6 text-xs font-['Inter-Medium']">
              <div className="space-y-2">
                <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                  Email Address
                </label>
                <div className="relative">
                  <Sms size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="email"
                    required
                    maxLength={255}
                    placeholder="citizen@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#FAFAFA] dark:bg-card border border-theme text-sm text-text-primary placeholder:text-text-muted shadow-2xs focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(90deg, #C7D5C1 0%, #F2C4CB 50%, #EFE6BD 100%)',
                  }}
                  className="w-full py-4 rounded-full text-[#292929] font-['Octarine-Bold'] text-sm shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Sending Code...' : 'Send Passcode'}</span>
                  {!loading && <ArrowRight size={16} />}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6 text-xs font-['Inter-Medium']">
              <div className="space-y-2">
                <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                  6-Digit OTP Code
                </label>
                <div className="relative">
                  <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    required
                    maxLength={8}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="w-full pl-11 pr-4 py-4 rounded-2xl bg-[#FAFAFA] dark:bg-card border border-theme text-sm font-mono text-text-primary tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: 'linear-gradient(90deg, #C7D5C1 0%, #F2C4CB 50%, #EFE6BD 100%)',
                  }}
                  className="w-full py-4 rounded-full text-[#292929] font-['Octarine-Bold'] text-sm shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>{loading ? 'Verifying Code...' : 'Verify & Sign In'}</span>
                  {!loading && <TickCircle size={16} />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep('email'); setOtpCode(''); }}
                className="w-full text-center text-xs text-text-muted hover:text-text-primary pt-2"
              >
                ← Change Email Address
              </button>
            </form>
          )}

          <div className="text-center pt-5 border-t border-theme/60 text-xs">
            <span className="text-text-muted">Return to </span>
            <Link href="/auth/login" className="font-['Octarine-Bold'] text-accent hover:underline ml-1">
              Standard Password Login &rarr;
            </Link>
          </div>
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
