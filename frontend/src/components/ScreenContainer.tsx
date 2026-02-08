import React, { RefObject } from 'react';
import { StyleSheet, ViewStyle, ScrollView } from 'react-native';
import SafeAreaWrapper from './SafeAreaWrapper';
import KeyboardAvoidingWrapper from './KeyboardAvoidingWrapper';
import { useTheme } from '../theme';

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

const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  style,
  contentContainerStyle,
  backgroundColor,
  safeAreaEdges = ['top', 'bottom', 'left', 'right'],
  enableKeyboardAvoiding = false,
  enableScrolling = false,
  showsVerticalScrollIndicator = false,
  keyboardShouldPersistTaps = 'handled',
  keyboardDismissMode = 'on-drag',
  scrollViewRef
}) => {
  const { colors } = useTheme();
  const bg = backgroundColor ?? colors.bgApp;

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
      backgroundColor={bg}
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
