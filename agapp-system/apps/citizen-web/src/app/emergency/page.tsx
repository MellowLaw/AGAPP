'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLgu } from '../../contexts/LguContext';
import { 
  Call, 
  ArrowLeft2,
  Flash, 
  Shield, 
  Health, 
  Buildings, 
  Danger
} from 'iconsax-react';

export default function EmergencyPage() {
  const router = useRouter();
  const { activeLgu } = useLgu();

  const hotlines = [
    { name: 'National Emergency Response', number: '911', desc: 'Medical, fire, and police dispatch', icon: Danger, bg: 'bg-red-50 text-red-700 border-red-200' },
    { name: 'Police Station (PNP)', number: '117', desc: 'Local police assistance and reports', icon: Shield, bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    { name: 'Fire Bureau (BFP)', number: '160', desc: 'Fire rescue and emergency hazardous response', icon: Flash, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    { name: 'Philippine Red Cross', number: '143', desc: 'Blood bank and disaster rescue services', icon: Health, bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    { name: 'NDRRMC Disaster Hotline', number: '(02) 8911-1406', desc: 'National Disaster Risk Reduction & Management', icon: Buildings, bg: 'bg-stone-100 text-stone-700 border-stone-200' },
  ];

  return (
    <div className="max-w-xl mx-auto px-4 py-4 space-y-4 pb-28 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-theme pb-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full bg-surface-alt dark:bg-chip border border-theme flex items-center justify-center text-text-primary hover:bg-surface transition shadow-2xs"
        >
          <ArrowLeft2 size={18} />
        </button>

        <div className="text-center">
          <h1 className="text-sm font-heading text-text-primary">Emergency Hotlines</h1>
          <p className="text-[10px] text-text-muted font-['Inter-Medium']">
            {activeLgu?.name || 'Municipality of Liliw'}
          </p>
        </div>

        <div className="w-9 h-9" />
      </div>

      <div className="space-y-1 pt-1">
        <h2 className="text-2xl font-['Octarine-Bold'] text-text-primary leading-tight">
          Municipal Hotlines
        </h2>
        <p className="text-xs text-text-muted font-['Inter-Medium'] leading-relaxed">
          If you or someone else is in immediate danger, tap any of the hotlines below to dial rescue and emergency services.
        </p>
      </div>

      {/* Hotlines Card List */}
      <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-3 shadow-xs space-y-1 transition-colors">
        {hotlines.map((h, i) => {
          const Icon = h.icon;
          return (
            <a
              key={h.name}
              href={`tel:${h.number.replace(/[^0-9+]/g, '')}`}
              className={`p-4 rounded-2xl flex items-center gap-3.5 hover:bg-surface-alt dark:hover:bg-chip transition group ${
                i < hotlines.length - 1 ? 'border-b border-theme' : ''
              }`}
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 border shadow-2xs ${h.bg}`}>
                <Icon size={20} variant="Bold" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-['Octarine-Bold'] text-text-primary group-hover:text-accent transition">
                  {h.name}
                </h3>
                <p className="text-xs text-text-muted font-['Inter-Medium'] truncate">
                  {h.desc}
                </p>
                <span className="text-xs font-['Inter-Bold'] text-accent pt-0.5 block font-mono">
                  {h.number}
                </span>
              </div>

              <div className="w-9 h-9 rounded-full bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white transition shadow-2xs">
                <Call size={16} variant="Bold" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
