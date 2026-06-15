'use client';

import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LoginLayout } from './LoginLayout';
import { Envelope, Lock, ArrowRight } from '@phosphor-icons/react';
import Link from 'next/link';

export const LGUAdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    // Simulate login - replace with actual API call
    setTimeout(() => {
      setIsLoading(false);
      // On success, redirect to dashboard
      window.location.href = '/lgu/dashboard';
    }, 1500);
  };
  
  return (
    <LoginLayout 
      title="LGU Admin Login" 
      subtitle="Sign in to manage your municipality"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="admin@lgu.gov.ph"
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
          Sign In
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
      
      <div className="mt-6 pt-6 border-t border-[#e5e5e5]">
        <p className="text-sm text-[#737373] text-center">
          Need an account? Contact your{' '}
          <a href="#" className="text-[#2563eb] hover:underline">
            Super Admin
          </a>
        </p>
      </div>
    </LoginLayout>
  );
};
