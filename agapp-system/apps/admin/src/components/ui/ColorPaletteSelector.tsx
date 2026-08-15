'use client';

import React, { useState, useEffect } from 'react';
import { Home, Briefcase, Danger, Scroll, DocumentText, Messages, Map, Call, TrendUp, User, ArrowUp2, ArrowDown2, TickCircle, Colorfilter } from 'iconsax-react';

interface ColorPaletteSelectorProps {
  primaryColor: string;
  secondaryColor: string;
  iconColor: string;
  darkBgColor: string;
  onChange: (colors: { primaryColor: string; secondaryColor: string; iconColor: string; darkBgColor: string }) => void;
  lguName?: string;
  sideBySide?: boolean;
  activeMode?: 'light' | 'dark';
  onModeChange?: (mode: 'light' | 'dark') => void;
}

function softenColor(hex: string, amount = 0.45): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) || 0;
  const g = parseInt(clean.slice(2, 4), 16) || 0;
  const b = parseInt(clean.slice(4, 6), 16) || 0;
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `#${[mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function lightenForDark(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (luminance >= 0.72) return hex;
  const target = 0.80;
  const mix = Math.min(1, (target - luminance) / (1 - luminance + 0.001));
  const lift = (c: number) => Math.round(c + (255 - c) * mix);
  return `#${[lift(r), lift(g), lift(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

function contrastColor(hex: string): '#292929' | '#FFFCF5' {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#292929';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#292929' : '#FFFCF5';
}

const PALETTE_CATEGORIES = ['All', 'Popular', 'Purple & Yellow', 'Cool & Clean', 'Warm & Sunset', 'Nature & Sage', 'Vibrant & Modern'];

export interface BrandCombo {
  num: number;
  name: string;
  tags: string;
  category: string;
  primary: string;
  secondary: string;
  icon: string;
  darkBg: string;
  c5: string;
}

