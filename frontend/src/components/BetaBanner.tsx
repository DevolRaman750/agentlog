import React from 'react';
import { View, Text, Platform } from 'react-native';
import { useThemedStyles, spacing, typography } from '../theme';
import { ThemeColors } from '../theme';

export const BetaBanner: React.FC = () => {
  const styles = useThemedStyles((colors: ThemeColors) => ({
    banner: {
      width: '100%' as const,
      backgroundColor: `${colors.statusWarning}15`,
      borderBottomWidth: 1,
      borderColor: `${colors.statusWarning}30`,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      ...typography.label,
      fontWeight: '600' as const,
      color: colors.statusWarning,
      textAlign: 'center' as const,
    },
  }));

  return (
    <View style={styles.banner}>
      <Text style={styles.text} accessibilityRole={Platform.OS === 'web' ? ('banner' as any) : undefined}>
        Agentlog is in beta — breaking changes or data resets may occur. Feel free to test.
      </Text>
    </View>
  );
};
