import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import TextEditor from './TextEditor';
import { useThemedStyles, spacing, typography } from '../theme';

const TextEditorExample: React.FC = () => {
  const [prompt, setPrompt] = useState('Create a comprehensive marketing plan for a sustainable tech startup.\n\nInclude the following sections:\n- Executive Summary\n- Market Analysis\n- Target Audience\n- Marketing Strategies\n- Budget Allocation\n- Success Metrics');

  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant specialized in marketing and business strategy.\n\nPlease provide detailed, actionable advice based on current market trends and best practices.');

  const [description, setDescription] = useState('Marketing plan generation test');

  const [codeExample, setCodeExample] = useState(`function generatePlan(input) {
  // Process the marketing requirements
  const sections = [
    'executive-summary',
    'market-analysis',
    'target-audience',
    'strategies',
    'budget',
    'metrics'
  ];

  return sections.map(section => ({
    name: section,
    content: processSection(input, section)
  }));
}`);

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: 100,
    },
    title: {
      ...typography.display,
      color: colors.textPrimary,
      marginBottom: spacing.xxl,
      textAlign: 'center' as const,
    },
    section: {
      marginBottom: spacing.xxl,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>TextEditor Component Examples</Text>

      {/* Main Prompt Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Main Prompt (Full Features)</Text>
        <TextEditor
          label="🚀 AI Prompt"
          value={prompt}
          onChangeText={setPrompt}
          placeholder="Enter your prompt here..."
          minHeight={150}
          maxHeight={400}
          allowFullscreen={true}
          showCharacterCount={true}
          showWordCount={true}
          showLineNumbers={false}
        />
      </View>

      {/* System Prompt with Line Numbers */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Prompt (With Line Numbers)</Text>
        <TextEditor
          label="🤖 System Instructions"
          value={systemPrompt}
          onChangeText={setSystemPrompt}
          placeholder="Enter system instructions..."
          minHeight={120}
          maxHeight={300}
          allowFullscreen={true}
          showCharacterCount={true}
          showWordCount={true}
          showLineNumbers={true}
        />
      </View>

      {/* Compact Description */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Description (Compact)</Text>
        <TextEditor
          label="📝 Notes"
          value={description}
          onChangeText={setDescription}
          placeholder="Brief description..."
          minHeight={60}
          maxHeight={150}
          allowFullscreen={false}
          showCharacterCount={false}
          showWordCount={false}
          showLineNumbers={false}
        />
      </View>

      {/* Code Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Code Editor (Monospace)</Text>
        <TextEditor
          label="💻 Code"
          value={codeExample}
          onChangeText={setCodeExample}
          placeholder="Enter code..."
          minHeight={200}
          maxHeight={500}
          allowFullscreen={true}
          showCharacterCount={true}
          showWordCount={false}
          showLineNumbers={true}
          language="json"
        />
      </View>

      {/* Dark Theme Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dark Theme</Text>
        <TextEditor
          label="🌙 Dark Mode Editor"
          value="This is a dark theme example.\n\nYou can use this for code editing or when you prefer a darker interface."
          onChangeText={() => {}}
          placeholder="Enter text..."
          minHeight={100}
          maxHeight={200}
          allowFullscreen={true}
          showCharacterCount={true}
          showWordCount={true}
          showLineNumbers={true}
          theme="dark"
        />
      </View>

      {/* Read-only Example */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Read-only Display</Text>
        <TextEditor
          label="📖 Read-only Content"
          value="This is read-only content.\n\nUsers can view and copy this text but cannot edit it.\n\nPerfect for displaying generated content or templates."
          onChangeText={() => {}}
          placeholder=""
          minHeight={100}
          maxHeight={200}
          allowFullscreen={true}
          showCharacterCount={true}
          showWordCount={true}
          showLineNumbers={false}
          editable={false}
        />
      </View>
    </ScrollView>
  );
};

export default TextEditorExample;
