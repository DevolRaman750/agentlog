import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { AlertAPI } from '../components/CustomAlert';
import { webInputStyles } from '../styles/containers';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
import type { ThemeColors } from '../theme';
import { goGentAPI } from '../api/client';
import { UserApiKey, CreateApiKeyRequest, UpdateApiKeyRequest } from '../types';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import ApiKeyModal from '../components/ApiKeyModal';
import { useToast } from '../context/ToastContext';
import { GitHubAuthSetup } from '../components/GitHubAuthSetup';
import { AuthModeComparison } from '../components/AuthModeComparison';
import { ApiKeyOnboarding } from '../components/ApiKeyOnboarding';

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
        name: 'whatsapp',
        displayName: 'WhatsApp Business',
        description: 'Access token for WhatsApp Business API messaging',
        placeholder: 'EAA...',
        keyType: 'bearer_token',
        defaultAccessLevel: 'write',
        defaultScopes: ['messages', 'business_management'],
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

const createStyles = (colors: ThemeColors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    paddingBottom: spacing.lg,
    minHeight: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
  },
  loadingText: {
    marginTop: spacing.lg,
    ...typography.title,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    ...typography.display,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  onboardingButton: {
    backgroundColor: colors.bgHover,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
    minHeight: touchTarget.min,
  },
  onboardingButtonText: {
    color: colors.accent,
    ...typography.bodyStrong,
    marginLeft: spacing.xs,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: touchTarget.min,
  },
  addButtonText: {
    color: colors.textInverse,
    ...typography.title,
    marginLeft: spacing.xs,
  },
  groupContainer: {
    marginTop: spacing.lg,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    minHeight: touchTarget.min,
  },
  groupHeaderLeft: {
    flex: 1,
  },
  groupTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  groupDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  groupStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  groupStatsText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  expandIcon: {
    marginLeft: spacing.sm,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    minHeight: touchTarget.min,
  },
  serviceIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  serviceIconConfigured: {
    backgroundColor: colors.statusSuccess,
  },
  serviceIconUnconfigured: {
    backgroundColor: colors.statusError,
  },
  serviceIconPartial: {
    backgroundColor: colors.statusWarning,
  },
  serviceDetails: {
    flex: 1,
  },
  serviceName: {
    ...typography.title,
    color: colors.textPrimary,
  },
  serviceDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  serviceStatusText: {
    ...typography.caption,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  serviceStatusConfigured: {
    color: colors.statusSuccess,
  },
  serviceStatusUnconfigured: {
    color: colors.statusError,
  },
  serviceStatusPartial: {
    color: colors.statusWarning,
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: spacing.sm,
    marginLeft: spacing.xs,
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyList: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  keyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    minHeight: touchTarget.min,
  },
  keyInfo: {
    flex: 1,
  },
  keyName: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  keyDetails: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  keyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    marginLeft: spacing.sm,
  },
  keyBadgeDefault: {
    backgroundColor: colors.accent,
  },
  keyBadgeNormal: {
    backgroundColor: colors.borderLight,
  },
  keyBadgeText: {
    ...typography.micro,
    fontWeight: '600',
  },
  keyBadgeTextDefault: {
    color: colors.textInverse,
  },
  keyBadgeTextNormal: {
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  emptyStateIcon: {
    marginBottom: spacing.lg,
  },
  emptyStateTitle: {
    ...typography.h1,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.title,
    fontWeight: '400',
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
  },

});

