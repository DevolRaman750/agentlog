import React from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  ViewStyle, 
  StyleSheet,
  ScrollView,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface KeyboardAvoidingWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  behavior?: 'height' | 'position' | 'padding';
  keyboardVerticalOffset?: number;
  contentContainerStyle?: ViewStyle;
  scrollable?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
}

/**
 * KeyboardAvoidingWrapper - A comprehensive keyboard handling component
 * 
 * Features:
 * - Platform-specific keyboard behavior
 * - Automatic safe area compensation
 * - Optional scrolling capability
 * - Consistent keyboard handling across forms
 * - Optimized for mobile UX
 */
const KeyboardAvoidingWrapper: React.FC<KeyboardAvoidingWrapperProps> = ({
  children,
  style,
  behavior,
  keyboardVerticalOffset,
  contentContainerStyle,
  scrollable = false,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag'
}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate appropriate keyboard offset
  const defaultOffset = Platform.OS === 'ios' ? 0 : 20;
  const finalOffset = keyboardVerticalOffset !== undefined 
    ? keyboardVerticalOffset 
    : defaultOffset;

  // Determine behavior based on platform and props
  const finalBehavior = behavior || (Platform.OS === 'ios' ? 'padding' : 'height');

  const keyboardAvoidingView = (
    <KeyboardAvoidingView
      style={[styles.keyboardView, style]}
      behavior={finalBehavior}
      keyboardVerticalOffset={finalOffset}
    >
      {children}
    </KeyboardAvoidingView>
  );

  if (scrollable) {
    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        keyboardDismissMode={keyboardDismissMode}
        bounces={false}
      >
        {keyboardAvoidingView}
      </ScrollView>
    );
  }

  return keyboardAvoidingView;
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default KeyboardAvoidingWrapper;