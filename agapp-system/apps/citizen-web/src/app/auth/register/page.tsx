'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLgu } from '../../../contexts/LguContext';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import { getBarangays } from '../../../lib/constants';
import { 
  User, 
  Lock, 
  Sms, 
  Location, 
  ArrowRight, 
  TickCircle, 
  Eye, 
  EyeSlash 
} from 'iconsax-react';

export default function RegisterPage() {
  const router = useRouter();
  const { activeLgu } = useLgu();
  const { showToast } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [barangay, setBarangay] = useState('Poblacion');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  // Email Uniqueness Live State
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');

  const barangayList = getBarangays(activeLgu?.id);

  useEffect(() => {
    if (barangayList.length > 0) {
      setBarangay(barangayList[0]);
    }
  }, [activeLgu?.id]);

  // Debounced Email Uniqueness Checker
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setEmailStatus('idle');
      return;
    }

    setEmailStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('email', trimmed)
          .maybeSingle();

        if (error) {
          setEmailStatus('idle');
          return;
        }

        if (data) {
          setEmailStatus('taken');
          showToast('This email is already registered. Please sign in instead.', 'error');
        } else {
          setEmailStatus('available');
        }
      } catch {
        setEmailStatus('idle');
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [email, showToast]);

  // Password Complexity Rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordValid) {
      const msg = 'Password must be at least 8 characters with 1 uppercase letter and 1 number.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    if (emailStatus === 'taken') {
      const msg = 'This email address is already registered. Please sign in.';
      setErrorMsg(msg);
      showToast(msg, 'error');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanName = fullName.trim();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            name: cleanName,
            role: 'CITIZEN',
            lgu_id: activeLgu?.id || 'liliw-laguna',
            barangay: barangay,
          },
        },
      });

      if (authError) {
        setErrorMsg(authError.message);
        showToast(authError.message, 'error');
      } else if (authData?.user) {
        // Upsert into public users table
        await supabase.from('users').upsert({
          id: authData.user.id,
          email: cleanEmail,
          name: cleanName,
          role: 'CITIZEN',
          lgu_id: activeLgu?.id || 'liliw-laguna',
          barangay: barangay,
          verification_status: 'unverified',
          is_active: true,
        });

        setRegisteredSuccess(true);
        showToast('Registration successful! Welcome to AGAPP.', 'success');
      }
    } catch (err: any) {
      const msg = err.message || 'An error occurred during registration.';
      setErrorMsg(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const lguDisplayName = (activeLgu?.name || 'Municipality of Liliw')
    .replace(/^Municipality of\s*/i, '')
    .replace(/,\s*Laguna/i, '');

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-12 bg-white dark:bg-[#1C1A17] text-text-primary transition-colors duration-200">
      {/* Left Column: Registration Form */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between px-8 py-10 sm:px-12 sm:py-12 lg:px-14 lg:py-16 xl:px-20 xl:py-20 min-h-screen bg-white dark:bg-[#1E1B18] z-10">
        {/* Top Mini Brand Header */}
        <div className="flex items-center justify-between mb-4">
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

        {/* Form Container with Generous Spacing */}
        <div className="w-full max-w-[420px] mx-auto my-auto py-4">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl sm:text-4xl font-['Octarine-Bold'] text-text-primary tracking-tight">
              Create account
            </h1>
            <p className="text-sm text-text-muted leading-relaxed font-['Inter-Medium']">
              Register for digital clearances, hazard reports, and instant QR passes.
            </p>
          </div>

          {registeredSuccess ? (
            <div className="p-6 sm:p-8 rounded-[28px] bg-surface dark:bg-card border border-theme shadow-xl text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <TickCircle size={36} variant="Bold" />
              </div>
              <div className="space-y-2">
                <h2 className="text-lg font-['Octarine-Bold'] text-text-primary">Registration Successful!</h2>
                <p className="text-xs text-text-muted leading-relaxed font-['Inter-Medium']">
                  Your citizen account for <strong className="text-text-primary">{email}</strong> has been created. You can now sign in.
                </p>
              </div>
              <Link
                href="/auth/login"
                className="w-full py-3.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-sm shadow-md hover:opacity-90 transition flex items-center justify-center gap-2 block"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="mb-4 p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-2xl font-['Inter-Medium'] animate-fade-in">
                  {errorMsg}
                </div>
              )}

              {/* Registration Form with Generous Spacing */}
              <form onSubmit={handleRegister} className="space-y-4 text-xs font-['Inter-Medium']">
                {/* Full Legal Name */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                    Full Legal Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      required
                      maxLength={100}
                      placeholder="Juan Dela Cruz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-card border border-theme text-sm text-text-primary placeholder:text-text-muted shadow-2xs focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    />
                  </div>
                </div>

                {/* Barangay Residence */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                    Barangay Residence ({lguDisplayName})
                  </label>
                  <div className="relative">
                    <Location size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <select
                      value={barangay}
                      onChange={(e) => setBarangay(e.target.value)}
                      className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-card border border-theme text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all appearance-none cursor-pointer"
                    >
                      {barangayList.map((bg) => (
                        <option key={bg} value={bg}>
                          Barangay {bg}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Email Address with Real-time Unique Checker */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                      Email Address
                    </label>
                    {emailStatus === 'checking' && (
                      <span className="text-[10px] text-text-muted italic">Checking availability...</span>
                    )}
                    {emailStatus === 'available' && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-['Octarine-Bold'] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                      </span>
                    )}
                    {emailStatus === 'taken' && (
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-['Octarine-Bold'] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Already registered
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Sms size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      required
                      maxLength={255}
                      placeholder="citizen@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-card border text-sm text-text-primary placeholder:text-text-muted shadow-2xs focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all ${
                        emailStatus === 'taken'
                          ? 'border-rose-500/80 focus:border-rose-500'
                          : emailStatus === 'available'
                          ? 'border-emerald-500/80 focus:border-emerald-500'
                          : 'border-theme focus:border-accent'
                      }`}
                    />
                  </div>
                </div>

                {/* Password with Live Requirement Indicator */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-['Octarine-Bold'] uppercase tracking-wider text-text-primary">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      maxLength={128}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3.5 rounded-2xl bg-[#FAFAFA] dark:bg-card border border-theme text-sm text-text-primary placeholder:text-text-muted shadow-2xs focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1 cursor-pointer"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Requirement Checklist (Zero Emojis, Pure Colored Typography) */}
                  <div className="p-2.5 rounded-2xl bg-surface-alt/70 dark:bg-chip/50 border border-theme space-y-1 mt-1.5">
                    <p className="text-[10px] font-['Octarine-Bold'] text-text-muted uppercase tracking-wider">
                      Requirements:
                    </p>
                    <div className="grid grid-cols-3 gap-1 text-[10.5px]">
                      <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-text-muted'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasMinLength ? 'bg-emerald-500' : 'bg-text-muted/40'}`} />
                        <span>8+ chars</span>
                      </div>

                      <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-text-muted'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasUppercase ? 'bg-emerald-500' : 'bg-text-muted/40'}`} />
                        <span>1 uppercase</span>
                      </div>

                      <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-text-muted'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${hasNumber ? 'bg-emerald-500' : 'bg-text-muted/40'}`} />
                        <span>1 number</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading || !isPasswordValid || emailStatus === 'taken'}
                    style={{
                      background: 'linear-gradient(90deg, #C7D5C1 0%, #F2C4CB 50%, #EFE6BD 100%)',
                    }}
                    className="w-full py-4 rounded-full text-[#292929] font-['Octarine-Bold'] text-sm shadow-xs hover:opacity-95 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>{loading ? 'Registering Account...' : 'Complete Registration'}</span>
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </div>

                {/* Already have an account */}
                <div className="text-center pt-3 border-t border-theme/60 text-xs">
                  <span className="text-text-muted">Already registered? </span>
                  <Link href="/auth/login" className="font-['Octarine-Bold'] text-accent hover:underline ml-1">
                    Sign in here &rarr;
                  </Link>
                </div>
              </form>
            </>
          )}

          {/* Continue as Guest */}
          <div className="text-center pt-2">
            <Link
              href="/"
              className="text-xs font-['Octarine-Bold'] text-text-muted hover:text-text-primary transition underline underline-offset-4"
            >
              Continue Browsing as Guest
            </Link>
          </div>
        </div>

        {/* Footer Terms */}
        <div className="text-[11px] text-text-muted leading-relaxed pt-8 font-['Inter-Medium'] max-w-[420px] mx-auto text-center lg:text-left mt-4">
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
