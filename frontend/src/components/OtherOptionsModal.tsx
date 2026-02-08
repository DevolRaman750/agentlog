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
import { useTheme, useThemedStyles } from '../theme';

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
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerButton: {
      padding: 8,
      minWidth: 60,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    doneButton: {
      alignItems: 'flex-end' as const,
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    subtitle: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    subtitleText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    selectionInfo: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
    },
    selectionCount: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.statusWarning,
      backgroundColor: `${colors.statusWarning}15`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    controls: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
    },
    clearButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: `${colors.statusError}15`,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: `${colors.statusError}40`,
      gap: 6,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.statusError,
    },
    scrollContent: {
      flex: 1,
    },
    scrollContentContainer: {
      padding: 16,
    },
    fieldContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    fieldHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    fieldLabelContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    fieldDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.bgSurface,
    },
    characterCount: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'right' as const,
      marginTop: 4,
    },
    tipsContainer: {
      backgroundColor: `${colors.statusWarning}15`,
      borderRadius: 12,
      padding: 16,
      marginTop: 8,
      borderWidth: 1,
      borderColor: `${colors.statusWarning}40`,
    },
    tipsHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
      gap: 8,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.statusWarning,
    },
    tipsList: {
      gap: 8,
    },
    tipItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 8,
    },
    tipBullet: {
      fontSize: 16,
      color: colors.statusWarning,
      fontWeight: 'bold' as const,
      marginTop: 2,
    },
    tipText: {
      flex: 1,
      fontSize: 14,
      color: colors.statusWarning,
      lineHeight: 20,
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
                <TouchableOpacity onPress={() => onExecutionNameChange('')}>
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
                <TouchableOpacity onPress={() => onDescriptionChange('')}>
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
                <TouchableOpacity onPress={() => onContextChange('')}>
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
