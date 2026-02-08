import { Theme } from './types';

export const lightTheme: Theme = {
  mode: 'light',
  colors: {
    bgApp: '#F2F2F7',
    bgCard: '#FFFFFF',
    bgElevated: '#FFFFFF',
    bgSurface: '#F8F9FA',
    bgNested: '#F2F2F7',
    bgInput: '#FFFFFF',
    bgHover: '#F0F8FF',
    bgOverlay: 'rgba(0,0,0,0.5)',

    textPrimary: '#1A1A1A',
    textSecondary: '#8E8E93',
    textTertiary: '#C7C7CC',
    textInverse: '#FFFFFF',
    textLink: '#007AFF',

    accent: '#007AFF',
    accentBright: '#4A90D9',
    accentMuted: '#B0D4FF',
    accentSoft: 'rgba(0, 122, 255, 0.10)',
    accentSecondary: '#FF9500',

    borderSubtle: '#E5E5EA',
    borderLight: '#E1E5E9',
    borderMedium: '#D1D1D6',
    borderAccent: 'rgba(0, 122, 255, 0.30)',

    statusSuccess: '#34C759',
    statusWarning: '#FF9500',
    statusError: '#FF3B30',
    statusInfo: '#007AFF',
    statusPaused: '#8E8E93',

    shadowColor: '#000000',

    navBg: '#FFFFFF',
    navItemActive: '#007AFF',
    navItemText: '#1A1A1A',
    navBorder: '#E1E5E9',
  },
};

export const darkTheme: Theme = {
  mode: 'dark',
  colors: {
    bgApp: '#0A0A0F',
    bgCard: '#111118',
    bgElevated: '#1A1A24',
    bgSurface: '#222230',
    bgNested: '#1A1A24',
    bgInput: '#1A1A24',
    bgHover: 'rgba(255, 255, 255, 0.06)',
    bgOverlay: 'rgba(0,0,0,0.7)',

    textPrimary: '#E2E8F0',
    textSecondary: '#94A3B8',
    textTertiary: '#64748B',
    textInverse: '#0A0A0F',
    textLink: '#10B981',

    accent: '#10B981',
    accentBright: '#34D399',
    accentMuted: '#059669',
    accentSoft: 'rgba(16, 185, 129, 0.15)',
    accentSecondary: '#FBBF24',

    borderSubtle: 'rgba(255, 255, 255, 0.12)',
    borderLight: 'rgba(255, 255, 255, 0.18)',
    borderMedium: 'rgba(255, 255, 255, 0.25)',
    borderAccent: 'rgba(16, 185, 129, 0.40)',

    statusSuccess: '#10B981',
    statusWarning: '#FBBF24',
    statusError: '#EF4444',
    statusInfo: '#10B981',
    statusPaused: '#64748B',

    shadowColor: '#10B981',

    navBg: '#0A0A0F',
    navItemActive: '#10B981',
    navItemText: '#E2E8F0',
    navBorder: 'rgba(255, 255, 255, 0.12)',
  },
};
