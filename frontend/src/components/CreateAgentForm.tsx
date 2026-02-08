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
import { AgentFormData, AgentFormErrors, LifecycleStatus, ExecutionTemplate } from '../types';
import { useTheme, useThemedStyles } from '../theme';
import { useContainerStyles } from '../styles/useContainerStyles';

interface CreateAgentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  prefilledData?: Partial<AgentFormData & {
    description?: string;
    functionGroups?: string[];
    marketplaceAgent?: {
      role: string;
      category: string;
      experienceLevel: string;
      modelConfig: {
        modelName: string;
        configName: string;
        temperature: number;
        maxTokens: number;
      };
      apiRequirements: {
        requiredKeys: string[];
        displayNames: string[];
      };
      highlights: string[];
    };
  }>;
}

interface TooltipProps {
  title: string;
  content: string;
  icon: string;
  visible: boolean;
  onClose: () => void;
  themedStyles: ReturnType<typeof useCreateAgentStyles>;
  colors: ReturnType<typeof useTheme>['colors'];
}

const Tooltip: React.FC<TooltipProps> = ({ title, content, icon, visible, onClose, themedStyles, colors }) => (
  <Modal visible={visible} transparent animationType="fade">
    <View style={themedStyles.tooltipOverlay}>
      <View style={themedStyles.tooltipContainer}>
        <View style={themedStyles.tooltipHeader}>
          <Ionicons name={icon as any} size={24} color={colors.accent} />
          <Text style={themedStyles.tooltipTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={themedStyles.tooltipClose}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={themedStyles.tooltipContent}>{content}</Text>
      </View>
    </View>
  </Modal>
);

const useCreateAgentStyles = (colors: ReturnType<typeof useTheme>['colors']) => useThemedStyles((colors) => ({
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
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  titleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginLeft: 12,
    marginRight: 8,
  },
  infoButton: {
    padding: 4,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.bgApp,
  },
  introCard: {
    margin: 16,
    marginBottom: 8,
  },
  introHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  introText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  marketplaceCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  marketplaceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 8,
  },
  marketplaceTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.accent,
    flex: 1,
  },
  experienceBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  experienceText: {
    fontSize: 12,
    color: colors.textInverse,
    fontWeight: '600' as const,
  },
  marketplaceRole: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  marketplaceDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 16,
  },
  apiSection: {
    marginBottom: 12,
  },
  apiSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  apiKeysContainer: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
  },
  apiKeyChip: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  apiKeyText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500' as const,
  },
  modelSection: {
    marginBottom: 8,
  },
  modelSectionTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  modelText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500' as const,
  },
  characterPreview: {
    backgroundColor: colors.bgSurface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  previewHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  previewContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 20,
  },
  previewText: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  previewRole: {
    fontSize: 16,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  formContainer: {
    margin: 16,
    marginTop: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
  },
  labelRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: 8,
    flex: 1,
  },
  fieldHelp: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  fieldHelpContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginTop: 6,
  },
  manageTemplatesLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginLeft: 8,
    padding: 4,
    borderRadius: 6,
    backgroundColor: colors.bgApp,
  },
  linkText: {
    fontSize: 12,
    color: colors.accent,
    fontWeight: '500' as const,
    marginLeft: 4,
  },
  selector: {
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  selectorContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  selectedDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  placeholderText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  statusRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  inputError: {
    borderColor: colors.statusError,
    backgroundColor: `${colors.statusError}08`,
  },
  errorText: {
    fontSize: 14,
    color: colors.statusError,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  statusIndicator: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  statusHelpText: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginLeft: 8,
    flex: 1,
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.bgApp,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  createButton: {
    flex: 2,
    flexDirection: 'row' as const,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  createButtonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textInverse,
    marginLeft: 6,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  modalCloseButton: {
    padding: 4,
  },

  // Template Selector
  templateList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  templateCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative' as const,
  },
  templateCardSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  templateCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 8,
  },
  templateCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  templateCardTitleSelected: {
    color: colors.textInverse,
  },
  templateCardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  templateCardDescriptionSelected: {
    color: colors.textInverse,
    opacity: 0.9,
  },
  systemBadge: {
    backgroundColor: colors.statusSuccess,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  customBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },

  // Status Selector
  statusList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statusCard: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    position: 'relative' as const,
  },
  statusCardSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  statusCardHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  statusCardTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  statusCardTitleSelected: {
    color: colors.textInverse,
  },
  statusCardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    marginLeft: 36,
  },
  statusCardDescriptionSelected: {
    color: colors.textInverse,
    opacity: 0.9,
  },
  recommendedBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectedIndicator: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
  },

  // Tooltip Styles
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
  },
  tooltipContainer: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    padding: 20,
    maxWidth: '90%' as const,
  },
  tooltipHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  tooltipClose: {
    padding: 4,
  },
  tooltipContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
}));

