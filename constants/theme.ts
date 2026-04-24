/**
 * PesaFi Theme System — Dark + Light mode support.
 * Inspired by Revolut, Cash App, and Chipper Cash aesthetics.
 */

export type ThemeMode = 'dark' | 'light';

const darkColors = {
  // Brand
  primary: '#22C55E',
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  accent: '#F97316',
  accentLight: '#FB923C',

  // Gradients
  gradientStart: '#10B981',
  gradientMid: '#22C55E',
  gradientEnd: '#0D9488',
  fxStart: '#F59E0B',
  fxEnd: '#B45309',

  // Surfaces
  background: '#06090F',
  backgroundSecondary: '#0C1320',
  card: '#111A2A',
  cardElevated: '#162236',
  border: '#1E2A3A',
  muted: '#141E2E',
  mutedForeground: '#64748B',

  // Text
  foreground: '#F8FAFC',
  foregroundSubtle: '#94A3B8',
  white: '#FFFFFF',

  // Semantic
  success: '#22C55E',
  successBg: 'rgba(34,197,94,0.12)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.12)',
  destructive: '#EF4444',
  destructiveBg: 'rgba(239,68,68,0.12)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.12)',

  // Action colors
  fx: '#F59E0B',
  fxDark: '#B45309',
  send: '#3B82F6',
  sendDark: '#2563EB',
  receive: '#22C55E',
  receiveDark: '#16A34A',
  deposit: '#F97316',
  depositDark: '#EA580C',
  withdraw: '#8B5CF6',
  withdrawDark: '#7C3AED',

  // Tab bar
  tabBar: '#0A1019',
  tabBarBorder: '#1A2332',
};

const lightColors: typeof darkColors = {
  primary: '#16A34A',
  primaryDark: '#15803D',
  primaryLight: '#22C55E',
  accent: '#EA580C',
  accentLight: '#F97316',

  gradientStart: '#059669',
  gradientMid: '#16A34A',
  gradientEnd: '#0F766E',
  fxStart: '#D97706',
  fxEnd: '#92400E',

  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  border: '#E2E8F0',
  muted: '#F1F5F9',
  mutedForeground: '#64748B',

  foreground: '#0F172A',
  foregroundSubtle: '#475569',
  white: '#FFFFFF',

  success: '#16A34A',
  successBg: 'rgba(22,163,74,0.1)',
  warning: '#D97706',
  warningBg: 'rgba(217,119,6,0.1)',
  destructive: '#DC2626',
  destructiveBg: 'rgba(220,38,38,0.1)',
  info: '#2563EB',
  infoBg: 'rgba(37,99,235,0.1)',

  fx: '#D97706',
  fxDark: '#92400E',
  send: '#2563EB',
  sendDark: '#1D4ED8',
  receive: '#16A34A',
  receiveDark: '#15803D',
  deposit: '#EA580C',
  depositDark: '#C2410C',
  withdraw: '#7C3AED',
  withdrawDark: '#6D28D9',

  tabBar: '#FFFFFF',
  tabBarBorder: '#E2E8F0',
};

export const themes = { dark: darkColors, light: lightColors };

// Default export for backward compatibility — will be overridden by ThemeProvider
export let Colors = { ...darkColors };

export function setThemeColors(mode: ThemeMode) {
  Object.assign(Colors, themes[mode]);
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 36,
  hero: 44,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const Shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  hero: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};
