import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import EnhancedTextEditor from './EnhancedTextEditor';
import { useResponsive } from '../context/ResponsiveContext';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

interface OtherOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  executionName: string;
  description: string;
  context: string;
  onExecutionNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onContextChange: (value: string) => void;
  defaultExecutionName?: string;
}

const OtherOptionsModal: React.FC<OtherOptionsModalProps> = ({
  visible,
  onClose,
  executionName,
  description,
  context,
  onExecutionNameChange,
  onDescriptionChange,
  onContextChange,
  defaultExecutionName,
}) => {
  const { colors } = useTheme();
  const { screenWidth } = useResponsive();

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerButton: {
      padding: spacing.sm,
      minWidth: 60,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    doneButton: {
      alignItems: 'flex-end' as const,
    },
    doneButtonText: {
      ...typography.title,
      color: colors.accent,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    subtitle: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    subtitleText: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    selectionInfo: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
    },
    selectionCount: {
      ...typography.bodyStrong,
      color: colors.statusWarning,
      backgroundColor: `${colors.statusWarning}15`,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    controls: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
    },
    clearButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: `${colors.statusError}15`,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: `${colors.statusError}40`,
      gap: spacing.sm,
    },
    clearButtonText: {
      ...typography.label,
      color: colors.statusError,
    },
    scrollContent: {
      flex: 1,
    },
    scrollContentContainer: {
      padding: spacing.lg,
    },
    fieldContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    fieldHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    fieldLabelContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    fieldLabel: {
      ...typography.title,
      color: colors.textPrimary,
    },
    fieldDescription: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      padding: spacing.md,
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      backgroundColor: colors.bgSurface,
    },
    characterCount: {
      ...typography.caption,
      color: colors.textTertiary,
      textAlign: 'right' as const,
      marginTop: spacing.xs,
    },
    tipsContainer: {
      backgroundColor: `${colors.statusWarning}15`,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.sm,
      borderWidth: 1,
      borderColor: `${colors.statusWarning}40`,
    },
    tipsHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    tipsTitle: {
      ...typography.title,
      color: colors.statusWarning,
    },
    tipsList: {
      gap: spacing.sm,
    },
    tipItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: spacing.sm,
    },
    tipBullet: {
      ...typography.title,
      color: colors.statusWarning,
      fontWeight: 'bold' as const,
      marginTop: 2,
    },
    tipText: {
      flex: 1,
      ...typography.body,
      color: colors.statusWarning,
    },
  }));

  const getFilledOptionsCount = () => {
    let count = 0;
    if (executionName?.trim()) count++;
    if (description?.trim()) count++;
    if (context?.trim()) count++;
    return count;
  };

  const clearAllFields = () => {
    onExecutionNameChange('');
    onDescriptionChange('');
    onContextChange('');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.accent} />
          </TouchableOpacity>

          <Text style={styles.title}>Other Options</Text>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.headerButton, styles.doneButton]}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Subtitle and info */}
        <View style={styles.subtitle}>
          <Text style={styles.subtitleText}>
            Add optional details to customize your execution
          </Text>

          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {getFilledOptionsCount()} filled
            </Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={clearAllFields} style={styles.clearButton}>
            <Ionicons name="refresh" size={16} color={colors.statusError} />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Execution Name */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldLabelContainer}>
                <Ionicons name="bookmark" size={18} color={colors.statusWarning} />
                <Text style={styles.fieldLabel}>Execution Name</Text>
              </View>

              {executionName?.trim() && (
                <TouchableOpacity
                  onPress={() => onExecutionNameChange('')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.fieldDescription}>
              Give this execution a memorable name for easy identification in your history
            </Text>

            <TextInput
              style={styles.textInput}
              value={executionName}
              onChangeText={onExecutionNameChange}
              placeholder={defaultExecutionName || 'My AI Execution'}
              placeholderTextColor={colors.textTertiary}
              multiline={false}
            />

            <Text style={styles.characterCount}>
              {executionName?.length || 0}/100 characters
            </Text>
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldLabelContainer}>
                <Ionicons name="document-text" size={18} color={colors.statusWarning} />
                <Text style={styles.fieldLabel}>Description</Text>
              </View>

              {description?.trim() && (
                <TouchableOpacity
                  onPress={() => onDescriptionChange('')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <EnhancedTextEditor
              value={description}
              onChangeText={onDescriptionChange}
              placeholder="Notes about this execution..."
              label="Description"
              minHeight={100}
              maxHeight={250}
              allowFullscreen={true}
              showCharacterCount={true}
              showWordCount={false}
              showLineNumbers={false}
              showToolbar={true}
              enableMarkdown={true}
              helperText="Add notes about this execution - what you're testing, why, or what you expect"
            />
          </View>

          {/* Additional Context */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldLabelContainer}>
                <Ionicons name="information-circle" size={18} color={colors.statusWarning} />
                <Text style={styles.fieldLabel}>Additional Context</Text>
              </View>

              {context?.trim() && (
                <TouchableOpacity
                  onPress={() => onContextChange('')}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <EnhancedTextEditor
              value={context}
              onChangeText={onContextChange}
              placeholder="Target audience, tone, constraints, etc..."
              label="Additional Context"
              minHeight={120}
              maxHeight={300}
              allowFullscreen={true}
              showCharacterCount={true}
              showWordCount={true}
              showLineNumbers={false}
              showToolbar={true}
              enableMarkdown={true}
              helperText="Provide additional context like target audience, tone, constraints, or special requirements"
            />
          </View>

          {/* Usage Tips */}
          <View style={styles.tipsContainer}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb" size={16} color={colors.statusWarning} />
              <Text style={styles.tipsTitle}>Tips</Text>
            </View>

            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Use descriptive names to easily find executions later
                </Text>
              </View>

              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Add context to help AI understand your specific requirements
                </Text>
              </View>

              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  All fields are optional - add only what's helpful for your use case
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default OtherOptionsModal;
