import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { secureStorage, API_KEY_VALIDATIONS, FUNCTION_API_KEY_REQUIREMENTS } from '../utils/secureStorage';
import { AlertAPI } from '../components/CustomAlert';
import { webInputStyles } from '../styles/containers';

interface ApiKeyStatus {
  name: string;
  displayName: string;
  isSet: boolean;
  isValid: boolean;
  functions: string[];
  description: string;
  placeholder: string;
  group: string;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  statusBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoSection: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    margin: 20,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#1A1A1A',
    marginLeft: 12,
    lineHeight: 20,
  },
  keysSection: {
    paddingHorizontal: 20,
    gap: 16,
  },
  keyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  keyHeader: {
    marginBottom: 12,
  },
  keyTitleSection: {
    flex: 1,
  },
  keyTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  keyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 8,
  },
  keyDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  functionsSection: {
    marginBottom: 16,
  },
  functionsLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  functionTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  functionTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  functionTagText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  editSection: {
    gap: 12,
  },
  editInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    ...webInputStyles,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  viewSection: {
    gap: 8,
  },
  keyValueSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  keyValue: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#1A1A1A',
    flex: 1,
  },
  keyActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  addButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  saveButton: {
    backgroundColor: '#34C759',
    flex: 1,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FF3B30',
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
  actionsSection: {
    padding: 20,
    paddingTop: 32,
  },
  clearAllButton: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  clearAllButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FF3B30',
  },
  // Group styles for API key organization
  groupContainer: {
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  groupHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  groupDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  groupHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupCount: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
  },
  groupContent: {
    marginTop: 8,
    gap: 8,
  },
});

