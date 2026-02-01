import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goGentAPI } from '../api/client';
import { UserApiKey, CreateApiKeyRequest } from '../types';
import { ModelKeyRequirement } from '../utils/modelKeyUtils';
import { useToast } from '../context/ToastContext';
import { webInputStyles } from '../styles/containers';
import { useTheme, useThemedStyles } from '../theme';

interface ModelKeyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  requirement: ModelKeyRequirement;
  configurationName: string;
}

const ModelKeyModal: React.FC<ModelKeyModalProps> = ({
  visible,
  onClose,
  onSuccess,
  requirement,
  configurationName,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgSurface,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      paddingTop: Platform.OS === 'ios' ? 60 : 16,
    },
    headerContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      marginLeft: 8,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: 8,
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    infoSection: {
      marginBottom: 24,
    },
    configurationText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    configurationName: {
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    requirementCard: {
      backgroundColor: colors.bgCard,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    requirementTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    requirementDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    inputSection: {
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
      borderColor: colors.borderLight,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      backgroundColor: colors.bgCard,
    },
    keyInput: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    buttonContainer: {
      flexDirection: 'row' as const,
      gap: 12,
    },
    button: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: 8,
      gap: 8,
    },
    testButton: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    testButtonText: {
      color: colors.accent,
      fontWeight: '600' as const,
      fontSize: 16,
    },
    saveButton: {
      backgroundColor: colors.accent,
    },
    saveButtonText: {
      color: colors.textInverse,
      fontWeight: '600' as const,
      fontSize: 16,
    },
  }));

  const [keyValue, setKeyValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (visible) {
      setKeyValue('');
      setLoading(false);
      setTesting(false);
    }
  }, [visible]);

  const getKeyPlaceholder = (keyName: string): string => {
    switch (keyName) {
      case 'gemini': return 'AIzaSy...';
      case 'openrouter': return 'sk-or-...';
      case 'openai': return 'sk-...';
      default: return 'Enter API key...';
    }
  };

  const handleSave = async () => {
    if (!keyValue.trim()) {
      showError('Validation Error', 'Please enter an API key');
      return;
    }

    setLoading(true);
    try {
      const createRequest: CreateApiKeyRequest = {
        keyName: `${requirement.keyName}_key`,
        serviceName: requirement.keyName,
        keyType: 'api_key',
        keyValue: keyValue.trim(),
        displayName: `${requirement.displayName} API Key`,
        description: requirement.description,
        accessLevel: 'read_write',
        scopes: ['chat', 'completions'],
        isDefault: true,
        environment: 'production',
      };

      const response = await goGentAPI.createApiKey(createRequest);
      if (response.success) {
        showSuccess('Success', `${requirement.displayName} API key saved successfully`);
        onSuccess();
      } else {
        showError('Error', response.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Error saving model API key:', error);
      showError('Error', 'Failed to save API key. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!keyValue.trim()) {
      showError('Validation Error', 'Please enter an API key to test');
      return;
    }

    setTesting(true);
    try {
      const response = await goGentAPI.testApiKey(keyValue.trim());
      if (response.success) {
        showSuccess('Test Successful', `${requirement.displayName} API key is valid`);
      } else {
        showError('Test Failed', response.error || 'API key test failed');
      }
    } catch (error) {
      console.error('Error testing API key:', error);
      showError('Test Failed', 'Could not test API key. Please verify it manually.');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Ionicons name="key" size={24} color={colors.accent} />
            <Text style={styles.title}>Model API Key Required</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.infoSection}>
            <Text style={styles.configurationText}>
              Configuration <Text style={styles.configurationName}>"{configurationName}"</Text> requires:
            </Text>
            <View style={styles.requirementCard}>
              <Text style={styles.requirementTitle}>{requirement.displayName}</Text>
              <Text style={styles.requirementDescription}>{requirement.description}</Text>
            </View>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>API Key</Text>
            <TextInput
              style={[
                Platform.OS === 'web' ? webInputStyles.textInput : styles.textInput,
                styles.keyInput
              ]}
              placeholder={getKeyPlaceholder(requirement.keyName)}
              placeholderTextColor="#999"
              value={keyValue}
              onChangeText={setKeyValue}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !testing}
            />
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTest}
              disabled={loading || testing || !keyValue.trim()}
            >
              {testing ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                  <Text style={styles.testButtonText}>Test Key</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading || testing || !keyValue.trim()}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Ionicons name="save" size={20} color="white" />
                  <Text style={styles.saveButtonText}>Save & Continue</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};


export default ModelKeyModal;