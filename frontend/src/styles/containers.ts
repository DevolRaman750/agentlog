import { StyleSheet, Platform } from 'react-native';
import { ThemeColors } from '../theme/types';
import { spacing, radius } from '../theme/tokens';

// Web-specific styles to fix double border issues (not color-dependent)
export const webInputStyles = Platform.select({
  web: {
    // @ts-ignore - Web-specific CSS properties
    outlineStyle: 'none',
    outlineWidth: 0,
    outlineColor: 'transparent',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
    MozAppearance: 'textfield',
    boxShadow: 'none',
  },
  default: {}
}) as any;

// Factory: container styles
//
// Aesthetic: FLAT & CLEAN. Cards/surfaces use a single 1px border and NO
// shadow (borders + shadows together read as heavy). Only `modalContainer`
// keeps a shadow, since it floats over an overlay. All spacing/radius values
// come from design tokens.
export const createContainerStyles = (colors: ThemeColors) => StyleSheet.create({
  appBackground: {
    backgroundColor: colors.bgApp,
  },

  primaryContainer: {
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  secondaryContainer: {
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  nestedContainer: {
    backgroundColor: colors.bgNested,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  listItemContainer: {
    backgroundColor: colors.bgCard,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  modalContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  inputContainer: {
    backgroundColor: colors.bgInput,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },

  headerContainer: {
    backgroundColor: colors.bgApp,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },

  statusContainer: {
    backgroundColor: colors.bgNested,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  sectionSpacer: {
    height: spacing.xl,
  },

  containerSpacer: {
    height: spacing.lg,
  },

  itemSpacer: {
    height: spacing.sm,
  },
});

// Factory: shadow presets
export const createShadowPresets = (colors: ThemeColors) => ({
  none: {
    shadowOpacity: 0,
    elevation: 0,
  },
  light: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  small: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
  },
  subtle: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  medium: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
  },
  strong: {
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 4,
  },
  dramatic: {
    shadowColor: colors.accentSecondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
});

// Factory: text input styles
export const createTextInputStyles = (colors: ThemeColors) => StyleSheet.create({
  base: {
    backgroundColor: colors.bgInput,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...webInputStyles,
  },
  compact: {
    backgroundColor: colors.bgInput,
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...webInputStyles,
  },
  large: {
    backgroundColor: colors.bgInput,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    ...webInputStyles,
  },
  error: {
    backgroundColor: colors.bgInput,
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.statusError,
    ...webInputStyles,
  },
});

// Backward-compatible static exports for files not yet migrated.
// These use the dark theme values as defaults (current state).
// Files should migrate to useContainerStyles() hook over time.
import { darkTheme } from '../theme/themes';

const _defaultColors = darkTheme.colors;

export const futuristicColors = {
  bgDeep: _defaultColors.bgApp,
  bgCard: _defaultColors.bgCard,
  bgElevated: _defaultColors.bgElevated,
  bgSurface: _defaultColors.bgSurface,
  bgApp: _defaultColors.bgApp,
  bgNested: _defaultColors.bgNested,
  accent: _defaultColors.accent,
  accentBright: _defaultColors.accentBright,
  accentMuted: _defaultColors.accentMuted,
  accentSoft: _defaultColors.accentSoft,
  accentBorder: _defaultColors.borderAccent,
  accentGlow: 'rgba(16, 185, 129, 0.12)',
  accentSecondary: _defaultColors.accentSecondary,
  textPrimary: _defaultColors.textPrimary,
  textSecondary: _defaultColors.textSecondary,
  textTertiary: _defaultColors.textTertiary,
  textOnAccent: _defaultColors.textInverse,
  borderSubtle: _defaultColors.borderSubtle,
  borderLight: _defaultColors.borderLight,
  borderMedium: _defaultColors.borderMedium,
  statusActive: _defaultColors.statusSuccess,
  statusWarning: _defaultColors.statusWarning,
  statusPaused: _defaultColors.statusPaused,
  statusError: _defaultColors.statusError,
};

export const containerStyles = createContainerStyles(_defaultColors);
export const shadowPresets = createShadowPresets(_defaultColors);
export const containerColors = {
  primary: _defaultColors.bgCard,
  secondary: _defaultColors.bgElevated,
  nested: _defaultColors.bgNested,
  muted: '#0F0F17',
  background: _defaultColors.bgApp,
  borders: {
    subtle: _defaultColors.borderSubtle,
    light: _defaultColors.borderLight,
    medium: _defaultColors.borderMedium,
    strong: 'rgba(255, 255, 255, 0.20)',
  },
};
export const textInputStyles = createTextInputStyles(_defaultColors);
