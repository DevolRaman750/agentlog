import { useMemo } from 'react';
import { useTheme } from '../theme';
import { createContainerStyles, createShadowPresets, createTextInputStyles } from './containers';

export function useContainerStyles() {
  const { colors, themeMode } = useTheme();

  return useMemo(() => ({
    containerStyles: createContainerStyles(colors),
    shadowPresets: createShadowPresets(colors),
    textInputStyles: createTextInputStyles(colors),
    colors,
  }), [themeMode]);
}
