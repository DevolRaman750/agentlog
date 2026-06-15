import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import { goGentAPI } from '../api/client';
import { CreateApiKeyRequest } from '../types';
import { useTheme, useThemedStyles } from '../theme';
import { spacing, radius, typography, touchTarget } from '../theme';

interface WhatsAppOnboardingSetupProps {
  onComplete: (success: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const WhatsAppOnboardingSetup: React.FC<WhatsAppOnboardingSetupProps> = ({
  onComplete,
  isLoading,
  setIsLoading,
}) => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState<'setup' | 'instructions'>('setup');
  const [formData, setFormData] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    verifyToken: '',
  });

  const styles = useThemedStyles((colors) => ({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 24,
    },
    container: {
      flex: 1,
      padding: spacing.md,
    },
    header: {
      alignItems: 'center' as const,
      marginBottom: spacing.xl,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: radius.pill,
      backgroundColor: '#25D36620',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
    },
    title: {
      ...typography.display,
      color: colors.textPrimary,
      textAlign: 'center' as const,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    formContainer: {
      marginBottom: spacing.xl,
    },
    inputGroup: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    textInput: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
    },
    inputHelp: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    actionsContainer: {
      gap: spacing.md,
    },
    helpButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: spacing.md,
      minHeight: touchTarget.min,
    },
    helpButtonText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.accent,
      marginLeft: spacing.sm,
    },
    saveButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: '#25D366',
      borderRadius: radius.md,
      paddingVertical: spacing.lg,
      gap: spacing.sm,
      minHeight: touchTarget.min,
    },
    saveButtonDisabled: {
      opacity: 0.6,
    },
    saveButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
    instructionsContainer: {
      marginBottom: spacing.xl,
    },
    instructionStep: {
      flexDirection: 'row' as const,
      marginBottom: spacing.xl,
    },
    stepNumber: {
      width: 32,
      height: 32,
      borderRadius: radius.xl,
      backgroundColor: colors.accent,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.lg,
    },
    stepNumberText: {
      ...typography.title,
      fontWeight: '700' as const,
      color: colors.textInverse,
    },
    stepContent: {
      flex: 1,
    },
    stepTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    stepDescription: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    linkButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    linkButtonText: {
      ...typography.body,
      color: colors.accent,
      textDecorationLine: 'underline' as const,
    },
    helpLinks: {
      marginBottom: spacing.xl,
    },
    helpLink: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.md,
      minHeight: touchTarget.min,
    },
    helpLinkText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.accent,
    },
    backButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.lg,
      minHeight: touchTarget.min,
    },
    backButtonText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.accent,
    },
  }));

  const validateAccessToken = (token: string): boolean => {
    return /^EAA[a-zA-Z0-9]{100,}$/.test(token);
  };

  const validatePhoneNumberId = (id: string): boolean => {
    return /^\d{10,}$/.test(id);
  };

  const validateBusinessAccountId = (id: string): boolean => {
    return /^\d{10,}$/.test(id);
  };

  const handleSave = async () => {
    if (!validateAccessToken(formData.accessToken)) {
      showError('Invalid access token format. Should start with EAA and be at least 100 characters.');
      return;
    }

    if (!validatePhoneNumberId(formData.phoneNumberId)) {
      showError('Invalid phone number ID. Should be a numeric ID with at least 10 digits.');
      return;
    }

    if (!validateBusinessAccountId(formData.businessAccountId)) {
      showError('Invalid business account ID. Should be a numeric ID with at least 10 digits.');
      return;
    }

    if (!formData.verifyToken.trim()) {
      formData.verifyToken = 'agentlog_whatsapp_verify_token';
    }

    setIsLoading(true);
    try {
      const createRequest: CreateApiKeyRequest = {
        keyName: 'WhatsApp Business API',
        serviceName: 'whatsapp',
        keyType: 'bearer_token',
        keyValue: formData.accessToken,
        authMode: 'whatsapp_business',
        authConfig: {
          phone_number_id: formData.phoneNumberId,
          business_account_id: formData.businessAccountId,
          webhook_verify_token: formData.verifyToken,
        },
        displayName: 'WhatsApp Business API',
        description: 'WhatsApp Business API access token for messaging and conversation management',
        accessLevel: 'write',
        scopes: ['messages', 'business_management'],
        isDefault: true,
        environment: 'production',
      };

      const response = await goGentAPI.createApiKey(createRequest);

      if (response.success) {
        showSuccess('WhatsApp Business API configured successfully!');
        onComplete(true);
      } else {
        throw new Error(response.error || 'Failed to save WhatsApp configuration');
      }
    } catch (error) {
      console.error('WhatsApp setup error:', error);
      showError(error instanceof Error ? error.message : 'Failed to save WhatsApp configuration');
      onComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const openMetaDeveloperPortal = () => {
    const url = 'https://developers.facebook.com/apps/';
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const openWhatsAppDocs = () => {
    const url = 'https://developers.facebook.com/docs/whatsapp/cloud-api/get-started';
    if (Platform.OS === 'web') {
      window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  };

  const renderSetupForm = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="chatbubble-ellipses" size={48} color="#25D366" />
        </View>
        <Text style={styles.title}>WhatsApp Business Setup</Text>
        <Text style={styles.subtitle}>
          Configure your WhatsApp Business API integration for automated messaging
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Access Token *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.accessToken}
            onChangeText={(text) => setFormData(prev => ({ ...prev, accessToken: text }))}
            placeholder="EAA..."
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputHelp}>
            Your WhatsApp Business API access token (starts with EAA)
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone Number ID *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.phoneNumberId}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phoneNumberId: text }))}
            placeholder="123456789012345"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputHelp}>
            Your WhatsApp Business phone number ID (numeric)
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Business Account ID *</Text>
          <TextInput
            style={styles.textInput}
            value={formData.businessAccountId}
            onChangeText={(text) => setFormData(prev => ({ ...prev, businessAccountId: text }))}
            placeholder="123456789012345"
            placeholderTextColor={colors.textSecondary}
            keyboardType="numeric"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputHelp}>
            Your WhatsApp Business account ID (numeric)
          </Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Webhook Verify Token (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={formData.verifyToken}
            onChangeText={(text) => setFormData(prev => ({ ...prev, verifyToken: text }))}
            placeholder="your_custom_verify_token"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.inputHelp}>
            Custom token for webhook verification (optional, defaults to agentlog_whatsapp_verify_token)
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setStep('instructions')}
        >
          <Ionicons name="help-circle" size={20} color={colors.accent} />
          <Text style={styles.helpButtonText}>Need help setting up?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Ionicons name="checkmark" size={20} color={colors.textInverse} />
          )}
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  const renderInstructions = () => (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="document-text" size={48} color={colors.accent} />
        </View>
        <Text style={styles.title}>Setup Instructions</Text>
        <Text style={styles.subtitle}>
          Follow these steps to get your WhatsApp Business API credentials
        </Text>
      </View>

      <View style={styles.instructionsContainer}>
        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create Meta Developer Account</Text>
            <Text style={styles.stepDescription}>
              Go to Meta for Developers and create a new app or use an existing one
            </Text>
            <TouchableOpacity style={styles.linkButton} onPress={openMetaDeveloperPortal}>
              <Text style={styles.linkButtonText}>Open Meta Developer Portal</Text>
              <Ionicons name="open-outline" size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Add WhatsApp Business API</Text>
            <Text style={styles.stepDescription}>
              In your app, add the WhatsApp Business API product and configure your business phone number
            </Text>
          </View>
        </View>

        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Generate Access Token</Text>
            <Text style={styles.stepDescription}>
              Create a permanent access token with the required permissions (whatsapp_business_messaging)
            </Text>
          </View>
        </View>

        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>4</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Get Phone Number ID</Text>
            <Text style={styles.stepDescription}>
              Find your phone number ID in the WhatsApp Business API settings
            </Text>
          </View>
        </View>

        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>5</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Get Business Account ID</Text>
            <Text style={styles.stepDescription}>
              Find your business account ID in Meta Business Manager
            </Text>
          </View>
        </View>

        <View style={styles.instructionStep}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>6</Text>
          </View>
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Create Verify Token</Text>
            <Text style={styles.stepDescription}>
              Create a custom verification token (can be any string) for webhook security
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.helpLinks}>
        <TouchableOpacity style={styles.helpLink} onPress={openWhatsAppDocs}>
          <Ionicons name="document-text" size={20} color={colors.accent} />
          <Text style={styles.helpLinkText}>WhatsApp Business API Documentation</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('setup')}
      >
        <Ionicons name="arrow-back" size={20} color={colors.accent} />
        <Text style={styles.backButtonText}>Back to Setup</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => onComplete(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>WhatsApp Business</Text>
        <View style={styles.headerSpacer} />
      </View>

      {step === 'setup' ? renderSetupForm() : renderInstructions()}
    </View>
  );
};

export default WhatsAppOnboardingSetup;
