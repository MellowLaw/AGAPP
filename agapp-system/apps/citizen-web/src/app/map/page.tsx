'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useLgu } from '../../contexts/LguContext';
import { supabase } from '../../lib/supabase';
import { StatusBadge } from '../../components/common/StatusBadge';
import { 
  ArrowLeft2, 
  SearchNormal1,
  Location,
  Buildings,
  Shield,
  Flash,
  Health,
  Category2,
  Call,
  ExportSquare,
  Clock,
  CloseCircle
} from 'iconsax-react';

const TownMapClient = dynamic(
  () => import('../../components/map/TownMapClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex flex-col items-center justify-center bg-surface-alt dark:bg-card text-text-muted gap-3">
        <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-heading">Loading Municipal Map...</span>
      </div>
    )
  }
);

const LGU_COORDINATES: Record<string, [number, number]> = {
  'liliw-laguna': [14.1311, 121.4363],
  'nagcarlan-laguna': [14.1378, 121.4167],
  'rizal-laguna': [14.1130, 121.3962],
  'san-pablo-city-laguna': [14.0683, 121.3256],
  'majayjay-laguna': [14.1436, 121.5161],
};

const CATEGORIES = [
  { id: 'all', label: 'All Facilities', icon: Category2, color: '#6B7280' },
  { id: 'municipal', label: 'Municipal Hall', icon: Buildings, color: '#D97706' },
  { id: 'police', label: 'Police Desk', icon: Shield, color: '#2563EB' },
  { id: 'fire', label: 'Fire & MDRRMO', icon: Flash, color: '#DC2626' },
  { id: 'hospital', label: 'RHU & Health', icon: Health, color: '#059669' },
  { id: 'other', label: 'Tourism & Other', icon: Location, color: '#7C3AED' },
];

