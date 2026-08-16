'use client';

import React from 'react';
import Link from 'next/link';
import { LottiePlayer } from '../common/LottiePlayer';

export function AuthGate({
  title = 'Get the Full Experience!',
  subtitle = 'Sign in to access full features and services.',
}: {
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="min-h-[65vh] flex flex-col items-center justify-center text-center px-6 py-10 space-y-6 animate-fade-in">
      {/* Animated Sign-Up Mascot Lottie Matching Mobile */}
      <div className="w-56 h-56 max-w-full flex items-center justify-center select-none pointer-events-none -mb-2">
        <LottiePlayer
          animationPath="/brand/sign-up-animation.json"
          className="w-full h-full"
        />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-['Octarine-Bold'] text-text-primary leading-tight">
          {title}
        </h2>
        <p className="text-sm text-text-muted font-['Inter-Medium'] leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3 pt-2">
        <Link
          href="/auth/login"
          className="block w-full py-3.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-sm hover:opacity-90 transition shadow-md text-center"
        >
          Login
        </Link>
        <Link
          href="/auth/register"
          className="block w-full py-2.5 text-text-primary font-['Octarine-Bold'] text-sm hover:opacity-75 transition text-center"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
