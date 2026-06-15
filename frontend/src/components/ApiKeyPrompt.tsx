import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { secureStorage, getApiKeyValidation, SessionApiKeys } from '../utils/secureStorage';
import { AlertAPI } from './CustomAlert';
import { useTheme, useThemedStyles } from '../theme';
import { spacing, radius, typography, touchTarget } from '../theme';

interface MissingApiKey {
  keyName: string;
  description: string;
  required: boolean;
}

interface ApiKeyPromptProps {
  visible: boolean;
  missingKeys: MissingApiKey[];
  onComplete: (success: boolean) => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

export const ApiKeyPrompt: React.FC<ApiKeyPromptProps> = ({
  visible,
  missingKeys,
  onComplete,
  onCancel,
  title = "API Keys Required",
  message = "Please provide the following API keys to continue:",
}) => {
  const { colors } = useTheme();
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgCard,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    title: {
      ...typography.h1,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    cancelButton: {
      padding: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSurface,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    cancelButtonText: {
      ...typography.title,
      fontWeight: '500' as const,
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    message: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
    },
    inputGroup: {
      marginBottom: spacing.lg,
    },
    labelContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
      flexWrap: 'wrap' as const,
      minHeight: 20,
    },
    label: {
      ...typography.body,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      flex: 1,
      minWidth: 80,
    },
    required: {
      ...typography.caption,
      color: colors.statusError,
      marginLeft: spacing.xs,
      alignSelf: 'flex-start' as const,
      flexShrink: 0,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      ...typography.title,
      fontWeight: '400' as const,
      backgroundColor: colors.bgCard,
    },
    inputError: {
      borderColor: colors.statusError,
      backgroundColor: `${colors.statusError}15`,
    },
    errorText: {
      ...typography.caption,
      color: colors.statusError,
      marginTop: spacing.xs,
    },
    helpText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      fontStyle: 'italic' as const,
    },
    infoSection: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    infoTitle: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    infoText: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      paddingBottom: Platform.OS === 'ios' ? 34 : spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      gap: spacing.md,
    },
    button: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: touchTarget.min,
    },
    cancelButtonFooter: {
      backgroundColor: colors.bgSurface,
    },
    cancelButtonFooterText: {
      ...typography.title,
      fontWeight: '500' as const,
      color: colors.textSecondary,
    },
    saveButton: {
      backgroundColor: colors.accent,
    },
    saveButtonDisabled: {
      backgroundColor: colors.borderLight,
    },
    saveButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
    saveButtonTextDisabled: {
      color: colors.textTertiary,
    },
  }));

  // Reset state when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setApiKeyValues({});
      setValidationErrors({});
      setIsLoading(false);
    }
  }, [visible]);

  const updateApiKey = (keyName: string, value: string) => {
    setApiKeyValues(prev => ({ ...prev, [keyName]: value }));

    // Clear validation error when user starts typing
    if (validationErrors[keyName]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[keyName];
        return newErrors;
      });
    }
  };

  const validateInputs = (): boolean => {
    const errors: Record<string, string> = {};
    let hasErrors = false;

    for (const missingKey of missingKeys) {
      const value = apiKeyValues[missingKey.keyName] || '';
      const validation = secureStorage.validateApiKey(missingKey.keyName, value);

      if (!validation.isValid) {
        errors[missingKey.keyName] = validation.error || 'Invalid value';
        hasErrors = true;
      }
    }

    setValidationErrors(errors);
    return !hasErrors;
  };

  const handleSave = async () => {
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);
    try {
      // Save each API key
      for (const missingKey of missingKeys) {
        const value = apiKeyValues[missingKey.keyName];
        if (value && value.trim()) {
          await secureStorage.updateApiKey(missingKey.keyName as keyof SessionApiKeys, value.trim());
        }
      }

      onComplete(true);
    } catch (error) {
      console.error('Failed to save API keys:', error);
      AlertAPI.alert(
        'Error',
        'Failed to save API keys. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    AlertAPI.alert(
      'Cancel Setup',
      'Without these API keys, some features will not work. Are you sure you want to cancel?',
      [
        { text: 'Continue Setup', style: 'default' },
        { text: 'Cancel', style: 'destructive', onPress: onCancel },
      ]
    );
  };

  const getInputPlaceholder = (keyName: string): string => {
    const validation = getApiKeyValidation(keyName);
    if (!validation) return 'Enter value...';

    switch (keyName) {
      case 'geminiApiKey':
        return 'AIza...';
      case 'openWeatherApiKey':
        return '32-character API key';
      case 'neo4jUrl':
        return 'neo4j://localhost:7687';
      case 'neo4jUsername':
        return 'neo4j';
      case 'neo4jPassword':
        return 'password';
      case 'neo4jDatabase':
        return 'neo4j';
      default:
        return 'Enter value...';
    }
  };

  const isPasswordField = (keyName: string): boolean => {
    return keyName.toLowerCase().includes('password') || keyName.toLowerCase().includes('key');
  };

  const canSave = missingKeys.every(key => {
    const value = apiKeyValues[key.keyName];
    return key.required ? (value && value.trim()) : true;
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>X</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.message}>{message}</Text>

          {missingKeys.map((missingKey) => {
            const validation = getApiKeyValidation(missingKey.keyName);
            const error = validationErrors[missingKey.keyName];

            return (
              <View key={missingKey.keyName} style={styles.inputGroup}>
                <View style={styles.labelContainer}>
                  <Text style={styles.label}>
                    {validation?.description || missingKey.description}
                  </Text>
                  {missingKey.required && <Text style={styles.required}>*</Text>}
                </View>

                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  value={apiKeyValues[missingKey.keyName] || ''}
                  onChangeText={(value) => updateApiKey(missingKey.keyName, value)}
                  placeholder={getInputPlaceholder(missingKey.keyName)}
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={isPasswordField(missingKey.keyName)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                {validation?.testEndpoint && (
                  <Text style={styles.helpText}>
                    Get your key from the API provider's dashboard
                  </Text>
                )}
              </View>
            );
          })}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Security Information</Text>
            <Text style={styles.infoText}>
              {'\u2022'} API keys are encrypted and stored locally on your device{'\n'}
              {'\u2022'} Keys are never sent to or stored on our servers{'\n'}
              {'\u2022'} Each execution request includes only the necessary keys{'\n'}
              {'\u2022'} You can remove keys anytime from Settings
            </Text>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButtonFooter]}
            onPress={handleCancel}
            disabled={isLoading}
          >
            <Text style={styles.cancelButtonFooterText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.saveButton,
              (!canSave || isLoading) && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!canSave || isLoading}
          >
            <Text style={[
              styles.saveButtonText,
              (!canSave || isLoading) && styles.saveButtonTextDisabled,
            ]}>
              {isLoading ? 'Saving...' : 'Save & Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};
