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
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      paddingTop: Platform.OS === 'ios' ? 60 : spacing.lg,
    },
    headerContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    title: {
      ...typography.h2,
      marginLeft: spacing.sm,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.sm,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    infoSection: {
      marginBottom: spacing.xl,
    },
    configurationText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    configurationName: {
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    requirementCard: {
      backgroundColor: colors.bgCard,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    requirementTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    requirementDescription: {
      ...typography.body,
      color: colors.textSecondary,
    },
    inputSection: {
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
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      ...typography.title,
      fontWeight: '400' as const,
      backgroundColor: colors.bgCard,
    },
    keyInput: {
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    buttonContainer: {
      flexDirection: 'row' as const,
      gap: spacing.md,
    },
    button: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: touchTarget.min,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      gap: spacing.sm,
    },
    testButton: {
      backgroundColor: colors.bgCard,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    testButtonText: {
      ...typography.title,
      color: colors.accent,
    },
    saveButton: {
      backgroundColor: colors.accent,
    },
    saveButtonText: {
      ...typography.title,
      color: colors.textInverse,
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
              placeholderTextColor={colors.textTertiary}
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
                <ActivityIndicator size="small" color={colors.textInverse} />
              ) : (
                <>
                  <Ionicons name="save" size={20} color={colors.textInverse} />
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