/**
 * PesaFi theme - mirrors the web app's CSS variables (now dark mode).
 *
 * From src/app/globals.css:
 *   --background:  222 47% 6%   →  #08101D  (deep navy)
 *   --card:        222 41% 11%  →  #111A2A  (raised surface)
 *   --primary:     142 71% 45%  →  #22C55E  (emerald)
 *   --accent:       25 95% 53%  →  #F97316  (orange)
 *   --border:      217 24% 20%  →  #2A3344
 */

export const Colors = {
  // Brand
  primary: '#22C55E',         // emerald-500
  primaryDark: '#16A34A',
  primaryLight: '#4ADE80',
  accent: '#F97316',          // orange-500
  accentLight: '#FB923C',

  // Gradient stops for the hero balance card
  gradientStart: '#10B981',   // emerald-500
  gradientMid: '#22C55E',     // green-500
  gradientEnd: '#0D9488',     // teal-600

  // Amber gradient for the new FX button
  fxStart: '#F59E0B',         // amber-500
  fxEnd: '#B45309',           // amber-700

  // Surfaces (dark theme)
  background: '#08101D',      // hsl(222 47% 6%)
  card: '#111A2A',            // hsl(222 41% 11%)
  cardElevated: '#162236',
  border: '#2A3344',          // hsl(217 24% 20%)
  muted: '#1A2334',           // hsl(217 28% 16%)
  mutedForeground: '#8190AB', // hsl(215 20% 58%)

  // Text
  foreground: '#F8FAFC',      // hsl(210 40% 98%)
  foregroundSubtle: '#CBD5E1',
  white: '#FFFFFF',

  // Semantic
  success: '#22C55E',
  successBg: 'rgba(34,197,94,0.15)',
  warning: '#F59E0B',
  warningBg: 'rgba(245,158,11,0.15)',
  destructive: '#EF4444',
  destructiveBg: 'rgba(239,68,68,0.15)',
  info: '#3B82F6',
  infoBg: 'rgba(59,130,246,0.15)',

  // Action button colors (from web Quick Actions)
  fx: '#F59E0B',              // amber - SSP FX
  fxDark: '#B45309',
  send: '#3B82F6',            // blue
  sendDark: '#2563EB',
  receive: '#22C55E',         // emerald
  receiveDark: '#16A34A',
  deposit: '#F97316',         // orange
  depositDark: '#EA580C',
  withdraw: '#8B5CF6',        // violet
  withdrawDark: '#7C3AED',
};

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
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHover: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  hero: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
};
