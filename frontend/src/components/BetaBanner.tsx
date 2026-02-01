import React from 'react';
import { View, Text, Platform } from 'react-native';
import { useThemedStyles } from '../theme';
import { ThemeColors } from '../theme';

export const BetaBanner: React.FC = () => {
  const styles = useThemedStyles((colors: ThemeColors) => ({
    banner: {
      width: '100%' as const,
      backgroundColor: '#FFF4E5',
      borderBottomWidth: 1,
      borderColor: '#FFE0B2',
      paddingVertical: 8,
      paddingHorizontal: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    text: {
      color: '#8A5200',
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
