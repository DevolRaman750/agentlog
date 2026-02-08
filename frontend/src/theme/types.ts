export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  // Backgrounds (layered depth)
  bgApp: string;
  bgCard: string;
  bgElevated: string;
  bgSurface: string;
  bgNested: string;
  bgInput: string;
  bgHover: string;
  bgOverlay: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textInverse: string;
  textLink: string;

  // Accents
  accent: string;
  accentBright: string;
  accentMuted: string;
  accentSoft: string;
  accentSecondary: string;

  // Borders
  borderSubtle: string;
  borderLight: string;
  borderMedium: string;
  borderAccent: string;

  // Status
  statusSuccess: string;
  statusWarning: string;
  statusError: string;
  statusInfo: string;
  statusPaused: string;

  // Shadows
  shadowColor: string;

  // Navigation
  navBg: string;
  navItemActive: string;
  navItemText: string;
  navBorder: string;
}

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
}
