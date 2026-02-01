import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from './ThemeContext';
import { ThemeColors } from './types';

/**
 * Creates a memoized StyleSheet that recomputes only when the theme changes.
 *
 * Usage:
 *   const styles = useThemedStyles((colors) => ({
 *     container: { backgroundColor: colors.bgApp },
 *     title: { color: colors.textPrimary },
 *   }));
 *
 * For external factory functions, use createStyles pattern:
 *   const createStyles = (colors: ThemeColors) => ({ ... });
 *   const styles = useThemedStyles(createStyles);
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ThemeColors) => T | StyleSheet.NamedStyles<T>
): T;
export function useThemedStyles(
  factory: (colors: ThemeColors) => Record<string, any>
): Record<string, any>;
export function useThemedStyles(
  factory: (colors: ThemeColors) => any
): any {
  const { colors, themeMode } = useTheme();
  return useMemo(
    () => StyleSheet.create(factory(colors)),
    [themeMode]
  );
}
