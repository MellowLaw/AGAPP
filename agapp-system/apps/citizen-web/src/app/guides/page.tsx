'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLgu } from '../../contexts/LguContext';
import { supabase } from '../../lib/supabase';
import { 
  Book, 
  SearchNormal1, 
  Location, 
  Clock, 
  Global, 
  Call, 
  Buildings,
  ArrowLeft2,
  CloseCircle
} from 'iconsax-react';

interface GuideItem {
  id: string;
  section: string;
  title: string;
  address?: string;
  schedule?: string;
  website?: string;
  phone?: string;
}

const SECTION_ORDER = [
  'ID Registration and Licenses',
  'Benefits & Contributions',
  'Specialized Assistance',
  'Other Local Government Offices'
];

export default function CitizenGuidesPage() {
  const router = useRouter();
  const { activeLgu } = useLgu();
  const [guides, setGuides] = useState<GuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchGuides() {
      if (!activeLgu?.id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('citizen_guides')
          .select('*')
          .eq('lgu_id', activeLgu.id)
          .order('created_at', { ascending: true });

        if (!error && data && data.length > 0) {
          setGuides(data);
        } else {
          // Fallback municipal guides
          setGuides([
            {
              id: 'g-1',
              section: 'ID Registration and Licenses',
              title: 'Philippine Identification System (PhilSys Step 2 Registration)',
              address: 'Ground Floor, Liliw Municipal Town Hall, Poblacion',
              schedule: 'Monday – Friday, 8:00 AM – 5:00 PM',
              phone: '(049) 563-1234',
              website: 'https://philsys.gov.ph',
            },
            {
              id: 'g-2',
              section: 'Benefits & Contributions',
              title: 'Social Security System (SSS Service Desk / E-Center)',
              address: 'Liliw Public Market Commercial Center, 2nd Floor',
              schedule: 'Tuesdays and Thursdays, 9:00 AM – 4:00 PM',
              phone: '1455',
              website: 'https://sss.gov.ph',
            },
            {
              id: 'g-3',
              section: 'Specialized Assistance',
              title: 'Municipal Social Welfare and Development Office (MSWDO)',
              address: 'Annex Building, Municipal Compound, Liliw',
              schedule: 'Monday – Friday, 8:00 AM – 5:00 PM',
              phone: '(049) 563-5678',
            },
            {
              id: 'g-4',
              section: 'Other Local Government Offices',
              title: 'Municipal Agriculture Office (MAO) Farmers & Fisherfolk Desk',
              address: 'Barangay Rizal Agricultural Station, Liliw',
              schedule: 'Monday – Friday, 8:00 AM – 5:00 PM',
              phone: '(049) 563-9988',
            },
          ]);
        }
      } catch (err) {
        console.error('Error fetching citizen guides', err);
      } finally {
        setLoading(false);
      }
    }
    fetchGuides();
  }, [activeLgu]);

  const filteredGuides = guides.filter((g) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (g.title || '').toLowerCase().includes(q) ||
      (g.address && g.address.toLowerCase().includes(q)) ||
      (g.section && g.section.toLowerCase().includes(q))
    );
  });

  const sectionsMap = filteredGuides.reduce((acc, guide) => {
    const sec = guide.section || 'General Guides';
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(guide);
    return acc;
  }, {} as Record<string, GuideItem[]>);

  const sortedSections = Object.keys(sectionsMap).sort((a, b) => {
    const idxA = SECTION_ORDER.indexOf(a);
    const idxB = SECTION_ORDER.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

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
          <h1 className="text-sm font-heading text-text-primary">Citizen's Charter & Guides</h1>
          <p className="text-[10px] text-text-muted font-['Inter-Medium']">
            {activeLgu?.name || 'Municipality of Liliw'}
          </p>
        </div>

        <div className="w-9 h-9" />
      </div>

      {/* Search Bar */}
      <div className="relative">
        <SearchNormal1 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search government offices, PhilSys, SSS..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-full bg-surface dark:bg-card border border-theme text-xs text-text-primary placeholder:text-text-muted font-['Inter-Medium'] shadow-xs focus:outline-none focus:ring-1 focus:ring-accent transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
          >
            <CloseCircle size={16} />
          </button>
        )}
      </div>

      {/* Guides Sections */}
      {loading ? (
        <div className="p-12 text-center text-xs text-text-muted font-['Inter-Medium']">
          Loading citizen guides...
        </div>
      ) : sortedSections.length === 0 ? (
        <div className="bg-surface dark:bg-card rounded-[28px] border border-theme p-10 text-center space-y-2">
          <Book size={32} className="text-text-muted mx-auto" />
          <p className="text-xs text-text-muted font-['Inter-Medium']">
            No guides found matching "{searchQuery}".
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedSections.map((secName) => (
            <div key={secName} className="space-y-3">
              <h2 className="text-xs font-['Octarine-Bold'] uppercase tracking-wider text-accent px-1">
                {secName}
              </h2>

              <div className="space-y-3">
                {sectionsMap[secName].map((guide) => (
                  <div
                    key={guide.id}
                    className="bg-surface dark:bg-card rounded-[24px] border border-theme p-5 shadow-xs space-y-3 hover:border-accent transition"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-accent flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/60 shadow-xs">
                        <Buildings size={20} variant="Bold" />
                      </div>
                      <div className="space-y-1 flex-1">
                        <h3 className="text-sm font-['Octarine-Bold'] text-text-primary leading-snug">
                          {guide.title}
                        </h3>
                        {guide.address && (
                          <p className="text-xs text-text-muted font-['Inter-Medium'] flex items-start gap-1.5 pt-1">
                            <Location size={14} className="text-text-muted shrink-0 mt-0.5" />
                            <span>{guide.address}</span>
                          </p>
                        )}
                        {guide.schedule && (
                          <p className="text-xs text-text-muted font-['Inter-Medium'] flex items-center gap-1.5">
                            <Clock size={14} className="shrink-0" />
                            <span>{guide.schedule}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Links */}
                    {(guide.phone || guide.website) && (
                      <div className="pt-2 border-t border-theme flex items-center gap-2 flex-wrap">
                        {guide.phone && (
                          <a
                            href={`tel:${guide.phone.replace(/[^0-9+]/g, '')}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-['Inter-Medium'] hover:bg-emerald-100 transition shadow-2xs"
                          >
                            <Call size={13} variant="Bold" />
                            <span>{guide.phone}</span>
                          </a>
                        )}

                        {guide.website && (
                          <a
                            href={guide.website.startsWith('http') ? guide.website : `https://${guide.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-['Inter-Medium'] hover:bg-blue-100 transition shadow-2xs"
                          >
                            <Global size={13} variant="Bold" />
                            <span>Visit Portal</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
