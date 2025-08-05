import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AlertAPI } from '../components/CustomAlert';
import { webInputStyles } from '../styles/containers';
import { goGentAPI } from '../api/client';
import { UserApiKey, CreateApiKeyRequest, UpdateApiKeyRequest } from '../types';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import ApiKeyModal from '../components/ApiKeyModal';
import { useToast } from '../context/ToastContext';

type ApiKeysScreenRouteProp = RouteProp<RootStackParamList, 'API Keys'>;

interface ServiceGroup {
  name: string;
  displayName: string;
  description: string;
  services: ServiceInfo[];
  expanded: boolean;
}

interface ServiceInfo {
  name: string;
  displayName: string;
  description: string;
  placeholder: string;
  keyType: 'api_key' | 'access_token' | 'bearer_token' | 'oauth_token' | 'webhook_url' | 'connection_string';
  defaultAccessLevel: 'read' | 'write' | 'admin' | 'read_write';
  defaultScopes: string[];
}

const SERVICE_GROUPS: ServiceGroup[] = [
  {
    name: 'ai_models',
    displayName: 'Model API Keys',
    description: 'API keys used by Configurations when executing with specific AI models',
    expanded: true,
    services: [
      {
        name: 'gemini',
        displayName: 'Google Gemini',
        description: 'Required for configurations using Gemini models (1.5 Flash, 1.5 Pro, etc.)',
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
        description: 'Required for configurations using Kimi K2 and other OpenRouter models',
        placeholder: 'sk-or-...',
        keyType: 'api_key',
        defaultAccessLevel: 'read_write',
        defaultScopes: ['chat', 'completions'],
      },
    ],
  },
  {
    name: 'communication',
    displayName: 'Communication',
    description: 'API keys for messaging and notification services',
    expanded: false,
    services: [
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
    ],
  },
  {
    name: 'data_services',
    displayName: 'Data Services',
    description: 'API keys for data and external services',
    expanded: false,
    services: [
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
    ],
  },
  {
    name: 'development',
    displayName: 'Development',
    description: 'API keys for development and code management',
    expanded: false,
    services: [
      {
        name: 'github',
        displayName: 'GitHub',
        description: 'Personal access token for GitHub API',
        placeholder: 'ghp_...',
        keyType: 'access_token',
        defaultAccessLevel: 'read_write',
        defaultScopes: ['repo', 'issues', 'pull_requests'],
      },
    ],
  },
];

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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  groupContainer: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  groupHeaderLeft: {
    flex: 1,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  groupDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  groupStatsText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  expandIcon: {
    marginLeft: 8,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceIconConfigured: {
    backgroundColor: '#34C759',
  },
  serviceIconUnconfigured: {
    backgroundColor: '#FF3B30',
  },
  serviceIconPartial: {
    backgroundColor: '#FF9500',
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  serviceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  serviceStatusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  serviceStatusConfigured: {
    color: '#34C759',
  },
  serviceStatusUnconfigured: {
    color: '#FF3B30',
  },
  serviceStatusPartial: {
    color: '#FF9500',
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  keyList: {
    marginTop: 8,
    paddingHorizontal: 16,
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginBottom: 8,
  },
  keyInfo: {
    flex: 1,
  },
  keyName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  keyDetails: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  keyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  keyBadgeDefault: {
    backgroundColor: '#007AFF',
  },
  keyBadgeNormal: {
    backgroundColor: '#E5E5EA',
  },
  keyBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  keyBadgeTextDefault: {
    color: '#FFFFFF',
  },
  keyBadgeTextNormal: {
    color: '#8E8E93',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});

const ApiKeysScreen: React.FC<{ route: ApiKeysScreenRouteProp }> = ({ route }) => {
  const { groupName } = route.params || {};
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [apiKeys, setApiKeys] = useState<UserApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [editingKey, setEditingKey] = useState<UserApiKey | null>(null);
  const [modalInitialService, setModalInitialService] = useState<string>('');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    ai_models: true,
    communication: false,
    data_services: false,
    development: false,
  });

  const loadApiKeys = useCallback(async () => {
    try {
      const response = await goGentAPI.getApiKeys();
      if (response.success && response.data) {
        setApiKeys(response.data);
      } else {
        console.error('Failed to load API keys:', response.error);
        AlertAPI.alert('Error', response.error || 'Failed to load API keys');
      }
    } catch (error) {
      console.error('Failed to load API keys:', error);
      AlertAPI.alert('Error', 'Failed to load API keys');
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadApiKeys();
    setIsRefreshing(false);
  }, [loadApiKeys]);

  useEffect(() => {
    const initializeScreen = async () => {
      setIsLoading(true);
      await loadApiKeys();
      setIsLoading(false);
    };

    initializeScreen();
  }, [loadApiKeys]);

  useEffect(() => {
    if (groupName) {
      setExpandedGroups(prev => ({
        ...prev,
        [groupName]: true,
      }));
    }
  }, [groupName]);

  const toggleGroupExpansion = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName],
    }));
  };

  const getServiceKeys = (serviceName: string): UserApiKey[] => {
    return apiKeys.filter(key => key.serviceName === serviceName);
  };

  const getServiceStatus = (serviceName: string): 'configured' | 'unconfigured' | 'partial' => {
    const keys = getServiceKeys(serviceName);
    if (keys.length === 0) return 'unconfigured';
    
    // Consider a service configured if it has active keys (regardless of validation status)
    const activeKeys = keys.filter(key => key.isActive);
    if (activeKeys.length === 0) return 'partial';
    
    return 'configured';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return 'checkmark-circle';
      case 'partial':
        return 'warning';
      case 'unconfigured':
      default:
        return 'close-circle';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
        return '#34C759';
      case 'partial':
        return '#FF9500';
      case 'unconfigured':
      default:
        return '#FF3B30';
    }
  };

  const handleAddKey = (serviceName: string) => {
    setModalInitialService(serviceName);
    setEditingKey(null);
    setShowApiKeyModal(true);
  };

  const handleEditKey = (keyId: string) => {
    const key = apiKeys.find(k => k.id === keyId);
    if (key) {
      setEditingKey(key);
      setModalInitialService('');
      setShowApiKeyModal(true);
    }
  };

  const handleTestKey = async (keyId: string) => {
    try {
      const response = await goGentAPI.testApiKey(keyId);
      if (response.success && response.data) {
        const result = response.data;
        if (result.isValid) {
          AlertAPI.alert('✅ Key Valid', `API key tested successfully in ${result.responseTimeMs}ms`);
        } else {
          AlertAPI.alert('❌ Key Invalid', result.errorMessage || 'API key validation failed');
        }
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to test API key');
      }
      // Refresh to update validation status
      await loadApiKeys();
    } catch (error) {
      console.error('Failed to test API key:', error);
      AlertAPI.alert('Error', 'Failed to test API key');
    }
  };

  const renderServiceItem = (service: ServiceInfo) => {
    const keys = getServiceKeys(service.name);
    const status = getServiceStatus(service.name);
    const statusColor = getStatusColor(status);

    return (
      <View key={service.name}>
        <TouchableOpacity 
          style={styles.serviceItem}
          onPress={() => handleAddKey(service.name)}
        >
          <View style={[
            styles.serviceIcon,
            status === 'configured' ? styles.serviceIconConfigured :
            status === 'partial' ? styles.serviceIconPartial :
            styles.serviceIconUnconfigured
          ]}>
            <Ionicons 
              name={getStatusIcon(status)} 
              size={20} 
              color="#FFFFFF" 
            />
          </View>
          
          <View style={styles.serviceDetails}>
            <Text style={styles.serviceName}>{service.displayName}</Text>
            <Text style={styles.serviceDescription}>{service.description}</Text>
            
            <View style={styles.serviceStatus}>
              <Ionicons 
                name={getStatusIcon(status)} 
                size={12} 
                color={statusColor} 
              />
              <Text style={[
                styles.serviceStatusText,
                status === 'configured' ? styles.serviceStatusConfigured :
                status === 'partial' ? styles.serviceStatusPartial :
                styles.serviceStatusUnconfigured
              ]}>
                {keys.length} key{keys.length !== 1 ? 's' : ''} configured
              </Text>
            </View>
          </View>
          
          <View style={styles.serviceActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleAddKey(service.name)}
            >
              <Ionicons name="add" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
        
        {keys.length > 0 && (
          <View style={styles.keyList}>
            {keys.map((key) => (
              <TouchableOpacity 
                key={key.id}
                style={styles.keyItem}
                onPress={() => handleEditKey(key.id)}
              >
                <View style={styles.keyInfo}>
                  <Text style={styles.keyName}>{key.displayName}</Text>
                  <Text style={styles.keyDetails}>
                    {key.environment} • {key.accessLevel} • {key.validationStatus}
                    {key.lastUsedAt && ` • Used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  </Text>
                </View>
                
                {key.isDefault && (
                  <View style={[styles.keyBadge, styles.keyBadgeDefault]}>
                    <Text style={[styles.keyBadgeText, styles.keyBadgeTextDefault]}>
                      DEFAULT
                    </Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleTestKey(key.id)}
                >
                  <Ionicons name="flask" size={16} color="#007AFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleEditKey(key.id)}
                >
                  <Ionicons name="pencil" size={16} color="#8E8E93" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderGroup = (group: ServiceGroup) => {
    const isExpanded = expandedGroups[group.name];
    const totalKeys = group.services.reduce((sum, service) => 
      sum + getServiceKeys(service.name).length, 0
    );
    const configuredServices = group.services.filter(service => 
      getServiceStatus(service.name) === 'configured'
    ).length;

    return (
      <View key={group.name} style={styles.groupContainer}>
        <TouchableOpacity 
          style={styles.groupHeader}
          onPress={() => toggleGroupExpansion(group.name)}
        >
          <View style={styles.groupHeaderLeft}>
            <Text style={styles.groupTitle}>{group.displayName}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>
            
            <View style={styles.groupStats}>
              <Ionicons 
                name={configuredServices === group.services.length ? "checkmark-circle" : "warning"} 
                size={12} 
                color={configuredServices === group.services.length ? "#34C759" : "#FF9500"} 
              />
              <Text style={styles.groupStatsText}>
                {configuredServices}/{group.services.length} services • {totalKeys} keys
              </Text>
            </View>
          </View>
          
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color="#8E8E93"
            style={styles.expandIcon}
          />
        </TouchableOpacity>
        
        {isExpanded && group.services.map(renderServiceItem)}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading API keys...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>API Keys</Text>
          <Text style={styles.headerSubtitle}>
            {apiKeys.length} keys configured across {SERVICE_GROUPS.length} categories
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => handleAddKey('gemini')} // Default to Gemini as it's most common
        >
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addButtonText}>Add Key</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#007AFF"
          />
        }
      >
        {apiKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="key-outline" 
              size={64} 
              color="#C7C7CC" 
              style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateTitle}>No API Keys Yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first API key to start using external services with your functions. 
              API keys are stored securely and encrypted.
            </Text>
          </View>
        ) : (
          SERVICE_GROUPS.map(renderGroup)
        )}
      </ScrollView>

      {/* API Key Management Modal */}
      <ApiKeyModal
        visible={showApiKeyModal}
        onClose={() => {
          setShowApiKeyModal(false);
          setEditingKey(null);
          setModalInitialService('');
        }}
        onSave={async () => {
          // Refresh the API keys list
          setShowApiKeyModal(false);
          setEditingKey(null);
          setModalInitialService('');
          await handleRefresh();
        }}
        editingKey={editingKey}
        initialService={modalInitialService}
      />
    </View>
  );
};

export default ApiKeysScreen; 