const ApiKeysScreen: React.FC<{ route: ApiKeysScreenRouteProp }> = ({ route }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
  const [showGitHubAuthSetup, setShowGitHubAuthSetup] = useState(false);
  const [showAuthComparison, setShowAuthComparison] = useState(false);
  const [isGitHubAuthLoading, setIsGitHubAuthLoading] = useState(false);
  const [gitHubEditingKey, setGitHubEditingKey] = useState<UserApiKey | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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
        return colors.statusSuccess;
      case 'partial':
        return colors.statusWarning;
      case 'unconfigured':
      default:
        return colors.statusError;
    }
  };

  const handleAddKey = (serviceName: string) => {
    // Special handling for GitHub - show auth mode comparison first
    if (serviceName === 'github') {
      setShowAuthComparison(true);
      return;
    }

    const existingKeys = getServiceKeys(serviceName);
    
    if (existingKeys.length > 0) {
      // If keys exist, ask user if they want to edit the existing key or create a new one
      AlertAPI.alert(
        'Existing Keys Found',
        `You already have ${existingKeys.length} key${existingKeys.length > 1 ? 's' : ''} for ${serviceName}. Would you like to edit an existing key or create a new one?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Edit Existing', 
            onPress: () => {
              // If there's a default key, edit that; otherwise edit the first active key
              const defaultKey = existingKeys.find(key => key.isDefault);
              const keyToEdit = defaultKey || existingKeys.find(key => key.isActive) || existingKeys[0];
              handleEditKey(keyToEdit.id);
            }
          },
          { 
            text: 'Create New', 
            onPress: () => {
              setModalInitialService(serviceName);
              setEditingKey(null);
              setShowApiKeyModal(true);
            }
          },
        ]
      );
    } else {
      // No existing keys, proceed with creation
      setModalInitialService(serviceName);
      setEditingKey(null);
      setShowApiKeyModal(true);
    }
  };

  const handleEditKey = (keyId: string) => {
    const key = apiKeys.find(k => k.id === keyId);
    if (key) {
      // Special handling for GitHub keys - route to appropriate auth flow
      if (key.serviceName === 'github') {
        setGitHubEditingKey(key);
        setShowGitHubAuthSetup(true);
        return;
      }
      
      // For non-GitHub keys, use the generic modal
      setEditingKey(key);
      setModalInitialService('');
      setShowApiKeyModal(true);
    }
  };

  const handleAuthModeSelect = (mode: 'personal_access_token' | 'github_app') => {
    setShowGitHubAuthSetup(true);
  };

  const handleGitHubAuthSave = async (authMode: 'personal_access_token' | 'github_app', config: any) => {
    setIsGitHubAuthLoading(true);
    
    try {
      if (gitHubEditingKey) {
        // Update existing key
        const updateRequest: UpdateApiKeyRequest = {
          keyValue: authMode === 'personal_access_token' ? config.token : 'github_app_auth',
          authMode,
          authConfig: config,
        };

        const response = await goGentAPI.updateApiKey(gitHubEditingKey.id, updateRequest);
        
        if (response.success) {
          showSuccess(`GitHub ${authMode === 'personal_access_token' ? 'PAT' : 'App'} updated successfully!`);
          setShowGitHubAuthSetup(false);
          setGitHubEditingKey(null);
          await loadApiKeys(); // Refresh the list
        } else {
          throw new Error(response.error || 'Failed to update GitHub authentication');
        }
      } else {
        // Create new key
        const keyName = authMode === 'personal_access_token' 
          ? 'GitHub Personal Access Token' 
          : 'GitHub App Integration';
        
        const createRequest: CreateApiKeyRequest = {
          keyName,
          serviceName: 'github',
          keyType: authMode === 'personal_access_token' ? 'access_token' : 'github_app_credentials',
          keyValue: authMode === 'personal_access_token' ? config.token : 'github_app_auth',
          authMode,
          authConfig: config,
          displayName: keyName,
          description: authMode === 'personal_access_token' 
            ? 'Personal Access Token for GitHub API access'
            : 'GitHub App authentication with enhanced permissions',
          accessLevel: 'read_write',
          scopes: ['repo', 'read:user'],
          isDefault: true,
          environment: 'production',
        };

        const response = await goGentAPI.createApiKey(createRequest);
        
        if (response.success) {
          showSuccess(`GitHub ${authMode === 'personal_access_token' ? 'PAT' : 'App'} configured successfully!`);
          setShowGitHubAuthSetup(false);
          await loadApiKeys(); // Refresh the list
        } else {
          throw new Error(response.error || 'Failed to save GitHub authentication');
        }
      }
    } catch (error) {
      console.error('GitHub auth save error:', error);
      showError(error instanceof Error ? error.message : 'Failed to save GitHub authentication');
    } finally {
      setIsGitHubAuthLoading(false);
    }
  };

  const handleGitHubAuthCancel = () => {
    setShowGitHubAuthSetup(false);
    setGitHubEditingKey(null);
  };

  const handleOnboardingComplete = () => {
    // Navigate to marketplace or agents screen after onboarding
    // For now, just refresh the API keys to show the new setup
    loadApiKeys();
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

  const handleDeleteKey = async (keyId: string, keyName: string) => {
    AlertAPI.alert(
      'Delete API Key',
      `Are you sure you want to delete "${keyName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await goGentAPI.deleteApiKey(keyId);
              if (response.success) {
                showSuccess('Key Deleted', 'API key has been deleted successfully');
                await loadApiKeys();
              } else {
                AlertAPI.alert('Error', response.error || 'Failed to delete API key');
              }
            } catch (error) {
              console.error('Failed to delete API key:', error);
              AlertAPI.alert('Error', 'Failed to delete API key');
            }
          }
        },
      ]
    );
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
              color={colors.textInverse} 
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
            {keys.length > 0 ? (
              <>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => {
                    const defaultKey = keys.find(key => key.isDefault);
                    const keyToEdit = defaultKey || keys.find(key => key.isActive) || keys[0];
                    handleEditKey(keyToEdit.id);
                  }}
                >
                  <Ionicons name="pencil" size={18} color={colors.accent} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleAddKey(service.name)}
                >
                  <Ionicons name="add" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleAddKey(service.name)}
              >
                <Ionicons name="add" size={20} color={colors.accent} />
              </TouchableOpacity>
            )}
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
                  <Ionicons name="flask" size={16} color={colors.accent} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleEditKey(key.id)}
                >
                  <Ionicons name="pencil" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={() => handleDeleteKey(key.id, key.displayName)}
                >
                  <Ionicons name="trash" size={16} color={colors.statusError} />
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
                color={configuredServices === group.services.length ? colors.statusSuccess : colors.statusWarning} 
              />
              <Text style={styles.groupStatsText}>
                {configuredServices}/{group.services.length} services • {totalKeys} keys
              </Text>
            </View>
          </View>
          
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={20} 
            color={colors.textSecondary}
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
        <ActivityIndicator size="large" color={colors.accent} />
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
        
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.onboardingButton}
            onPress={() => setShowOnboarding(true)}
          >
            <Ionicons name="refresh" size={16} color={colors.accent} />
            <Text style={styles.onboardingButtonText}>Setup Guide</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => handleAddKey('gemini')} // Default to Gemini as it's most common
          >
            <Ionicons name="add" size={20} color={colors.textInverse} />
            <Text style={styles.addButtonText}>Add Key</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {apiKeys.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons 
              name="key-outline" 
              size={64} 
              color={colors.textTertiary} 
              style={styles.emptyStateIcon}
            />
            <Text style={styles.emptyStateTitle}>No API Keys Yet</Text>
            <Text style={styles.emptyStateText}>
              Get started by setting up your core API keys to enable agent creation on the AgentLog platform.
            </Text>
            <TouchableOpacity 
              style={styles.onboardingButton}
              onPress={() => setShowOnboarding(true)}
            >
              <Ionicons name="rocket" size={20} color={colors.textInverse} />
              <Text style={styles.onboardingButtonText}>Get Started with API Keys</Text>
            </TouchableOpacity>
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
          // Don't close the modal here - let the modal handle its own closing
          // Just refresh the API keys list
          await loadApiKeys();
        }}
        editingKey={editingKey}
        initialService={modalInitialService}
      />

      {/* GitHub Auth Mode Comparison Modal */}
      <AuthModeComparison
        isVisible={showAuthComparison}
        onClose={() => setShowAuthComparison(false)}
        onSelectMode={handleAuthModeSelect}
      />

      {/* GitHub Auth Setup Modal */}
      {showGitHubAuthSetup && (
        <Modal
          visible={showGitHubAuthSetup}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={handleGitHubAuthCancel}
        >
          <GitHubAuthSetup
            onSave={handleGitHubAuthSave}
            onCancel={handleGitHubAuthCancel}
            isLoading={isGitHubAuthLoading}
            editingKey={gitHubEditingKey}
          />
        </Modal>
      )}

      {/* API Key Onboarding Modal */}
      <ApiKeyOnboarding
        visible={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
        existingKeys={apiKeys}
      />
    </View>
  );
};

export default ApiKeysScreen; 