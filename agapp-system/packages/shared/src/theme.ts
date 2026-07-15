import { StyleSheet } from 'react-native';

export const PASTELS = {
  sage:    '#C7D5C1',
  blue:    '#C4D0D7',
  pink:    '#F2C4CB',
  cream:   '#E8DEC9',
  lilac:   '#D4CCE0',
  butter:  '#EFE6BD',
};

// Deprecated static fallback — screens should stop importing this directly.
// Dynamic per-municipality accent now lives on the theme (T.accent via ThemeContext).
export const ACCENT = '#F2E863';

// Blends any hex color toward white by `amount` (0-1). Used to derive a soft,
// pastel version of a per-LGU accent for large fills (tab bar pill, toggle
// tracks) — a raw full-saturation accent reads as "neon" at that size,
// regardless of which municipality's color it is.
export function softenColor(hex: string, amount = 0.45): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const mix = (channel: number) => Math.round(channel + (255 - channel) * amount);
  return `#${[mix(r), mix(g), mix(b)].map(v => v.toString(16).padStart(2, '0')).join('')}`;
}

// Picks ink or cream depending on how light/dark `hex` itself is — NOT the
// app's light/dark theme mode. Use this for any text/icon drawn ON TOP of an
// accent-colored fill (e.g. the tab bar's active pill): an LGU can pick a
// genuinely dark accent, and hardcoded ink text would go invisible on it even
// while the rest of the app is still in light mode. Same relative-luminance
// formula as admin's DashboardLayout.tsx (so both sides agree on what reads
// as "light enough for dark text").
export function contrastColor(hex: string): '#292929' | '#FFFCF5' {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#292929';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#292929' : '#FFFCF5';
}

export const TOKENS = {
  light: {
    bg:        '#FFFCF5',
    bgAlt:     '#F7F3EA',
    card:      '#FFFDF7',
    cardAlt:   '#FBF8F0',
    text:      '#292929',
    textMuted: '#8A8781',
    border:    '#E9E4DA',
    chip:      '#F1ECE1',
  },
  dark: {
    bg:        '#292929',
    bgAlt:     '#1F1F1F',
    card:      '#333333',
    cardAlt:   '#2D2D2D',
    text:      '#FFFCF5',
    textMuted: '#A19E97',
    border:    '#3D3D3D',
    chip:      '#3A3A3A',
  },
};

export const RADII = { pill: 999, card: 24, tile: 16, input: 14 };
export const SPACING = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 };
export const FONTS = { heading: 'Octarine-Bold', body: 'Inter-Medium' };

export const globalStyles = StyleSheet.create({
  screen:              { flex: 1 },
  serif:               { fontFamily: 'serif', letterSpacing: -0.5 },
  muted:               { fontSize: 14, lineHeight: 20 },
  card:                { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 16 },
  label:               { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  input:               { height: 52, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, marginBottom: 20, fontFamily: 'Inter-Medium' },
  primaryButton:       { height: 56, borderRadius: 999, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText:   { fontSize: 16, fontWeight: '600', fontFamily: 'Inter-Medium' },
  sectionHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, marginTop: 12 },
  sectionTitle:        { fontSize: 20, fontWeight: '700', letterSpacing: -0.5, fontFamily: 'Octarine-Bold' },
  sectionAction:       { fontSize: 14, fontWeight: '600', fontFamily: 'Inter-Medium' },
  h2:                  { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, fontFamily: 'Octarine-Bold' },
  h3:                  { fontSize: 20, fontWeight: '600', letterSpacing: -0.5, fontFamily: 'Octarine-Bold' },
  secondaryButton:     { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  secondaryButtonText: { fontSize: 15, fontWeight: '600', fontFamily: 'Inter-Medium' },
});
