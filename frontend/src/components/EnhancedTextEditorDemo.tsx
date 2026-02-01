import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EnhancedTextEditor from './EnhancedTextEditor';
import ScreenContainer from './ScreenContainer';
import { useTheme, useThemedStyles } from '../theme';

/**
 * Demo component showcasing the EnhancedTextEditor capabilities
 * This demonstrates all the features and use cases for the text editor
 */
const EnhancedTextEditorDemo: React.FC = () => {
  const { colors } = useTheme();
  const [basicText, setBasicText] = useState('');
  const [promptText, setPromptText] = useState(
    `Write a compelling product description for a sustainable water bottle.

Key requirements:
- Highlight eco-friendly features
- Target environmentally conscious consumers
- Include technical specifications
- Mention durability and design`
  );
  const [markdownText, setMarkdownText] = useState(
    `# Product Launch Strategy

## Overview
This document outlines our approach for the upcoming product launch.

### Key Features
- **Sustainability**: 100% recycled materials
- **Design**: Minimalist aesthetic
- **Functionality**: Advanced temperature control

### Target Audience
Our primary audience consists of:
1. Environmentally conscious consumers
2. Tech-savvy millennials
3. Outdoor enthusiasts

> **Note**: All features have been thoroughly tested and validated.

\`\`\`
Technical specifications:
- Material: Recycled stainless steel
- Capacity: 750ml
- Insulation: Double-wall vacuum
\`\`\`

For more information, visit [our website](https://example.com).`
  );
  const [contextText, setContextText] = useState('');

  // Demo settings
  const [showLineNumbers, setShowLineNumbers] = useState(false);
  const [showToolbar, setShowToolbar] = useState(true);
  const [enableMarkdown, setEnableMarkdown] = useState(true);
  const [autoExpandOnFocus, setAutoExpandOnFocus] = useState(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const styles = useThemedStyles((colors) => ({
    container: {
      padding: 16,
      paddingBottom: 40,
    },
    header: {
      marginBottom: 24,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    settingsPanel: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    settingsTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    settingRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    settingLabel: {
      fontSize: 16,
      color: colors.textPrimary,
      flex: 1,
    },
    themeToggle: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgSurface,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      gap: 6,
    },
    themeToggleText: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: '500' as const,
    },
    demoSection: {
      marginBottom: 32,
    },
    sectionHeader: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    sectionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    sectionContent: {
      // Content will be styled by the text editor component
    },
    featuresSection: {
      marginTop: 32,
      marginBottom: 32,
    },
    featuresTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    featuresList: {
      gap: 12,
    },
    featureItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    featureText: {
      fontSize: 14,
      color: colors.textPrimary,
      flex: 1,
    },
    tipsSection: {
      backgroundColor: colors.bgSurface,
      borderRadius: 12,
      padding: 16,
      marginTop: 16,
    },
    tipsTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    tipsList: {
      gap: 16,
    },
    tipItem: {
      // Individual tip styling
    },
    tipTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    tipText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
  }));

  const demoSections = [
    {
      title: 'Basic Text Input',
      description: 'Simple text editor with basic functionality',
      component: (
        <EnhancedTextEditor
          value={basicText}
          onChangeText={setBasicText}
          placeholder="Start typing your text here..."
          label="Basic Text Editor"
          minHeight={100}
          maxHeight={200}
          allowFullscreen={true}
          showCharacterCount={true}
          showWordCount={true}
          showLineNumbers={showLineNumbers}
          showToolbar={false}
          theme={theme}
          autoExpandOnFocus={autoExpandOnFocus}
          helperText="This is a basic text editor with auto-resize and character counting"
        />
      )
    },
    {
      title: 'AI Prompt Editor',
      description: 'Enhanced editor for AI prompts with all features enabled',
      component: (
        <EnhancedTextEditor
          value={promptText}
          onChangeText={setPromptText}
          placeholder="Describe what you want the AI to do..."
          label="AI Prompt"
          minHeight={150}
          maxHeight={400}
          allowFullscreen={true}
          showCharacterCount={true}
          showWordCount={true}
          showLineNumbers={showLineNumbers}
          showToolbar={showToolbar}
          enableMarkdown={enableMarkdown}
          theme={theme}
          autoExpandOnFocus={autoExpandOnFocus}
          required={true}
          helperText="Write clear, detailed instructions for the AI. Use the toolbar for formatting."
        />
      )
    },
    {
      title: 'Markdown Editor',
      description: 'Full-featured editor with markdown support and toolbar',
      component: (
        <EnhancedTextEditor
          value={markdownText}
          onChangeText={setMarkdownText}
          placeholder="Write your markdown content..."
          label="Markdown Document"
          minHeight={200}
          maxHeight={500}
          allowFullscreen={true}
          showCharacterCount={true}
          showWordCount={true}
          showLineNumbers={showLineNumbers}
          showToolbar={showToolbar}
          enableMarkdown={true}
          theme={theme}
          autoExpandOnFocus={autoExpandOnFocus}
          language="markdown"
          helperText="Full markdown support with syntax highlighting and formatting tools"
        />
      )
    },
    {
      title: 'Context Editor',
      description: 'Editor for additional context with character limits',
      component: (
        <EnhancedTextEditor
          value={contextText}
          onChangeText={setContextText}
          placeholder="Provide additional context, constraints, or requirements..."
          label="Additional Context"
          minHeight={120}
          maxHeight={300}
          allowFullscreen={true}
          showCharacterCount={true}
          showWordCount={false}
          showLineNumbers={false}
          showToolbar={showToolbar}
          enableMarkdown={enableMarkdown}
          theme={theme}
          autoExpandOnFocus={autoExpandOnFocus}
          maxLength={1000}
          helperText="Provide any additional context that might help improve the results"
        />
      )
    }
  ];

  return (
    <ScreenContainer
      enableKeyboardAvoiding={true}
      enableScrolling={true}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Enhanced Text Editor Demo</Text>
          <Text style={styles.subtitle}>
            Explore the features of our enhanced text editor component designed for mobile and web
          </Text>
        </View>

        {/* Settings Panel */}
        <View style={styles.settingsPanel}>
          <Text style={styles.settingsTitle}>Demo Settings</Text>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Show Line Numbers</Text>
            <Switch
              value={showLineNumbers}
              onValueChange={setShowLineNumbers}
              trackColor={{ false: colors.textTertiary, true: colors.accent }}
              thumbColor={colors.bgCard}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Show Toolbar</Text>
            <Switch
              value={showToolbar}
              onValueChange={setShowToolbar}
              trackColor={{ false: colors.textTertiary, true: colors.accent }}
              thumbColor={colors.bgCard}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Enable Markdown</Text>
            <Switch
              value={enableMarkdown}
              onValueChange={setEnableMarkdown}
              trackColor={{ false: colors.textTertiary, true: colors.accent }}
              thumbColor={colors.bgCard}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Auto-Expand on Focus</Text>
            <Switch
              value={autoExpandOnFocus}
              onValueChange={setAutoExpandOnFocus}
              trackColor={{ false: colors.textTertiary, true: colors.accent }}
              thumbColor={colors.bgCard}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Theme</Text>
            <TouchableOpacity
              style={styles.themeToggle}
              onPress={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              <Ionicons
                name={theme === 'light' ? 'sunny' : 'moon'}
                size={16}
                color={theme === 'light' ? colors.accentSecondary : colors.accent}
              />
              <Text style={styles.themeToggleText}>
                {theme === 'light' ? 'Light' : 'Dark'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Demo Sections */}
        {demoSections.map((section, index) => (
          <View key={index} style={styles.demoSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.sectionDescription}>{section.description}</Text>
            </View>

            <View style={styles.sectionContent}>
              {section.component}
            </View>
          </View>
        ))}

        {/* Features List */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Key Features</Text>

          <View style={styles.featuresList}>
            {[
              { icon: 'phone-portrait', text: 'Mobile-first full-screen editing experience' },
              { icon: 'expand', text: 'Auto-expand to full-screen on focus (mobile)' },
              { icon: 'build', text: 'Rich toolbar with formatting actions' },
              { icon: 'resize', text: 'Smart auto-resize based on content' },
              { icon: 'devices', text: 'Responsive design for all screen sizes' },
              { icon: 'accessibility', text: 'Full accessibility support' },
              { icon: 'flash', text: 'Keyboard shortcuts for power users' },
              { icon: 'time', text: 'Undo/redo history management' },
              { icon: 'stats-chart', text: 'Real-time character and word counting' },
              { icon: 'code-slash', text: 'Markdown support with syntax highlighting' },
              { icon: 'color-palette', text: 'Light and dark theme support' }
            ].map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <Ionicons name={feature.icon as any} size={20} color={colors.accent} />
                <Text style={styles.featureText}>{feature.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Usage Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Usage Tips</Text>

          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <Text style={styles.tipTitle}>📱 Mobile Experience</Text>
              <Text style={styles.tipText}>
                On mobile devices, the editor automatically expands to full-screen when you tap into any text field, providing a distraction-free editing experience with toolbar.
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipTitle}>⌨️ Keyboard Shortcuts</Text>
              <Text style={styles.tipText}>
                Use Cmd+B for bold, Cmd+I for italic, Cmd+K for links, and Cmd+Z for undo/redo (web only).
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipTitle}>🎨 Formatting Tools</Text>
              <Text style={styles.tipText}>
                The toolbar provides quick access to common formatting like bold, italic, lists, quotes, and code blocks.
              </Text>
            </View>

            <View style={styles.tipItem}>
              <Text style={styles.tipTitle}>♿ Accessibility</Text>
              <Text style={styles.tipText}>
                Full screen reader support with proper labels, hints, and keyboard navigation for all interactive elements.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
};

export default EnhancedTextEditorDemo;