export default function TownMapPage() {
  const { activeLgu } = useLgu();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<any | null>(null);

  const lguCenter: [number, number] = useMemo(() => {
    if (activeLgu?.latitude && activeLgu?.longitude) {
      return [Number(activeLgu.latitude), Number(activeLgu.longitude)];
    }
    return LGU_COORDINATES[activeLgu?.id || ''] || [14.1311, 121.4363];
  }, [activeLgu]);

  useEffect(() => {
    async function loadFacilities() {
      if (!activeLgu?.id) return;
      try {
        const { data } = await supabase
          .from('lgu_facilities')
          .select('*')
          .eq('lgu_id', activeLgu.id);

        if (data && data.length > 0) {
          setFacilities(data);
        } else {
          // Comprehensive fallback facilities for all municipalities
          const lguName = activeLgu.name?.replace(/^municipality of\s*/i, '') || 'Liliw';
          const [baseLat, baseLng] = lguCenter;

          setFacilities([
            {
              id: 'f1',
              name: `${lguName} Municipal Town Hall`,
              category: 'municipal',
              address: `Poblacion, ${lguName}, Laguna`,
              phone: '(049) 563-1234',
              schedule: 'Mon–Fri 8:00 AM – 5:00 PM',
              latitude: baseLat,
              longitude: baseLng,
              color: '#D97706',
            },
            {
              id: 'f2',
              name: `Rural Health Unit (RHU ${lguName} Clinic)`,
              category: 'hospital',
              address: `Municipal Health Compound, ${lguName}`,
              phone: '(049) 563-5678',
              schedule: '24/7 Emergency & Outpatient',
              latitude: baseLat + 0.0014,
              longitude: baseLng - 0.0008,
              color: '#059669',
            },
            {
              id: 'f3',
              name: `Philippine National Police (${lguName} Police Station)`,
              category: 'police',
              address: `Public Safety Complex, ${lguName}`,
              phone: '0998-598-5643',
              schedule: '24/7 Emergency Response',
              latitude: baseLat - 0.0006,
              longitude: baseLng + 0.0007,
              color: '#2563EB',
            },
            {
              id: 'f4',
              name: `Bureau of Fire Protection (${lguName} BFP Station)`,
              category: 'fire',
              address: `National Road, ${lguName}`,
              phone: '(049) 563-2211',
              schedule: '24/7 Fire & Rescue Desk',
              latitude: baseLat + 0.0022,
              longitude: baseLng + 0.0015,
              color: '#DC2626',
            },
            {
              id: 'f5',
              name: `${lguName} Parish Church & Historical Plaza`,
              category: 'other',
              address: `Church Plaza, ${lguName}`,
              phone: '(049) 563-1122',
              schedule: 'Daily 6:00 AM – 6:00 PM',
              latitude: baseLat - 0.0012,
              longitude: baseLng + 0.0009,
              color: '#7C3AED',
            },
            {
              id: 'f6',
              name: `${lguName} Public Market & Commercial Complex`,
              category: 'other',
              address: `Market Road, ${lguName}`,
              phone: null,
              schedule: 'Daily 5:00 AM – 7:00 PM',
              latitude: baseLat - 0.0021,
              longitude: baseLng - 0.0018,
              color: '#7C3AED',
            },
          ]);
        }
      } catch (err) {
        console.error('Error loading facilities:', err);
      }
    }
    loadFacilities();
  }, [activeLgu, lguCenter]);

  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchCat =
        selectedCategory === 'all' ||
        f.category === selectedCategory ||
        (f.type && f.type.toLowerCase().includes(selectedCategory));
      const matchSearch =
        !searchQuery.trim() ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.address && f.address.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [facilities, selectedCategory, searchQuery]);

  return (
    <div className="relative h-[calc(100vh-68px)] w-full flex flex-col lg:flex-row bg-bg overflow-hidden">
      {/* Desktop Left Facilities Sidebar (Hidden on Mobile, Visible on Desktop) */}
      <div className="hidden lg:flex w-[380px] xl:w-[420px] h-full flex-col bg-surface dark:bg-card border-r border-theme z-20 shrink-0 shadow-sm transition-colors">
        {/* Header with LGU Name & Search */}
        <div className="p-4 border-b border-theme space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[9px] font-['Octarine-Bold'] uppercase tracking-wider text-accent block leading-none">
                AGAPP MAP EXPLORER
              </span>
              <h2 className="text-sm font-['Octarine-Bold'] text-text-primary mt-1">
                {activeLgu?.name || 'Liliw, Laguna'}
              </h2>
            </div>
            <span className="text-[11px] font-['Inter-Medium'] text-text-muted">
              {filteredFacilities.length} locations
            </span>
          </div>

          <div className="relative">
            <SearchNormal1 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search facilities, clinics, stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-full bg-surface-alt dark:bg-chip border border-theme text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-['Inter-Medium'] transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
              >
                <CloseCircle size={14} />
              </button>
            )}
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1 rounded-full text-[10.5px] font-['Octarine-Bold'] whitespace-nowrap transition-all duration-200 shadow-2xs flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-accent text-accent-contrast'
                      : 'bg-surface-alt dark:bg-chip text-text-muted hover:text-text-primary border border-theme'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Facility Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {filteredFacilities.length === 0 ? (
            <div className="p-8 text-center text-xs text-text-muted">
              No facilities found matching your search.
            </div>
          ) : (
            filteredFacilities.map((fac) => {
              const isSelected = selectedFacility?.id === fac.id;
              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? 'bg-accent/10 border-accent shadow-xs'
                      : 'bg-surface-alt/60 dark:bg-chip/50 border-theme hover:border-accent/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <StatusBadge status={fac.category || fac.type || 'Government Office'} />
                    {fac.phone && (
                      <span className="text-[10px] text-text-muted font-mono">{fac.phone}</span>
                    )}
                  </div>
                  <h4 className="text-xs font-['Octarine-Bold'] text-text-primary mt-1.5 leading-snug">
                    {fac.name}
                  </h4>
                  {fac.address && (
                    <p className="text-[10.5px] text-text-muted font-['Inter-Medium'] flex items-center gap-1 mt-1 truncate">
                      <Location size={11} className="text-accent shrink-0" />
                      <span>{fac.address}</span>
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Main Interactive Map Viewport */}
      <div className="flex-1 h-full relative z-0">
        {/* Mobile Floating Explorer Header (Hidden on Desktop) */}
        <div className="lg:hidden absolute top-3 left-3 right-3 z-[1000] pointer-events-auto max-w-lg mx-auto space-y-2">
          <div className="p-3 sm:p-3.5 rounded-[28px] bg-white/85 dark:bg-[#24211F]/90 backdrop-blur-2xl border border-white/70 dark:border-white/15 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.18)] flex items-center justify-between gap-3 transition-colors">
            <Link
              href="/"
              className="w-8 h-8 rounded-full flex items-center justify-center text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0"
              title="Back to Home"
            >
              <ArrowLeft2 size={18} />
            </Link>

            <div className="flex-1 min-w-0">
              <span className="text-[9px] font-['Octarine-Bold'] uppercase tracking-wider text-accent block leading-none">
                AGAPP MAP
              </span>
              <h2 className="text-xs sm:text-sm font-['Octarine-Bold'] text-text-primary truncate mt-0.5">
                {activeLgu?.name || 'Liliw, Laguna'}
              </h2>
            </div>

            <div className="relative flex-1 max-w-[170px] sm:max-w-[200px]">
              <SearchNormal1 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 rounded-full bg-surface-alt dark:bg-chip border border-theme text-[11px] text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent font-['Inter-Medium']"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                >
                  <CloseCircle size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full no-scrollbar">
            {CATEGORIES.map((c) => {
              const isSelected = selectedCategory === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-['Octarine-Bold'] whitespace-nowrap transition-all duration-200 shadow-sm flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-accent text-accent-contrast scale-105 shadow-md'
                      : 'bg-white/80 dark:bg-[#282422]/85 text-stone-700 dark:text-stone-200 hover:text-black dark:hover:text-white border border-white/60 dark:border-white/15 backdrop-blur-xl'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span>{c.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Map Canvas */}
        <div className="w-full h-full relative z-0">
          <TownMapClient
            center={lguCenter}
            facilities={filteredFacilities}
            selectedFacility={selectedFacility}
            onSelectFacility={(fac) => setSelectedFacility(fac)}
          />
        </div>

        {/* Selected Facility Details Drawer Card */}
        {selectedFacility && (
          <div className="absolute bottom-20 lg:bottom-6 left-4 right-4 lg:left-6 lg:right-auto lg:max-w-md z-[1000] pointer-events-auto max-w-md mx-auto lg:mx-0 animate-fade-in">
          <div className="p-4 sm:p-5 rounded-[32px] bg-white/95 dark:bg-[#252220]/95 backdrop-blur-2xl border border-white/70 dark:border-white/15 shadow-[0_20px_45px_-8px_rgba(0,0,0,0.5)] space-y-3 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <StatusBadge status={selectedFacility.category || selectedFacility.type || 'Government Office'} />
                <h3 className="text-sm sm:text-base font-['Octarine-Bold'] text-text-primary mt-1.5 leading-snug">
                  {selectedFacility.name}
                </h3>
                {selectedFacility.address && (
                  <p className="text-[11px] text-text-muted font-['Inter-Medium'] flex items-center gap-1 mt-0.5">
                    <Location size={12} className="text-accent shrink-0" />
                    <span className="truncate">{selectedFacility.address}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => setSelectedFacility(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-black/5 dark:hover:bg-white/10 transition shrink-0 cursor-pointer"
                aria-label="Close details"
              >
                <CloseCircle size={18} />
              </button>
            </div>

            {selectedFacility.schedule && (
              <div className="flex items-center gap-1.5 text-[11px] text-text-muted bg-surface-alt dark:bg-chip p-2.5 rounded-xl border border-theme">
                <Clock size={13} className="text-emerald-500 shrink-0" />
                <span>{selectedFacility.schedule}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              {selectedFacility.phone && (
                <a
                  href={`tel:${selectedFacility.phone}`}
                  className="flex-1 py-2.5 rounded-full bg-accent text-accent-contrast font-['Octarine-Bold'] text-xs hover:opacity-90 transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Call size={14} variant="Bold" />
                  <span>Call Desk</span>
                </a>
              )}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedFacility.latitude || selectedFacility.lat},${selectedFacility.longitude || selectedFacility.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 rounded-full bg-surface-alt dark:bg-chip text-text-primary border border-theme font-['Octarine-Bold'] text-xs hover:bg-surface transition flex items-center justify-center gap-1.5 shadow-xs"
              >
                <ExportSquare size={14} />
                <span>Directions ↗</span>
              </a>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
