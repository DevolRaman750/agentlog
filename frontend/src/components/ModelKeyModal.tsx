import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
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
            <Ionicons name="key" size={24} color="#007AFF" />
            <Text style={styles.title}>Model API Key Required</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
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
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingTop: Platform.OS === 'ios' ? 60 : 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#333',
  },
  closeButton: {
    padding: 8, // Increased for better touch target
    minWidth: 44, // Ensure minimum touch target size
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    color: '#666',
    marginBottom: 12,
  },
  configurationName: {
    fontWeight: '600',
    color: '#333',
  },
  requirementCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  requirementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  requirementDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  keyInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    gap: 8,
  },
  testButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  testButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ModelKeyModal;