const ApiKeysScreen: React.FC = () => {
  const { user } = useAuth();
  const [apiKeyStatuses, setApiKeyStatuses] = useState<ApiKeyStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [showValue, setShowValue] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    model: true,
    weather: false,
    graph: false,
    github: false,
    development: false,
  });

  const API_KEY_INFO = {
    geminiApiKey: {
      displayName: 'Gemini + API Key',
      description: 'API key for Google Gemini model',
      placeholder: 'Enter your Google Gemini API key',
      functions: ['All AI Functions'],
      group: 'model',
    },
    openRouterApiKey: {
      displayName: 'OpenRouter API Key', 
      description: 'API key for Kimi K2 and other models via OpenRouter',
      placeholder: 'sk-or-your-openrouter-key',
      functions: ['Kimi K2 Models', 'Future AI Models'],
      group: 'model',
    },
    openWeatherApiKey: {
      displayName: 'OpenWeather API Key',
      description: 'For weather-related functions and data',
      placeholder: 'Enter your OpenWeather API key',
      functions: ['get_current_weather'],
      group: 'weather',
    },
    neo4jUrl: {
      displayName: 'Neo4j Database URL',
      description: 'Connection URL for Neo4j graph database',
      placeholder: 'bolt://localhost:7687',
      functions: ['neo4j_node_lookup'],
      group: 'graph',
    },
    neo4jUsername: {
      displayName: 'Neo4j Username',
      description: 'Username for Neo4j database authentication',
      placeholder: 'neo4j',
      functions: ['neo4j_node_lookup'],
      group: 'graph',
    },
    neo4jPassword: {
      displayName: 'Neo4j Password',
      description: 'Password for Neo4j database authentication',
      placeholder: 'Enter Neo4j password',
      functions: ['neo4j_node_lookup'],
      group: 'graph',
    },
    githubApiKey: {
      displayName: 'GitHub API Key',
      description: 'For GitHub repository and organization functions',
      placeholder: 'Enter your GitHub personal access token',
      functions: ['github_repo_info'],
      group: 'github',
    },
    mcpServerEndpoint: {
      displayName: 'MCP Server Endpoint',
      description: 'Model Context Protocol server URL for advanced GitHub operations and software engineering tasks',
      placeholder: 'http://localhost:3001',
      functions: ['mcp_github_operations', 'Software Engineer Template'],
      group: 'development',
    },
  };

  useEffect(() => {
    loadApiKeyStatuses();
  }, []);

  const loadApiKeyStatuses = async () => {
    setIsLoading(true);
    try {
      const storedKeys = await secureStorage.loadApiKeys();
      
      const statuses: ApiKeyStatus[] = Object.entries(API_KEY_INFO).map(([keyName, info]) => {
        const value = storedKeys[keyName as keyof typeof storedKeys] || '';
        // Skip validation for Neo4j URL, validate all other keys
        let isValid = true;
        if (value && keyName !== 'neo4jUrl') {
          const validationResult = secureStorage.validateApiKey(keyName as keyof typeof storedKeys, value);
          isValid = typeof validationResult === 'boolean' ? validationResult : validationResult.isValid;
        } else if (value && keyName === 'neo4jUrl') {
          // Always consider Neo4j URL as valid if it has a value
          isValid = true;
        } else {
          isValid = false;
        }
        
        return {
          name: keyName,
          displayName: info.displayName,
          isSet: !!value,
          isValid,
          functions: info.functions,
          description: info.description,
          placeholder: info.placeholder,
          group: info.group,
        };
      });

      setApiKeyStatuses(statuses);
    } catch (error) {
      console.error('Failed to load API key statuses:', error);
      AlertAPI.alert('Error', 'Failed to load API key information');
    } finally {
      setIsLoading(false);
    }
  };

  // Group API keys by their group
  const groupedApiKeys = apiKeyStatuses.reduce((acc, keyStatus) => {
    if (!acc[keyStatus.group]) {
      acc[keyStatus.group] = [];
    }
    acc[keyStatus.group].push(keyStatus);
    return acc;
  }, {} as Record<string, ApiKeyStatus[]>);

  // Define group display information
  const GROUP_INFO = {
    model: {
      title: 'Model Configuration',
      description: 'API keys for AI models and language services',
      icon: 'hardware-chip-outline' as const,
    },
    weather: {
      title: 'Weather Services',
      description: 'API keys for weather data providers',
      icon: 'partly-sunny-outline' as const,
    },
    graph: {
      title: 'Graph Database',
      description: 'Connection credentials for Neo4j database',
      icon: 'git-network-outline' as const,
    },
    github: {
      title: 'GitHub Integration',
      description: 'API keys for GitHub repository access',
      icon: 'logo-github' as const,
    },
    development: {
      title: 'Development Tools',
      description: 'Configuration for development and advanced features',
      icon: 'code-outline' as const,
    },
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const handleEditKey = (keyName: string, currentValue: string = '') => {
    setEditingKey(keyName);
    setEditingValue(currentValue);
  };

  const handleSaveKey = async () => {
    if (!editingKey) return;

    try {
      const trimmedValue = editingValue.trim();
      
      if (trimmedValue) {
        // Skip validation for Neo4j URL, validate all other keys
        if (editingKey !== 'neo4jUrl') {
          const validationResult = secureStorage.validateApiKey(editingKey as keyof typeof API_KEY_INFO, trimmedValue);
          const isValid = typeof validationResult === 'boolean' ? validationResult : validationResult.isValid;
          
          if (!isValid) {
            AlertAPI.alert(
              'Invalid API Key',
              `The ${API_KEY_INFO[editingKey as keyof typeof API_KEY_INFO]?.displayName} format appears to be invalid. Please check and try again.`
            );
            return;
          }
        }

        // Save the key
        await secureStorage.updateApiKey(editingKey as keyof typeof API_KEY_INFO, trimmedValue);
        
        AlertAPI.alert(
          '✅ API Key Saved',
          `${API_KEY_INFO[editingKey as keyof typeof API_KEY_INFO]?.displayName} has been saved successfully.`
        );
      } else {
        // Remove the key if empty
        await secureStorage.removeApiKey(editingKey as keyof typeof API_KEY_INFO);
        
        AlertAPI.alert(
          '🗑️ API Key Removed',
          `${API_KEY_INFO[editingKey as keyof typeof API_KEY_INFO]?.displayName} has been removed.`
        );
      }

      setEditingKey(null);
      setEditingValue('');
      await loadApiKeyStatuses();
    } catch (error) {
      console.error('Failed to save API key:', error);
      AlertAPI.alert('Error', 'Failed to save API key');
    }
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValue('');
  };

  const toggleShowValue = (keyName: string) => {
    setShowValue(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleClearAllKeys = () => {
    AlertAPI.alert(
      '⚠️ Clear All API Keys',
      'This will remove all stored API keys. You will need to re-enter them to use functions that require API access.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await secureStorage.clearAllApiKeys();
              await loadApiKeyStatuses();
              AlertAPI.alert('✅ Cleared', 'All API keys have been removed.');
            } catch (error) {
              AlertAPI.alert('Error', 'Failed to clear API keys');
            }
          },
        },
      ]
    );
  };

  const renderApiKeyCard = (keyStatus: ApiKeyStatus) => {
    const isEditing = editingKey === keyStatus.name;
    const shouldShow = showValue[keyStatus.name];

    return (
      <View key={keyStatus.name} style={styles.keyCard}>
        <View style={styles.keyHeader}>
          <View style={styles.keyTitleSection}>
            <View style={styles.keyTitleRow}>
              <Text style={styles.keyTitle}>{keyStatus.displayName}</Text>
              <View style={styles.statusIndicators}>
                {keyStatus.isSet && (
                  <Ionicons
                    name={keyStatus.isValid ? "checkmark-circle" : "warning-outline"}
                    size={20}
                    color={keyStatus.isValid ? "#34C759" : "#FF9500"}
                  />
                )}
                <Ionicons
                  name={keyStatus.isSet ? "key" : "key-outline"}
                  size={18}
                  color={keyStatus.isSet ? "#007AFF" : "#8E8E93"}
                />
              </View>
            </View>
            <Text style={styles.keyDescription}>{keyStatus.description}</Text>
          </View>
        </View>

        <View style={styles.functionsSection}>
          <Text style={styles.functionsLabel}>Used by:</Text>
          <View style={styles.functionTags}>
            {keyStatus.functions.map((func, index) => (
              <View key={index} style={styles.functionTag}>
                <Text style={styles.functionTagText}>{func}</Text>
              </View>
            ))}
          </View>
        </View>

        {isEditing ? (
          <View style={styles.editSection}>
            <TextInput
              style={styles.editInput}
              value={editingValue}
              onChangeText={setEditingValue}
              placeholder={keyStatus.placeholder}
              secureTextEntry={!shouldShow}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={keyStatus.name === 'neo4jUrl'}
              numberOfLines={keyStatus.name === 'neo4jUrl' ? 2 : 1}
            />
            <View style={styles.editActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.cancelButton]}
                onPress={handleCancelEdit}
              >
                <Ionicons name="close" size={16} color="#FF3B30" />
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.saveButton]}
                onPress={handleSaveKey}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.viewSection}>
            {keyStatus.isSet ? (
              <View style={styles.keyValueSection}>
                <Text style={styles.keyValue}>
                  {shouldShow ? '••••••••••••••••' : '••••••••••••••••'}
                </Text>
                <View style={styles.keyActions}>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => toggleShowValue(keyStatus.name)}
                  >
                    <Ionicons
                      name={shouldShow ? "eye-off" : "eye"}
                      size={20}
                      color="#8E8E93"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => handleEditKey(keyStatus.name, '***')}
                  >
                    <Ionicons name="pencil" size={20} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={() => handleEditKey(keyStatus.name)}
              >
                <Ionicons name="add" size={16} color="#007AFF" />
                <Text style={styles.addButtonText}>Add API Key</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading API Keys...</Text>
      </View>
    );
  }

  const setKeysCount = apiKeyStatuses.filter(k => k.isSet).length;
  const totalKeysCount = apiKeyStatuses.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>API Keys</Text>
          <Text style={styles.headerSubtitle}>
            Manage your API keys for external services
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {setKeysCount}/{totalKeysCount} Set
          </Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Ionicons name="information-circle" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          API keys are encrypted and stored securely on your device. They are transmitted encrypted to our servers only when making API calls on your behalf and are never stored permanently on our servers.
          {user?.is_temporary ? ' Connect your account to an email to preserve your data in the platform' : ' Your data is preserved across sessions.'}
        </Text>
      </View>

      <View style={styles.keysSection}>
        {Object.entries(groupedApiKeys).map(([groupName, keys]) => {
          const groupInfo = GROUP_INFO[groupName as keyof typeof GROUP_INFO];
          if (!groupInfo || keys.length === 0) return null;

          return (
            <View key={groupName} style={styles.groupContainer}>
              <TouchableOpacity
                style={styles.groupHeader}
                onPress={() => toggleGroup(groupName)}
              >
                <View style={styles.groupHeaderLeft}>
                  <Ionicons 
                    name={groupInfo.icon} 
                    size={20} 
                    color="#007AFF" 
                  />
                  <View style={styles.groupHeaderText}>
                    <Text style={styles.groupTitle}>{groupInfo.title}</Text>
                    <Text style={styles.groupDescription}>{groupInfo.description}</Text>
                  </View>
                </View>
                <View style={styles.groupHeaderRight}>
                  <Text style={styles.groupCount}>
                    {keys.filter(k => k.isSet).length}/{keys.length}
                  </Text>
                  <Ionicons
                    name={expandedGroups[groupName] ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#8E8E93"
                  />
                </View>
              </TouchableOpacity>
              
              {expandedGroups[groupName] && (
                <View style={styles.groupContent}>
                  {keys.map(renderApiKeyCard)}
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearAllButton]}
          onPress={handleClearAllKeys}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.clearAllButtonText}>Clear All Keys</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ApiKeysScreen; 