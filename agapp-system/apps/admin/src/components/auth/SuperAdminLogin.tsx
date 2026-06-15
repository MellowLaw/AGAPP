'use client';

import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LoginLayout } from './LoginLayout';
import { Shield, ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link';

export const SuperAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate credentials check - replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      setStep('2fa');
    }, 1500);
  };
  
  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate 2FA verification - replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      // On success, redirect to dashboard
      window.location.href = '/super/dashboard';
    }, 1500);
  };
  
  return (
    <LoginLayout 
      title="Super Admin Login" 
      subtitle="System administrator access"
    >
      {step === 'credentials' ? (
        <form onSubmit={handleCredentialsSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="superadmin@agapp.gov.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <div>
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="mt-2 text-right">
              <Link 
                href="/forgot-password" 
                className="text-sm text-[#2563eb] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          
          {error && (
            <p className="text-sm text-[#dc2626]">{error}</p>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isLoading}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <div className="flex items-center gap-2 p-3 bg-[#f5f5f5] rounded-md">
            <Shield className="w-5 h-5 text-[#2563eb]" />
            <p className="text-sm text-[#737373]">
              Two-factor authentication required
            </p>
          </div>
        </form>
      ) : (
        <form onSubmit={handle2FASubmit} className="space-y-4">
          <p className="text-sm text-[#737373]">
            Enter the 6-digit code sent to your email
          </p>
          
          <Input
            label="Authentication Code"
            type="text"
            placeholder="000000"
            maxLength={6}
            value={twoFactorCode}
            onChange={(e) => setTwoFactorCode(e.target.value)}
            required
          />
          
          {error && (
            <p className="text-sm text-[#dc2626]">{error}</p>
          )}
          
          <Button 
            type="submit" 
            className="w-full" 
            isLoading={isLoading}
          >
            Verify & Sign In
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          
          <button
            type="button"
            onClick={() => setStep('credentials')}
            className="w-full text-center text-sm text-[#737373] hover:text-[#1a1a1a]"
          >
            Back to credentials
          </button>
        </form>
      )}
    </LoginLayout>
  );
};
