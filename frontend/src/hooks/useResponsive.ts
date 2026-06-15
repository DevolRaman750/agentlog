import { useWindowDimensions } from 'react-native';
import { breakpoints } from '../theme';

export type Breakpoint = 'phone' | 'tablet' | 'desktop';

/**
 * Live breakpoint based on `useWindowDimensions`, which (unlike
 * ResponsiveContext) updates on every dimension change — including sub-768px
 * resizes. Use this for spacing/typography that should adapt across phone /
 * tablet / desktop.
 */
export function useBreakpoint(): Breakpoint {
  const { width } = useWindowDimensions();
  if (width >= breakpoints.desktop) return 'desktop';
  if (width >= breakpoints.tablet) return 'tablet';
  return 'phone';
}

/**
 * Pick a value per breakpoint. `tablet` and `desktop` fall back to the next
 * smaller defined value, so the common case (phone vs everything-else) is just:
 *
 *   const pad = useResponsiveValue({ phone: spacing.md, desktop: spacing.lg });
 *
 * Full form:
 *
 *   const cols = useResponsiveValue({ phone: 1, tablet: 2, desktop: 3 });
 */
export function useResponsiveValue<T>(values: {
  phone: T;
  tablet?: T;
  desktop?: T;
}): T {
  const bp = useBreakpoint();
  if (bp === 'desktop') return values.desktop ?? values.tablet ?? values.phone;
  if (bp === 'tablet') return values.tablet ?? values.phone;
  return values.phone;
}

/** Convenience flags. */
export function useIsPhone(): boolean {
  return useBreakpoint() === 'phone';
}