// 24 Vibrant Palette Combos — Avoids near-black or dark primary colors
const PREDEFINED_PALETTES: BrandCombo[] = [
  { num: 1, name: 'DUSK', tags: 'Calm • Warm • Sophisticated', category: 'Popular', primary: '#42426F', secondary: '#6D5BA6', icon: '#9B72CF', darkBg: '#1E1B4B', c5: '#FFD6C9' },
  { num: 2, name: 'SAGE', tags: 'Fresh • Natural • Balanced', category: 'Nature & Sage', primary: '#386641', secondary: '#527F5B', icon: '#6A994E', darkBg: '#1C3124', c5: '#DCEAD9' },
  { num: 3, name: 'OCEAN', tags: 'Cool • Clean • Refreshing', category: 'Cool & Clean', primary: '#1B4965', secondary: '#29ADB2', icon: '#0077B6', darkBg: '#0F2B48', c5: '#A8DADC' },
  { num: 4, name: 'SUNSET', tags: 'Vibrant • Energetic • Friendly', category: 'Warm & Sunset', primary: '#E94F37', secondary: '#F9844A', icon: '#F9C74F', darkBg: '#3B170B', c5: '#FDD9B5' },
  { num: 5, name: 'LAVENDER', tags: 'Soft • Dreamy • Elegant', category: 'Popular', primary: '#5E4B8B', secondary: '#7D6CC4', icon: '#9D4EDD', darkBg: '#211244', c5: '#E7D6F7' },
  { num: 6, name: 'MUSTARD', tags: 'Bold • Modern • Playful', category: 'Warm & Sunset', primary: '#D4A017', secondary: '#F0C94C', icon: '#E5A91A', darkBg: '#302404', c5: '#F7E7B5' },
  { num: 7, name: 'TEAL/GRAY', tags: 'Minimal • Calm • Professional', category: 'Cool & Clean', primary: '#455A64', secondary: '#80CBC4', icon: '#00897B', darkBg: '#1C282C', c5: '#CFD8DC' },
  { num: 8, name: 'BERRY', tags: 'Rich • Bold • Luxurious', category: 'Popular', primary: '#90174D', secondary: '#E3356A', icon: '#F72585', darkBg: '#3D0521', c5: '#F7A1B3' },
  
  // Specific requested variation: LAVENDER FIELDS (Purple & Yellow combination!)
  { num: 9, name: 'LAVENDER FIELDS', tags: 'Purple & Yellow • Dual Complementary • Vibrant', category: 'Purple & Yellow', primary: '#7B2CBF', secondary: '#FFD166', icon: '#9D4EDD', darkBg: '#2E104D', c5: '#FFF3BF' },
  { num: 10, name: 'LAVENDER GOLD', tags: 'Purple & Gold • Regal • Warm Accent', category: 'Purple & Yellow', primary: '#5A189A', secondary: '#FFB703', icon: '#9D4EDD', darkBg: '#240645', c5: '#FFE29A' },
  { num: 11, name: 'VIOLET SUNSHINE', tags: 'Deep Violet • Canary Yellow • Lively', category: 'Purple & Yellow', primary: '#7B2CBF', secondary: '#FFC300', icon: '#9D4EDD', darkBg: '#33085A', c5: '#FFF0AA' },
  { num: 12, name: 'PURPLE HONEY', tags: 'Soft Lavender • Amber Gold • Harmonious', category: 'Purple & Yellow', primary: '#9D4EDD', secondary: '#FFB703', icon: '#C77DFF', darkBg: '#3E0A66', c5: '#FFF6CC' },

  // Additional Variations
  { num: 13, name: 'MIDNIGHT NEON', tags: 'Cyber • Electric • Neon Violet', category: 'Vibrant & Modern', primary: '#6D28D9', secondary: '#8338EC', icon: '#FF007F', darkBg: '#2E1065', c5: '#00F5D4' },
  { num: 14, name: 'GOLDEN HARVEST', tags: 'Warm • Earthy • Amber Gold', category: 'Warm & Sunset', primary: '#D97706', secondary: '#E9C46A', icon: '#F7B801', darkBg: '#451A03', c5: '#FFF8E7' },
  { num: 15, name: 'EMERALD COAST', tags: 'Lush • Tropical • Emerald Teal', category: 'Nature & Sage', primary: '#059669', secondary: '#06D6A0', icon: '#2A9D8F', darkBg: '#064E3B', c5: '#E8FDF8' },
  { num: 16, name: 'ROYAL VELVET', tags: 'Regal • Purple • Violet Accent', category: 'Popular', primary: '#7C3AED', secondary: '#5C3796', icon: '#7209B7', darkBg: '#3B0764', c5: '#F3E8FF' },
  { num: 17, name: 'AUTUMN AMBER', tags: 'Warm • Coziness • Terracotta Orange', category: 'Warm & Sunset', primary: '#EA580C', secondary: '#FF6B35', icon: '#F4A261', darkBg: '#451A03', c5: '#FFF5EE' },
  { num: 18, name: 'CYBERPUNK GLOW', tags: 'Futuristic • Royal Blue • Cyan', category: 'Vibrant & Modern', primary: '#2563EB', secondary: '#0077B6', icon: '#00F5D4', darkBg: '#1E1B4B', c5: '#E6FFFF' },
  { num: 19, name: 'CORAL REEF', tags: 'Bright • Rose Pink • Coral Accent', category: 'Warm & Sunset', primary: '#E11D48', secondary: '#FF4D6D', icon: '#FF758F', darkBg: '#4C0519', c5: '#FFF0F3' },
  { num: 20, name: 'ARCTIC FROST', tags: 'Crisp • Sky Blue • Glacier Tint', category: 'Cool & Clean', primary: '#0284C7', secondary: '#0EA5E9', icon: '#38BDF8', darkBg: '#0C4A6E', c5: '#F0F9FF' },
  { num: 21, name: 'DEEP FOREST', tags: 'Organic • Emerald Green • Moss', category: 'Nature & Sage', primary: '#166534', secondary: '#3A5A40', icon: '#588157', darkBg: '#052E16', c5: '#F4F7F4' },
  { num: 22, name: 'COFFEE & CREAM', tags: 'Classic • Rich Bronze • Warm Beige', category: 'Warm & Sunset', primary: '#78350F', secondary: '#9A3412', icon: '#D4A373', darkBg: '#451A03', c5: '#FFFDF9' },
  { num: 23, name: 'CHERRY BLOSSOM', tags: 'Floral • Crimson • Soft Rose', category: 'Popular', primary: '#D90429', secondary: '#F72585', icon: '#FF758F', darkBg: '#4C0519', c5: '#FFF0F5' },
  { num: 24, name: 'ELECTRIC CYAN', tags: 'High Voltage • Blue • Cyan Glow', category: 'Cool & Clean', primary: '#0284C7', secondary: '#0077B6', icon: '#00F5D4', darkBg: '#0C4A6E', c5: '#E6F9FF' },
];

