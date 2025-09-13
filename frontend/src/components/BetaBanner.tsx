import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

export const BetaBanner: React.FC = () => {
  return (
    <View style={styles.banner}>
      <Text style={styles.text} accessibilityRole={Platform.OS === 'web' ? 'banner' : undefined}>
        Agentlog is in beta — breaking changes or data resets may occur. Feel free to test.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    backgroundColor: '#FFF4E5',
    borderBottomWidth: 1,
    borderColor: '#FFE0B2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#8A5200',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
