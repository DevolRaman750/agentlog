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

interface ApiKeyOnboardingProps {
  visible: boolean;
  onClose: () => void;
  onComplete: () => void;
  existingKeys?: any[]; // Pass existing keys to show current status
}

export type OnboardingStep = 'welcome' | 'model-selection' | 'model-setup' | 'functions-setup' | 'completion';
export type ModelProvider = 'gemini' | 'openrouter';

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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  stepContent: {
    flex: 1,
  },
  welcomeContainer: {
    padding: 20,
    alignItems: 'center' as const,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.bgHover,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  requirementCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%' as const,
  },
  requirementHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  requirementTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  requirementItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  requirementText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  requirementBold: {
    fontWeight: '600' as const,
  },
  statusCard: {
    backgroundColor: `${colors.statusSuccess}15`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: `${colors.statusSuccess}30`,
  },
  statusHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.statusSuccess,
    marginLeft: 8,
  },
  statusItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  statusBold: {
    fontWeight: '600' as const,
  },
  costWarningCard: {
    backgroundColor: `${colors.statusWarning}15`,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%' as const,
    borderWidth: 1,
    borderColor: `${colors.statusWarning}30`,
  },
  warningHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.statusWarning,
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
  },
  benefitsCard: {
    backgroundColor: colors.bgHover,
    borderRadius: 12,
    padding: 20,
    width: '100%' as const,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  selectionContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 24,
  },
  providerCard: {
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  selectedProviderCard: {
    borderColor: colors.accent,
    backgroundColor: colors.bgHover,
  },
  providerHeader: {
    marginBottom: 12,
  },
  providerTitleContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  providerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
  },
  recommendedBadge: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.statusSuccess,
    backgroundColor: `${colors.statusSuccess}15`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  costEffectiveBadge: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.accent,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  providerDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  providerFeatures: {
    gap: 4,
  },
  featureText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  comparisonNote: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    backgroundColor: colors.bgSurface,
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  comparisonText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  setupContainer: {
    padding: 20,
  },
  instructionsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  instructionsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  linkButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  linkButtonText: {
    fontSize: 12,
    color: colors.textInverse,
    fontWeight: '600' as const,
    marginRight: 4,
  },
  instructionStep: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  stepText: {
    fontSize: 14,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    backgroundColor: colors.bgSurface,
  },
  invalidInput: {
    borderColor: colors.statusError,
    backgroundColor: `${colors.statusError}10`,
  },
  errorText: {
    fontSize: 12,
    color: colors.statusError,
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    color: colors.statusSuccess,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  disabledButton: {
    backgroundColor: colors.borderMedium,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  functionsContainer: {
    padding: 20,
  },
  optionalBadgeContainer: {
    alignItems: 'center' as const,
    marginBottom: 24,
  },
  optionalBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  optionalBadgeText: {
    fontSize: 14,
    color: colors.accent,
    marginLeft: 8,
    fontWeight: '500' as const,
  },
  functionServiceCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  functionServiceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  functionServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 16,
  },
  functionServiceInfo: {
    flex: 1,
  },
  functionServiceTitleRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  functionServiceName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginRight: 8,
  },
  popularBadge: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.statusWarning,
    backgroundColor: `${colors.statusWarning}15`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  functionServiceDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  setupButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  completedButton: {
    backgroundColor: colors.statusSuccess,
  },
  setupButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  completedButtonText: {
    color: colors.textInverse,
  },
  continueButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center' as const,
    marginTop: 24,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  completionContainer: {
    padding: 20,
    alignItems: 'center' as const,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: colors.textPrimary,
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  completionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  summaryCard: {
    backgroundColor: colors.bgHover,
    borderRadius: 12,
    padding: 20,
    width: '100%' as const,
    marginBottom: 24,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  summaryBold: {
    fontWeight: '600' as const,
  },
  nextStepsCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: 20,
    width: '100%' as const,
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  nextStepItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  nextStepText: {
    fontSize: 14,
    color: colors.textPrimary,
    marginLeft: 8,
  },
  footer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    backgroundColor: colors.bgCard,
  },
  backButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.accent,
    marginLeft: 4,
  },
  footerSpacer: {
    flex: 1,
  },
  nextButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textInverse,
    marginRight: 8,
  },
  completeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.statusSuccess,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textInverse,
    marginRight: 8,
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
  const [selectedModel, setSelectedModel] = useState<SelectedModel | null>(null);
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
      ['gemini', 'openai', 'openrouter'].includes(key.serviceName)
    );
    const functionServices = existingKeys.filter(key =>
      !['gemini', 'openai', 'openrouter', 'agent', 'team', 'internal'].includes(key.serviceName)
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
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
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
              <Text style={styles.requirementBold}>AI Model API Key</Text> - Either Google Gemini or OpenRouter (required)
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
            You will incur costs through using these API keys as per the Gemini/OpenRouter platform pricing.
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
            selectedModel?.provider === 'gemini' && styles.selectedProviderCard
          ]}
          onPress={() => setSelectedModel({
            provider: 'gemini',
            name: 'gemini-2.5-pro',
            displayName: 'Google Gemini 1.5 Pro'
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
              <Text style={styles.recommendedBadge}>RECOMMENDED</Text>
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
            name: 'anthropic/claude-3.5-sonnet',
            displayName: 'Claude 3.5 Sonnet (via OpenRouter)'
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
            Access to multiple AI models including Claude 3.5 Sonnet, GPT-4o, and more through a single API.
          </Text>
          <View style={styles.providerFeatures}>
            <Text style={styles.featureText}>Multiple model options</Text>
            <Text style={styles.featureText}>Excellent function calling</Text>
            <Text style={styles.featureText}>High-quality responses</Text>
            <Text style={styles.featureText}>$3 per 1M input tokens (Claude 3.5 Sonnet)</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.comparisonNote}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.comparisonText}>
            Both options provide excellent AI capabilities. Choose based on your budget and specific needs.
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
            !['gemini', 'openai', 'openrouter', 'agent', 'team', 'internal'].includes(service.id)
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
