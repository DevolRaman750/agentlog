import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { webInputStyles } from '../styles/containers';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
import type { ThemeColors } from '../theme';
import { useResponsive } from '../context/ResponsiveContext';

export interface EnhancedTextEditorProps {
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
  // Enhanced features
  showToolbar?: boolean;
  enableMarkdown?: boolean;
  maxLength?: number;
  required?: boolean;
  errorMessage?: string;
  helperText?: string;
  autoExpandOnFocus?: boolean; // New prop to control auto-expansion
  onFocus?: () => void;
  onBlur?: () => void;
}

interface ToolbarAction {
  id: string;
  icon: string;
  label: string;
  action: (textInputRef: React.RefObject<TextInput>, value: string, onChangeText: (text: string) => void) => void;
  shortcut?: string;
}

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
  requiredIndicator: {
    color: colors.statusError,
    fontWeight: '700' as const,
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
  errorContainer: {
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
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
  helperContainer: {
    marginTop: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    lineHeight: 16,
  },

  // Fullscreen styles
  fullscreenContainer: {
    flex: 1,
  },
  fullscreenKeyboard: {
    flex: 1,
  },
  fullscreenHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    minHeight: 60,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start' as const,
  },
  headerButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
    minHeight: touchTarget.min,
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
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    ...webInputStyles,
  },

  // Toolbar styles
  toolbar: {
    borderTopWidth: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  toolbarContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  toolbarButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    gap: spacing.xs,
    minWidth: 70,
    minHeight: touchTarget.min,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  mobileToolbarButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    minWidth: touchTarget.min,
    borderRadius: radius.sm,
  },
  toolbarButtonText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '500' as const,
  },
  secondaryToolbarContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginTop: spacing.sm,
  },
  secondaryToolbarButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgApp,
    borderRadius: radius.sm,
    gap: spacing.xs,
    minWidth: 55,
    minHeight: touchTarget.min,
    justifyContent: 'center' as const,
  },
  mobileSecondaryToolbarButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: touchTarget.min,
    borderRadius: radius.sm,
  },
  secondaryToolbarButtonText: {
    ...typography.micro,
    color: colors.textSecondary,
    fontWeight: '400' as const,
  },
});

