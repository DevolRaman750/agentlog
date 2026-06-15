import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import { goGentAPI } from '../api/client';
import { CreateApiKeyRequest } from '../types';
import { GitHubOnboardingSetup } from './GitHubOnboardingSetup';
import { GenericApiKeySetup } from './GenericApiKeySetup';
import { WhatsAppOnboardingSetup } from './WhatsAppOnboardingSetup';
import { useTheme, useThemedStyles } from '../theme';
import { ThemeColors } from '../theme';
import { spacing, radius, typography, touchTarget } from '../theme';

interface ApiKeyOnboardingProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  existingKeys?: any[]; // Pass existing keys to show current status
}

export type OnboardingStep = 'welcome' | 'model-selection' | 'model-setup' | 'functions-setup' | 'completion';
export type ModelProvider = 'gemini' | 'openrouter' | 'ollama';

interface SelectedModel {
  provider: ModelProvider;
  name: string;
  displayName: string;
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgCard,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    padding: spacing.sm,
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.bgSurface,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  progressFill: {
    height: '100%' as const,
    backgroundColor: colors.accent,
    borderRadius: 2,
  },
  progressText: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center' as const,
  },
  stepContent: {
    flex: 1,
  },
  welcomeContainer: {
    padding: spacing.lg,
    alignItems: 'center' as const,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: radius.pill,
    backgroundColor: colors.bgHover,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xl,
  },
  welcomeTitle: {
    ...typography.display,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    ...typography.title,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: spacing.xxl,
  },
  requirementCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  requirementHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  requirementTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  requirementItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  requirementText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flex: 1,
  },
  requirementBold: {
    fontWeight: '600' as const,
  },
  statusCard: {
    backgroundColor: `${colors.statusSuccess}15`,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: `${colors.statusSuccess}30`,
  },
  statusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  statusTitle: {
    ...typography.h2,
    color: colors.statusSuccess,
    marginLeft: spacing.sm,
  },
  statusItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  statusText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flex: 1,
  },
  statusBold: {
    fontWeight: '600' as const,
  },
  costWarningCard: {
    backgroundColor: `${colors.statusWarning}15`,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: `${colors.statusWarning}30`,
  },
  warningHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.md,
  },
  warningTitle: {
    ...typography.title,
    color: colors.statusWarning,
    marginLeft: spacing.sm,
  },
  warningText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  benefitsCard: {
    backgroundColor: colors.bgHover,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  benefitsTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  benefitItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  benefitText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  selectionContainer: {
    padding: spacing.lg,
  },
  stepTitle: {
    ...typography.display,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stepDescription: {
    ...typography.title,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  providerCard: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  selectedProviderCard: {
    borderColor: colors.accent,
    backgroundColor: colors.bgHover,
  },
  providerHeader: {
    marginBottom: spacing.md,
  },
  providerTitleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  providerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flex: 1,
  },
  recommendedBadge: {
    ...typography.micro,
    fontWeight: '700' as const,
    color: colors.statusSuccess,
    backgroundColor: `${colors.statusSuccess}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  costEffectiveBadge: {
    ...typography.micro,
    fontWeight: '700' as const,
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  providerDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  providerFeatures: {
    gap: spacing.xs,
  },
  featureText: {
    ...typography.label,
    fontWeight: '400' as const,
    color: colors.textSecondary,
  },
  comparisonNote: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: colors.bgSurface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  comparisonText: {
    ...typography.label,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  setupContainer: {
    padding: spacing.lg,
  },
  instructionsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  instructionsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  instructionsTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  linkButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  linkButtonText: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: '600' as const,
    marginRight: spacing.xs,
  },
  instructionStep: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: spacing.md,
  },
  stepNumberText: {
    ...typography.caption,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  stepText: {
    ...typography.body,
    color: colors.textPrimary,
    flex: 1,
  },
  inputContainer: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    ...typography.title,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.title,
    fontWeight: '400' as const,
    backgroundColor: colors.bgSurface,
  },
  invalidInput: {
    borderColor: colors.statusError,
    backgroundColor: `${colors.statusError}10`,
  },
  errorText: {
    ...typography.caption,
    color: colors.statusError,
    marginTop: spacing.xs,
  },
  successText: {
    ...typography.caption,
    color: colors.statusSuccess,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: touchTarget.min,
  },
  disabledButton: {
    backgroundColor: colors.borderMedium,
  },
  saveButtonText: {
    ...typography.title,
    color: colors.textInverse,
  },
  functionsContainer: {
    padding: spacing.lg,
  },
  optionalBadgeContainer: {
    alignItems: 'center' as const,
    marginBottom: spacing.xl,
  },
  optionalBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  optionalBadgeText: {
    ...typography.body,
    color: colors.accent,
    marginLeft: spacing.sm,
    fontWeight: '500' as const,
  },
  functionServiceCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  functionServiceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  functionServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: spacing.lg,
  },
  functionServiceInfo: {
    flex: 1,
  },
  functionServiceTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xs,
  },
  functionServiceName: {
    ...typography.title,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  popularBadge: {
    ...typography.micro,
    fontWeight: '700' as const,
    color: colors.statusWarning,
    backgroundColor: `${colors.statusWarning}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  functionServiceDescription: {
    ...typography.body,
    color: colors.textSecondary,
  },
  setupButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    minHeight: touchTarget.min,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  completedButton: {
    backgroundColor: colors.statusSuccess,
  },
  setupButtonText: {
    ...typography.bodyStrong,
    color: colors.textInverse,
  },
  completedButtonText: {
    color: colors.textInverse,
  },
  continueButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: touchTarget.min,
    marginTop: spacing.xl,
  },
  continueButtonText: {
    ...typography.title,
    color: colors.textInverse,
  },
  loadingContainer: {
    padding: spacing.xxxl,
    alignItems: 'center' as const,
  },
  loadingText: {
    ...typography.title,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    marginTop: spacing.lg,
  },
  completionContainer: {
    padding: spacing.lg,
    alignItems: 'center' as const,
  },
  successIconContainer: {
    marginBottom: spacing.xl,
  },
  completionTitle: {
    ...typography.display,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: spacing.sm,
  },
  completionSubtitle: {
    ...typography.title,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: spacing.xxl,
  },
  summaryCard: {
    backgroundColor: colors.bgHover,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%' as const,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  summaryTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  summaryItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: spacing.md,
  },
  summaryText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.md,
    flex: 1,
  },
  summaryBold: {
    fontWeight: '600' as const,
  },
  nextStepsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  nextStepsTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  nextStepItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  nextStepText: {
    ...typography.body,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.bgCard,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: touchTarget.min,
  },
  backButtonText: {
    ...typography.title,
    fontWeight: '400' as const,
    color: colors.accent,
    marginLeft: spacing.xs,
  },
  footerSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    minHeight: touchTarget.min,
  },
  nextButtonText: {
    ...typography.title,
    color: colors.textInverse,
    marginRight: spacing.sm,
  },
  completeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.statusSuccess,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    minHeight: touchTarget.min,
  },
  completeButtonText: {
    ...typography.title,
    color: colors.textInverse,
    marginRight: spacing.sm,
  },
});

