/**
 * Design tokens — mode-independent scales for spacing, radius, typography,
 * and breakpoints. These complement the color tokens in `themes.ts`.
 *
 * Colors change with the active theme (light/dark) and are accessed via
 * `useTheme()` / `useThemedStyles()`. The tokens below are static, so import
 * them directly:
 *
 *   import { spacing, radius, typography } from '../theme';
 *
 * Goal: replace the ~960 hardcoded fontSize values and the dozen ad-hoc
 * padding/margin numbers with a single, consistent scale.
 */

/** 4px-based spacing scale. Use these instead of raw numbers. */
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export type SpacingKey = keyof typeof spacing;

/** Corner radius scale. `pill` for fully-rounded chips/avatars. */
export const radius = {
  none: 0,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

/** Minimum interactive target size (Apple HIG / Material accessibility). */
export const touchTarget = {
  min: 44,
} as const;

/**
 * Semantic typography roles. Each entry is a ready-to-spread text style:
 *
 *   <Text style={[typography.title, { color: colors.textPrimary }]}>
 *
 * fontSize/lineHeight/fontWeight are paired so vertical rhythm stays
 * consistent. Color is intentionally NOT included — apply it from the theme.
 */
export const typography = {
  /** Largest screen titles / hero numbers. */
  display: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const },
  /** Screen titles. */
  h1: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  /** Section headers. */
  h2: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  /** Card titles / prominent labels. */
  title: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  /** Default body copy. */
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  /** Emphasized body. */
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  /** Form labels, secondary metadata. */
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  /** Captions, helper text, timestamps. */
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  /** Badges, tiny meta. Use sparingly. */
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '500' as const },
} as const;

export type TypographyRole = keyof typeof typography;

/**
 * Layout breakpoints (min-width, px).
 * - phone:   < tablet
 * - tablet:  >= 600 and < desktop
 * - desktop: >= 768 (matches the existing sidebar breakpoint in ResponsiveContext)
 *
 * `desktop` is kept at 768 to stay consistent with navigation behavior.
 */
export const breakpoints = {
  tablet: 600,
  desktop: 768,
  wide: 1200,
} as const;

/** Max content width on large/web displays so layouts don't stretch edge-to-edge. */
export const layout = {
  maxContentWidth: 1200,
} as const;
