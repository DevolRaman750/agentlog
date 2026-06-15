import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { webInputStyles } from '../styles/containers';
import { useTheme, useThemedStyles, spacing, radius, typography } from '../theme';
import type { ThemeColors } from '../theme';

interface TextEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  showLineNumbers?: boolean;
  showCharacterCount?: boolean;
  showWordCount?: boolean;
  minHeight?: number;
  maxHeight?: number;
  allowFullscreen?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  style?: any;
  textStyle?: any;
  theme?: 'light' | 'dark';
  language?: 'plain' | 'markdown' | 'json' | 'sql';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const createStyles = (colors: ThemeColors) => ({
  container: {
    marginBottom: spacing.lg,
  },
  labelContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.title,
    flex: 1,
  },
  expandButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgHover,
    borderRadius: radius.sm,
    gap: spacing.xs,
  },
  expandButtonText: {
    ...typography.body,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  editorContainer: {
    borderWidth: 1.5,
    borderRadius: radius.lg,
    overflow: 'hidden' as const,
  },
  focusedContainer: {
  },
  editorContent: {
    flexDirection: 'row' as const,
    flex: 1,
  },
  lineNumberContainer: {
    minWidth: 40,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  lineNumberContent: {
    alignItems: 'flex-end' as const,
  },
  lineNumber: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 22,
    marginBottom: 0,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    ...webInputStyles,
  },
  statsContainer: {
    marginTop: spacing.sm,
    alignItems: 'flex-end' as const,
  },
  statsText: {
    ...typography.caption,
    fontWeight: '500' as const,
  },

  // Fullscreen styles
  fullscreenContainer: {
    flex: 1,
  },
  fullscreenSafeArea: {
    flex: 1,
  },
  fullscreenKeyboard: {
    flex: 1,
  },
  fullscreenHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: Platform.OS === 'ios' ? spacing.lg : spacing.md,
    borderBottomWidth: 1,
    minHeight: Platform.OS === 'ios' ? 64 : 60,
    ...Platform.select({
      ios: {
        paddingTop: spacing.lg, // Extra padding for iOS to account for potential status bar issues
      },
      android: {
        paddingTop: spacing.md,
      },
      web: {
        paddingTop: spacing.md,
      },
    }),
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start' as const,
  },
  headerButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  headerButtonText: {
    ...typography.title,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  headerTitle: {
    ...typography.h2,
    flex: 2,
    textAlign: 'center' as const,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end' as const,
  },
  fullscreenEditorContainer: {
    flex: 1,
    backgroundColor: colors.bgCard,
  },
  fullscreenEditorContent: {
    flex: 1,
    flexDirection: 'row' as const,
  },
  fullscreenLineNumbers: {
    width: 60,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  fullscreenLineNumber: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 22,
    textAlign: 'right' as const,
  },
  fullscreenTextInput: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    ...webInputStyles,
  },

});

