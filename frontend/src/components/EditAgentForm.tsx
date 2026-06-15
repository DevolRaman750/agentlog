import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { goGentAPI } from '../api/client';
import { AlertAPI } from './CustomAlert';
import AgentAvatar from './AgentAvatar';
import { Agent, AgentFormData, AgentFormErrors, LifecycleStatus, ExecutionTemplate } from '../types';
import { useTheme, useThemedStyles } from '../theme';
import { spacing, radius, typography } from '../theme';
import { useContainerStyles } from '../styles/useContainerStyles';

interface EditAgentFormProps {
  agent: Agent;
  onSuccess: () => void;
  onCancel: () => void;
}

interface TooltipProps {
  title: string;
  content: string;
  visible: boolean;
  onClose: () => void;
  themedStyles: any;
  colors: any;
}

const Tooltip: React.FC<TooltipProps> = ({ title, content, visible, onClose, themedStyles, colors }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <TouchableOpacity style={themedStyles.tooltipOverlay} onPress={onClose}>
      <View style={themedStyles.tooltipContainer}>
        <View style={themedStyles.tooltipHeader}>
          <Ionicons name="information-circle" size={24} color={colors.accent} />
          <Text style={themedStyles.tooltipTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={themedStyles.tooltipContent}>{content}</Text>
      </View>
    </TouchableOpacity>
  </Modal>
);

const EditAgentForm: React.FC<EditAgentFormProps> = ({ agent, onSuccess, onCancel }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { containerStyles, shadowPresets, textInputStyles } = useContainerStyles();
  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgApp,
    },
    loadingText: {
      marginTop: spacing.lg,
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
      paddingBottom: spacing.lg,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    title: {
      ...typography.display,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.sm,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    overviewSection: {
      marginBottom: spacing.xl,
    },
    overviewHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      backgroundColor: colors.bgCard,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    overviewTitle: {
      flex: 1,
      ...typography.title,
      color: colors.accent,
    },
    characterPreview: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    previewHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
      gap: spacing.sm,
    },
    previewTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    previewContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.lg,
    },
    previewText: {
      flex: 1,
    },
    previewName: {
      ...typography.h1,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    previewRole: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      fontStyle: 'italic' as const,
      marginBottom: spacing.sm,
    },
    previewChanges: {
      ...typography.bodyStrong,
      fontWeight: '500' as const,
      color: colors.accent,
    },
    section: {
      marginBottom: spacing.xl,
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      flex: 1,
      ...typography.h2,
      color: colors.textPrimary,
    },
    inputRow: {
      flexDirection: 'row' as const,
      gap: spacing.lg,
    },
    inputColumn: {
      flex: 1,
    },
    labelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    label: {
      ...typography.title,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    inputError: {
      borderColor: colors.statusError,
      borderWidth: 1,
    },
    errorText: {
      color: colors.statusError,
      ...typography.body,
      marginTop: spacing.xs,
    },
    selectorButton: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    selectorContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    selectorMain: {
      flex: 1,
    },
    selectorLabel: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    selectorValue: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    selectorPlaceholder: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textTertiary,
      marginBottom: spacing.xs,
    },
    selectorDescription: {
      ...typography.body,
      color: colors.textSecondary,
    },
    statusIndicator: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    footer: {
      flexDirection: 'row' as const,
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    cancelButton: {
      flex: 1,
      backgroundColor: colors.bgSurface,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    cancelButtonText: {
      ...typography.title,
      color: colors.textSecondary,
    },
    saveButton: {
      flex: 1,
      backgroundColor: colors.accent,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
    },
    saveButtonDisabled: {
      backgroundColor: colors.borderMedium,
    },
    saveButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
      paddingBottom: spacing.lg,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalTitle: {
      ...typography.h1,
      color: colors.textPrimary,
    },
    modalList: {
      padding: spacing.lg,
      gap: spacing.md,
    },
    templateCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    templateCardSelected: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    templateCardHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    templateCardName: {
      flex: 1,
      ...typography.title,
      color: colors.textPrimary,
    },
    templateBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    templateBadgeText: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    templateCardDescription: {
      ...typography.body,
      color: colors.textSecondary,
    },
    statusCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    statusCardSelected: {
      borderColor: colors.accent,
      borderWidth: 2,
    },
    statusCardContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.lg,
    },
    statusCardText: {
      flex: 1,
    },
    statusCardName: {
      ...typography.h2,
      marginBottom: spacing.xs,
    },
    statusCardDescription: {
      ...typography.body,
      color: colors.textSecondary,
    },
    tooltipOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
    },
    tooltipContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      maxWidth: '90%' as const,
    },
    tooltipHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    tooltipTitle: {
      flex: 1,
      ...typography.h2,
      color: colors.textPrimary,
    },
    tooltipContent: {
      ...typography.body,
      color: colors.textSecondary,
    },
    fieldHelpContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginTop: spacing.sm,
    },
    fieldHelp: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.sm,
      flex: 1,
    },
    manageTemplatesLink: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginLeft: spacing.sm,
      padding: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: colors.bgApp,
    },
    linkText: {
      ...typography.caption,
      fontWeight: '500' as const,
      color: colors.accent,
      marginLeft: spacing.xs,
    },
  }));

  const [formData, setFormData] = useState<AgentFormData>({
    firstName: agent.firstName,
    lastName: agent.lastName,
    templateId: agent.templateId,
    maxTokensPerDay: agent.maxTokensPerDay,
    heartbeatMinutes: agent.heartbeatMinutes,
    lifecycleStatus: agent.lifecycleStatus,
  });

  const [templates, setTemplates] = useState<ExecutionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<AgentFormErrors>({});

  // Modal states
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAgentTooltip, setShowAgentTooltip] = useState(false);
  const [showTemplateTooltip, setShowTemplateTooltip] = useState(false);
  const [showHeartbeatTooltip, setShowHeartbeatTooltip] = useState(false);
  const [showTokensTooltip, setShowTokensTooltip] = useState(false);
  const [showStatusTooltip, setShowStatusTooltip] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await goGentAPI.getTemplates();
      if (response.success && response.data?.templates) {
        setTemplates(response.data.templates);
      } else {
        AlertAPI.alert('Error', 'Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      AlertAPI.alert('Error', 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: AgentFormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.templateId) {
      newErrors.templateId = 'Archetype template selection is required';
    }

    if (formData.maxTokensPerDay < 1000) {
      newErrors.maxTokensPerDay = 'Minimum 1,000 tokens per day';
    }

    if (formData.heartbeatMinutes < 5) {
      newErrors.heartbeatMinutes = 'Minimum 5 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await goGentAPI.updateAgent(agent.id, formData);

      if (response.success) {
        AlertAPI.alert('Success', 'Agent updated successfully!', [
          { text: 'OK', onPress: onSuccess }
        ]);
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to update agent');
      }
    } catch (error) {
      console.error('Error updating agent:', error);
      AlertAPI.alert('Error', 'Failed to update agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof AgentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const getStatusInfo = (status: LifecycleStatus): { description: string; color: string; icon: string } => {
    switch (status) {
      case 'STANDBY':
        return {
          description: 'Testing mode - Logs actions but doesn\'t execute them',
          color: colors.statusWarning,
          icon: 'pause-circle'
        };
      case 'ACTIVE':
        return {
          description: 'Fully operational - Executes tasks according to schedule',
          color: colors.statusSuccess,
          icon: 'play-circle'
        };
      case 'PAUSED':
        return {
          description: 'Temporarily stopped - Can be resumed anytime',
          color: colors.textSecondary,
          icon: 'stop-circle'
        };
      case 'KILLED':
        return {
          description: 'Permanently disabled - Cannot be reactivated',
          color: colors.statusError,
          icon: 'close-circle'
        };
      default:
        return { description: '', color: colors.textSecondary, icon: 'help-circle' };
    }
  };

  const hasChanges = (): boolean => {
    return (
      formData.firstName !== agent.firstName ||
      formData.lastName !== agent.lastName ||
      formData.templateId !== agent.templateId ||
      formData.maxTokensPerDay !== agent.maxTokensPerDay ||
      formData.heartbeatMinutes !== agent.heartbeatMinutes ||
      formData.lifecycleStatus !== agent.lifecycleStatus
    );
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);
  const statusInfo = getStatusInfo(formData.lifecycleStatus);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="pencil" size={28} color={colors.accent} />
          <Text style={styles.title}>Edit Agent</Text>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Agent Overview Tooltip */}
        <View style={styles.overviewSection}>
          <TouchableOpacity
            style={styles.overviewHeader}
            onPress={() => setShowAgentTooltip(true)}
          >
            <Ionicons name="information-circle-outline" size={20} color={colors.accent} />
            <Text style={styles.overviewTitle}>About Agent Editing</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Character Preview */}
        <View style={styles.characterPreview}>
          <View style={styles.previewHeader}>
            <Ionicons name="sparkles" size={20} color={colors.accent} />
            <Text style={styles.previewTitle}>Character Profile</Text>
          </View>
          <View style={styles.previewContent}>
            <AgentAvatar
              agent={{
                firstName: formData.firstName || agent.firstName,
                lastName: formData.lastName || agent.lastName,
                lifecycleStatus: formData.lifecycleStatus,
                templateName: selectedTemplate?.name || agent.templateName
              }}
              size="xl"
              showStatus={true}
              animated={true}
            />
            <View style={styles.previewText}>
              <Text style={styles.previewName}>
                {formData.firstName} {formData.lastName}
              </Text>
              <Text style={styles.previewRole}>
                {selectedTemplate?.name || agent.templateName}
              </Text>
              <Text style={styles.previewChanges}>
                {hasChanges() ? '✨ Changes pending' : '✓ All saved'}
              </Text>
            </View>
          </View>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Basic Information</Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={[textInputStyles.base, errors.firstName && styles.inputError]}
                value={formData.firstName}
                onChangeText={(value) => updateFormData('firstName', value)}
                placeholder="Enter first name"
                placeholderTextColor={colors.textTertiary}
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>

            <View style={styles.inputColumn}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={[textInputStyles.base, errors.lastName && styles.inputError]}
                value={formData.lastName}
                onChangeText={(value) => updateFormData('lastName', value)}
                placeholder="Enter last name"
                placeholderTextColor={colors.textTertiary}
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>
          </View>
        </View>

        {/* Template Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Archetype Template</Text>
            <TouchableOpacity onPress={() => setShowTemplateTooltip(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.selectorButton, errors.templateId && styles.inputError]}
            onPress={() => setShowTemplateModal(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorMain}>
                <Text style={styles.selectorLabel}>Selected Archetype Template</Text>
                <Text style={selectedTemplate ? styles.selectorValue : styles.selectorPlaceholder}>
                  {selectedTemplate ? selectedTemplate.name : 'Choose an archetype template'}
                </Text>
                {selectedTemplate && (
                  <Text style={styles.selectorDescription} numberOfLines={2}>
                    {selectedTemplate.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </View>
          </TouchableOpacity>
          {errors.templateId && <Text style={styles.errorText}>{errors.templateId}</Text>}
          <View style={styles.fieldHelpContainer}>
            <Text style={styles.fieldHelp}>
              The archetype template defines what your agent can do. System templates are pre-built, custom templates are your own creations.
            </Text>
            <TouchableOpacity
              style={styles.manageTemplatesLink}
              onPress={() => navigation.navigate('Execution Templates' as never)}
            >
              <Ionicons name="open-outline" size={14} color={colors.accent} />
              <Text style={styles.linkText}>Manage Templates</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Behavior Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Behavior Settings</Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputColumn}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Heartbeat (min) *</Text>
                <TouchableOpacity onPress={() => setShowHeartbeatTooltip(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[textInputStyles.base, errors.heartbeatMinutes && styles.inputError]}
                value={formData.heartbeatMinutes.toString()}
                onChangeText={(value) => updateFormData('heartbeatMinutes', parseInt(value) || 5)}
                placeholder="5"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              {errors.heartbeatMinutes && <Text style={styles.errorText}>{errors.heartbeatMinutes}</Text>}
            </View>

            <View style={styles.inputColumn}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Max Tokens/Day *</Text>
                <TouchableOpacity onPress={() => setShowTokensTooltip(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="help-circle-outline" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[textInputStyles.base, errors.maxTokensPerDay && styles.inputError]}
                value={formData.maxTokensPerDay.toString()}
                onChangeText={(value) => updateFormData('maxTokensPerDay', parseInt(value) || 10000)}
                placeholder="10000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="numeric"
              />
              {errors.maxTokensPerDay && <Text style={styles.errorText}>{errors.maxTokensPerDay}</Text>}
            </View>
          </View>
        </View>

        {/* Lifecycle Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pulse" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Lifecycle Status</Text>
            <TouchableOpacity onPress={() => setShowStatusTooltip(true)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="help-circle-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowStatusModal(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorMain}>
                <Text style={styles.selectorLabel}>Current Status</Text>
                <View style={styles.statusIndicator}>
                  <Ionicons name={statusInfo.icon as any} size={20} color={statusInfo.color} />
                  <Text style={[styles.selectorValue, { color: statusInfo.color }]}>
                    {formData.lifecycleStatus}
                  </Text>
                </View>
                <Text style={styles.selectorDescription} numberOfLines={2}>
                  {statusInfo.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.accent} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges() || isSubmitting) && styles.saveButtonDisabled
          ]}
          onPress={handleSubmit}
          disabled={!hasChanges() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={colors.textInverse} />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Template Selection Modal */}
      <Modal visible={showTemplateModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Archetype Template</Text>
            <TouchableOpacity onPress={() => setShowTemplateModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.templateCard,
                  formData.templateId === item.id && styles.templateCardSelected
                ]}
                onPress={() => {
                  updateFormData('templateId', item.id);
                  setShowTemplateModal(false);
                }}
              >
                <View style={styles.templateCardHeader}>
                  <Text style={styles.templateCardName}>{item.name}</Text>
                  <View style={[
                    styles.templateBadge,
                    { backgroundColor: item.isPublic ? colors.accent : colors.statusSuccess }
                  ]}>
                    <Text style={styles.templateBadgeText}>
                      {item.isPublic ? 'Public' : 'Private'}
                    </Text>
                  </View>
                  {formData.templateId === item.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                  )}
                </View>
                <Text style={styles.templateCardDescription} numberOfLines={3}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.modalList}
          />
        </View>
      </Modal>

      {/* Status Selection Modal */}
      <Modal visible={showStatusModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Status</Text>
            <TouchableOpacity onPress={() => setShowStatusModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.modalList}>
            {(['STANDBY', 'ACTIVE', 'PAUSED', 'KILLED'] as LifecycleStatus[]).map((status) => {
              const info = getStatusInfo(status);
              const isSelected = formData.lifecycleStatus === status;
              return (
                <TouchableOpacity
                  key={status}
                  style={[styles.statusCard, isSelected && styles.statusCardSelected]}
                  onPress={() => {
                    updateFormData('lifecycleStatus', status);
                    setShowStatusModal(false);
                  }}
                >
                  <View style={styles.statusCardContent}>
                    <Ionicons name={info.icon as any} size={28} color={info.color} />
                    <View style={styles.statusCardText}>
                      <Text style={[styles.statusCardName, { color: info.color }]}>
                        {status}
                      </Text>
                      <Text style={styles.statusCardDescription}>
                        {info.description}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.accent} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* Tooltips */}
      <Tooltip
        title="Agent Editing"
        content="You're editing an existing agent. Changes to the template selection will affect how the agent behaves in future executions. The agent will maintain its execution history and current token usage."
        visible={showAgentTooltip}
        onClose={() => setShowAgentTooltip(false)}
        themedStyles={styles}
        colors={colors}
      />

      <Tooltip
        title="Archetype Templates"
        content={`An Archetype Template is a complete configuration that defines your agent's capabilities:

• **AI Model Selection**: Choose which LLM your agent uses (Gemini, GPT-4, Claude, etc.)
• **System Prompts**: The core instructions that shape your agent's personality and behavior
• **Available Functions**: Tools and APIs your agent can access
• **Configuration Parameters**: Settings for temperature, token limits, and more

Changing the template will update the agent's capabilities and behavior for future executions. System templates are pre-built and maintained, while custom templates give you full control.

💡 **Tip**: You can create and edit templates in the "Execution Templates" section to customize your agent's capabilities.`}
        visible={showTemplateTooltip}
        onClose={() => setShowTemplateTooltip(false)}
        themedStyles={styles}
        colors={colors}
      />

      <Tooltip
        title="Heartbeat Cadence"
        content="How often your agent checks for work and potentially executes. Minimum is 5 minutes. More frequent heartbeats consume more resources but provide faster response times. Consider your use case when setting this."
        visible={showHeartbeatTooltip}
        onClose={() => setShowHeartbeatTooltip(false)}
        themedStyles={styles}
        colors={colors}
      />

      <Tooltip
        title="Token Budget"
        content="Daily limit for AI model token usage. Prevents runaway costs. Agent stops executing when limit is reached and resets at midnight UTC. Recommended: 10,000+ for active agents, 50,000+ for heavy workloads."
        visible={showTokensTooltip}
        onClose={() => setShowTokensTooltip(false)}
        themedStyles={styles}
        colors={colors}
      />

      <Tooltip
        title="Lifecycle Status"
        content="Controls agent behavior: STANDBY (testing/logging only), ACTIVE (full execution), PAUSED (temporarily stopped), KILLED (permanently disabled). Use STANDBY to test agent behavior safely."
        visible={showStatusTooltip}
        onClose={() => setShowStatusTooltip(false)}
        themedStyles={styles}
        colors={colors}
      />
    </View>
  );
};

export default EditAgentForm;
