'use client';

import React, { useState, useEffect } from 'react';

interface ColorPaletteSelectorProps {
  primaryColor: string;
  secondaryColor: string;
  iconColor: string;
  darkBgColor: string;
  onChange: (colors: { primaryColor: string; secondaryColor: string; iconColor: string; darkBgColor: string }) => void;
  lguName?: string;
}

const PALETTE_CATEGORIES = ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Pink', 'Grey', 'Custom'];

const PREDEFINED_PALETTES = [
  // Red
  { name: 'Warm Red', primary: '#E63946', secondary: '#F1FAEE', icon: '#E63946', darkBg: '#291012', category: 'Red' },
  { name: 'Crimson Slate', primary: '#D90429', secondary: '#2B2D42', icon: '#EF233C', darkBg: '#1C1316', category: 'Red' },
  { name: 'Terracotta Clay', primary: '#E07A5F', secondary: '#3D405B', icon: '#F2CC8F', darkBg: '#211614', category: 'Red' },
  // Orange
  { name: 'Sunset Glow', primary: '#FB8500', secondary: '#FFB703', icon: '#FFB703', darkBg: '#21150B', category: 'Orange' },
  { name: 'Peach Ember', primary: '#F4A261', secondary: '#E76F51', icon: '#F4A261', darkBg: '#241712', category: 'Orange' },
  { name: 'Desert Sand', primary: '#E09F3E', secondary: '#FFF3B0', icon: '#E09F3E', darkBg: '#1F1B12', category: 'Orange' },
  // Yellow
  { name: 'Canary Gold', primary: '#FFC300', secondary: '#000814', icon: '#FFC300', darkBg: '#0A0800', category: 'Yellow' },
  { name: 'Vintage Ochre', primary: '#E9C46A', secondary: '#264653', icon: '#E9C46A', darkBg: '#1A1813', category: 'Yellow' },
  // Green
  { name: 'Emerald Wave', primary: '#2A9D8F', secondary: '#E9C46A', icon: '#2A9D8F', darkBg: '#101F1C', category: 'Green' },
  { name: 'Mint Forest', primary: '#06D6A0', secondary: '#118AB2', icon: '#00F5D4', darkBg: '#0B251E', category: 'Green' },
  { name: 'Sage Sea', primary: '#83C5BE', secondary: '#006D77', icon: '#83C5BE', darkBg: '#121F1E', category: 'Green' },
  // Blue
  { name: 'Deep Ocean', primary: '#1D3557', secondary: '#457B9D', icon: '#A8DADC', darkBg: '#0F1A2C', category: 'Blue' },
  { name: 'Sky Breeze', primary: '#0077B6', secondary: '#90E0EF', icon: '#00B4D8', darkBg: '#0F1D2C', category: 'Blue' },
  { name: 'Electric Cyan', primary: '#03045E', secondary: '#0077B6', icon: '#00F5D4', darkBg: '#090B1A', category: 'Blue' },
  // Purple
  { name: 'Royal Velvet', primary: '#7209B7', secondary: '#F72585', icon: '#F72585', darkBg: '#140A26', category: 'Purple' },
  { name: 'Cyberpunk Purple', primary: '#8338EC', secondary: '#3A86C8', icon: '#FF007F', darkBg: '#100B21', category: 'Purple' },
  { name: 'Amethyst Night', primary: '#5C3796', secondary: '#8A308B', icon: '#D8B4FE', darkBg: '#161224', category: 'Purple' },
  // Pink
  { name: 'Bubblegum Rose', primary: '#FF758F', secondary: '#FFC4D6', icon: '#FF4D6D', darkBg: '#291015', category: 'Pink' },
  { name: 'Blush Coral', primary: '#E07A5F', secondary: '#F4F1DE', icon: '#FF758F', darkBg: '#241416', category: 'Pink' },
  { name: 'Cotton Candy', primary: '#FF85A1', secondary: '#FBB1BD', icon: '#FF85A1', darkBg: '#29151A', category: 'Pink' },
  // Grey
  { name: 'Charcoal Slate', primary: '#2F3E46', secondary: '#CAD2C5', icon: '#CBD5E0', darkBg: '#1F242E', category: 'Grey' },
  { name: 'Soft Pebble', primary: '#4A5568', secondary: '#EDF2F7', icon: '#CBD5E0', darkBg: '#242936', category: 'Grey' },
];

