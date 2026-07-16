'use client';

import React, { useState, useEffect } from 'react';
// Real Iconsax icons — same family/names as mobile's iconsax-react-native
// (Sidebar.tsx already imports this package successfully in this same
// Next.js build, confirmed before using it here). Using the actual bold
// glyphs instead of generic outline placeholders so the preview's icon
// SHAPE is accurate, not just its color.
import { Home, Briefcase, Danger, Scroll, DocumentText, Messages, Map, Call, TrendUp, User } from 'iconsax-react';

interface ColorPaletteSelectorProps {
  primaryColor: string;
  secondaryColor: string;
  iconColor: string;
  darkBgColor: string;
  onChange: (colors: { primaryColor: string; secondaryColor: string; iconColor: string; darkBgColor: string }) => void;
  lguName?: string;
  sideBySide?: boolean;
}

// Reimplementation of packages/shared/src/theme.ts's softenColor/contrastColor —
// copied verbatim (same math) rather than imported, because @agapp/shared's
// barrel pulls in react-native (ThemeContext.tsx -> AsyncStorage, theme.ts ->
// StyleSheet) at module scope, which would risk breaking this Next.js/webpack
// build. Keep these in sync by hand if the mobile formulas ever change.

// Blends any hex color toward white by `amount` (0-1) — same "soft pill" fill
// mobile derives for the active tab bar indicator (T.accentSoft).
function softenColor(hex: string, amount = 0.45): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `#${[mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

// Picks ink or cream depending on how light/dark `hex` itself is — same
// relative-luminance formula mobile uses to pick text/icon color drawn on
// top of an accent fill (T.onAccentSoft).
function contrastColor(hex: string): '#292929' | '#FFFCF5' {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#292929';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#292929' : '#FFFCF5';
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

// The real icons + labels HomeScreen.tsx's quick-action grid and
// AppNavigator.tsx's floating tab bar actually use (verified against the
// live mobile code, not approximated) — rendered with `variant="Bold"` to
// match mobile's filled/bold Iconsax style, not an outline placeholder.
// "Chatbot" is the one exception: mobile uses Ionicons "chatbox-ellipses"
// (no iconsax equivalent existed for that exact glyph), so it stays a
// hand-drawn shape here too, but filled solid now instead of stroked.
type IconVariant = 'Linear' | 'Outline' | 'Broken' | 'Bold' | 'Bulk' | 'TwoTone';
type PreviewGlyph = { label: string; Icon?: React.ComponentType<{ size?: string | number; color?: string; variant?: IconVariant }> };

const PREVIEW_QUICK_ACTIONS: PreviewGlyph[] = [
  { label: 'E-Services', Icon: Briefcase },
  { label: 'Report', Icon: Danger },
  { label: 'Citizen Guide', Icon: Scroll },
  { label: 'News', Icon: DocumentText },
  { label: 'Forum', Icon: Messages },
  { label: 'Chatbot' }, // hand-drawn filled bubble below, no iconsax match
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

// Filled speech-bubble-with-dots for the one non-iconsax glyph (Chatbot).
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

  // Derived preview values — reproduces the exact mobile color logic
  // (HomeScreen.tsx's T.iconAccent, AppNavigator.tsx's T.accentSoft /
  // T.onAccentSoft) so this preview honestly predicts what mobile will show.
  const previewPrimary = primaryColor || '#A2B59F';
  const previewIconAccent = iconColor || previewPrimary;
  const previewBg = isPreviewDark ? (darkBgColor || '#292929') : '#FFFCF5';
  const previewSoftenAmount = isPreviewDark ? 0.3 : 0.45;
  const previewPillColor = softenColor(previewPrimary, previewSoftenAmount);
  const previewPillIconColor = contrastColor(previewPillColor);
  // Same diagonal accent wash apps/mobile/src/components/ScreenBackground.tsx
  // paints behind every tab screen — per the brand mockup (HOME PAGE V3.png /
  // HOME PAGE DARKMODE.png) the tint carries almost the full screen height,
  // only settling into the flat base bg right near the bottom edge, not a
  // small corner glow that flattens out early.
  const washTopAlpha = isPreviewDark ? '33' : '4D';
  const washMidAlpha = isPreviewDark ? '21' : '29';
  const washLowAlpha = isPreviewDark ? '12' : '14';
  const previewWash = `linear-gradient(to bottom left, ${previewPrimary}${washTopAlpha} 0%, ${previewPrimary}${washMidAlpha} 40%, ${previewPrimary}${washLowAlpha} 75%, ${previewBg} 100%)`;

  const innerContent = (
    <>
      {/* Left/Main portion: Palettes Selection */}
      <div className={sideBySide ? "lg:col-span-7 space-y-4" : "space-y-4"}>
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
      </div>

      {/* Right portion: Live Phone Preview Mockup */}
      <div className={sideBySide ? "lg:col-span-5 flex flex-col justify-between space-y-4 lg:space-y-0" : "space-y-4"}>
        {/* Preview header with Light/Dark mode switcher */}
        <div className="flex justify-between items-center pt-2">
          <div className="flex flex-col gap-0.5">
            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Mobile App Live Preview
            </label>
            <span className="text-[10px] text-text-faint">
              Simulated iOS/Android display
            </span>
          </div>
          <div className="flex gap-1 bg-surface border border-theme rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setIsPreviewDark(false)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                !isPreviewDark ? 'bg-text-primary text-bg' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Light
            </button>
            <button
              type="button"
              onClick={() => setIsPreviewDark(true)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                isPreviewDark ? 'bg-text-primary text-bg' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Phone Frame Wrap Container */}
        <div className="flex justify-center py-2.5 bg-surface-alt/20 rounded-2xl border border-theme">
          {/* Bezel frame of simulated Phone */}
          <div className="w-[230px] h-[390px] bg-black rounded-[36px] p-2 shadow-2xl relative border-[3px] border-[#333333]">
            
            {/* Dynamic screen area */}
            <div
              className="w-full h-full rounded-[28px] overflow-hidden relative transition-all duration-300 select-none"
              style={{
                backgroundImage: previewWash,
                backgroundColor: previewBg,
                color: isPreviewDark ? '#FFFCF5' : '#292929',
              }}
            >
              {/* Sparkle shapes */}
              <div className="absolute inset-x-0 top-0 h-[60%] pointer-events-none overflow-hidden">
                <div className="absolute rounded-full" style={{ top: 10, left: '18%', width: 4, height: 4, backgroundColor: previewPrimary, opacity: 0.55 }} />
                <div className="absolute rotate-45" style={{ top: 20, left: '68%', width: 5, height: 5, backgroundColor: previewPrimary, opacity: 0.5 }} />
                <div className="absolute rounded-full border" style={{ top: 30, left: '42%', width: 6, height: 6, borderColor: previewPrimary, opacity: 0.5 }} />
              </div>

              {/* Simulated Phone Status Bar */}
              <div className="h-5 w-full flex justify-between items-center px-4 text-[8px] font-bold tracking-tight z-20 opacity-75">
                <span>9:41</span>
                <div className="flex items-center gap-1">
                  <div className="w-3.5 h-1.5 border border-current rounded-sm p-0.5 flex items-center">
                    <div className="w-full h-full bg-current rounded-xs" />
                  </div>
                </div>
              </div>

              {/* Home screen top portion */}
              <div className="px-3 pt-0.5 overflow-hidden" style={{ height: 'calc(100% - 20px - 54px)' }}>
                <span className="block text-[7px] font-medium opacity-70 mb-0.5">
                  Brgy. Poblacion | {lguName}
                </span>
                <h4 className="text-[13px] font-bold leading-tight mb-2">
                  Magandang Araw!
                </h4>

                {/* Quick Actions Grid Card */}
                <div
                  className="rounded-xl border p-2"
                  style={{
                    backgroundColor: isPreviewDark ? '#333333' : '#FFFDF7',
                    borderColor: isPreviewDark ? '#3D3D3D' : '#E9E4DA',
                  }}
                >
                  <span className="block text-[7px] font-bold mb-1.5 opacity-80">
                    What would you like to do?
                  </span>
                  <div className="grid grid-cols-4 gap-x-1 gap-y-1.5">
                    {PREVIEW_QUICK_ACTIONS.map((qa) => (
                      <div key={qa.label} className="flex flex-col items-center gap-0.5">
                        <div
                          className="w-6.5 h-6.5 rounded-lg border flex items-center justify-center"
                          style={{
                            backgroundColor: isPreviewDark ? '#3A3A33' : '#FFFFFF',
                            borderColor: isPreviewDark ? '#3D3D3D' : '#E9E4DA',
                          }}
                        >
                          {qa.Icon ? (
                            <qa.Icon size={12} color={previewIconAccent} variant="Bold" />
                          ) : (
                            <ChatboxGlyph size={12} color={previewIconAccent} />
                          )}
                        </div>
                        <span className="text-[5px] font-medium text-center leading-tight opacity-85 scale-90 truncate w-full">
                          {qa.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Floating pill nav bar */}
              <div
                className="absolute left-2 right-2 bottom-2 h-10 rounded-full flex items-center px-1 shadow-sm border"
                style={{
                  backgroundColor: isPreviewDark ? '#333333' : '#FFFDF7',
                  borderColor: isPreviewDark ? '#3D3D3D' : '#E9E4DA',
                }}
              >
                {PREVIEW_NAV_TABS.map((tab, idx) => {
                  const active = idx === 0;
                  const tabColor = active ? previewPillIconColor : (isPreviewDark ? '#A19E97' : '#8A8781');
                  return (
                    <div key={tab.label} className="flex-1 h-full flex items-center justify-center relative">
                      {active && (
                        <div
                          className="absolute inset-y-1 inset-x-0.5 rounded-full"
                          style={{ backgroundColor: previewPillColor }}
                        />
                      )}
                      <div className="relative flex flex-col items-center gap-0.5">
                        {tab.Icon && <tab.Icon size={11} color={tabColor} variant="Bold" />}
                        <span style={{ fontSize: 5.5, fontWeight: 500, color: tabColor, lineHeight: '6px' }}>
                          {tab.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className={sideBySide ? "" : "border border-theme rounded-xl p-4 bg-surface-alt/30 space-y-4"}>
      {sideBySide ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {innerContent}
        </div>
      ) : (
        <div className="space-y-4">
          {innerContent}
        </div>
      )}
    </div>
  );
}