type IconVariant = 'Linear' | 'Outline' | 'Broken' | 'Bold' | 'Bulk' | 'TwoTone';
type PreviewGlyph = { label: string; Icon?: React.ComponentType<{ size?: string | number; color?: string; variant?: IconVariant }> };

const PREVIEW_QUICK_ACTIONS: PreviewGlyph[] = [
  { label: 'E-Services', Icon: Briefcase },
  { label: 'Report', Icon: Danger },
  { label: 'Citizen Guide', Icon: Scroll },
  { label: 'News', Icon: DocumentText },
  { label: 'Forum', Icon: Messages },
  { label: 'Chatbot' },
  { label: 'Explore', Icon: Map },
  { label: 'Emergency', Icon: Call },
];

const PREVIEW_NAV_TABS: PreviewGlyph[] = [
  { label: 'Home', Icon: Home },
  { label: 'Services', Icon: Briefcase },
  { label: 'Report', Icon: TrendUp },
  { label: 'Forum', Icon: Messages },
  { label: 'Profile', Icon: User },
];

function ChatboxGlyph({ size = 16, color = '#000' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M20 2H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h3v3.5a.5.5 0 0 0 .8.4L13 19h7a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"
        fill={color}
      />
      <circle cx="8" cy="10.5" r="1.4" fill={color === '#FFFCF5' ? '#292929' : '#FFFCF5'} />
      <circle cx="12" cy="10.5" r="1.4" fill={color === '#FFFCF5' ? '#292929' : '#FFFCF5'} />
      <circle cx="16" cy="10.5" r="1.4" fill={color === '#FFFCF5' ? '#292929' : '#FFFCF5'} />
    </svg>
  );
}

