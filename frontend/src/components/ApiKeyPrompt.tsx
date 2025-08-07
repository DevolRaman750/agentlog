import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { secureStorage, getApiKeyValidation, SessionApiKeys } from '../utils/secureStorage';
import { AlertAPI } from './CustomAlert';

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
  title = "🔑 API Keys Required",
  message = "Please provide the following API keys to continue:",
}) => {
  const [apiKeyValues, setApiKeyValues] = useState<Record<string, string>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

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
            <Text style={styles.cancelButtonText}>✕</Text>
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
                  placeholderTextColor="#999"
                  secureTextEntry={isPasswordField(missingKey.keyName)}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                />

                {error && <Text style={styles.errorText}>{error}</Text>}

                {validation?.testEndpoint && (
                  <Text style={styles.helpText}>
                    💡 Get your key from the API provider's dashboard
                  </Text>
                )}
              </View>
            );
          })}

          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>🔒 Security Information</Text>
            <Text style={styles.infoText}>
              • API keys are encrypted and stored locally on your device{'\n'}
              • Keys are never sent to or stored on our servers{'\n'}
              • Each execution request includes only the necessary keys{'\n'}
              • You can remove keys anytime from Settings
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  cancelButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  message: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap', // Allow wrapping on small screens
    minHeight: 20, // Ensure consistent height
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1, // Allow label to take available space
    minWidth: 80, // Minimum width before wrapping
  },
  required: {
    fontSize: 12, // Slightly smaller on mobile
    color: '#e74c3c',
    marginLeft: 4,
    alignSelf: 'flex-start', // Prevent stretching
    flexShrink: 0, // Don't shrink the indicator
  },
  input: {
    borderWidth: 1,
    borderColor: '#e1e5e9',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#e74c3c',
    backgroundColor: '#fef7f7',
  },
  errorText: {
    fontSize: 12,
    color: '#e74c3c',
    marginTop: 4,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonFooter: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonFooterText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  saveButtonTextDisabled: {
    color: '#999',
  },
}); 