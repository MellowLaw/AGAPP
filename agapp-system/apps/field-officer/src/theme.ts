import { StyleSheet } from 'react-native';

export const PASTELS = {
  sage:    '#C7D5C1',
  blue:    '#C4D0D7',
  pink:    '#F2C4CB',
  cream:   '#E8DEC9',
  lilac:   '#D4CCE0',
  butter:  '#EFE6BD',
};

export const ACCENT = '#F497A2';

export const TOKENS = {
  light: {
    bg:        '#E8E7E5',
    bgAlt:     '#DEDCD8',
    card:      '#FFFFFF',
    cardAlt:   '#F4F2EE',
    text:      '#1A1A1A',
    textMuted: '#6B7280',
    border:    'rgba(26,26,26,0.08)',
    chip:      '#F4F2EE',
  },
  dark: {
    bg:        '#1A1A1A',
    bgAlt:     '#0F0F0F',
    card:      '#242322',
    cardAlt:   '#2E2D2C',
    text:      '#E8E7E5',
    textMuted: '#9CA3AF',
    border:    'rgba(232,231,229,0.08)',
    chip:      '#2E2D2C',
  },
};

export const globalStyles = StyleSheet.create({
  screen: { flex: 1 },
  serif: { fontFamily: 'serif', letterSpacing: -0.5 },
  muted: { fontSize: 14, lineHeight: 20 },
  card: { padding: 20, borderRadius: 24, borderWidth: 1, marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  input: { height: 52, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, borderWidth: 1, marginBottom: 20 },
  primaryButton: { height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  primaryButtonText: { fontSize: 16, fontWeight: '600' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 16, marginTop: 12 },
  sectionTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  sectionAction: { fontSize: 14, fontWeight: '600' },
  h2: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  h3: { fontSize: 20, fontWeight: '600', letterSpacing: -0.5 },
  secondaryButton: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  secondaryButtonText: { fontSize: 15, fontWeight: '600' },
});
