import React, { RefObject } from 'react';
import { StyleSheet, ViewStyle, ScrollView } from 'react-native';
import SafeAreaWrapper from './SafeAreaWrapper';
import KeyboardAvoidingWrapper from './KeyboardAvoidingWrapper';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  backgroundColor?: string;
  safeAreaEdges?: ('top' | 'bottom' | 'left' | 'right')[];
  enableKeyboardAvoiding?: boolean;
  enableScrolling?: boolean;
  showsVerticalScrollIndicator?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
  keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
  scrollViewRef?: RefObject<ScrollView>;
}

/**
 * ScreenContainer - A complete screen layout solution
 * 
 * Features:
 * - Combines SafeAreaWrapper and KeyboardAvoidingWrapper
 * - Consistent layout behavior across all screens
 * - Configurable safe area edges
 * - Optional keyboard avoidance and scrolling
 * - Platform optimizations built-in
 * - Prevents notch clipping and keyboard overlap
 */
const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  contentContainerStyle,
  backgroundColor = '#F2F2F7',
  safeAreaEdges = ['top', 'bottom', 'left', 'right'],
  enableKeyboardAvoiding = false,
  enableScrolling = false,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag',
  scrollViewRef
}) => {
  const renderContent = () => {
    if (enableKeyboardAvoiding) {
      return (
        <KeyboardAvoidingWrapper
          scrollable={enableScrolling}
          contentContainerStyle={contentContainerStyle}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          keyboardDismissMode={keyboardDismissMode}
          scrollViewRef={scrollViewRef}
        >
          {children}
        </KeyboardAvoidingWrapper>
      );
    }
    
    if (enableScrolling) {
      return (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
          showsVerticalScrollIndicator={showsVerticalScrollIndicator}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          keyboardDismissMode={keyboardDismissMode}
          bounces={true}
        >
          {children}
        </ScrollView>
      );
    }
    
    return children;
  };

  return (
    <SafeAreaWrapper
      style={style}
      edges={safeAreaEdges}
      backgroundColor={backgroundColor}
    >
      {renderContent()}
    </SafeAreaWrapper>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});

export default ScreenContainer;