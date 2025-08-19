import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  const { showSuccess, showError } = useToast();
  const [step, setStep] = useState<'setup' | 'instructions'>('setup');
  const [formData, setFormData] = useState({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: '',
    verifyToken: '',
  });

  const validateAccessToken = (token: string): boolean => {
    // WhatsApp Business API tokens start with EAA
    return /^EAA[a-zA-Z0-9]{100,}$/.test(token);
  };

  const validatePhoneNumberId = (id: string): boolean => {
    // Phone number IDs are typically long numeric strings
    return /^\d{10,}$/.test(id);
  };

  const validateBusinessAccountId = (id: string): boolean => {
    // Business account IDs are typically long numeric strings
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
      // Make verify token optional for pull-based approach
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
            placeholderTextColor="#8E8E93"
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
            placeholderTextColor="#8E8E93"
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
            placeholderTextColor="#8E8E93"
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
            placeholderTextColor="#8E8E93"
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
          <Ionicons name="help-circle" size={20} color="#007AFF" />
          <Text style={styles.helpButtonText}>Need help setting up?</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
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
          <Ionicons name="document-text" size={48} color="#007AFF" />
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
              <Ionicons name="open-outline" size={16} color="#007AFF" />
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
          <Ionicons name="document-text" size={20} color="#007AFF" />
          <Text style={styles.helpLinkText}>WhatsApp Business API Documentation</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setStep('setup')}
      >
        <Ionicons name="arrow-back" size={20} color="#007AFF" />
        <Text style={styles.backButtonText}>Back to Setup</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={styles.modalContainer}>
      <View style={styles.modalHeader}>
        <TouchableOpacity onPress={() => onComplete(false)}>
          <Ionicons name="close" size={24} color="#8E8E93" />
        </TouchableOpacity>
        <Text style={styles.modalTitle}>WhatsApp Business</Text>
        <View style={styles.headerSpacer} />
      </View>

      {step === 'setup' ? renderSetupForm() : renderInstructions()}
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  headerSpacer: {
    width: 24,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#25D36620',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1F',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1D1D1F',
  },
  inputHelp: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  helpButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  instructionStep: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  linkButtonText: {
    fontSize: 14,
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  helpLinks: {
    marginBottom: 24,
  },
  helpLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  helpLinkText: {
    fontSize: 16,
    color: '#007AFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default WhatsAppOnboardingSetup;
