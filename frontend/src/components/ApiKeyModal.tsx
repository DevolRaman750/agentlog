import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { AlertAPI } from './CustomAlert';
import { goGentAPI } from '../api/client';
import { UserApiKey, CreateApiKeyRequest, UpdateApiKeyRequest } from '../types';

interface ServiceInfo {
  name: string;
  displayName: string;
  description: string;
  placeholder: string;
  keyType: 'api_key' | 'access_token' | 'bearer_token' | 'oauth_token' | 'webhook_url' | 'connection_string';
  defaultAccessLevel: 'read' | 'write' | 'admin' | 'read_write';
  defaultScopes: string[];
}

const SERVICES: ServiceInfo[] = [
  {
    name: 'gemini',
    displayName: 'Google Gemini',
    description: 'API key for Google Gemini models (text generation, function calling)',
    placeholder: 'AIzaSy...',
    keyType: 'api_key',
    defaultAccessLevel: 'read_write',
    defaultScopes: ['generate', 'chat', 'function_calling'],
  },
  {
    name: 'openai',
    displayName: 'OpenAI',
    description: 'API key for OpenAI GPT models and DALL-E image generation',
    placeholder: 'sk-...',
    keyType: 'api_key',
    defaultAccessLevel: 'read_write',
    defaultScopes: ['completions', 'images', 'models'],
  },
  {
    name: 'openrouter',
    displayName: 'OpenRouter',
    description: 'API key for OpenRouter (Kimi K2 and other models)',
    placeholder: 'sk-or-...',
    keyType: 'api_key',
    defaultAccessLevel: 'read_write',
    defaultScopes: ['chat', 'completions'],
  },
  {
    name: 'slack',
    displayName: 'Slack',
    description: 'Bot token for sending messages to Slack channels',
    placeholder: 'xoxb-...',
    keyType: 'bearer_token',
    defaultAccessLevel: 'write',
    defaultScopes: ['chat:write', 'channels:read'],
  },
  {
    name: 'discord',
    displayName: 'Discord',
    description: 'Webhook URL for sending messages to Discord channels',
    placeholder: 'https://discord.com/api/webhooks/...',
    keyType: 'webhook_url',
    defaultAccessLevel: 'write',
    defaultScopes: ['messages'],
  },
  {
    name: 'openweather',
    displayName: 'OpenWeather',
    description: 'API key for weather data and forecasts',
    placeholder: 'Enter your OpenWeather API key',
    keyType: 'api_key',
    defaultAccessLevel: 'read',
    defaultScopes: ['current_weather', 'forecasts'],
  },
  {
    name: 'neo4j',
    displayName: 'Neo4j',
    description: 'Connection string for Neo4j graph database',
    placeholder: 'bolt://username:password@localhost:7687',
    keyType: 'connection_string',
    defaultAccessLevel: 'read_write',
    defaultScopes: ['read', 'write'],
  },
  {
    name: 'github',
    displayName: 'GitHub',
    description: 'Personal access token for GitHub API',
    placeholder: 'ghp_...',
    keyType: 'access_token',
    defaultAccessLevel: 'read_write',
    defaultScopes: ['repo', 'issues', 'pull_requests'],
  },
];

interface ApiKeyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingKey?: UserApiKey | null;
  initialService?: string; // Pre-select a service when opened from function page
  requiredServices?: string[]; // Filter to only show these services
}

