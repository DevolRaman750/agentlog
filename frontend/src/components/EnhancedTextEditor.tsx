import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  StatusBar,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { webInputStyles } from '../styles/containers';

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

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isTablet = screenWidth >= 768;
const isMobile = screenWidth < 768;

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
  const themeColors = {
    light: {
      background: '#FFFFFF',
      border: '#E5E5EA',
      focusBorder: '#007AFF',
      errorBorder: '#FF3B30',
      text: '#1A1A1A',
      placeholder: '#8E8E93',
      lineNumbers: '#C7C7CC',
      lineNumberBg: '#F8F9FA',
      stats: '#6B6B6B',
      headerBg: '#F8F9FA',
      toolbarBg: '#FFFFFF',
      toolbarBorder: '#E5E5EA',
      shadowColor: '#000',
      overlayBg: 'rgba(0, 0, 0, 0.4)',
      helperText: '#6B6B6B',
      errorText: '#FF3B30',
    },
    dark: {
      background: '#1C1C1E',
      border: '#38383A',
      focusBorder: '#0A84FF',
      errorBorder: '#FF453A',
      text: '#FFFFFF',
      placeholder: '#8E8E93',
      lineNumbers: '#8E8E93',
      lineNumberBg: '#2C2C2E',
      stats: '#8E8E93',
      headerBg: '#2C2C2E',
      toolbarBg: '#1C1C1E',
      toolbarBorder: '#38383A',
      shadowColor: '#FFF',
      overlayBg: 'rgba(255, 255, 255, 0.1)',
      helperText: '#8E8E93',
      errorText: '#FF453A',
    },
  };

  const colors = themeColors[theme];

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
                  color={isDisabled ? "#C7C7CC" : "#007AFF"} 
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
                    color={isDisabled ? "#C7C7CC" : "#6B6B6B"} 
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
              <Ionicons name="expand-outline" size={16} color="#007AFF" />
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
                <Ionicons name="chevron-down" size={24} color="#007AFF" />
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  requiredIndicator: {
    color: '#FF3B30',
    fontWeight: '700',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    gap: 4,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  editorContainer: {
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  focusedContainer: {
    ...Platform.select({
      ios: {
        shadowOpacity: 0.15,
        shadowRadius: 5,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  errorContainer: {
    ...Platform.select({
      ios: {
        shadowColor: '#FF3B30',
        shadowOpacity: 0.15,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  editorContent: {
    flexDirection: 'row',
    flex: 1,
  },
  lineNumberContainer: {
    minWidth: 40,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  lineNumberContent: {
    alignItems: 'flex-end',
  },
  lineNumber: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 22,
    marginBottom: 0,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    ...webInputStyles,
  },
  statsContainer: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  statsText: {
    fontSize: 12,
    fontWeight: '500',
  },
  helperContainer: {
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    minHeight: 60,
  },
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerTitle: {
    flex: 2,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fullscreenEditorContainer: {
    flex: 1,
  },
  fullscreenEditorContent: {
    flex: 1,
    flexDirection: 'row',
  },
  fullscreenLineNumbers: {
    width: 60,
    paddingHorizontal: 8,
    paddingVertical: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  fullscreenLineNumber: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 22,
    textAlign: 'right',
  },
  fullscreenTextInput: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Text' : 'Roboto',
    ...webInputStyles,
  },

  // Toolbar styles
  toolbar: {
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  toolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 4,
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    gap: 4,
    minWidth: 70,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  mobileToolbarButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    minWidth: 40,
    borderRadius: 6,
  },
  toolbarButtonText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  secondaryToolbarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 8,
  },
  secondaryToolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    gap: 3,
    minWidth: 55,
  },
  mobileSecondaryToolbarButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    minWidth: 32,
    borderRadius: 4,
  },
  secondaryToolbarButtonText: {
    fontSize: 11,
    color: '#6B6B6B',
    fontWeight: '400',
  },
});

export default EnhancedTextEditor;