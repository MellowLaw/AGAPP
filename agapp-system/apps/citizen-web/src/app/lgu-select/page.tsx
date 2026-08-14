'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLgu, getLguLogo } from '../../contexts/LguContext';
import { ArrowLeft, ArrowRight2 } from 'iconsax-react';

export default function SelectLguPage() {
  const router = useRouter();
  const { lgus, activeLgu, setActiveLgu } = useLgu();

  return (
    <div className="relative min-h-screen flex flex-col justify-between px-6 py-8 max-w-md mx-auto animate-fade-in overflow-hidden">
      {/* Subtle Tinted Map Background (1:1 with Mobile LguSelectScreen) */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <img
          src="/brand/bg-map-1.png"
          alt=""
          className="w-full h-full object-cover opacity-[0.07] dark:invert dark:opacity-[0.03]"
        />
      </div>

      <div className="space-y-6 pt-2">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface dark:bg-card border border-theme flex items-center justify-center text-text-primary hover:bg-surface-alt dark:hover:bg-chip transition shadow-xs"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Header (Matches Mobile) */}
        <div className="space-y-1.5">
          <h1 className="text-3xl font-heading text-text-primary tracking-tight">
            Select your LGU.
          </h1>
          <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
            Choose your municipality to access local services and reports.
          </p>
        </div>

        {/* LGU List Cards */}
        <div className="space-y-3 pt-2">
          {lgus.map((lgu) => {
            const isSelected = activeLgu?.id === lgu.id;
            const logoUrl = getLguLogo(lgu);

            return (
              <button
                key={lgu.id}
                onClick={() => {
                  setActiveLgu(lgu);
                  router.push('/');
                }}
                className={`w-full p-4 rounded-[20px] bg-surface dark:bg-card border flex items-center justify-between text-left shadow-xs transition duration-200 hover:shadow-md ${
                  isSelected
                    ? 'border-accent ring-1 ring-accent'
                    : 'border-theme hover:border-accent/40'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                    <img
                      src={logoUrl}
                      alt={lgu.name}
                      className="w-full h-full object-cover rounded-xl"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/brand/liliw-seal.jpg';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-heading text-text-primary truncate">
                      {lgu.name ? lgu.name.replace(/^municipality of\s+/i, '').trim() : ''}
                    </h3>
                  </div>
                </div>

                <ArrowRight2 size={18} className="text-text-muted shrink-0 ml-2" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
