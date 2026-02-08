import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Switch,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';
import { goGentAPI } from '../api/client';
import { AlertAPI } from './CustomAlert';
import { useToast } from '../context/ToastContext';
import { UserApiKey, Agent, CreateApiKeyRequest } from '../types';
import ApiKeyModal from './ApiKeyModal';

interface AgentApiKey {
  id: string;
  agentId: string;
  apiKeyId: string;
  isDefault: boolean;
  useGlobalDefault: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
  serviceName?: string;
  displayName?: string;
  validationStatus?: string;
  isActive?: boolean;
}

interface AgentApiKeyManagerProps {
  agent: Agent;
  visible: boolean;
  onClose: () => void;
}

const AgentApiKeyManager: React.FC<AgentApiKeyManagerProps> = ({
  agent,
  visible,
  onClose,
}) => {
  const { colors } = useTheme();
  const [agentApiKeys, setAgentApiKeys] = useState<AgentApiKey[]>([]);
  const [availableApiKeys, setAvailableApiKeys] = useState<UserApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState<string>('');
  const [isDefault, setIsDefault] = useState(false);
  const [useGlobalDefault, setUseGlobalDefault] = useState(true);
  const [priority, setPriority] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
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
    },
    closeButton: {
      padding: 8,
    },
    title: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.textPrimary,
    },
    addButton: {
      padding: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      paddingVertical: 16,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      gap: 16,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 40,
      gap: 16,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    emptyText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 22,
    },
    listContainer: {
      padding: 16,
    },
    apiKeyCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    apiKeyHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 12,
    },
    apiKeyInfo: {
      flex: 1,
    },
    apiKeyName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    apiKeyService: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    apiKeyActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    removeButton: {
      padding: 4,
    },
    apiKeySettings: {
      gap: 8,
    },
    settingRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: 4,
    },
    settingLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.textPrimary,
    },
    defaultBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingVertical: 4,
    },
    defaultText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.statusWarning,
    },
    priorityText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    // Add Modal Styles
    addModalContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    addModalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    cancelButton: {
      fontSize: 17,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    addModalTitle: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.textPrimary,
    },
    saveButton: {
      fontSize: 17,
      color: colors.accent,
      fontWeight: '700' as const,
    },
    saveButtonDisabled: {
      color: colors.textSecondary,
    },
    addModalContent: {
      flex: 1,
      padding: 16,
    },
    field: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    fieldDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.bgCard,
    },
    switchRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    switchInfo: {
      flex: 1,
      marginRight: 16,
    },
    pickerContainer: {
      gap: 8,
    },
    pickerOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.bgCard,
    },
    pickerOptionSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.bgHover,
    },
    pickerOptionContent: {
      flex: 1,
    },
    pickerOptionText: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    pickerOptionTextSelected: {
      color: colors.accent,
    },
    pickerOptionSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    noKeysContainer: {
      alignItems: 'center' as const,
      paddingVertical: 20,
      paddingHorizontal: 16,
      backgroundColor: colors.bgSurface,
      borderRadius: 8,
      marginTop: 8,
    },
    noKeysText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 12,
      textAlign: 'center' as const,
    },
    createKeyButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      gap: 6,
    },
    createKeyButtonText: {
      color: colors.textInverse,
      fontSize: 14,
      fontWeight: '600' as const,
    },
  }));

  useEffect(() => {
    if (visible) {
      loadData();
    }
  }, [visible]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load both agent API keys and available API keys
      const [agentKeysResponse, allKeysResponse] = await Promise.all([
        goGentAPI.getAgentApiKeys(agent.id),
        goGentAPI.getApiKeys(),
      ]);

      if (agentKeysResponse.success) {
        setAgentApiKeys(agentKeysResponse.data || []);
      } else {
        console.error('Failed to load agent API keys:', agentKeysResponse.error);
      }

      if (allKeysResponse.success) {
        setAvailableApiKeys(allKeysResponse.data || []);
      } else {
        console.error('Failed to load available API keys:', allKeysResponse.error);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showError('Load Error', 'Failed to load API key data');
    } finally {
      setIsLoading(false);
    }
  };

  const getAvailableKeysForAdd = () => {
    const assignedKeyIds = agentApiKeys.map(ak => ak.apiKeyId);
    return availableApiKeys.filter(key => !assignedKeyIds.includes(key.id) && key.isActive);
  };

  const handleAddApiKey = async () => {
    if (!selectedApiKey) {
      showError('Validation Error', 'Please select an API key');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await goGentAPI.createAgentApiKey(agent.id, {
        agentId: agent.id,
        apiKeyId: selectedApiKey,
        isDefault,
        useGlobalDefault,
        priority: parseInt(priority) || 100,
      });

      if (response.success) {
        showSuccess('Success', 'API key added to agent successfully');
        setShowAddModal(false);
        resetAddForm();
        loadData(); // Reload data
      } else {
        showError('Add Failed', response.error || 'Failed to add API key');
      }
    } catch (error) {
      console.error('Error adding API key:', error);
      showError('Add Failed', 'Failed to add API key to agent');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveApiKey = (apiKeyMapping: AgentApiKey) => {
    AlertAPI.alert(
      'Remove API Key',
      `Are you sure you want to remove "${apiKeyMapping.displayName || 'this API key'}" from ${agent.firstName} ${agent.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await goGentAPI.deleteAgentApiKey(agent.id, apiKeyMapping.id);
              if (response.success) {
                showSuccess('Success', 'API key removed successfully');
                loadData(); // Reload data
              } else {
                showError('Remove Failed', response.error || 'Failed to remove API key');
              }
            } catch (error) {
              console.error('Error removing API key:', error);
              showError('Remove Failed', 'Failed to remove API key');
            }
          },
        },
      ]
    );
  };

  const toggleUseGlobalDefault = async (apiKeyMapping: AgentApiKey) => {
    try {
      const response = await goGentAPI.updateAgentApiKey(agent.id, apiKeyMapping.id, {
        useGlobalDefault: !apiKeyMapping.useGlobalDefault,
      });

      if (response.success) {
        showSuccess('Success', 'API key settings updated');
        loadData(); // Reload data
      } else {
        showError('Update Failed', response.error || 'Failed to update API key settings');
      }
    } catch (error) {
      console.error('Error updating API key:', error);
      showError('Update Failed', 'Failed to update API key settings');
    }
  };

  const handleAddButtonPress = () => {
    const availableKeys = getAvailableKeysForAdd();

    if (availableKeys.length === 0) {
      // No existing keys available - offer to create new
      AlertAPI.alert(
        'Add API Key',
        'You don\'t have any available API keys. Would you like to create a new one?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Create New Key', onPress: () => setShowCreateModal(true) },
        ]
      );
    } else {
      // Show options to use existing or create new
      AlertAPI.alert(
        'Add API Key',
        'Choose how you\'d like to add an API key for this agent:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Use Existing Key', onPress: () => setShowAddModal(true) },
          { text: 'Create New Key', onPress: () => setShowCreateModal(true) },
        ]
      );
    }
  };

  const handleCreateApiKeySave = async () => {
    // Refresh available keys after creating new one
    await loadData();
  };

  const resetAddForm = () => {
    setSelectedApiKey('');
    setIsDefault(false);
    setUseGlobalDefault(true);
    setPriority('100');
  };

  const getValidationStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
      case 'valid': return colors.statusSuccess;
      case 'invalid': return colors.statusError;
      case 'expired': return colors.statusWarning;
      case 'untested': return colors.textSecondary;
      case 'rate_limited': return colors.statusWarning;
      default: return colors.textSecondary;
    }
  };

  const renderApiKeyItem = ({ item }: { item: AgentApiKey }) => (
    <View style={styles.apiKeyCard}>
      <View style={styles.apiKeyHeader}>
        <View style={styles.apiKeyInfo}>
          <Text style={styles.apiKeyName}>{item.displayName || 'Unknown API Key'}</Text>
          <Text style={styles.apiKeyService}>{item.serviceName || 'Unknown Service'}</Text>
        </View>
        <View style={styles.apiKeyActions}>
          {item.validationStatus && (
            <View style={[styles.statusBadge, { backgroundColor: getValidationStatusColor(item.validationStatus) }]}>
              <Text style={styles.statusText}>{item.validationStatus.toUpperCase()}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveApiKey(item)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={20} color={colors.statusError} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.apiKeySettings}>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Use Global Default</Text>
          <Switch
            value={item.useGlobalDefault}
            onValueChange={() => toggleUseGlobalDefault(item)}
            trackColor={{ false: colors.borderLight, true: colors.statusSuccess }}
            thumbColor={colors.textInverse}
          />
        </View>

        {item.isDefault && (
          <View style={styles.defaultBadge}>
            <Ionicons name="star" size={16} color={colors.statusWarning} />
            <Text style={styles.defaultText}>Default for Service</Text>
          </View>
        )}

        <Text style={styles.priorityText}>Priority: {item.priority}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.accent} />
          </TouchableOpacity>
          <Text style={styles.title}>API Keys</Text>
          <TouchableOpacity
            onPress={handleAddButtonPress}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>
          Manage API keys for {agent.firstName} {agent.lastName}
        </Text>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading API keys...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {agentApiKeys.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="key-outline" size={64} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>No API Keys</Text>
                <Text style={styles.emptyText}>
                  This agent will use global default API keys.{'\n'}
                  Tap the + button to add existing keys or create new ones specifically for this agent.
                </Text>
              </View>
            ) : (
              <FlatList
                data={agentApiKeys}
                keyExtractor={(item) => item.id}
                renderItem={renderApiKeyItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContainer}
              />
            )}
          </View>
        )}

        {/* Create New API Key Modal - Using the same modal as main API Keys screen */}
        <ApiKeyModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleCreateApiKeySave}
          editingKey={null}
          initialService=""
        />

        {/* Add Existing API Key Modal */}
        <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
          <View style={styles.addModalContainer}>
            <View style={styles.addModalHeader}>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Text style={styles.cancelButton}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.addModalTitle}>Use Existing API Key</Text>
              <TouchableOpacity onPress={handleAddApiKey} disabled={isSubmitting || !selectedApiKey}>
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Text style={[styles.saveButton, (!selectedApiKey) && styles.saveButtonDisabled]}>
                    Add
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.addModalContent}>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Select Existing API Key</Text>
                <Text style={styles.fieldDescription}>
                  Choose from your existing API keys. If you need a new key, close this and select "Create New Key".
                </Text>
                <View style={styles.pickerContainer}>
                  {getAvailableKeysForAdd().map((apiKey) => (
                    <TouchableOpacity
                      key={apiKey.id}
                      style={[
                        styles.pickerOption,
                        selectedApiKey === apiKey.id && styles.pickerOptionSelected
                      ]}
                      onPress={() => setSelectedApiKey(apiKey.id)}
                    >
                      <View style={styles.pickerOptionContent}>
                        <Text style={[
                          styles.pickerOptionText,
                          selectedApiKey === apiKey.id && styles.pickerOptionTextSelected
                        ]}>
                          {apiKey.displayName}
                        </Text>
                        <Text style={styles.pickerOptionSubtext}>
                          {apiKey.serviceName} • {apiKey.environment}
                        </Text>
                      </View>
                      {selectedApiKey === apiKey.id && (
                        <Ionicons name="checkmark" size={20} color={colors.accent} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                {getAvailableKeysForAdd().length === 0 && (
                  <View style={styles.noKeysContainer}>
                    <Text style={styles.noKeysText}>No available API keys found</Text>
                    <TouchableOpacity
                      style={styles.createKeyButton}
                      onPress={() => {
                        setShowAddModal(false);
                        setShowCreateModal(true);
                      }}
                    >
                      <Ionicons name="add" size={16} color={colors.textInverse} />
                      <Text style={styles.createKeyButtonText}>Create New API Key</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.field}>
                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.fieldLabel}>Use Global Default</Text>
                    <Text style={styles.fieldDescription}>
                      Use global API key as fallback when this key fails
                    </Text>
                  </View>
                  <Switch
                    value={useGlobalDefault}
                    onValueChange={setUseGlobalDefault}
                    trackColor={{ false: colors.borderLight, true: colors.statusSuccess }}
                    thumbColor={colors.textInverse}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.fieldLabel}>Set as Default</Text>
                    <Text style={styles.fieldDescription}>
                      Make this the default key for this service
                    </Text>
                  </View>
                  <Switch
                    value={isDefault}
                    onValueChange={setIsDefault}
                    trackColor={{ false: colors.borderLight, true: colors.statusSuccess }}
                    thumbColor={colors.textInverse}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Priority</Text>
                <TextInput
                  style={styles.input}
                  value={priority}
                  onChangeText={setPriority}
                  keyboardType="numeric"
                  placeholder="100"
                />
                <Text style={styles.fieldDescription}>
                  Lower numbers have higher priority. Default is 100.
                </Text>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

export default AgentApiKeyManager;
