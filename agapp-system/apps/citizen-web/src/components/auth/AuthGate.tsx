'use client';

import React from 'react';
import Link from 'next/link';

export function AuthGate({ title = 'Get the Full Experience!', subtitle = 'Sign in to access full features and services.' }: { title?: string; subtitle?: string }) {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-10 space-y-6 animate-fade-in">
      {/* Visual Mascot / Sticker Frame */}
      <div className="w-36 h-36 rounded-full bg-surface-alt dark:bg-chip border-2 border-theme p-4 flex items-center justify-center shadow-inner relative transition-colors">
        <img
          src="/brand/mascot.png"
          alt="AGAPP Mascot"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="space-y-2 max-w-sm">
        <h2 className="text-2xl font-heading text-text-primary leading-tight">
          {title}
        </h2>
        <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
          {subtitle}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-3 pt-2">
        <Link
          href="/auth/login"
          className="block w-full py-3.5 rounded-full bg-accent text-accent-contrast font-heading text-sm hover:opacity-90 transition shadow-md"
        >
          Login
        </Link>
        <Link
          href="/auth/register"
          className="block w-full py-2.5 text-text-primary font-heading text-sm hover:opacity-75 transition"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}