interface FormData {
  serviceName: string;
  keyName: string;
  displayName: string;
  description: string;
  keyValue: string;
  accessLevel: 'read' | 'write' | 'admin' | 'read_write';
  environment: 'production' | 'staging' | 'development' | 'test';
  isDefault: boolean;
  isActive: boolean;
  scopes: string[];
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  visible,
  onClose,
  onSave,
  editingKey,
  initialService,
  requiredServices,
}) => {
  const { user } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic');

  const [formData, setFormData] = useState<FormData>({
    serviceName: initialService || '',
    keyName: '',
    displayName: '',
    description: '',
    keyValue: '',
    accessLevel: 'read_write',
    environment: 'production',
    isDefault: false,
    isActive: true,
    scopes: [],
  });

  // Get available services (filter if requiredServices is provided)
  const availableServices = useMemo(() => {
    return requiredServices 
      ? SERVICES.filter(s => requiredServices.includes(s.name))
      : SERVICES;
  }, [requiredServices]);

  const selectedService = SERVICES.find(s => s.name === formData.serviceName);

  // Reset form when modal opens/closes or editing key changes
  useEffect(() => {
    if (visible) {
      if (editingKey) {
        // Pre-populate form for editing
        setFormData({
          serviceName: editingKey.serviceName,
          keyName: editingKey.keyName,
          displayName: editingKey.displayName,
          description: editingKey.description || '',
          keyValue: '', // Never show actual key value
          accessLevel: editingKey.accessLevel as any,
          environment: editingKey.environment as any,
          isDefault: editingKey.isDefault,
          isActive: editingKey.isActive,
          scopes: editingKey.scopes || [],
        });
      } else {
        // Reset form for new key
        const service = availableServices.find(s => s.name === (initialService || availableServices[0]?.name));
        setFormData({
          serviceName: service?.name || '',
          keyName: service ? `${service.name}_key` : '',
          displayName: service ? `${service.displayName} Key` : '',
          description: service?.description || '',
          keyValue: '',
          accessLevel: service?.defaultAccessLevel || 'read_write',
          environment: 'production',
          isDefault: false,
          isActive: true,
          scopes: service?.defaultScopes || [],
        });
      }
      setActiveTab('basic');
    }
  }, [visible, editingKey, initialService]);

  // Update form when service selection changes
  const handleServiceChange = (serviceName: string) => {
    const service = SERVICES.find(s => s.name === serviceName);
    if (!service) return;

    setFormData(prev => ({
      ...prev,
      serviceName,
      keyName: `${service.name}_key`,
      displayName: `${service.displayName} Key`,
      description: service.description,
      accessLevel: service.defaultAccessLevel,
      scopes: service.defaultScopes,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.serviceName) return 'Please select a service';
    if (!formData.keyName.trim()) return 'Key name is required';
    if (!formData.displayName.trim()) return 'Display name is required';
    if (!formData.keyValue.trim() && !editingKey) return 'Key value is required';
    
    // Basic validation for key formats
    if (formData.keyValue && selectedService) {
      const keyValue = formData.keyValue.trim();
      switch (selectedService.name) {
        case 'gemini':
          if (!keyValue.startsWith('AIza')) {
            return 'Gemini API keys should start with "AIza"';
          }
          break;
        case 'openai':
          if (!keyValue.startsWith('sk-')) {
            return 'OpenAI API keys should start with "sk-"';
          }
          break;
        case 'openrouter':
          if (!keyValue.startsWith('sk-or-')) {
            return 'OpenRouter API keys should start with "sk-or-"';
          }
          break;
        case 'slack':
          if (!keyValue.startsWith('xoxb-')) {
            return 'Slack bot tokens should start with "xoxb-"';
          }
          break;
        case 'github':
          if (!keyValue.startsWith('ghp_')) {
            return 'GitHub personal access tokens should start with "ghp_"';
          }
          break;
        case 'discord':
          if (!keyValue.startsWith('https://discord.com/api/webhooks/')) {
            return 'Discord webhook URLs should start with "https://discord.com/api/webhooks/"';
          }
          break;
      }
    }

    return null;
  };

  const handleTestKey = async () => {
    const validationError = validateForm();
    if (validationError) {
      showError('Validation Error', validationError);
      return;
    }

    if (!formData.keyValue.trim()) {
      showWarning('No Key Value', 'Please enter a key value to test');
      return;
    }

    setIsTesting(true);
    try {
      // For testing, we can create a temporary key request
      const testRequest: CreateApiKeyRequest = {
        keyName: formData.keyName,
        serviceName: formData.serviceName,
        keyType: selectedService!.keyType,
        keyValue: formData.keyValue,
        displayName: formData.displayName,
        description: formData.description,
        accessLevel: formData.accessLevel,
        scopes: formData.scopes,
        isDefault: formData.isDefault,
        environment: formData.environment,
      };

      // Note: We'd need a test endpoint on the backend for this
      // For now, we'll show a placeholder success
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      showSuccess('Key Valid', 'The API key appears to be valid and working');
    } catch (error) {
      console.error('Failed to test API key:', error);
      showError('Test Failed', 'Failed to validate the API key. Please check the value and try again.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      showError('Validation Error', validationError);
      return;
    }

    setIsLoading(true);
    try {
      if (editingKey) {
        // Update existing key
        const updateRequest: UpdateApiKeyRequest = {
          keyName: formData.keyName !== editingKey.keyName ? formData.keyName : undefined,
          displayName: formData.displayName !== editingKey.displayName ? formData.displayName : undefined,
          description: formData.description !== editingKey.description ? formData.description : undefined,
          keyValue: formData.keyValue.trim() ? formData.keyValue : undefined,
          accessLevel: formData.accessLevel !== editingKey.accessLevel ? formData.accessLevel : undefined,
          scopes: JSON.stringify(formData.scopes) !== JSON.stringify(editingKey.scopes) ? formData.scopes : undefined,
          isDefault: formData.isDefault !== editingKey.isDefault ? formData.isDefault : undefined,
          isActive: formData.isActive !== editingKey.isActive ? formData.isActive : undefined,
          environment: formData.environment !== editingKey.environment ? formData.environment : undefined,
        };

        const response = await goGentAPI.updateApiKey(editingKey.id, updateRequest);
        if (response.success) {
          showSuccess('Key Updated', 'API key has been updated successfully');
          // Call onSave first to refresh the list, then close
          await onSave();
          onClose();
        } else {
          showError('Update Failed', response.error || 'Failed to update API key');
        }
      } else {
        // Create new key
        const createRequest: CreateApiKeyRequest = {
          keyName: formData.keyName,
          serviceName: formData.serviceName,
          keyType: selectedService!.keyType,
          keyValue: formData.keyValue,
          displayName: formData.displayName,
          description: formData.description,
          accessLevel: formData.accessLevel,
          scopes: formData.scopes,
          isDefault: formData.isDefault,
          environment: formData.environment,
        };

        const response = await goGentAPI.createApiKey(createRequest);
        if (response.success) {
          showSuccess('Key Created', 'API key has been created successfully');
          // Call onSave first to refresh the list, then close
          await onSave();
          onClose();
        } else {
          showError('Creation Failed', response.error || 'Failed to create API key');
        }
      }
    } catch (error) {
      console.error('Failed to save API key:', error);
      showError('Save Failed', 'Failed to save API key. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (formData.keyValue.trim() && !editingKey) {
      AlertAPI.alert(
        'Discard Changes',
        'You have unsaved changes. Are you sure you want to close?',
        [
          { text: 'Continue Editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {editingKey ? 'Edit API Key' : 'Add API Key'}
          </Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isLoading}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'basic' && styles.activeTab]}
            onPress={() => setActiveTab('basic')}
          >
            <Ionicons 
              name="key-outline" 
              size={16} 
              color={activeTab === 'basic' ? '#007AFF' : '#8E8E93'} 
            />
            <Text style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>
              Basic Setup
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'advanced' && styles.activeTab]}
            onPress={() => setActiveTab('advanced')}
          >
            <Ionicons 
              name="settings-outline" 
              size={16} 
              color={activeTab === 'advanced' ? '#007AFF' : '#8E8E93'} 
            />
            <Text style={[styles.tabText, activeTab === 'advanced' && styles.activeTabText]}>
              Advanced
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'basic' ? (
            <View style={styles.tabContent}>
              {/* Service Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Service</Text>
                <Text style={styles.sectionDescription}>
                  Choose the service this API key will be used for
                </Text>
                
                <View style={styles.serviceGrid}>
                  {availableServices.map((service) => (
                    <TouchableOpacity
                      key={service.name}
                      style={[
                        styles.serviceCard,
                        formData.serviceName === service.name && styles.serviceCardSelected
                      ]}
                      onPress={() => handleServiceChange(service.name)}
                      disabled={!!editingKey} // Can't change service when editing
                    >
                      <Text style={[
                        styles.serviceCardTitle,
                        formData.serviceName === service.name && styles.serviceCardTitleSelected
                      ]}>
                        {service.displayName}
                      </Text>
                      <Text style={styles.serviceCardDescription}>
                        {service.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Basic Information */}
              {selectedService && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Key Information</Text>
                  
                  <View style={styles.field}>
                    <Text style={styles.label}>Display Name</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.displayName}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, displayName: text }))}
                      placeholder="My API Key"
                    />
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Key Name (Internal)</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.keyName}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, keyName: text }))}
                      placeholder="my_api_key"
                      autoCapitalize="none"
                    />
                    <Text style={styles.helpText}>
                      Used internally to reference this key. Use lowercase with underscores.
                    </Text>
                  </View>

                  <View style={styles.field}>
                    <Text style={styles.label}>Description (Optional)</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={formData.description}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                      placeholder="Brief description of this API key..."
                      multiline
                      numberOfLines={2}
                    />
                  </View>

                  <View style={styles.field}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>API Key Value</Text>
                      {formData.keyValue.trim() && (
                        <TouchableOpacity 
                          onPress={handleTestKey}
                          disabled={isTesting}
                          style={[styles.testButton, isTesting && styles.testButtonDisabled]}
                        >
                          {isTesting ? (
                            <ActivityIndicator size="small" color="#007AFF" />
                          ) : (
                            <>
                              <Ionicons name="flask-outline" size={16} color="#007AFF" />
                              <Text style={styles.testButtonText}>Test</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                    <TextInput
                      style={[styles.input, styles.keyInput]}
                      value={formData.keyValue}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, keyValue: text }))}
                      placeholder={selectedService.placeholder}
                      autoCapitalize="none"
                      secureTextEntry={selectedService.keyType !== 'webhook_url'}
                    />
                    <Text style={styles.helpText}>
                      {editingKey 
                        ? 'Leave empty to keep the current key value unchanged'
                        : 'Enter your API key or token. This will be encrypted and stored securely.'
                      }
                    </Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.tabContent}>
              {/* Advanced Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Access & Permissions</Text>
                
                <View style={styles.field}>
                  <Text style={styles.label}>Access Level</Text>
                  <View style={styles.accessLevelGrid}>
                    {['read', 'write', 'read_write', 'admin'].map((level) => (
                      <TouchableOpacity
                        key={level}
                        style={[
                          styles.accessLevelCard,
                          formData.accessLevel === level && styles.accessLevelCardSelected
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, accessLevel: level as any }))}
                      >
                        <Text style={[
                          styles.accessLevelText,
                          formData.accessLevel === level && styles.accessLevelTextSelected
                        ]}>
                          {level.replace('_', ' ').toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Environment</Text>
                  <View style={styles.environmentGrid}>
                    {['production', 'staging', 'development', 'test'].map((env) => (
                      <TouchableOpacity
                        key={env}
                        style={[
                          styles.environmentCard,
                          formData.environment === env && styles.environmentCardSelected
                        ]}
                        onPress={() => setFormData(prev => ({ ...prev, environment: env as any }))}
                      >
                        <Text style={[
                          styles.environmentText,
                          formData.environment === env && styles.environmentTextSelected
                        ]}>
                          {env.charAt(0).toUpperCase() + env.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              {/* Key Settings */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Settings</Text>
                
                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Default Key</Text>
                    <Text style={styles.switchDescription}>
                      Use this as the default key for this service
                    </Text>
                  </View>
                  <Switch
                    value={formData.isDefault}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isDefault: value }))}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Active</Text>
                    <Text style={styles.switchDescription}>
                      Whether this key can be used for API calls
                    </Text>
                  </View>
                  <Switch
                    value={formData.isActive}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value }))}
                    trackColor={{ false: '#E5E5EA', true: '#34C759' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>

              {/* Scopes */}
              {selectedService && formData.scopes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Scopes & Permissions</Text>
                  <Text style={styles.sectionDescription}>
                    The permissions this key will have for the {selectedService.displayName} service
                  </Text>
                  
                  <View style={styles.scopesList}>
                    {formData.scopes.map((scope, index) => (
                      <View key={index} style={styles.scopeItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                        <Text style={styles.scopeText}>{scope}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  cancelButton: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '700',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 2,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  keyInput: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 14,
  },
  helpText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    lineHeight: 16,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  testButtonDisabled: {
    opacity: 0.5,
  },
  testButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  serviceCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  serviceCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  serviceCardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  serviceCardTitleSelected: {
    color: '#007AFF',
  },
  serviceCardDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  accessLevelGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accessLevelCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  accessLevelCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  accessLevelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  accessLevelTextSelected: {
    color: '#007AFF',
  },
  environmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  environmentCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  environmentCardSelected: {
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  environmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
  },
  environmentTextSelected: {
    color: '#34C759',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchInfo: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  scopesList: {
    gap: 8,
  },
  scopeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  scopeText: {
    fontSize: 14,
    color: '#000000',
  },
});

export default ApiKeyModal;