export function ColorPaletteSelector({
  primaryColor,
  secondaryColor,
  iconColor,
  darkBgColor,
  onChange,
  lguName = 'Municipality',
}: ColorPaletteSelectorProps) {
  const [activeTab, setActiveTab] = useState('Red');
  const [savedPalettes, setSavedPalettes] = useState<any[]>([]);
  const [newPaletteName, setNewPaletteName] = useState('');
  const [isPreviewDark, setIsPreviewDark] = useState(false);

  // Load custom palettes on mount
  useEffect(() => {
    const stored = localStorage.getItem('agapp-custom-palettes');
    if (stored) {
      try {
        setSavedPalettes(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse custom palettes:', e);
      }
    }
  }, []);

  const customPalettes = savedPalettes.map(p => ({ ...p, category: 'Custom' }));
  const allPalettes = [...PREDEFINED_PALETTES, ...customPalettes];
  const filteredPalettes = allPalettes.filter((p) => p.category === activeTab);

  const handleSavePalette = () => {
    if (!newPaletteName.trim()) return;
    const newPalette = {
      name: newPaletteName.trim(),
      primary: primaryColor,
      secondary: secondaryColor,
      icon: iconColor || primaryColor,
      darkBg: darkBgColor || '#292929',
    };
    
    // Prevent duplicate names
    const nextList = [...savedPalettes.filter(p => p.name !== newPalette.name), newPalette];
    setSavedPalettes(nextList);
    localStorage.setItem('agapp-custom-palettes', JSON.stringify(nextList));
    setNewPaletteName('');
  };

  const handleDeletePalette = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextList = savedPalettes.filter(p => p.name !== name);
    setSavedPalettes(nextList);
    localStorage.setItem('agapp-custom-palettes', JSON.stringify(nextList));
  };

  // SVG base64 noise filter for texture
  const noiseBgStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
  };

  return (
    <div className="space-y-4 border border-theme rounded-xl p-4 bg-surface-alt/30">
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
          Predefined Brand Palettes (Coolors & Custom)
        </label>
        <span className="text-[11px] text-text-faint">
          Select a category to apply matching primary, secondary, active icon, and dark mode background colors.
        </span>
      </div>

      {/* Palette Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-theme pb-2.5">
        {PALETTE_CATEGORIES.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-text-primary text-bg'
                : 'bg-surface border border-theme text-text-muted hover:text-text-primary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Palette Items Grid */}
      {filteredPalettes.length === 0 ? (
        <div className="text-center py-6 text-xs text-text-faint bg-surface rounded-xl border border-dashed border-theme">
          No custom palettes saved yet. Enter a name below to save your current configuration!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredPalettes.map((palette) => {
            const isSelected =
              primaryColor.toLowerCase() === palette.primary.toLowerCase() &&
              secondaryColor.toLowerCase() === palette.secondary.toLowerCase() &&
              iconColor.toLowerCase() === palette.icon.toLowerCase() &&
              darkBgColor.toLowerCase() === palette.darkBg.toLowerCase();
            return (
              <button
                key={palette.name}
                type="button"
                onClick={() =>
                  onChange({
                    primaryColor: palette.primary,
                    secondaryColor: palette.secondary,
                    iconColor: palette.icon,
                    darkBgColor: palette.darkBg,
                  })
                }
                className={`p-2.5 rounded-xl border text-left flex flex-col gap-2 relative transition-all ${
                  isSelected
                    ? 'border-accent bg-accent-soft shadow-sm ring-1 ring-accent'
                    : 'border-theme bg-surface hover:border-text-muted'
                }`}
              >
                <span className="text-[11px] font-bold text-text-primary truncate pr-4">{palette.name}</span>
                <div className="flex gap-1.5 items-center">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: palette.primary }}
                    title={`Primary: ${palette.primary}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: palette.secondary }}
                    title={`Secondary: ${palette.secondary}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: palette.icon }}
                    title={`Icon Override: ${palette.icon}`}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    style={{ backgroundColor: palette.darkBg }}
                    title={`Dark BG Override: ${palette.darkBg}`}
                  />
                </div>
                {palette.category === 'Custom' && (
                  <button
                    type="button"
                    onClick={(e) => handleDeletePalette(palette.name, e)}
                    className="absolute top-1.5 right-1.5 text-text-faint hover:text-red-500 font-bold text-xs"
                    title="Delete custom palette"
                  >
                    ✕
                  </button>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Save Custom Palette Form */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2 pb-1">
        <input
          type="text"
          value={newPaletteName}
          onChange={(e) => setNewPaletteName(e.target.value)}
          placeholder="New Palette Name…"
          className="flex-1 px-3 py-1.5 bg-surface border border-theme rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={handleSavePalette}
          disabled={!newPaletteName.trim()}
          className="px-4 py-1.5 rounded-lg bg-text-primary text-bg hover:opacity-90 disabled:opacity-40 transition-opacity text-xs font-bold shrink-0"
        >
          Save Current Config
        </button>
      </div>

      {/* Preview header with Light/Dark mode switcher */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-theme">
        <div className="flex flex-col gap-0.5">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Mobile App Live Preview Mockup
          </label>
          <span className="text-[10px] text-text-faint">
            View active icons in custom colors and dark backgrounds simulated on iOS/Android.
          </span>
        </div>
        <div className="flex gap-1 bg-surface border border-theme rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setIsPreviewDark(false)}
            className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
              !isPreviewDark ? 'bg-text-primary text-bg' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Light
          </button>
          <button
            type="button"
            onClick={() => setIsPreviewDark(true)}
            className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
              isPreviewDark ? 'bg-text-primary text-bg' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            Dark
          </button>
        </div>
      </div>

      {/* Phone Frame Wrap Container */}
      <div className="flex justify-center py-4 bg-surface-alt/20 rounded-2xl border border-theme">
        {/* Bezel frame of simulated Phone */}
        <div className="w-[260px] h-[450px] bg-black rounded-[42px] p-2.5 shadow-2xl relative border-4 border-[#333333]">
          
          {/* Dynamic screen area */}
          <div
            className="w-full h-full rounded-[32px] overflow-hidden flex flex-col justify-between relative transition-all duration-300 select-none"
            style={{
              backgroundColor: isPreviewDark ? (darkBgColor || '#292929') : '#fffcf5',
              color: isPreviewDark ? '#fffcf5' : '#292929',
            }}
          >
            {/* Simulated Phone Status Bar */}
            <div className="h-6 w-full flex justify-between items-center px-5 text-[9px] font-bold tracking-tight z-20 opacity-75">
              <span>9:41</span>
              {/* Dynamic status indicators */}
              <div className="flex items-center gap-1">
                <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c3.9 3.89 10.21 3.89 14.1 0l1.38-1.79C21.26 16.07 22 14.12 22 12c0-4.97-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-1-10h2v4h-2zm0 6h2v2h-2z" />
                </svg>
                <div className="w-4 h-2 border border-current rounded-sm p-0.5 flex items-center">
                  <div className="w-full h-full bg-current rounded-xs" />
                </div>
              </div>
            </div>

            {/* Mobile Viewport Main Page Content */}
            <div className="flex-1 flex flex-col p-3.5 gap-3 overflow-hidden">
              
              {/* Mock App Header */}
              <div className="flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-xs font-bold tracking-tight">agapp</span>
                </div>
                {/* Active Notification Indicator */}
                <div className="relative">
                  <svg className="w-4 h-4 text-text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                </div>
              </div>

              {/* Mobile Noise Gradient Banner */}
              <div
                className="relative h-28 rounded-2xl overflow-hidden flex flex-col justify-between p-3 text-white transition-all duration-300 shadow-sm shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${primaryColor || '#E63946'}, ${secondaryColor || '#F1FAEE'})`,
                }}
              >
                {/* Noise filter overlay */}
                <div
                  className="absolute inset-0 opacity-[0.08] pointer-events-none select-none mix-blend-overlay"
                  style={noiseBgStyle}
                />

                <div className="flex justify-between items-start z-10">
                  <div>
                    <span className="text-[7px] font-mono tracking-[0.2em] uppercase opacity-75">
                      Citizen Portal
                    </span>
                    <h4 className="display-font font-serif italic text-sm tracking-tight leading-tight mt-0.5">
                      Discover {lguName}
                    </h4>
                  </div>
                  <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm border border-white/25 flex items-center justify-center">
                    <span className="text-[6px] font-bold">LGU</span>
                  </div>
                </div>

                <div className="flex justify-between items-end z-10">
                  <span className="text-[7px] font-mono opacity-70">Liliw, Laguna</span>
                  <div
                    className="px-2.5 py-1 rounded-md text-[7px] font-bold shadow-sm transition-transform cursor-pointer"
                    style={{ backgroundColor: isPreviewDark ? '#ffffff' : '#000000', color: isPreviewDark ? '#000000' : '#ffffff' }}
                  >
                    Quick Services
                  </div>
                </div>
              </div>

              {/* Simulated Card widgets */}
              <div className="space-y-2 overflow-hidden flex-1">
                {/* Card 1 */}
                <div
                  className="rounded-xl p-2.5 border text-left flex flex-col gap-1 transition-colors"
                  style={{
                    backgroundColor: isPreviewDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isPreviewDark ? '#3d3d3d' : '#e5e2d9',
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[6px] uppercase font-bold tracking-wider opacity-60">Citizen Alert</span>
                    <span className="text-[6px] font-mono opacity-50">Just now</span>
                  </div>
                  <h5 className="text-[9px] font-bold leading-tight">Cluttered Canal Overflow</h5>
                  <p className="text-[8px] opacity-60 leading-normal line-clamp-1">
                    Emergency response node dispatched in Barangay Kanluran.
                  </p>
                </div>

                {/* Card 2 */}
                <div
                  className="rounded-xl p-2.5 border text-left flex flex-col gap-1 transition-colors"
                  style={{
                    backgroundColor: isPreviewDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
                    borderColor: isPreviewDark ? '#3d3d3d' : '#e5e2d9',
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[6px] uppercase font-bold tracking-wider opacity-60">Forum Activity</span>
                    <span className="text-[6px] font-mono opacity-50">3m ago</span>
                  </div>
                  <h5 className="text-[9px] font-bold leading-tight">Community Meeting Schedule</h5>
                  <div className="flex items-center gap-1 pt-0.5">
                    <span className="w-1 h-1 rounded-full" style={{ backgroundColor: primaryColor }} />
                    <span className="text-[8px] font-medium opacity-70">24 Citizen attendees</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Simulated Phone Navigation Tab Bar */}
            <div
              className="h-12 w-full border-t flex justify-around items-center px-4 select-none shrink-0"
              style={{
                backgroundColor: isPreviewDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
                borderColor: isPreviewDark ? '#3d3d3d' : '#e5e2d9',
              }}
            >
              {/* Tab 1 (Active) */}
              <div className="flex flex-col items-center gap-0.5 cursor-pointer">
                {/* Active Tab Icon using custom Icon Color */}
                <svg className="w-4 h-4 transition-colors" viewBox="0 0 24 24" fill={iconColor || primaryColor}>
                  <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
                </svg>
                <span className="text-[7px] font-bold" style={{ color: iconColor || primaryColor }}>Home</span>
                {/* Active indicator dot */}
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: iconColor || primaryColor }} />
              </div>

              {/* Tab 2 */}
              <div className="flex flex-col items-center gap-0.5 cursor-pointer opacity-50 hover:opacity-80">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <span className="text-[7px] font-semibold">Services</span>
              </div>

              {/* Tab 3 */}
              <div className="flex flex-col items-center gap-0.5 cursor-pointer opacity-50 hover:opacity-80">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                </svg>
                <span className="text-[7px] font-semibold">Profile</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
