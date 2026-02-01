import React from 'react';
import { StyleSheet, ViewStyle, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  backgroundColor?: string;
}

/**
 * SafeAreaWrapper - A consistent safe area component that works across all platforms
 *
 * Features:
 * - Uses react-native-safe-area-context for proper safe area handling
 * - Customizable edges for flexible safe area application
 * - Platform-specific optimizations
 * - Consistent styling across the app
 */
const SafeAreaWrapper: React.FC<SafeAreaWrapperProps> = ({
  children,
  style,
  edges = ['top', 'bottom', 'left', 'right'],
  backgroundColor
}) => {
  const { colors } = useTheme();
  const resolvedBg = backgroundColor ?? colors.bgApp;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: resolvedBg },
        style
      ]}
      edges={edges}
    >
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default SafeAreaWrapper;
