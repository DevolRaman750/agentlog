import React from 'react';
import { View, Text, Platform } from 'react-native';
import { useThemedStyles } from '../theme';
import { ThemeColors } from '../theme';

export const BetaBanner: React.FC = () => {
  const styles = useThemedStyles((colors: ThemeColors) => ({
    banner: {
      width: '100%' as const,
      backgroundColor: `${colors.statusWarning}15`,
      borderBottomWidth: 1,
      borderColor: `${colors.statusWarning}30`,
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      color: colors.statusWarning,
      fontSize: 13,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    },
  }));

  return (
    <View style={styles.banner}>
      <Text style={styles.text} accessibilityRole={Platform.OS === 'web' ? 'banner' : undefined}>
        Agentlog is in beta — breaking changes or data resets may occur. Feel free to test.
      </Text>
    </View>
  );
};