const EnhancedTextEditor: React.FC<EnhancedTextEditorProps> = ({
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
  showToolbar = true,
  enableMarkdown = false,
  maxLength,
  required = false,
  errorMessage,
  helperText,
  autoExpandOnFocus = true, // Default to true for better mobile UX
  onFocus,
  onBlur,
}) => {
  // Responsive layout
  const { isSidebarLayout } = useResponsive();
  const isMobile = !isSidebarLayout;

  // State management
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(minHeight);
  const [selectionStart, setSelectionStart] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [historyStack, setHistoryStack] = useState<string[]>([value]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Refs
  const textInputRef = useRef<TextInput>(null);
  const fullscreenInputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Computed values
  const lines = value.split('\n');
  const characterCount = value.length;
  const wordCount = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
  const lineCount = lines.length;
  const isOverLimit = maxLength ? characterCount > maxLength : false;
  const hasError = !!errorMessage || isOverLimit;

  // Theme configuration
  const { colors: appColors } = useTheme();
  const styles = useThemedStyles(createStyles);
  // Use app theme colors for consistent theming
  const colors = {
    background: appColors.bgCard,
    border: appColors.borderLight,
    focusBorder: appColors.accent,
    errorBorder: appColors.statusError,
    text: appColors.textPrimary,
    placeholder: appColors.textSecondary,
    lineNumbers: appColors.textTertiary,
    lineNumberBg: appColors.bgSurface,
    stats: appColors.textSecondary,
    headerBg: appColors.bgSurface,
    toolbarBg: appColors.bgCard,
    toolbarBorder: appColors.borderLight,
    shadowColor: appColors.shadowColor,
    overlayBg: 'rgba(0, 0, 0, 0.4)',
    helperText: appColors.textSecondary,
    errorText: appColors.statusError,
  };

  // History management
  const addToHistory = useCallback((text: string) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(text);

    // Limit history to 50 items for performance
    if (newStack.length > 50) {
      newStack.shift();
    } else {
      setHistoryIndex(newStack.length - 1);
    }

    setHistoryStack(newStack);
  }, [historyStack, historyIndex]);

  // Toolbar actions configuration
  const toolbarActions: ToolbarAction[] = useMemo(() => [
    {
      id: 'undo',
      icon: 'arrow-undo',
      label: 'Undo',
      shortcut: 'Cmd+Z',
      action: () => {
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          onChangeText(historyStack[newIndex]);
        }
      },
    },
    {
      id: 'redo',
      icon: 'arrow-redo',
      label: 'Redo',
      shortcut: 'Cmd+Shift+Z',
      action: () => {
        if (historyIndex < historyStack.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          onChangeText(historyStack[newIndex]);
        }
      },
    },
    {
      id: 'bold',
      icon: 'text',
      label: 'Bold',
      shortcut: 'Cmd+B',
      action: (textInputRef, value, onChangeText) => {
        const before = value.substring(0, selectionStart);
        const selected = value.substring(selectionStart, selectionEnd);
        const after = value.substring(selectionEnd);
        const newText = `${before}**${selected || 'bold text'}**${after}`;
        onChangeText(newText);
        addToHistory(newText);

        // Update cursor position
        const newCursorPos = selectionStart + (selected ? selected.length + 4 : 11);
        setTimeout(() => {
          textInputRef.current?.setNativeProps({
            selection: { start: newCursorPos, end: newCursorPos }
          });
        }, 50);
      },
    },
    {
      id: 'italic',
      icon: 'text-outline',
      label: 'Italic',
      action: (textInputRef, value, onChangeText) => {
        const before = value.substring(0, selectionStart);
        const selected = value.substring(selectionStart, selectionEnd);
        const after = value.substring(selectionEnd);
        const newText = `${before}*${selected || 'italic text'}*${after}`;
        onChangeText(newText);
        addToHistory(newText);

        // Update cursor position
        const newCursorPos = selectionStart + (selected ? selected.length + 2 : 13);
        setTimeout(() => {
          textInputRef.current?.setNativeProps({
            selection: { start: newCursorPos, end: newCursorPos }
          });
        }, 50);
      },
    },
    {
      id: 'bullet',
      icon: 'list',
      label: 'Bullet',
      action: (textInputRef, value, onChangeText) => {
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];

        // Toggle bullet point
        if (currentLine.startsWith('• ')) {
          lines[currentLineIndex] = currentLine.substring(2);
        } else if (currentLine.startsWith('- ')) {
          lines[currentLineIndex] = currentLine.substring(2);
        } else {
          lines[currentLineIndex] = `• ${currentLine}`;
        }

        const newText = lines.join('\n');
        onChangeText(newText);
        addToHistory(newText);
      },
    },
    {
      id: 'numbered',
      icon: 'list-outline',
      label: 'Numbers',
      action: (textInputRef, value, onChangeText) => {
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];

        // Add or toggle numbered list
        if (/^\d+\.\s/.test(currentLine)) {
          lines[currentLineIndex] = currentLine.replace(/^\d+\.\s/, '');
        } else {
          lines[currentLineIndex] = `1. ${currentLine}`;
        }

        const newText = lines.join('\n');
        onChangeText(newText);
        addToHistory(newText);
      },
    },
    {
      id: 'link',
      icon: 'link',
      label: 'Link',
      action: (textInputRef, value, onChangeText) => {
        const before = value.substring(0, selectionStart);
        const selected = value.substring(selectionStart, selectionEnd);
        const after = value.substring(selectionEnd);
        const linkText = selected || 'link text';
        const newText = `${before}[${linkText}](https://example.com)${after}`;
        onChangeText(newText);
        addToHistory(newText);
      },
    },
    {
      id: 'quote',
      icon: 'chatbubble-outline',
      label: 'Quote',
      action: (textInputRef, value, onChangeText) => {
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];

        // Toggle quote
        if (currentLine.startsWith('> ')) {
          lines[currentLineIndex] = currentLine.substring(2);
        } else {
          lines[currentLineIndex] = `> ${currentLine}`;
        }

        const newText = lines.join('\n');
        onChangeText(newText);
        addToHistory(newText);
      },
    },
    {
      id: 'code',
      icon: 'code-slash',
      label: 'Code',
      action: (textInputRef, value, onChangeText) => {
        const before = value.substring(0, selectionStart);
        const selected = value.substring(selectionStart, selectionEnd);
        const after = value.substring(selectionEnd);

        if (selected.includes('\n')) {
          // Multi-line code block
          const newText = `${before}\`\`\`\n${selected || 'code here'}\n\`\`\`${after}`;
          onChangeText(newText);
        } else {
          // Inline code
          const newText = `${before}\`${selected || 'code'}\`${after}`;
          onChangeText(newText);
          addToHistory(newText);
        }
      },
    },
    {
      id: 'heading',
      icon: 'text-size',
      label: 'Heading',
      action: (textInputRef, value, onChangeText) => {
        const lines = value.split('\n');
        const currentLineIndex = value.substring(0, selectionStart).split('\n').length - 1;
        const currentLine = lines[currentLineIndex];

        // Cycle through heading levels
        if (currentLine.startsWith('### ')) {
          lines[currentLineIndex] = currentLine.substring(4);
        } else if (currentLine.startsWith('## ')) {
          lines[currentLineIndex] = `### ${currentLine.substring(3)}`;
        } else if (currentLine.startsWith('# ')) {
          lines[currentLineIndex] = `## ${currentLine.substring(2)}`;
        } else {
          lines[currentLineIndex] = `# ${currentLine}`;
        }

        const newText = lines.join('\n');
        onChangeText(newText);
        addToHistory(newText);
      },
    },
    {
      id: 'clear',
      icon: 'trash',
      label: 'Clear',
      action: (textInputRef, value, onChangeText) => {
        onChangeText('');
        addToHistory('');
      },
    },
  ], [historyStack, historyIndex, selectionStart, selectionEnd, addToHistory]);

  // Content height calculation
  const handleContentSizeChange = useCallback((event: any) => {
    const newHeight = Math.max(
      minHeight,
      Math.min(maxHeight, event.nativeEvent.contentSize.height + 20)
    );
    setContentHeight(newHeight);
  }, [minHeight, maxHeight]);

  // Focus handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();

    // Auto-expand to fullscreen on mobile when user clicks into the input
    if (isMobile && allowFullscreen && autoExpandOnFocus) {
      // Small delay to ensure the focus event is processed first
      setTimeout(() => setIsFullscreen(true), 100);
    }
  }, [onFocus, allowFullscreen, autoExpandOnFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  // Selection tracking
  const handleSelectionChange = useCallback((event: any) => {
    const { start, end } = event.nativeEvent.selection;
    setSelectionStart(start);
    setSelectionEnd(end);
  }, []);

  // Text change with history
  const handleTextChange = useCallback((text: string) => {
    onChangeText(text);

    // Add to history if significant change (prevent spam from typing)
    const currentTime = Date.now();
    const lastTime = (handleTextChange as any).lastTime || 0;

    if (currentTime - lastTime > 1000) { // 1 second debounce
      addToHistory(text);
      (handleTextChange as any).lastTime = currentTime;
    }
  }, [onChangeText, addToHistory]);

  // Keyboard shortcuts handler
  const handleKeyPress = useCallback((event: any) => {
    if (Platform.OS === 'web') {
      const { key, metaKey, ctrlKey, shiftKey } = event.nativeEvent;
      const isCmd = Platform.OS === 'web' ? (metaKey || ctrlKey) : metaKey;

      if (isCmd) {
        switch (key) {
          case 'z':
            event.preventDefault();
            if (shiftKey) {
              // Redo
              if (historyIndex < historyStack.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                onChangeText(historyStack[newIndex]);
              }
            } else {
              // Undo
              if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                onChangeText(historyStack[newIndex]);
              }
            }
            break;
          case 'b':
            event.preventDefault();
            toolbarActions.find(action => action.id === 'bold')?.action(
              isFullscreen ? fullscreenInputRef : textInputRef,
              value,
              handleTextChange
            );
            break;
          case 'i':
            event.preventDefault();
            toolbarActions.find(action => action.id === 'italic')?.action(
              isFullscreen ? fullscreenInputRef : textInputRef,
              value,
              handleTextChange
            );
            break;
          case 'k':
            event.preventDefault();
            toolbarActions.find(action => action.id === 'link')?.action(
              isFullscreen ? fullscreenInputRef : textInputRef,
              value,
              handleTextChange
            );
            break;
        }
      }
    }
  }, [historyStack, historyIndex, value, onChangeText, toolbarActions, isFullscreen, handleTextChange]);

  // Animation for fullscreen
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isFullscreen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isFullscreen, fadeAnim]);

  // Line numbers renderer
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

  // Statistics renderer
  const renderStats = () => {
    if (!showCharacterCount && !showWordCount) return null;

    const stats = [];
    if (showCharacterCount) {
      const charText = maxLength
        ? `${characterCount}/${maxLength} chars`
        : `${characterCount} chars`;
      stats.push(charText);
    }
    if (showWordCount) stats.push(`${wordCount} words`);
    stats.push(`${lineCount} lines`);

    return (
      <View style={styles.statsContainer}>
        <Text style={[
          styles.statsText,
          { color: isOverLimit ? colors.errorText : colors.stats }
        ]}>
          {stats.join(' • ')}
        </Text>
      </View>
    );
  };

  // Toolbar renderer
  const renderToolbar = () => {
    if (!showToolbar || !isFullscreen) return null;

    // Group actions for better mobile layout
    const primaryActions = toolbarActions.slice(0, 6); // Most used actions
    const secondaryActions = toolbarActions.slice(6); // Additional actions

    return (
      <View style={[styles.toolbar, {
        backgroundColor: colors.toolbarBg,
        borderTopColor: colors.toolbarBorder,
      }]}>
        {/* Primary toolbar row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.toolbarContent}
        >
          {primaryActions.map((action) => {
            const isDisabled = (action.id === 'undo' && historyIndex === 0) ||
                              (action.id === 'redo' && historyIndex === historyStack.length - 1);

            return (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.toolbarButton,
                  { opacity: isDisabled ? 0.5 : 1 },
                  isMobile && styles.mobileToolbarButton
                ]}
                onPress={() => action.action(fullscreenInputRef, value, handleTextChange)}
                disabled={isDisabled}
                accessible={true}
                accessibilityLabel={action.label}
                accessibilityHint={action.shortcut ? `Keyboard shortcut: ${action.shortcut}` : undefined}
                accessibilityRole="button"
                accessibilityState={{ disabled: isDisabled }}
              >
                <Ionicons
                  name={action.icon as any}
                  size={isMobile ? 18 : 20}
                  color={isDisabled ? appColors.textTertiary : appColors.accent}
                />
                {!isMobile && <Text style={styles.toolbarButtonText}>{action.label}</Text>}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Secondary toolbar row for additional actions */}
        {secondaryActions.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.secondaryToolbarContent}
          >
            {secondaryActions.map((action) => {
              const isDisabled = action.id === 'clear' && !value.trim();

              return (
                <TouchableOpacity
                  key={action.id}
                  style={[
                    styles.secondaryToolbarButton,
                    { opacity: isDisabled ? 0.5 : 1 },
                    isMobile && styles.mobileSecondaryToolbarButton
                  ]}
                  onPress={() => action.action(fullscreenInputRef, value, handleTextChange)}
                  disabled={isDisabled}
                  accessible={true}
                  accessibilityLabel={action.label}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isDisabled }}
                >
                  <Ionicons
                    name={action.icon as any}
                    size={isMobile ? 16 : 18}
                    color={isDisabled ? appColors.textTertiary : appColors.textSecondary}
                  />
                  {!isMobile && <Text style={styles.secondaryToolbarButtonText}>{action.label}</Text>}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  // Helper text renderer
  const renderHelperText = () => {
    if (!helperText && !errorMessage && !isOverLimit) return null;

    const text = errorMessage || (isOverLimit ? 'Character limit exceeded' : helperText);
    const textColor = hasError ? colors.errorText : colors.helperText;

    return (
      <View style={styles.helperContainer}>
        <Text style={[styles.helperText, { color: textColor }]}>
          {text}
        </Text>
      </View>
    );
  };

  // Compact editor renderer
  const renderCompactEditor = () => (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: colors.text }]}>
            {label}
            {required && <Text style={styles.requiredIndicator}> *</Text>}
          </Text>
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
            borderColor: hasError ? colors.errorBorder :
                        isFocused ? colors.focusBorder : colors.border,
            minHeight: contentHeight,
          },
          isFocused && styles.focusedContainer,
          hasError && styles.errorContainer,
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
            onChangeText={handleTextChange}
            placeholder={placeholder}
            placeholderTextColor={colors.placeholder}
            multiline
            autoFocus={autoFocus}
            editable={editable}
            textAlignVertical="top"
            onFocus={handleFocus}
            onBlur={handleBlur}
            onContentSizeChange={handleContentSizeChange}
            onSelectionChange={handleSelectionChange}
            onKeyPress={handleKeyPress}
            scrollEnabled={contentHeight >= maxHeight}
            returnKeyType="default"
            blurOnSubmit={false}
            maxLength={maxLength}
            // Accessibility
            accessible={true}
            accessibilityLabel={label || 'Text editor'}
            accessibilityHint={helperText || 'Enter your text here'}
            accessibilityRole="text"
          />
        </View>
      </View>

      {renderStats()}
      {renderHelperText()}
    </View>
  );

  // Fullscreen editor renderer
  const renderFullscreenEditor = () => (
    <Modal
      visible={isFullscreen}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => setIsFullscreen(false)}
    >
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      <SafeAreaView style={[styles.fullscreenContainer, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView
          style={styles.fullscreenKeyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.fullscreenHeader, { backgroundColor: colors.headerBg }]}>
            <View style={styles.headerLeft}>
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setIsFullscreen(false)}
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
                ref={fullscreenInputRef}
                style={[
                  styles.fullscreenTextInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                  },
                  textStyle,
                ]}
                value={value}
                onChangeText={handleTextChange}
                placeholder={placeholder}
                placeholderTextColor={colors.placeholder}
                multiline
                autoFocus
                editable={editable}
                textAlignVertical="top"
                onSelectionChange={handleSelectionChange}
                onKeyPress={handleKeyPress}
                scrollEnabled
                returnKeyType="default"
                blurOnSubmit={false}
                maxLength={maxLength}
                // Accessibility
                accessible={true}
                accessibilityLabel={`${label || 'Text editor'} - Full screen mode`}
                accessibilityHint="Use the toolbar below for formatting options"
                accessibilityRole="text"
              />
            </View>
          </View>

          {/* Toolbar */}
          {renderToolbar()}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <>
      {renderCompactEditor()}
      {renderFullscreenEditor()}
    </>
  );
};

export default EnhancedTextEditor;