const CreateAgentForm: React.FC<CreateAgentFormProps> = ({ onSuccess, onCancel, prefilledData }) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { containerStyles, shadowPresets, textInputStyles } = useContainerStyles();
  const styles = useCreateAgentStyles(colors);

  const [formData, setFormData] = useState<AgentFormData>({
    firstName: prefilledData?.firstName || '',
    lastName: prefilledData?.lastName || '',
    templateId: prefilledData?.templateId || '',
    maxTokensPerDay: prefilledData?.maxTokensPerDay || 10000,
    heartbeatMinutes: prefilledData?.heartbeatMinutes || 5,
    lifecycleStatus: (prefilledData?.lifecycleStatus as LifecycleStatus) || 'STANDBY',
  });

  const [errors, setErrors] = useState<AgentFormErrors>({});
  const [templates, setTemplates] = useState<ExecutionTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modal states
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string>('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await goGentAPI.getTemplates();
      if (response.success && response.data?.templates) {
        const activeTemplates = response.data.templates.filter((t: ExecutionTemplate) => t.isActive !== false);
        setTemplates(activeTemplates);
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
      const response = await goGentAPI.createAgent(formData);

      if (response.success) {
        AlertAPI.alert('Success', 'Agent created successfully!', [
          { text: 'OK', onPress: onSuccess }
        ]);
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      AlertAPI.alert('Error', 'Failed to create agent');
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

  const getStatusInfo = (status: LifecycleStatus) => {
    switch (status) {
      case 'STANDBY':
        return {
          title: 'Standby Mode',
          description: 'Agent will log actions but not execute them. Perfect for testing and validation.',
          color: '#FF9500',
          icon: 'pause-circle' as const,
          details: 'In standby mode, your agent will go through all the motions of executing tasks but won\'t actually perform any actions. You\'ll see all logs and can verify the agent is working correctly before going live.'
        };
      case 'ACTIVE':
        return {
          title: 'Active Mode',
          description: 'Agent will fully execute tasks according to its schedule and configuration.',
          color: colors.statusSuccess,
          icon: 'play-circle' as const,
          details: 'Your agent will actively execute tasks based on its heartbeat schedule. It will use the configured template to process requests and perform real actions.'
        };
      case 'PAUSED':
        return {
          title: 'Paused Mode',
          description: 'Agent is temporarily stopped but can be resumed at any time.',
          color: colors.textSecondary,
          icon: 'pause' as const,
          details: 'The agent will not execute any tasks but maintains its configuration. You can resume it whenever needed without losing any settings.'
        };
      case 'KILLED':
        return {
          title: 'Killed Mode',
          description: 'Agent is permanently disabled and cannot be revived.',
          color: colors.statusError,
          icon: 'stop-circle' as const,
          details: 'This permanently disables the agent. Once killed, the agent cannot be reactivated and you would need to create a new agent instead.'
        };
      default:
        return { title: '', description: '', color: colors.textSecondary, icon: 'help-circle' as const, details: '' };
    }
  };

  const selectedTemplate = templates.find(t => t.id === formData.templateId);
  const selectedStatusInfo = getStatusInfo(formData.lifecycleStatus);

  const tooltips = {
    agent: {
      title: 'What is an Agent?',
              content: 'An Agent is an autonomous AI assistant that executes tasks on a schedule using an Archetype Template. Think of it as a specialized AI employee that:\n\n• Uses an Archetype Template to define its capabilities and behavior\n• Runs automatically based on your heartbeat schedule\n• Can be in different lifecycle states (Standby, Active, Paused, Killed)\n• Has token limits to control usage\n\nTo modify how your agent works, update the underlying Archetype Template - all agents using that template will inherit the changes.',
      icon: 'information-circle'
    },
              template: {
      title: 'Archetype Template',
      content: 'An Archetype Template is a complete configuration that defines your agent\'s capabilities:\n\n• **AI Model Selection**: Choose which LLM your agent uses (Gemini, GPT-4, Claude, etc.)\n• **System Prompts**: The core instructions that shape your agent\'s personality and behavior\n• **Available Functions**: Tools and APIs your agent can access\n• **Configuration Parameters**: Settings for temperature, token limits, and more\n\nTemplates can be shared across multiple agents. System templates are pre-built and maintained, while custom templates give you full control over every aspect of your agent\'s behavior.\n\n💡 **Tip**: You can create and edit templates in the "Execution Templates" section to customize your agent\'s capabilities.',
      icon: 'document-text'
    },
    heartbeat: {
      title: 'Heartbeat Interval',
      content: 'How often your agent checks for work and executes tasks:\n\n• Minimum: 5 minutes (prevents excessive API usage)\n• Recommended: 15-30 minutes for most tasks\n• Higher frequency = more responsive but uses more resources\n• Lower frequency = more efficient but less responsive\n\nConsider your use case: real-time monitoring might need 5-10 minutes, while daily reports could use 60+ minutes.',
      icon: 'heart'
    },
    tokens: {
      title: 'Daily Token Limit',
      content: 'Prevents runaway costs by limiting AI API usage:\n\n• Minimum: 1,000 tokens per day\n• Typical conversation: 100-500 tokens\n• Complex tasks: 1,000-5,000 tokens\n• When limit is reached, agent pauses until next day\n\nMonitor your agent\'s actual usage and adjust accordingly. Better to start conservative and increase as needed.',
      icon: 'speedometer'
    },
    status: {
      title: 'Lifecycle Status',
      content: 'Controls how your agent behaves:\n\n• STANDBY: Safe testing mode - logs actions but doesn\'t execute\n• ACTIVE: Full execution mode - performs real actions\n• PAUSED: Temporarily stopped, can be resumed\n• KILLED: Permanently disabled, cannot be revived\n\nAlways start in STANDBY to verify your agent works correctly before going ACTIVE.',
      icon: 'settings'
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading templates...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="construct" size={24} color={colors.accent} />
          <Text style={styles.title}>Create New Agent</Text>
          <TouchableOpacity
            onPress={() => setShowTooltip('agent')}
            style={styles.infoButton}
          >
            <Ionicons name="help-circle-outline" size={20} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Marketplace Agent Card - Show when hired from marketplace */}
      {prefilledData?.marketplaceAgent && (
        <View style={[containerStyles.primaryContainer, styles.marketplaceCard]}>
          <View style={styles.marketplaceHeader}>
            <Ionicons name="storefront" size={20} color={colors.accent} />
            <Text style={styles.marketplaceTitle}>Agent from Marketplace</Text>
            <View style={styles.experienceBadge}>
              <Text style={styles.experienceText}>
                {prefilledData.marketplaceAgent.experienceLevel}
              </Text>
            </View>
          </View>
          <Text style={styles.marketplaceRole}>
            {prefilledData.marketplaceAgent.role}
          </Text>
          <Text style={styles.marketplaceDescription}>
            {prefilledData.description}
          </Text>

          {/* API Requirements */}
          <View style={styles.apiSection}>
            <Text style={styles.apiSectionTitle}>Required API Keys:</Text>
            <View style={styles.apiKeysContainer}>
              {prefilledData.marketplaceAgent.apiRequirements.displayNames.map((apiKey: string, index: number) => (
                <View key={index} style={styles.apiKeyChip}>
                  <Ionicons name="key" size={12} color={colors.accent} />
                  <Text style={styles.apiKeyText}>{apiKey}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Model Configuration */}
          <View style={styles.modelSection}>
            <Text style={styles.modelSectionTitle}>AI Model:</Text>
            <Text style={styles.modelText}>
              {prefilledData.marketplaceAgent.modelConfig.configName}
              ({prefilledData.marketplaceAgent.modelConfig.modelName})
            </Text>
          </View>
        </View>
      )}

      {/* Introduction Card */}
      <View style={[containerStyles.primaryContainer, styles.introCard]}>
        <View style={styles.introHeader}>
          <Ionicons name="bulb-outline" size={20} color="#FF9500" />
          <Text style={styles.introTitle}>
            {prefilledData?.marketplaceAgent ? 'Customize Your Agent' : 'Creating Your AI Agent'}
          </Text>
        </View>
        <Text style={styles.introText}>
          {prefilledData?.marketplaceAgent
            ? 'All settings have been pre-configured based on your marketplace selection. Review the details below and click Create to hire your agent!'
            : 'You\'re about to create an autonomous AI agent that will work for you around the clock. Choose an archetype template that defines its capabilities, set a schedule, and configure safety limits.'
          }
        </Text>
      </View>

      <View style={[containerStyles.primaryContainer, styles.formContainer]}>
        {/* Character Preview */}
        {(formData.firstName || formData.lastName) && (
          <View style={styles.characterPreview}>
            <View style={styles.previewHeader}>
              <Ionicons name="sparkles" size={20} color={colors.accent} />
              <Text style={styles.previewTitle}>Character Preview</Text>
            </View>
            <View style={styles.previewContent}>
              <AgentAvatar
                agent={{
                  firstName: formData.firstName || 'John',
                  lastName: formData.lastName || 'Doe',
                  lifecycleStatus: formData.lifecycleStatus,
                  templateName: selectedTemplate?.name
                }}
                size="xl"
                showStatus={true}
                animated={true}
              />
              <View style={styles.previewText}>
                <Text style={styles.previewName}>
                  {formData.firstName || 'First'} {formData.lastName || 'Last'}
                </Text>
                <Text style={styles.previewRole}>
                  {selectedTemplate?.name || 'Choose a template'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Basic Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="person-outline" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Agent Identity</Text>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[
                  textInputStyles.base,
                  errors.firstName && styles.inputError
                ]}
                value={formData.firstName}
                onChangeText={(value) => updateFormData('firstName', value)}
                placeholder="e.g., Alex"
                placeholderTextColor={colors.textSecondary}
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[
                  textInputStyles.base,
                  errors.lastName && styles.inputError
                ]}
                value={formData.lastName}
                onChangeText={(value) => updateFormData('lastName', value)}
                placeholder="e.g., Assistant"
                placeholderTextColor={colors.textSecondary}
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
            </View>
          </View>
          <Text style={styles.fieldHelp}>
            Give your agent a friendly name to easily identify it in your dashboard.
          </Text>
        </View>

        {/* Template Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="document-text-outline" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Archetype Template</Text>
            <TouchableOpacity
              onPress={() => setShowTooltip('template')}
              style={styles.infoButton}
            >
              <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Archetype Template</Text>
            <TouchableOpacity
              style={[
                styles.selector,
                errors.templateId && styles.inputError
              ]}
              onPress={() => setShowTemplateSelector(true)}
            >
              <View style={styles.selectorContent}>
                {selectedTemplate ? (
                  <View style={styles.selectedInfo}>
                    <Text style={styles.selectedTitle}>{selectedTemplate.name}</Text>
                    <Text style={styles.selectedDescription} numberOfLines={2}>
                      {selectedTemplate.description || 'No description available'}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Select an archetype template...</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
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
        </View>

        {/* Configuration Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Behavior Configuration</Text>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Max Tokens/Day</Text>
                <TouchableOpacity
                  onPress={() => setShowTooltip('tokens')}
                  style={styles.infoButton}
                >
                  <Ionicons name="help-circle-outline" size={14} color={colors.accent} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  textInputStyles.base,
                  errors.maxTokensPerDay && styles.inputError
                ]}
                value={formData.maxTokensPerDay.toString()}
                onChangeText={(value) => updateFormData('maxTokensPerDay', parseInt(value) || 0)}
                placeholder="10000"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
              {errors.maxTokensPerDay && <Text style={styles.errorText}>{errors.maxTokensPerDay}</Text>}
              <Text style={styles.fieldHelp}>
                Daily safety limit to prevent excessive costs.
              </Text>
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Heartbeat (min)</Text>
                <TouchableOpacity
                  onPress={() => setShowTooltip('heartbeat')}
                  style={styles.infoButton}
                >
                  <Ionicons name="help-circle-outline" size={14} color={colors.accent} />
                </TouchableOpacity>
              </View>
              <TextInput
                style={[
                  textInputStyles.base,
                  errors.heartbeatMinutes && styles.inputError
                ]}
                value={formData.heartbeatMinutes.toString()}
                onChangeText={(value) => updateFormData('heartbeatMinutes', parseInt(value) || 0)}
                placeholder="5"
                keyboardType="numeric"
                placeholderTextColor={colors.textSecondary}
              />
              {errors.heartbeatMinutes && <Text style={styles.errorText}>{errors.heartbeatMinutes}</Text>}
              <Text style={styles.fieldHelp}>
                How often the agent checks for work.
              </Text>
            </View>
          </View>
        </View>

        {/* Lifecycle Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="power" size={20} color={colors.accent} />
            <Text style={styles.sectionTitle}>Initial Status</Text>
            <TouchableOpacity
              onPress={() => setShowTooltip('status')}
              style={styles.infoButton}
            >
              <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lifecycle Status</Text>
            <TouchableOpacity
              style={styles.selector}
              onPress={() => setShowStatusSelector(true)}
            >
              <View style={styles.selectorContent}>
                <View style={styles.selectedInfo}>
                  <View style={styles.statusRow}>
                    <Ionicons name={selectedStatusInfo.icon} size={20} color={selectedStatusInfo.color} />
                    <Text style={styles.selectedTitle}>{selectedStatusInfo.title}</Text>
                  </View>
                  <Text style={styles.selectedDescription} numberOfLines={2}>
                    {selectedStatusInfo.description}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
            <View style={[styles.statusIndicator, { backgroundColor: selectedStatusInfo.color + '15' }]}>
              <Ionicons name="information-circle" size={16} color={selectedStatusInfo.color} />
              <Text style={[styles.statusHelpText, { color: selectedStatusInfo.color }]}>
                Recommended: Start in STANDBY mode to test your agent safely
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isSubmitting}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createButton, isSubmitting && styles.createButtonDisabled]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color={colors.textInverse} />
              <Text style={styles.createButtonText}>Create Agent</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Template Selector Modal */}
      <Modal
        visible={showTemplateSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTemplateSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Archetype Template</Text>
            <TouchableOpacity
              onPress={() => setShowTemplateSelector(false)}
              style={styles.modalCloseButton}
            >
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
                  setShowTemplateSelector(false);
                }}
              >
                <View style={styles.templateCardHeader}>
                  <Text style={[
                    styles.templateCardTitle,
                    formData.templateId === item.id && styles.templateCardTitleSelected
                  ]}>
                    {item.name}
                  </Text>
                  {item.userId ? (
                    <View style={styles.customBadge}>
                      <Text style={styles.badgeText}>Custom</Text>
                    </View>
                  ) : (
                    <View style={styles.systemBadge}>
                      <Text style={styles.badgeText}>System</Text>
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.templateCardDescription,
                  formData.templateId === item.id && styles.templateCardDescriptionSelected
                ]}>
                  {item.description || 'No description available'}
                </Text>
                {formData.templateId === item.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                  </View>
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.templateList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </Modal>

      {/* Status Selector Modal */}
      <Modal
        visible={showStatusSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowStatusSelector(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Lifecycle Status</Text>
            <TouchableOpacity
              onPress={() => setShowStatusSelector(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.statusList}>
            {(['STANDBY', 'ACTIVE', 'PAUSED'] as LifecycleStatus[]).map((status) => {
              const statusInfo = getStatusInfo(status);
              return (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusCard,
                    formData.lifecycleStatus === status && styles.statusCardSelected
                  ]}
                  onPress={() => {
                    updateFormData('lifecycleStatus', status);
                    setShowStatusSelector(false);
                  }}
                >
                  <View style={styles.statusCardHeader}>
                    <Ionicons name={statusInfo.icon} size={24} color={statusInfo.color} />
                    <Text style={[
                      styles.statusCardTitle,
                      formData.lifecycleStatus === status && styles.statusCardTitleSelected
                    ]}>
                      {statusInfo.title}
                    </Text>
                    {status === 'STANDBY' && (
                      <View style={styles.recommendedBadge}>
                        <Text style={styles.badgeText}>Recommended</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.statusCardDescription,
                    formData.lifecycleStatus === status && styles.statusCardDescriptionSelected
                  ]}>
                    {statusInfo.details}
                  </Text>
                  {formData.lifecycleStatus === status && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>

      {/* Tooltips */}
      {Object.entries(tooltips).map(([key, tooltip]) => (
        <Tooltip
          key={key}
          title={tooltip.title}
          content={tooltip.content}
          icon={tooltip.icon}
          visible={showTooltip === key}
          onClose={() => setShowTooltip('')}
          themedStyles={styles}
          colors={colors}
        />
      ))}
    </ScrollView>
  );
};

export default CreateAgentForm;