export function ColorPaletteSelector({
  primaryColor,
  secondaryColor,
  iconColor,
  darkBgColor,
  onChange,
  lguName = 'Municipality',
  sideBySide = false,
  activeMode,
  onModeChange,
}: ColorPaletteSelectorProps) {
  const [activeTab, setActiveTab] = useState('All');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [internalPreviewDark, setInternalPreviewDark] = useState(false);

  const isPreviewDark = activeMode ? activeMode === 'dark' : internalPreviewDark;
  const setIsPreviewDark = (dark: boolean) => {
    setInternalPreviewDark(dark);
    if (onModeChange) {
      onModeChange(dark ? 'dark' : 'light');
    }
  };

  const filteredPalettes = activeTab === 'All' ? PREDEFINED_PALETTES : PREDEFINED_PALETTES.filter((p) => p.category === activeTab);

  const previewPrimary = primaryColor || '#42426F';
  const previewIconAccentRaw = iconColor || previewPrimary;
  // Mirror the same auto-brightening logic from ThemeContext: in dark mode lift
  // the icon accent so it reads clearly against the dark background.
  const previewIconAccent = isPreviewDark ? lightenForDark(previewIconAccentRaw) : previewIconAccentRaw;
  const previewBg = isPreviewDark ? (darkBgColor || '#1E1B4B') : '#FFFCF5';
  const previewSoftenAmount = isPreviewDark ? 0.3 : 0.45;
  const previewPillColor = softenColor(previewPrimary, previewSoftenAmount);
  const rawPillIconColor = secondaryColor && secondaryColor !== '#ffffff' ? secondaryColor : contrastColor(previewPillColor);
  const previewPillIconColor = !isPreviewDark ? lightenForDark(rawPillIconColor) : rawPillIconColor;
  const washTopAlpha = isPreviewDark ? '33' : '4D';
  const washMidAlpha = isPreviewDark ? '21' : '29';
  const washLowAlpha = isPreviewDark ? '12' : '14';
  const previewWash = `linear-gradient(to bottom left, ${previewPrimary}${washTopAlpha} 0%, ${previewPrimary}${washMidAlpha} 40%, ${previewPrimary}${washLowAlpha} 75%, ${previewBg} 100%)`;

  return (
    <div className={sideBySide ? "flex flex-col xl:flex-row gap-6" : "space-y-6"}>
      {/* Left/Main portion: Palettes Selection Cards */}
      <div className={sideBySide ? "flex-1 min-w-0 space-y-4" : "space-y-4"}>
        {/* Header & Collapsible Action */}
        <div className="flex items-center justify-between p-4 bg-surface border border-theme rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent font-bold text-sm">
              <Colorfilter variant="Bold" className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-text-primary uppercase tracking-wider">
                Brand Palette Combos ({PREDEFINED_PALETTES.length})
              </h4>
              <p className="text-xs text-text-muted">
                {isCollapsed ? 'Palette view is hidden (collapsed)' : 'Vibrant, chromatic color combinations without dark tones'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-accent hover:bg-accent/10 rounded-xl transition-colors border border-accent/20"
          >
            {isCollapsed ? (
              <>
                <ArrowDown2 className="w-4 h-4" />
                <span>Expand Combos ({PREDEFINED_PALETTES.length})</span>
              </>
            ) : (
              <>
                <ArrowUp2 className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>

        {/* Collapsed State Strip */}
        {isCollapsed ? (
          <div className="p-4 bg-surface border border-theme rounded-2xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-text-muted">Active Theme:</span>
              <div className="flex items-center gap-1.5 p-1.5 bg-surface-alt border border-theme rounded-xl">
                <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: primaryColor }} title={`Primary: ${primaryColor}`} />
                <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: secondaryColor }} title={`Secondary: ${secondaryColor}`} />
                <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: iconColor }} title={`Icon: ${iconColor}`} />
                <div className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: darkBgColor }} title={`Dark BG: ${darkBgColor}`} />
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-text-primary">{primaryColor}</span>
          </div>
        ) : (
          <>
            {/* Category Filter Tabs */}
            <div className="flex flex-wrap gap-1.5 border-b border-theme pb-2.5">
              {PALETTE_CATEGORIES.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-text-primary text-bg shadow-xs'
                      : 'bg-surface border border-theme text-text-muted hover:text-text-primary'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* List of Palette Cards matching the photo format */}
            <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
              {filteredPalettes.map((p) => {
                const isSelected =
                  primaryColor.toLowerCase() === p.primary.toLowerCase() &&
                  secondaryColor.toLowerCase() === p.secondary.toLowerCase() &&
                  iconColor.toLowerCase() === p.icon.toLowerCase() &&
                  darkBgColor.toLowerCase() === p.darkBg.toLowerCase();

                // Colorful 5-swatch layout: Primary, Secondary, Icon, Accent Light, Dark Mode BG
                const swatches = [
                  { label: 'Primary Accent', hex: p.primary },
                  { label: 'Secondary Accent', hex: p.secondary },
                  { label: 'Icon Highlight', hex: p.icon },
                  { label: 'Soft Tint', hex: p.c5 },
                  { label: 'Dark Mode BG', hex: p.darkBg },
                ];

                return (
                  <div
                    key={p.num}
                    onClick={() =>
                      onChange({
                        primaryColor: p.primary,
                        secondaryColor: p.secondary,
                        iconColor: p.icon,
                        darkBgColor: p.darkBg,
                      })
                    }
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 shadow-sm hover:shadow-md ${
                      isSelected
                        ? 'border-accent bg-accent/10 ring-2 ring-accent'
                        : 'border-theme bg-surface hover:border-accent/40'
                    }`}
                  >
                    {/* Left title section - Fixed width to ensure right swatches align perfectly vertically */}
                    <div className="flex items-center gap-3 w-48 sm:w-56 shrink-0 min-w-0">
                      <div
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: p.primary }}
                      >
                        {p.num}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-extrabold text-xs sm:text-sm tracking-wider text-text-primary uppercase truncate">
                            {p.name}
                          </h4>
                          {isSelected && (
                            <span className="bg-accent text-accent-contrast text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs shrink-0">
                              <TickCircle className="w-3 h-3" variant="Bold" />
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] sm:text-[11px] text-text-muted mt-0.5 truncate">{p.tags}</p>
                      </div>
                    </div>

                    {/* Right Color Blocks section - Aligned & non-black swatches */}
                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      {swatches.map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-0.5 w-[38px] sm:w-[44px]">
                          <div
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-black/10 shadow-sm transition-transform hover:scale-105"
                            style={{ backgroundColor: s.hex }}
                            title={`${s.label}: ${s.hex}`}
                          />
                          <span className="text-[9px] sm:text-[10px] font-mono text-text-muted uppercase font-semibold text-center truncate w-full">
                            {s.hex.replace('#', '')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Right portion: Live Phone Preview Mockup */}
      <div className={sideBySide ? "w-full xl:w-[260px] shrink-0 flex flex-col items-center gap-3" : "space-y-4"}>
        <div className="flex justify-between items-center w-full">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Mobile App Live Preview
            </label>
            <span className="text-[10px] text-text-faint">
              Simulated iOS/Android display
            </span>
          </div>
          <div className="flex gap-1 bg-surface border border-theme rounded-lg p-0.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsPreviewDark(false)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                !isPreviewDark ? 'bg-text-primary text-bg' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewDark(true)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                isPreviewDark ? 'bg-text-primary text-bg' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* ── Phone Shell ─────────────────────────────────────────── */}
        <div
          className="relative w-[220px] rounded-[32px] border-[6px] border-neutral-800 shadow-2xl overflow-hidden flex flex-col select-none"
          style={{
            height: '460px',
            backgroundColor: previewBg,
            transition: 'background-color 0.3s',
          }}
        >
          {/* Gradient wash — exactly mirrors ScreenBackground.tsx */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{ background: previewWash }}
          />

          {/* ── Status Bar ── */}
          <div className="relative z-10 pt-2.5 px-4 flex justify-between items-center">
            <span className="text-[9px] font-bold font-mono" style={{ color: isPreviewDark ? '#FFFCF5' : '#292929' }}>
              9:41
            </span>
            {/* Dynamic Island */}
            <div className="w-12 h-2.5 bg-neutral-900 rounded-full" />
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: isPreviewDark ? '#FFFCF5aa' : '#29292988' }} />
          </div>

          {/* ── "For you | Community" Tab Header ── */}
          <div className="relative z-10 flex justify-center gap-5 pt-1 pb-0.5 px-4">
            <span className="text-[10px] font-extrabold" style={{ color: isPreviewDark ? '#FFFCF5' : '#292929' }}>
              For you
            </span>
            <span className="text-[10px] font-extrabold" style={{ color: isPreviewDark ? '#A19E97' : '#8A8781' }}>
              Community
            </span>
          </div>

          {/* ── Search Bar + Bell ── */}
          <div className="relative z-10 flex items-center gap-2 px-3 pt-1.5 pb-1">
            <div
              className="flex-1 flex items-center gap-1.5 rounded-full h-7 px-2.5"
              style={{
                backgroundColor: isPreviewDark ? '#333333' : '#FFFDF7',
                border: `1px solid ${isPreviewDark ? '#3D3D3D' : '#E9E4DA'}`,
              }}
            >
              {/* Search icon */}
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
                <circle cx="11" cy="11" r="7" stroke={isPreviewDark ? '#A19E97' : '#8A8781'} strokeWidth="2.5"/>
                <line x1="16.5" y1="16.5" x2="21" y2="21" stroke={isPreviewDark ? '#A19E97' : '#8A8781'} strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <span className="text-[7px]" style={{ color: isPreviewDark ? '#A19E97' : '#8A8781' }}>Search services, news...</span>
            </div>
            {/* Bell with accent dot */}
            <div className="relative">
              <svg width="14" height="14" viewBox="0 0 24 24" fill={isPreviewDark ? '#FFFCF5' : '#292929'}>
                <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
              </svg>
              <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: previewPrimary }} />
            </div>
          </div>

          {/* ── Scrollable Content ── */}
          <div className="relative z-10 flex-1 overflow-hidden px-3">
            {/* Advisory Banner */}
            <div
              className="flex items-center justify-between rounded-xl px-2 py-1 mb-1.5"
              style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA' }}
            >
              <div className="flex items-center gap-1 flex-1">
                <span className="text-[6px] font-bold px-1 py-0.5 rounded text-white uppercase" style={{ backgroundColor: '#EF4444' }}>
                  Advisory!
                </span>
                <span className="text-[6px]" style={{ color: '#991B1B' }}>An official advisory has been posted.</span>
              </div>
              <span className="text-[8px] font-bold" style={{ color: '#EF4444' }}>→</span>
            </div>

            {/* Location text + greeting + LGU seal row */}
            <div className="mb-1">
              <span className="text-[6px]" style={{ color: isPreviewDark ? '#A19E97' : '#8A8781' }}>
                Poblacion · {lguName || 'Municipality'} · Sun, Jul 26
              </span>
              <div className="flex items-center justify-between mt-0.5">
                <div>
                  <div className="text-[11px] font-extrabold leading-tight" style={{ color: isPreviewDark ? '#FFFCF5' : '#292929' }}>
                    Magandang Hapon,
                  </div>
                  <div className="text-[11px] font-extrabold leading-tight" style={{ color: isPreviewDark ? '#FFFCF5' : '#292929' }}>
                    Citizen!
                  </div>
                </div>
                {/* LGU Seal circle */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[7px] font-bold shrink-0 border"
                  style={{
                    backgroundColor: previewPrimary,
                    color: contrastColor(previewPrimary),
                    borderColor: isPreviewDark ? '#3D3D3D' : '#E9E4DA',
                  }}
                >
                  LGU
                </div>
              </div>
            </div>

            {/* ── Quick Actions Card ── exact match to HomeScreen */}
            <div
              className="rounded-[18px] p-2.5 mb-1.5"
              style={{
                backgroundColor: isPreviewDark ? '#333333' : '#FFFDF7',
                border: `1px solid ${isPreviewDark ? '#3D3D3D' : '#E9E4DA'}`,
              }}
            >
              <div className="text-[7px] font-bold mb-1.5 pl-0.5" style={{ color: isPreviewDark ? '#FFFCF5' : '#292929' }}>
                What would you like to do?
              </div>
              <div className="grid grid-cols-4 gap-1">
                {PREVIEW_QUICK_ACTIONS.map(({ label, Icon }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    {/* Tile — exact same colors/border-radius as mobile (borderRadius:20, dark:'#3A3A33', light:'#FFFFFF') */}
                    <div
                      className="w-9 h-9 rounded-[11px] flex items-center justify-center"
                      style={{
                        backgroundColor: isPreviewDark ? '#3A3A33' : '#FFFFFF',
                        border: `1px solid ${isPreviewDark ? '#3D3D3D' : '#E9E4DA'}`,
                      }}
                    >
                      {Icon
                        ? <Icon size={18} color={isPreviewDark ? previewPillColor : previewIconAccent} variant="Bold" />
                        : <ChatboxGlyph size={18} color={isPreviewDark ? previewPillColor : previewIconAccent} />}
                    </div>
                    <span className="text-[5.5px] text-center leading-tight" style={{ color: isPreviewDark ? '#FFFCF5' : '#292929' }}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Featured label */}
            <div className="text-[8px] font-extrabold" style={{ color: isPreviewDark ? '#FFFCF5' : '#292929' }}>
              Featured
            </div>
          </div>

          {/* ── Floating Pill Tab Bar ── exact match to FloatingTabBar in AppNavigator.tsx */}
          <div className="relative z-10 px-2 pb-2 pt-1">
            <div
              className="rounded-full flex justify-around items-center relative overflow-hidden"
              style={{
                backgroundColor: isPreviewDark ? '#333333' : '#FFFDF7',
                border: `1px solid ${isPreviewDark ? '#3D3D3D' : '#E9E4DA'}`,
                height: '34px',
              }}
            >
              {PREVIEW_NAV_TABS.map(({ label, Icon }, i) => {
                const isActive = i === 0;
                return (
                  <div
                    key={label}
                    className="flex-1 flex items-center justify-center gap-0.5 h-full px-1"
                    style={{
                      backgroundColor: isActive ? previewPillColor : 'transparent',
                      borderRadius: isActive ? '999px' : '0',
                    }}
                  >
                    {Icon && (
                      <Icon
                        size={13}
                        color={isActive ? previewPillIconColor : (isPreviewDark ? '#A19E97' : '#8A8781')}
                        variant={isActive ? 'Bold' : 'Linear'}
                      />
                    )}
                    {isActive && (
                      <span className="text-[7px] font-bold" style={{ color: previewPillIconColor }}>
                        {label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
