import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import { goGentAPI } from '../api/client';
import { CreateApiKeyRequest } from '../types';
import { useTheme, useThemedStyles } from '../theme';
import { spacing, radius, typography, touchTarget } from '../theme';

interface ServiceMetadata {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
  popular: boolean;
  keyType: string;
  authModes: string[];
  placeholder: string;
  defaultAccessLevel: string;
  defaultScopes: string[];
  setupInstructions: {
    description: string;
    scopes: string[];
    links: Array<{ text: string; url: string; }>;
  };
}

interface GenericApiKeySetupProps {
  service: ServiceMetadata;
  onComplete: (success: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const GenericApiKeySetup: React.FC<GenericApiKeySetupProps> = ({
  service,
  onComplete,
  isLoading,
  setIsLoading,
}) => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const [apiKey, setApiKey] = useState('');

  const styles = useThemedStyles((colors) => ({
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
      backgroundColor: colors.bgCard,
    },
    backButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      minHeight: touchTarget.min,
    },
    backButtonText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.accent,
      marginLeft: spacing.xs,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.sm,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
    },
    serviceHeader: {
      alignItems: 'center' as const,
      marginBottom: spacing.xl,
    },
    serviceIcon: {
      width: 80,
      height: 80,
      borderRadius: radius.pill,
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
    instructionsCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
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
    scopesCard: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    scopesHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    scopesTitle: {
      ...typography.title,
      color: colors.statusSuccess,
      marginLeft: spacing.sm,
    },
    scopesDescription: {
      ...typography.body,
      color: colors.statusSuccess,
      marginBottom: spacing.md,
    },
    scopeItem: {
      marginBottom: spacing.sm,
    },
    scopeBadge: {
      backgroundColor: colors.statusSuccess,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      alignSelf: 'flex-start' as const,
    },
    scopeBadgeText: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    inputSection: {
      marginBottom: spacing.lg,
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
      color: colors.textPrimary,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.borderMedium,
      borderRadius: radius.md,
      padding: spacing.md,
      ...typography.body,
      backgroundColor: colors.bgSurface,
      color: colors.textPrimary,
      minHeight: 160,
      textAlignVertical: 'top' as const,
    },
    invalidInput: {
      borderColor: colors.statusError,
      backgroundColor: colors.bgSurface,
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
    linksSection: {
      marginBottom: spacing.lg,
    },
    linksTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    linkItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
      minHeight: touchTarget.min,
    },
    linkText: {
      ...typography.body,
      color: colors.accent,
      marginLeft: spacing.sm,
      flex: 1,
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
  }));

  const validateApiKey = (key: string): boolean => {
    // Basic validation - just check if it's not empty and has reasonable length
    return key.trim().length > 0 && key.trim().length >= 10;
  };