const TextEditor: React.FC<TextEditorProps> = ({
  value = '',
  onChangeText,
  placeholder = 'Enter your text...',
  label,
  showLineNumbers = false,
  showCharacterCount = true,
  showWordCount = true,
  minHeight = 120,
  maxHeight = 300,
  allowFullscreen = true,
  autoFocus = false,
  editable = true,
  style,
  textStyle,
  theme = 'light',
  language = 'plain',
}) => {
  const { colors: appColors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(minHeight);
  const textInputRef = useRef<TextInput>(null);

  const lines = value.split('\n');
  const characterCount = value.length;
  const wordCount = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
  const lineCount = lines.length;

  // Use app theme colors for both light and dark modes
  const colors = {
    background: appColors.bgCard,
    border: appColors.borderLight,
    focusBorder: appColors.accent,
    text: appColors.textPrimary,
    placeholder: appColors.textSecondary,
    lineNumbers: appColors.textTertiary,
    lineNumberBg: appColors.bgSurface,
    stats: appColors.textSecondary,
    headerBg: appColors.bgSurface,
    shadowColor: appColors.shadowColor,
  };

  const handleContentSizeChange = useCallback((event: any) => {
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, event.nativeEvent.contentSize.height + 20)
    );
    setContentHeight(newHeight);
  }, [minHeight, maxHeight]);

  const renderLineNumbers = () => {
    if (!showLineNumbers) return null;

    return (
      <View style={[styles.lineNumberContainer, { backgroundColor: colors.lineNumberBg }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          contentContainerStyle={styles.lineNumberContent}
        >
          {lines.map((_, index) => (
            <Text
              key={index}
              style={[
                styles.lineNumber,
                { color: colors.lineNumbers },
                textStyle,
              ]}
            >
              {index + 1}
            </Text>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderStats = () => {
    if (!showCharacterCount && !showWordCount) return null;

    const stats = [];
    if (showCharacterCount) stats.push(`${characterCount} chars`);
    if (showWordCount) stats.push(`${wordCount} words`);
    stats.push(`${lineCount} lines`);

    return (
      <View style={styles.statsContainer}>
        <Text style={[styles.statsText, { color: colors.stats }]}>
          {stats.join(' • ')}
        </Text>
      </View>
    );
  };

  const renderCompactEditor = () => (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          {allowFullscreen && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => setIsFullscreen(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="expand-outline" size={16} color={appColors.accent} />
              <Text style={styles.expandButtonText}>Expand</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View
        style={[
          styles.editorContainer,
          {
            backgroundColor: colors.background,
            borderColor: isFocused ? colors.focusBorder : colors.border,
            minHeight: contentHeight,
          },
          isFocused && styles.focusedContainer,
        ]}
      >
        <View style={styles.editorContent}>
          {renderLineNumbers()}
          <TextInput
            ref={textInputRef}
            style={[
              styles.textInput,
              {
                color: colors.text,
                height: Math.max(contentHeight - 20, minHeight - 20),
              },
              textStyle,
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            multiline
            autoFocus={autoFocus}
            editable={editable}
            textAlignVertical="top"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onContentSizeChange={handleContentSizeChange}
            scrollEnabled={contentHeight >= maxHeight}
            returnKeyType="default"
            blurOnSubmit={false}
          />
        </View>
      </View>

      {renderStats()}
    </View>
  );

  const renderFullscreenEditor = () => (
    <Modal
      visible={isFullscreen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setIsFullscreen(false)}
    >
      <View style={[styles.fullscreenContainer, { backgroundColor: colors.background }]}>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={colors.headerBg}
          translucent={false}
        />
        <SafeAreaView style={styles.fullscreenSafeArea}>
          <KeyboardAvoidingView
            style={styles.fullscreenKeyboard}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Header */}
            <View style={[styles.fullscreenHeader, {
              backgroundColor: colors.headerBg,
              borderBottomColor: colors.border
            }]}>
              <View style={styles.headerLeft}>
                <TouchableOpacity
                  style={styles.headerButton}
                  onPress={() => setIsFullscreen(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-down" size={24} color={appColors.accent} />
                  <Text style={styles.headerButtonText}>Done</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {label || 'Text Editor'}
              </Text>

              <View style={styles.headerRight}>
                {renderStats()}
              </View>
            </View>

          {/* Editor */}
          <View style={styles.fullscreenEditorContainer}>
            <View style={styles.fullscreenEditorContent}>
              {showLineNumbers && (
                <View style={[styles.fullscreenLineNumbers, { backgroundColor: colors.lineNumberBg }]}>
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {lines.map((_, index) => (
                      <Text
                        key={index}
                        style={[
                          styles.fullscreenLineNumber,
                          { color: colors.lineNumbers },
                        ]}
                      >
                        {String(index + 1).padStart(3, ' ')}
                      </Text>
                    ))}
                  </ScrollView>
                </View>
              )}

              <TextInput
                style={[
                  styles.fullscreenTextInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                  textStyle,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.placeholder}
                multiline
                autoFocus
                editable={editable}
                textAlignVertical="top"
                scrollEnabled
                returnKeyType="default"
                blurOnSubmit={false}
              />
            </View>
          </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </Modal>
  );

  return (
    <>
      {renderCompactEditor()}
      {renderFullscreenEditor()}
    </>
  );
};

export default TextEditor;
