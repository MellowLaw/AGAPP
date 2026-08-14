'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLgu } from '../../../contexts/LguContext';
import { supabase } from '../../../lib/supabase';
import { getBarangays } from '../../../lib/constants';
import { User, Lock, Sms, Location, ArrowRight, TickCircle } from 'iconsax-react';

export default function RegisterPage() {
  const router = useRouter();
  const { activeLgu } = useLgu();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [barangay, setBarangay] = useState('Poblacion');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  const barangayList = getBarangays(activeLgu?.id);

  useEffect(() => {
    if (barangayList.length > 0) {
      setBarangay(barangayList[0]);
    }
  }, [activeLgu?.id]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: fullName,
            role: 'CITIZEN',
            lgu_id: activeLgu?.id || 'liliw-laguna',
            barangay: barangay,
          },
        },
      });

      if (authError) {
        setErrorMsg(authError.message);
      } else if (authData?.user) {
        // Upsert into users table
        await supabase.from('users').upsert({
          id: authData.user.id,
          email: email,
          name: fullName,
          role: 'CITIZEN',
          lgu_id: activeLgu?.id || 'liliw-laguna',
          barangay: barangay,
          verification_status: 'unverified',
          is_active: true,
        });
        setRegisteredSuccess(true);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during registration.');
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
          <h1 className="text-2xl font-bold text-text-primary">Create Citizen Account</h1>
          <p className="text-xs text-text-muted">
            Register for {activeLgu?.name || 'Municipality of Liliw'} digital services
          </p>
        </div>

        {registeredSuccess ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-14 h-14 rounded-full bg-green-100 text-green-600 mx-auto flex items-center justify-center">
              <TickCircle size={32} variant="Bold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">Registration Successful!</h2>
              <p className="text-xs text-text-muted mt-1">
                Your citizen account is ready. Please sign in to begin accessing municipal e-services.
              </p>
            </div>
            <Link
              href="/auth/login"
              className="inline-block w-full py-2.5 rounded-xl bg-accent text-accent-contrast font-bold text-xs shadow transition text-center"
            >
              Go to Sign In →
            </Link>
          </div>
        ) : (
          <>
            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs rounded-xl">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-text-primary mb-1">Full Legal Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    required
                    placeholder="Juan Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-alt dark:bg-chip border border-theme text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-text-primary mb-1">Barangay Residence</label>
                <div className="relative">
                  <Location size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <select
                    value={barangay}
                    onChange={(e) => setBarangay(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-alt dark:bg-chip border border-theme text-text-primary focus:ring-1 focus:ring-accent"
                  >
                    {barangayList.map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-text-primary mb-1">Email Address</label>
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

              <div>
                <label className="block font-bold text-text-primary mb-1">Create Strong Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-surface-alt dark:bg-chip border border-theme text-text-primary placeholder:text-text-muted focus:ring-1 focus:ring-accent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-accent text-accent-contrast font-bold text-sm hover:opacity-90 shadow-md transition flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Registering Account...' : 'Complete Registration'}</span>
                <ArrowRight size={16} />
              </button>
            </form>

            <div className="text-center text-xs text-text-muted pt-2 border-t border-theme">
              Already have a citizen account?{' '}
              <Link href="/auth/login" className="font-bold text-accent hover:underline">
                Sign In
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