export const ApiKeyOnboarding: React.FC<ApiKeyOnboardingProps> = ({
  visible,
  onClose,
  onComplete,
  existingKeys = [],
}) => {
  const { showSuccess, showError } = useToast();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [selectedModel, setSelectedModel] = useState<SelectedModel | null>({
    provider: 'ollama',
    name: 'llama3.1:latest',
    displayName: 'Self-Hosted Llama 3.1 (GPU)'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [setupResults, setSetupResults] = useState<{
    modelKey: boolean;
    functionKeys: string[];
  }>({
    modelKey: false,
    functionKeys: [],
  });

  const steps: { id: OnboardingStep; title: string; description: string }[] = [
    { id: 'welcome', title: 'Welcome', description: 'Getting started with API Keys' },
    { id: 'model-selection', title: 'AI Model', description: 'Choose your AI provider' },
    { id: 'model-setup', title: 'Setup', description: 'Configure your API key' },
    { id: 'functions-setup', title: 'Functions', description: 'Optional integrations' },
    { id: 'completion', title: 'Complete', description: 'You\'re all set!' },
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getConfiguredServices = () => {
    const modelServices = existingKeys.filter(key =>
      ['gemini', 'openai', 'openrouter', 'ollama'].includes(key.serviceName)
    );
    const functionServices = existingKeys.filter(key =>
      !['gemini', 'openai', 'openrouter', 'ollama', 'agent', 'team', 'internal'].includes(key.serviceName)
    );

    return {
      modelServices,
      functionServices,
      hasModelKey: modelServices.length > 0,
      hasFunctionKeys: functionServices.length > 0
    };
  };

  const configured = getConfiguredServices();

  const handleClose = () => {
    setCurrentStep('welcome');
    setSelectedModel(null);
    setSetupResults({ modelKey: false, functionKeys: [] });
    onClose();
  };

  const handleNext = () => {
    const currentIndex = getCurrentStepIndex();
    // Skip model-setup step for Ollama (no API key needed)
    if (currentStep === 'model-selection' && selectedModel?.provider === 'ollama') {
      setSetupResults(prev => ({ ...prev, modelKey: true }));
      setCurrentStep('functions-setup');
      return;
    }
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    // Skip model-setup step when going back from functions-setup with Ollama
    if (currentStep === 'functions-setup' && selectedModel?.provider === 'ollama') {
      setCurrentStep('model-selection');
      return;
    }
    const currentIndex = getCurrentStepIndex();
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  const renderProgressBar = () => {
    const currentIndex = getCurrentStepIndex();
    const progress = ((currentIndex + 1) / steps.length) * 100;

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>
          Step {currentIndex + 1} of {steps.length}: {steps[currentIndex].title}
        </Text>
      </View>
    );
  };

  const renderWelcomeStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeContainer}>
        <View style={styles.iconContainer}>
          <Ionicons name="key" size={64} color={colors.accent} />
        </View>

        <Text style={styles.welcomeTitle}>
          {existingKeys.length > 0 ? 'Update Your AgentLog Setup' : 'Welcome to AgentLog Setup'}
        </Text>
        <Text style={styles.welcomeSubtitle}>
          {existingKeys.length > 0
            ? 'Review and update your API key configuration'
            : 'Let\'s set up your core API keys to enable agent creation on the AgentLog platform'
          }
        </Text>

        {existingKeys.length > 0 && (
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Ionicons name="checkmark-circle" size={24} color={colors.statusSuccess} />
              <Text style={styles.statusTitle}>Current Configuration</Text>
            </View>

            <View style={styles.statusItem}>
              <Ionicons
                name={configured.hasModelKey ? "checkmark-circle" : "close-circle"}
                size={20}
                color={configured.hasModelKey ? colors.statusSuccess : colors.statusError}
              />
              <Text style={styles.statusText}>
                <Text style={styles.statusBold}>AI Model Keys:</Text> {
                  configured.hasModelKey
                    ? `${configured.modelServices.length} configured (${configured.modelServices.map(k => k.serviceName).join(', ')})`
                    : 'None configured'
                }
              </Text>
            </View>

            <View style={styles.statusItem}>
              <Ionicons
                name={configured.hasFunctionKeys ? "checkmark-circle" : "information-circle"}
                size={20}
                color={configured.hasFunctionKeys ? colors.statusSuccess : colors.textSecondary}
              />
              <Text style={styles.statusText}>
                <Text style={styles.statusBold}>Function APIs:</Text> {
                  configured.hasFunctionKeys
                    ? `${configured.functionServices.length} configured (${configured.functionServices.map(k => k.serviceName).join(', ')})`
                    : 'None configured (optional)'
                }
              </Text>
            </View>
          </View>
        )}

        <View style={styles.requirementCard}>
          <View style={styles.requirementHeader}>
            <Ionicons name="information-circle" size={24} color={colors.accent} />
            <Text style={styles.requirementTitle}>
              {existingKeys.length > 0 ? 'Available Options' : 'What you\'ll need'}
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.statusSuccess} />
            <Text style={styles.requirementText}>
              <Text style={styles.requirementBold}>AI Model</Text> - Use the free self-hosted GPU, or bring your own Gemini/OpenRouter key
            </Text>
          </View>

          <View style={styles.requirementItem}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.requirementText}>
              <Text style={styles.requirementBold}>Function APIs</Text> - GitHub, Slack, WhatsApp, Weather, etc. (optional)
            </Text>
          </View>
        </View>

        <View style={styles.costWarningCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color={colors.statusWarning} />
            <Text style={styles.warningTitle}>Cost Awareness</Text>
          </View>
          <Text style={styles.warningText}>
            The self-hosted GPU model is free. If you choose Gemini or OpenRouter, you will incur costs as per their platform pricing.
            AgentLog will track and wrap all API usage so you can monitor your consumption and costs.
          </Text>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>What you'll get</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="hardware-chip" size={16} color={colors.accent} />
            <Text style={styles.benefitText}>Create intelligent AI agents</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="analytics" size={16} color={colors.accent} />
            <Text style={styles.benefitText}>Track usage and costs</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="shield-checkmark" size={16} color={colors.accent} />
            <Text style={styles.benefitText}>Secure, encrypted key storage</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="extension-puzzle" size={16} color={colors.accent} />
            <Text style={styles.benefitText}>Connect to external services</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderModelSelectionStep = () => (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.selectionContainer}>
        <Text style={styles.stepTitle}>Choose Your AI Model Provider</Text>
        <Text style={styles.stepDescription}>
          Select the AI service that will power your agents. You can add more providers later.
        </Text>

        <TouchableOpacity
          style={[
            styles.providerCard,
            selectedModel?.provider === 'ollama' && styles.selectedProviderCard
          ]}
          onPress={() => setSelectedModel({
            provider: 'ollama',
            name: 'llama3.1:latest',
            displayName: 'Self-Hosted Llama 3.1 (GPU)'
          })}
        >
          <View style={styles.providerHeader}>
            <View style={styles.providerTitleContainer}>
              <Ionicons
                name={selectedModel?.provider === 'ollama' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedModel?.provider === 'ollama' ? colors.accent : colors.textTertiary}
              />
              <Text style={styles.providerTitle}>Self-Hosted GPU</Text>
              <Text style={styles.recommendedBadge}>FREE - NO API KEY</Text>
            </View>
          </View>
          <Text style={styles.providerDescription}>
            Start immediately with our self-hosted AI model. No account or API key needed.
          </Text>
          <View style={styles.providerFeatures}>
            <Text style={styles.featureText}>Free to use</Text>
            <Text style={styles.featureText}>No API key required</Text>
            <Text style={styles.featureText}>Self-hosted on GPU</Text>
            <Text style={styles.featureText}>Function calling support</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.providerCard,
            selectedModel?.provider === 'gemini' && styles.selectedProviderCard
          ]}
          onPress={() => setSelectedModel({
            provider: 'gemini',
            name: 'gemini-2.5-pro',
            displayName: 'Google Gemini 2.5 Pro'
          })}
        >
          <View style={styles.providerHeader}>
            <View style={styles.providerTitleContainer}>
              <Ionicons
                name={selectedModel?.provider === 'gemini' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedModel?.provider === 'gemini' ? colors.accent : colors.textTertiary}
              />
              <Text style={styles.providerTitle}>Google Gemini</Text>
              <Text style={styles.costEffectiveBadge}>ADVANCED</Text>
            </View>
          </View>
          <Text style={styles.providerDescription}>
            Google's latest AI model with excellent reasoning, coding, and multimodal capabilities.
          </Text>
          <View style={styles.providerFeatures}>
            <Text style={styles.featureText}>Fast response times</Text>
            <Text style={styles.featureText}>Large context window (2M tokens)</Text>
            <Text style={styles.featureText}>Function calling support</Text>
            <Text style={styles.featureText}>$3.50 per 1M input tokens</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.providerCard,
            selectedModel?.provider === 'openrouter' && styles.selectedProviderCard
          ]}
          onPress={() => setSelectedModel({
            provider: 'openrouter',
            name: 'anthropic/claude-sonnet-4',
            displayName: 'Claude Sonnet 4 (via OpenRouter)'
          })}
        >
          <View style={styles.providerHeader}>
            <View style={styles.providerTitleContainer}>
              <Ionicons
                name={selectedModel?.provider === 'openrouter' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedModel?.provider === 'openrouter' ? colors.accent : colors.textTertiary}
              />
              <Text style={styles.providerTitle}>OpenRouter</Text>
              <Text style={styles.costEffectiveBadge}>ADVANCED TOOLS</Text>
            </View>
          </View>
          <Text style={styles.providerDescription}>
            Access to multiple AI models including Claude Sonnet 4, GPT-4.1, and more through a single API.
          </Text>
          <View style={styles.providerFeatures}>
            <Text style={styles.featureText}>Multiple model options</Text>
            <Text style={styles.featureText}>Excellent function calling</Text>
            <Text style={styles.featureText}>High-quality responses</Text>
            <Text style={styles.featureText}>$3 per 1M input tokens (Claude Sonnet 4)</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.comparisonNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.comparisonText}>
            The self-hosted GPU is free and requires no setup. Gemini and OpenRouter offer more advanced models but require an API key.
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Ionicons name="close" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>API Key Setup</Text>
      <View style={styles.headerSpacer} />
    </View>
  );

  const renderFooter = () => {
    const currentIndex = getCurrentStepIndex();
    const isLastStep = currentIndex === steps.length - 1;
    const isFirstStep = currentIndex === 0;
    const canProceed = currentStep === 'welcome' ||
                      (currentStep === 'model-selection' && selectedModel) ||
                      currentStep === 'model-setup' ||
                      currentStep === 'functions-setup' ||
                      currentStep === 'completion';

    return (
      <View style={styles.footer}>
        {!isFirstStep && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            disabled={isLoading}
          >
            <Ionicons name="chevron-back" size={20} color={colors.accent} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <View style={styles.footerSpacer} />

        {!isLastStep ? (
          <TouchableOpacity
            style={[styles.nextButton, (!canProceed || isLoading) && styles.disabledButton]}
            onPress={handleNext}
            disabled={!canProceed || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <>
                <Text style={styles.nextButtonText}>
                  {currentStep === 'functions-setup' ? 'Complete Setup' : 'Continue'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textInverse} />
              </>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => {
              onComplete();
              handleClose();
            }}
          >
            <Text style={styles.completeButtonText}>Go to Marketplace</Text>
            <Ionicons name="storefront" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'model-selection':
        return renderModelSelectionStep();
      case 'model-setup':
        return <ModelSetupStep
          selectedModel={selectedModel!}
          onComplete={(success) => {
            setSetupResults(prev => ({ ...prev, modelKey: success }));
            handleNext();
          }}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />;
      case 'functions-setup':
        return <FunctionsSetupStep
          onComplete={(functionKeys) => {
            setSetupResults(prev => ({ ...prev, functionKeys }));
            handleNext();
          }}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
        />;
      case 'completion':
        return <CompletionStep
          setupResults={setupResults}
          selectedModel={selectedModel!}
        />;
      default:
        return renderWelcomeStep();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {renderHeader()}
        {renderProgressBar()}
        {renderCurrentStep()}
        {renderFooter()}
      </View>
    </Modal>
  );
};

// Model Setup Step Component
interface ModelSetupStepProps {
  selectedModel: SelectedModel;
  onComplete: (success: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const ModelSetupStep: React.FC<ModelSetupStepProps> = ({
  selectedModel,
  onComplete,
  isLoading,
  setIsLoading,
}) => {
  const [apiKey, setApiKey] = useState('');
  const { showSuccess, showError } = useToast();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const validateApiKey = (key: string): boolean => {
    if (selectedModel.provider === 'gemini') {
      return /^AIza[0-9A-Za-z_-]{35}$/.test(key);
    } else if (selectedModel.provider === 'openrouter') {
      // OpenRouter keys can be either sk-or-v1-{64 hex chars} or sk-or-{48 chars}
      return /^sk-or-v1-[a-f0-9]{64}$/.test(key) || /^sk-or-[a-zA-Z0-9]{48}$/.test(key);
    }
    return false;
  };

  const handleSave = async () => {
    if (!validateApiKey(apiKey)) {
      showError('Invalid API key format');
      return;
    }

    setIsLoading(true);
    try {
      const createRequest: CreateApiKeyRequest = {
        keyName: selectedModel.displayName,
        serviceName: selectedModel.provider,
        keyType: 'api_key',
        keyValue: apiKey,
        displayName: selectedModel.displayName,
        description: `API key for ${selectedModel.displayName}`,
        accessLevel: 'read_write',
        scopes: selectedModel.provider === 'gemini'
          ? ['generate', 'chat', 'function_calling']
          : ['chat', 'completions'],
        isDefault: true,
        environment: 'production',
      };

      const response = await goGentAPI.createApiKey(createRequest);

      if (response.success) {
        showSuccess(`${selectedModel.displayName} configured successfully!`);
        onComplete(true);
      } else {
        throw new Error(response.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error('API key save error:', error);
      showError(error instanceof Error ? error.message : 'Failed to save API key');
      onComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getSetupInstructions = () => {
    if (selectedModel.provider === 'gemini') {
      return {
        title: 'Get Your Google Gemini API Key',
        steps: [
          'Go to Google AI Studio (aistudio.google.com)',
          'Sign in with your Google account',
          'Click "Get API key" in the left sidebar',
          'Click "Create API key"',
          'Select "Create API key in new project" or choose existing project',
          'Copy the generated API key',
          'Paste it in the field below'
        ],
        placeholder: 'AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        linkUrl: 'https://aistudio.google.com/app/apikey',
        linkText: 'Get Gemini API Key'
      };
    } else {
      return {
        title: 'Get Your OpenRouter API Key',
        steps: [
          'Go to OpenRouter (openrouter.ai)',
          'Sign up or sign in to your account',
          'Click on your profile in the top right',
          'Select "API Keys" from the dropdown',
          'Click "Create Key"',
          'Give your key a name (e.g., "AgentLog Integration")',
          'Copy the generated API key',
          'Paste it in the field below'
        ],
        placeholder: 'sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        linkUrl: 'https://openrouter.ai/keys',
        linkText: 'Get OpenRouter API Key'
      };
    }
  };

  const instructions = getSetupInstructions();

  return (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.setupContainer}>
        <Text style={styles.stepTitle}>{instructions.title}</Text>
        <Text style={styles.stepDescription}>
          Follow these steps to get your API key from {selectedModel.provider === 'gemini' ? 'Google' : 'OpenRouter'}.
        </Text>

        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="list" size={20} color={colors.accent} />
            <Text style={styles.instructionsTitle}>Step-by-step guide</Text>
            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => Linking.openURL(instructions.linkUrl)}
            >
              <Text style={styles.linkButtonText}>{instructions.linkText}</Text>
              <Ionicons name="open-outline" size={16} color={colors.textInverse} />
            </TouchableOpacity>
          </View>

          {instructions.steps.map((step, index) => (
            <View key={index} style={styles.instructionStep}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>API Key *</Text>
          <TextInput
            style={[styles.textInput, !validateApiKey(apiKey) && apiKey.length > 0 && styles.invalidInput]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={instructions.placeholder}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          {apiKey.length > 0 && !validateApiKey(apiKey) && (
            <Text style={styles.errorText}>
              {selectedModel.provider === 'gemini'
                ? 'Invalid Gemini API key format (should start with AIza)'
                : 'Invalid OpenRouter API key format (should start with sk-or-v1- or sk-or-)'
              }
            </Text>
          )}
          {validateApiKey(apiKey) && (
            <Text style={styles.successText}>Valid API key format</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (!validateApiKey(apiKey) || isLoading) && styles.disabledButton]}
          onPress={handleSave}
          disabled={!validateApiKey(apiKey) || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.saveButtonText}>Save API Key</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Functions Setup Step Component
interface FunctionsSetupStepProps {
  onComplete: (functionKeys: string[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const FunctionsSetupStep: React.FC<FunctionsSetupStepProps> = ({
  onComplete,
  isLoading,
  setIsLoading,
}) => {
  const [completedSetups, setCompletedSetups] = useState<string[]>([]);
  const [showGitHubSetup, setShowGitHubSetup] = useState(false);
  const [showWhatsAppSetup, setShowWhatsAppSetup] = useState(false);
  const [showGenericSetup, setShowGenericSetup] = useState<any>(null);
  const [availableServices, setAvailableServices] = useState<any[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  // Load available services from backend
  React.useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await goGentAPI.getAvailableServices();
        if (response.success && response.data) {
          // Filter out AI model services and internal services, focus on function services
          const functionServices = response.data.filter(service =>
            !['gemini', 'openai', 'openrouter', 'ollama', 'agent', 'team', 'internal'].includes(service.id)
          );
          setAvailableServices(functionServices);
        }
      } catch (error) {
        console.error('Failed to load available services:', error);
        // Fallback to hardcoded services if API fails
        setAvailableServices([
          {
            id: 'github',
            name: 'GitHub',
            displayName: 'GitHub',
            description: 'Create issues, PRs, manage repositories',
            icon: 'logo-github',
            color: '#24292e',
            popular: true,
          },
          {
            id: 'slack',
            name: 'Slack',
            displayName: 'Slack',
            description: 'Send messages, create channels',
            icon: 'chatbubbles',
            color: '#4A154B',
            popular: true,
          },
          {
            id: 'whatsapp',
            name: 'WhatsApp Business',
            displayName: 'WhatsApp Business',
            description: 'Send messages, manage conversations',
            icon: 'chatbubble-ellipses',
            color: '#25D366',
            popular: true,
          },
          {
            id: 'openweather',
            name: 'Weather',
            displayName: 'Weather',
            description: 'Get weather data and forecasts',
            icon: 'partly-sunny',
            color: '#FF9500',
            popular: false,
          },
        ]);
      } finally {
        setServicesLoading(false);
      }
    };

    loadServices();
  }, []);

  return (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.functionsContainer}>
        <Text style={styles.stepTitle}>Optional Function APIs</Text>
        <Text style={styles.stepDescription}>
          Connect your agents to external services. These are optional but enable powerful automation capabilities.
        </Text>

        <View style={styles.optionalBadgeContainer}>
          <View style={styles.optionalBadge}>
            <Ionicons name="information-circle" size={16} color={colors.accent} />
            <Text style={styles.optionalBadgeText}>You can skip this step and add these later</Text>
          </View>
        </View>

        {servicesLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading available services...</Text>
          </View>
        ) : (
          availableServices.map((service) => (
          <View key={service.id} style={styles.functionServiceCard}>
            <View style={styles.functionServiceHeader}>
              <View style={[styles.functionServiceIcon, { backgroundColor: service.color + '20' }]}>
                <Ionicons name={service.icon as any} size={24} color={service.color} />
              </View>
              <View style={styles.functionServiceInfo}>
                <View style={styles.functionServiceTitleRow}>
                  <Text style={styles.functionServiceName}>{service.displayName}</Text>
                  {service.popular && (
                    <Text style={styles.popularBadge}>POPULAR</Text>
                  )}
                </View>
                <Text style={styles.functionServiceDescription}>{service.description}</Text>
              </View>
              <TouchableOpacity
                style={[
                  styles.setupButton,
                  completedSetups.includes(service.id) && styles.completedButton
                ]}
                onPress={() => {
                  if (service.id === 'github') {
                    setShowGitHubSetup(true);
                  } else if (service.id === 'whatsapp') {
                    setShowWhatsAppSetup(true);
                  } else {
                    // For other services, use the generic setup
                    setShowGenericSetup(service);
                  }
                }}
              >
                <Text style={[
                  styles.setupButtonText,
                  completedSetups.includes(service.id) && styles.completedButtonText
                ]}>
                  {completedSetups.includes(service.id) ? 'Added' : 'Setup'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
        )}

        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => onComplete(completedSetups)}
        >
          <Text style={styles.continueButtonText}>
            {completedSetups.length > 0
              ? `Continue with ${completedSetups.length} function${completedSetups.length > 1 ? 's' : ''}`
              : 'Skip for now'
            }
          </Text>
        </TouchableOpacity>

        {/* GitHub Setup Modal */}
        {showGitHubSetup && (
          <Modal
            visible={showGitHubSetup}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowGitHubSetup(false)}
          >
            <GitHubOnboardingSetup
              onComplete={(success) => {
                if (success) {
                  setCompletedSetups(prev => [...prev, 'github']);
                }
                setShowGitHubSetup(false);
              }}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </Modal>
        )}

        {/* WhatsApp Setup Modal */}
        {showWhatsAppSetup && (
          <Modal
            visible={showWhatsAppSetup}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowWhatsAppSetup(false)}
          >
            <WhatsAppOnboardingSetup
              onComplete={(success) => {
                if (success) {
                  setCompletedSetups(prev => [...prev, 'whatsapp']);
                }
                setShowWhatsAppSetup(false);
              }}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </Modal>
        )}

        {/* Generic Setup Modal */}
        {showGenericSetup && (
          <Modal
            visible={!!showGenericSetup}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowGenericSetup(null)}
          >
            <GenericApiKeySetup
              service={showGenericSetup}
              onComplete={(success) => {
                if (success) {
                  setCompletedSetups(prev => [...prev, showGenericSetup.id]);
                }
                setShowGenericSetup(null);
              }}
              isLoading={isLoading}
              setIsLoading={setIsLoading}
            />
          </Modal>
        )}
      </View>
    </ScrollView>
  );
};

// Completion Step Component
interface CompletionStepProps {
  setupResults: {
    modelKey: boolean;
    functionKeys: string[];
  };
  selectedModel: SelectedModel;
}

const CompletionStep: React.FC<CompletionStepProps> = ({
  setupResults,
  selectedModel,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <ScrollView style={styles.stepContent} showsVerticalScrollIndicator={false}>
      <View style={styles.completionContainer}>
        <View style={styles.successIconContainer}>
          <Ionicons name="checkmark-circle" size={80} color={colors.statusSuccess} />
        </View>

        <Text style={styles.completionTitle}>Setup Complete!</Text>
        <Text style={styles.completionSubtitle}>
          Your AgentLog platform is now ready to create intelligent agents
        </Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>What you've configured:</Text>

          <View style={styles.summaryItem}>
            <Ionicons name="checkmark-circle" size={20} color={colors.statusSuccess} />
            <Text style={styles.summaryText}>
              <Text style={styles.summaryBold}>AI Model:</Text> {selectedModel.displayName}
            </Text>
          </View>

          {setupResults.functionKeys.length > 0 ? (
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.statusSuccess} />
              <Text style={styles.summaryText}>
                <Text style={styles.summaryBold}>Function APIs:</Text> {setupResults.functionKeys.join(', ')}
              </Text>
            </View>
          ) : (
            <View style={styles.summaryItem}>
              <Ionicons name="information-circle" size={20} color={colors.textSecondary} />
              <Text style={styles.summaryText}>
                <Text style={styles.summaryBold}>Function APIs:</Text> None (you can add these later)
              </Text>
            </View>
          )}
        </View>

        <View style={styles.nextStepsCard}>
          <Text style={styles.nextStepsTitle}>Next Steps:</Text>
          <View style={styles.nextStepItem}>
            <Ionicons name="storefront" size={16} color={colors.accent} />
            <Text style={styles.nextStepText}>Browse the Marketplace to find pre-built agents</Text>
          </View>
          <View style={styles.nextStepItem}>
            <Ionicons name="add-circle" size={16} color={colors.accent} />
            <Text style={styles.nextStepText}>Create your first custom agent</Text>
          </View>
          <View style={styles.nextStepItem}>
            <Ionicons name="people" size={16} color={colors.accent} />
            <Text style={styles.nextStepText}>Build teams of agents for complex workflows</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};
