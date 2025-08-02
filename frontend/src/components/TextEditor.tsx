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
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { webInputStyles } from '../styles/containers';

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
  language?: 'plain' | 'markdown' | 'json';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [contentHeight, setContentHeight] = useState(minHeight);
  const textInputRef = useRef<TextInput>(null);

  const lines = value.split('\n');
  const characterCount = value.length;
  const wordCount = value.trim() === '' ? 0 : value.trim().split(/\s+/).length;
  const lineCount = lines.length;

  const themeColors = {
    light: {
      background: '#FFFFFF',
      border: '#E5E5EA',
      focusBorder: '#007AFF',
      text: '#1A1A1A',
      placeholder: '#8E8E93',
      lineNumbers: '#C7C7CC',
      lineNumberBg: '#F8F9FA',
      stats: '#6B6B6B',
      headerBg: '#F8F9FA',
      shadowColor: '#000',
    },
    dark: {
      background: '#1C1C1E',
      border: '#38383A',
      focusBorder: '#0A84FF',
      text: '#FFFFFF',
      placeholder: '#8E8E93',
      lineNumbers: '#8E8E93',
      lineNumberBg: '#2C2C2E',
      stats: '#8E8E93',
      headerBg: '#2C2C2E',
      shadowColor: '#FFF',
    },
  };

  const colors = themeColors[theme];

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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  focusedContainer: {
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
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
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
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
    backgroundColor: '#FFFFFF',
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
    fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace',
    ...webInputStyles,
  },
});

export default TextEditor; 