  const handleSave = async () => {
    if (!validateApiKey(apiKey)) {
      showError('Please enter a valid API key');
      return;
    }

    setIsLoading(true);
    try {
      const createRequest: CreateApiKeyRequest = {
        keyName: `${service.displayName} API Key`,
        serviceName: service.id,
        keyType: service.keyType as any,
        keyValue: apiKey.trim(),
        displayName: `${service.displayName} API Key`,
        description: `API key for ${service.displayName} integration`,
        accessLevel: service.defaultAccessLevel as any,
        scopes: service.defaultScopes,
        isDefault: true,
        environment: 'production',
      };

      const response = await goGentAPI.createApiKey(createRequest);

      if (response.success) {
        showSuccess(`${service.displayName} API key configured successfully!`);
        onComplete(true);
      } else {
        throw new Error(response.error || `Failed to save ${service.displayName} API key`);
      }
    } catch (error) {
      console.error(`${service.displayName} setup error:`, error);
      showError(error instanceof Error ? error.message : `Failed to configure ${service.displayName}`);
      onComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getSpecificInstructions = () => {
    switch (service.id) {
      case 'slack':
        return {
          title: 'Get Your Slack Bot Token',
          steps: [
            'Go to api.slack.com/apps',
            'Click "Create New App" → "From scratch"',
            'Enter your app name (e.g., "AgentLog Bot") and select your workspace',
            'Click "Create App"',
            'In the left sidebar, click "OAuth & Permissions"',
            'Scroll down to "Scopes" and add Bot Token Scopes:',
            '  • chat:write - Send messages',
            '  • channels:read - View channels',
            '  • users:read - Read user information',
            '  • files:write - Upload files (optional)',
            'Scroll up and click "Install to Workspace"',
            'Click "Allow" to authorize the app',
            'Copy the "Bot User OAuth Token" (starts with xoxb-)',
            'Paste the token in the field below'
          ],
          keyFormat: 'xoxb-xxxxxxxxxxxx-xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx',
          validation: (key: string) => /^xoxb-[0-9]{10,13}-[0-9]{10,13}-[a-zA-Z0-9]{24}$/.test(key),
          validationError: 'Slack bot token should start with "xoxb-" and have the format: xoxb-############-############-########################'
        };

      case 'openweather':
        return {
          title: 'Get Your OpenWeather API Key',
          steps: [
            'Go to openweathermap.org',
            'Click "Sign Up" if you don\'t have an account, or "Sign In"',
            'After signing in, go to openweathermap.org/api',
            'Choose "Current Weather Data" (free tier available)',
            'Click "Subscribe" on the Free plan',
            'Go to your account dashboard',
            'Click on "API keys" tab',
            'Copy your default API key or create a new one',
            'Paste the API key in the field below'
          ],
          keyFormat: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 characters)',
          validation: (key: string) => /^[a-f0-9]{32}$/.test(key),
          validationError: 'OpenWeather API key should be 32 hexadecimal characters'
        };

      case 'googledrive':
        return {
          title: 'Set Up Google Drive Service Account',
          steps: [
            'Go to console.cloud.google.com',
            'Create a new project or select an existing one',
            'Enable the Google Drive API:',
            '  • Go to "APIs & Services" → "Library"',
            '  • Search for "Google Drive API" and enable it',
            'Create a service account:',
            '  • Go to "APIs & Services" → "Credentials"',
            '  • Click "Create Credentials" → "Service Account"',
            '  • Fill in the service account details',
            'Generate a key:',
            '  • Click on your service account',
            '  • Go to "Keys" tab → "Add Key" → "Create new key"',
            '  • Choose JSON format and download the file',
            'Copy the entire JSON content and paste it below',
            'Share your Google Drive folders with the service account email'
          ],
          keyFormat: 'JSON service account credentials',
          validation: (key: string) => {
            try {
              const parsed = JSON.parse(key);
              return parsed.type === 'service_account' && parsed.private_key && parsed.client_email;
            } catch {
              return false;
            }
          },
          validationError: 'Please paste the complete JSON service account credentials'
        };

      default:
        return {
          title: `Get Your ${service.displayName} API Key`,
          steps: [
            `Visit the ${service.displayName} developer portal or settings`,
            'Sign in to your account or create one if needed',
            'Navigate to the API keys or developer settings section',
            'Generate a new API key for AgentLog integration',
            'Copy the API key and paste it in the field below'
          ],
          keyFormat: service.placeholder,
          validation: (key: string) => key.trim().length >= 10,
          validationError: `Please enter a valid ${service.displayName} API key`
        };
    }
  };

  const instructions = getSpecificInstructions();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onComplete(false)}
        >
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{service.displayName} Setup</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => onComplete(false)}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        <View style={styles.serviceHeader}>
          <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
            <Ionicons name={service.icon as any} size={32} color={service.color} />
          </View>
          <Text style={styles.title}>{instructions.title}</Text>
          <Text style={styles.subtitle}>{service.setupInstructions.description}</Text>
        </View>

        <View style={styles.instructionsCard}>
          <View style={styles.instructionsHeader}>
            <Ionicons name="list" size={20} color={colors.accent} />
            <Text style={styles.instructionsTitle}>Step-by-step guide</Text>
            {service.setupInstructions.links.length > 0 && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={() => Linking.openURL(service.setupInstructions.links[0].url)}
              >
                <Text style={styles.linkButtonText}>{service.setupInstructions.links[0].text}</Text>
                <Ionicons name="open-outline" size={16} color={colors.accent} />
              </TouchableOpacity>
            )}
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

        {service.setupInstructions.scopes.length > 0 && (
          <View style={styles.scopesCard}>
            <View style={styles.scopesHeader}>
              <Ionicons name="shield-checkmark" size={20} color={colors.statusSuccess} />
              <Text style={styles.scopesTitle}>Required Permissions</Text>
            </View>
            <Text style={styles.scopesDescription}>
              Make sure to configure these permissions for optimal functionality:
            </Text>
            {service.setupInstructions.scopes.map((scope, index) => (
              <View key={index} style={styles.scopeItem}>
                <View style={styles.scopeBadge}>
                  <Text style={styles.scopeBadgeText}>{scope}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>
            {service.id === 'googledrive' ? 'Service Account JSON *' : 'API Key *'}
          </Text>
          <TextInput
            style={[
              service.id === 'googledrive' ? styles.textArea : styles.textInput,
              !instructions.validation(apiKey) && apiKey.length > 0 && styles.invalidInput
            ]}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={instructions.keyFormat}
            placeholderTextColor={colors.textTertiary}
            multiline={service.id === 'googledrive'}
            numberOfLines={service.id === 'googledrive' ? 8 : 1}
            secureTextEntry={service.id !== 'googledrive'}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {apiKey.length > 0 && !instructions.validation(apiKey) && (
            <Text style={styles.errorText}>{instructions.validationError}</Text>
          )}
          {instructions.validation(apiKey) && (
            <Text style={styles.successText}>✅ Valid format</Text>
          )}
        </View>

        {service.setupInstructions.links.length > 1 && (
          <View style={styles.linksSection}>
            <Text style={styles.linksTitle}>Helpful Resources</Text>
            {service.setupInstructions.links.slice(1).map((link, index) => (
              <TouchableOpacity
                key={index}
                style={styles.linkItem}
                onPress={() => Linking.openURL(link.url)}
              >
                <Ionicons name="link" size={16} color={colors.accent} />
                <Text style={styles.linkText}>{link.text}</Text>
                <Ionicons name="open-outline" size={16} color={colors.accent} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, (!instructions.validation(apiKey) || isLoading) && styles.disabledButton]}
          onPress={handleSave}
          disabled={!instructions.validation(apiKey) || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.saveButtonText}>Configure {service.displayName}</Text>
          )}
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
