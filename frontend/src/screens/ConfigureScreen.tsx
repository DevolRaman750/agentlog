import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  FlatList,
  ActivityIndicator,
  Platform,
  Modal,
  Dimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfigurationCard from '../components/ConfigurationCard';
import { SessionManager } from '../components/SessionManager';
import { containerStyles, webInputStyles } from '../styles/containers';
import LoadingScreen from '../components/LoadingScreen';
import { CustomAlert, AlertAPI, AlertButton } from '../components/CustomAlert';
import ModelSelector, { SUPPORTED_MODELS } from '../components/ModelSelector';
import { APIConfiguration, getResourceOwnership } from '../types';
import { debugAuthState, clearAllAuthData, createTestUser } from '../utils/debugAuth';
import TextEditor from '../components/TextEditor';
import ParameterSlider from '../components/ParameterSlider';
import ScreenContainer from '../components/ScreenContainer';

const { width } = Dimensions.get('window');

// Tooltip Component
interface TooltipProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  description: string;
  examples: string[];
}

const Tooltip: React.FC<TooltipProps> = ({ visible, onClose, title, description, examples }) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <TouchableOpacity style={styles.tooltipOverlay} onPress={onClose}>
      <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
          <Text style={styles.tooltipTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.tooltipCloseButton}>
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.tooltipDescription}>{description}</Text>
        
        <View style={styles.tooltipExamples}>
          <Text style={styles.tooltipExamplesTitle}>Example Values:</Text>
          {examples.map((example, index) => (
            <Text key={index} style={styles.tooltipExample}>• {example}</Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  </Modal>
);

// Parameter Field with Tooltip Component
interface ParameterFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numeric';
  tooltipInfo: {
    title: string;
    description: string;
    examples: string[];
  };
}

const ParameterField: React.FC<ParameterFieldProps> = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  keyboardType = 'default',
  tooltipInfo 
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <View style={styles.parameterField}>
      <View style={styles.parameterLabelRow}>
        <Text style={styles.formLabel}>{label}</Text>
        <TouchableOpacity
          onPress={() => setShowTooltip(true)}
          style={styles.tooltipButton}
        >
          <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.parameterInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholder={placeholder}
      />
      <Tooltip
        visible={showTooltip}
        onClose={() => setShowTooltip(false)}
        title={tooltipInfo.title}
        description={tooltipInfo.description}
        examples={tooltipInfo.examples}
      />
    </View>
  );
};

const ConfigureScreen: React.FC = () => {
  const { state, updateConfig, addConfiguration, updateConfiguration, deleteConfiguration, loadConfigurations, testConnection, clearError, clearSession, exportSessionData, importSessionData, refreshAllData } = useApp();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { showSuccess, showError, showWarning, showInfo, showToast } = useToast();

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading configuration..." />;
  }
  const [apiKey, setApiKey] = useState(state.config.geminiApiKey || '');
  const [openWeatherApiKey, setOpenWeatherApiKey] = useState(state.config.openWeatherApiKey || '');
  const [neo4jUrl, setNeo4jUrl] = useState(state.config.neo4jUrl || '');
  const [neo4jUsername, setNeo4jUsername] = useState(state.config.neo4jUsername || '');
  const [neo4jPassword, setNeo4jPassword] = useState(state.config.neo4jPassword || '');
  const [neo4jDatabase, setNeo4jDatabase] = useState(state.config.neo4jDatabase || 'neo4j');
  const [backendUrl, setBackendUrl] = useState(state.config.backendUrl);
  const [useMockResponses, setUseMockResponses] = useState(state.config.useMockResponses);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewConfigForm, setShowNewConfigForm] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [editingConfig, setEditingConfig] = useState<APIConfiguration | null>(null);
  const [viewingConfig, setViewingConfig] = useState<APIConfiguration | null>(null);
  const [showViewConfigModal, setShowViewConfigModal] = useState(false);


  // Connection status color
  const connectionColor = state.isConnected ? '#34C759' : '#FF3B30';
  const connectionText = state.isConnected 
    ? `Connected (${state.connectionLatency}ms)` 
    : 'Disconnected';

  useEffect(() => {
    if (state.error) {
      AlertAPI.alert('Error', state.error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [state.error]);

  // Update local state when context config changes (e.g., after loading from AsyncStorage)
  useEffect(() => {
    setApiKey(state.config.geminiApiKey || '');
    setOpenWeatherApiKey(state.config.openWeatherApiKey || '');
    setNeo4jUrl(state.config.neo4jUrl || '');
    setNeo4jUsername(state.config.neo4jUsername || '');
    setNeo4jPassword(state.config.neo4jPassword || '');
    setNeo4jDatabase(state.config.neo4jDatabase || 'neo4j');
    setBackendUrl(state.config.backendUrl);
    setUseMockResponses(state.config.useMockResponses);
  }, [state.config]);

  // Reload data when tab becomes focused - SMART REFRESH
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 ConfigureScreen focused - checking connection status');
      
      // Always test connection on focus to update status
      // This is lightweight and helps keep connection status accurate
      testConnection().catch(console.warn);
      
      // Let AppContext handle configuration loading - don't duplicate it here
      console.log('✅ Connection status refreshed');
    }, [testConnection])
  );

  const handleSaveSettings = async () => {
    try {
      await updateConfig({
        geminiApiKey: apiKey,
        openWeatherApiKey: openWeatherApiKey,
        neo4jUrl: neo4jUrl,
        neo4jUsername: neo4jUsername,
        neo4jPassword: neo4jPassword,
        neo4jDatabase: neo4jDatabase,
        backendUrl,
        useMockResponses,
      });
      setIsEditing(false);
      await testConnection();
      
      // Refresh all app data to sync across tabs after config changes
      refreshAllData().catch(console.warn);
      
      showSuccess('Settings Saved', 'Configuration settings saved successfully!');
    } catch (error) {
      showError('Save Failed', 'Failed to save configuration settings');
    }
  };

  const handleClearSession = () => {
    AlertAPI.alert(
      'Clear Session Data',
      'This will remove all API settings, configurations, and execution history. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All Data', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearSession();
              AlertAPI.alert('Success', 'All session data has been cleared.');
            } catch (error) {
              AlertAPI.alert('Error', 'Failed to clear session data.');
            }
          }
        }
      ]
    );
  };

  const handleExportSession = async () => {
    try {
      const sessionData = await exportSessionData();
      const dataString = JSON.stringify(sessionData, null, 2);
      
      // In a real app, you'd want to use a file sharing library
      // For now, we'll just show the data
      AlertAPI.alert(
        'Export Session Data',
        'Session data exported. In a production app, this would be saved to a file.'
      );
      
      console.log('Exported session data:', dataString);
    } catch (error) {
      AlertAPI.alert('Error', 'Failed to export session data.');
    }
  };

  const handleTestConnection = async () => {
    await testConnection();
    const message = state.isConnected 
      ? `Connection successful! Latency: ${state.connectionLatency}ms`
      : 'Connection failed. Please check your settings.';
    
    AlertAPI.alert(
      state.isConnected ? 'Connection Test' : 'Connection Failed',
      message
    );
  };

  const renderSettingsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>API Settings</Text>
        <TouchableOpacity
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          <Ionicons name={isEditing ? "close" : "pencil"} size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Backend URL</Text>
        <TextInput
          style={[styles.textInput, !isEditing && styles.disabledInput]}
          value={backendUrl}
          onChangeText={setBackendUrl}
          placeholder="http://localhost:8080"
          editable={isEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Gemini API Key</Text>
        <TextInput
          style={[styles.textInput, !isEditing && styles.disabledInput]}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="Enter your Gemini API key"
          secureTextEntry={!isEditing}
          editable={isEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>OpenWeather API Key</Text>
        <TextInput
          style={[styles.textInput, !isEditing && styles.disabledInput]}
          value={openWeatherApiKey}
          onChangeText={setOpenWeatherApiKey}
          placeholder="Enter your OpenWeather API key"
          secureTextEntry={!isEditing}
          editable={isEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Neo4j Configuration Section */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Neo4j Graph Database</Text>
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Neo4j URL</Text>
        <TextInput
          style={[styles.textInput, !isEditing && styles.disabledInput]}
          value={neo4jUrl}
          onChangeText={setNeo4jUrl}
          placeholder="bolt://localhost:7687"
          editable={isEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Neo4j Username</Text>
        <TextInput
          style={[styles.textInput, !isEditing && styles.disabledInput]}
          value={neo4jUsername}
          onChangeText={setNeo4jUsername}
          placeholder="neo4j"
          editable={isEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Neo4j Password</Text>
        <TextInput
          style={[styles.textInput, !isEditing && styles.disabledInput]}
          value={neo4jPassword}
          onChangeText={setNeo4jPassword}
          placeholder="Enter your Neo4j password"
          secureTextEntry={!isEditing}
          editable={isEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Neo4j Database</Text>
        <TextInput
          style={[styles.textInput, !isEditing && styles.disabledInput]}
          value={neo4jDatabase}
          onChangeText={setNeo4jDatabase}
          placeholder="neo4j"
          editable={isEditing}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.switchRow}>
          <Text style={styles.settingLabel}>Use Mock Responses</Text>
          <Switch
            value={useMockResponses}
            onValueChange={setUseMockResponses}
            disabled={!isEditing}
            trackColor={{ false: '#E5E5EA', true: '#34C759' }}
            thumbColor={useMockResponses ? '#FFFFFF' : '#F4F3F4'}
          />
        </View>
        <Text style={styles.settingDescription}>
          Enable this to use mock responses instead of the real Gemini API
        </Text>
      </View>

      {isEditing && (
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveSettings}
        >
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderConfigurationsSection = () => {
    // Separate system and user configurations
    const userConfigurations = state.configurations.filter(config => {
      const ownership = getResourceOwnership(config, user?.id);
      return ownership.ownershipType !== 'system';
    });
    
    const systemConfigurations = state.configurations.filter(config => {
      const ownership = getResourceOwnership(config, user?.id);
      return ownership.ownershipType === 'system';
    });

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🎯 AI Configurations</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowNewConfigForm(true)}
          >
            <Ionicons name="add" size={20} color="#007AFF" />
            <Text style={styles.addButtonText}>Add New</Text>
          </TouchableOpacity>
        </View>

        {/* System Configurations */}
        {systemConfigurations.length > 0 && (
          <>
            <View style={styles.subsectionHeader}>
              <Ionicons name="shield-checkmark" size={16} color="#007AFF" />
              <Text style={styles.subsectionTitle}>System Configurations</Text>
              <Text style={styles.subsectionCount}>({systemConfigurations.length})</Text>
            </View>
                          <FlatList
                data={systemConfigurations}
                keyExtractor={(item) => item.id || item.variationName}
                renderItem={({ item }) => (
                  <ConfigurationCard
                    configuration={item}
                    onView={handleViewConfiguration}
                    onEdit={handleEditConfiguration}
                    onDelete={handleDeleteConfiguration}
                    onDuplicate={handleDuplicateConfiguration}
                  />
                )}
                scrollEnabled={false}
              />
          </>
        )}

        {/* User Configurations */}
        <View style={styles.subsectionHeader}>
          <Ionicons name="person" size={16} color="#34C759" />
          <Text style={styles.subsectionTitle}>Your Configurations</Text>
          <Text style={styles.subsectionCount}>({userConfigurations.length})</Text>
        </View>
        
        {userConfigurations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#C7C7CC" />
            <Text style={styles.emptyStateTitle}>No Custom Configurations</Text>
            <Text style={styles.emptyStateText}>
              Create your own AI configurations or duplicate system ones to get started.
            </Text>
            <TouchableOpacity
              style={styles.emptyStateButton}
              onPress={() => setShowNewConfigForm(true)}
            >
              <Text style={styles.emptyStateButtonText}>Create Configuration</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={userConfigurations}
            keyExtractor={(item) => item.id || item.variationName}
            renderItem={({ item }) => (
              <ConfigurationCard
                configuration={item}
                onView={handleViewConfiguration}
                onEdit={handleEditConfiguration}
                onDelete={handleDeleteConfiguration}
                onDuplicate={handleDuplicateConfiguration}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </View>
    );
  };

  const handleViewConfiguration = (config: APIConfiguration) => {
    setViewingConfig(config);
    setShowViewConfigModal(true);
  };

  const handleEditConfiguration = (config: APIConfiguration) => {
    const ownership = getResourceOwnership(config, user?.id);
    if (!ownership.canEdit) {
      showWarning('Permission Denied', 'You cannot edit this configuration.');
      return;
    }
    // Set the configuration to edit and show the form
    setEditingConfig(config);
    setShowNewConfigForm(true);
  };

  const handleDeleteConfiguration = async (configId: string) => {
    console.log('🗑️ Executing delete for configId:', configId);
    
    const config = state.configurations.find(c => c.id === configId);
    console.log('📋 Found configuration:', config);
    
    if (!config) {
      console.error('❌ Configuration not found for ID:', configId);
      showError('Error', 'Configuration not found.');
      return;
    }

    const ownership = getResourceOwnership(config, user?.id);
    console.log('🔐 Ownership check:', ownership, 'User ID:', user?.id, 'Config User ID:', config.userId);
    
    if (!ownership.canDelete) {
      console.warn('🚫 Cannot delete - permission denied');
      showWarning('Permission Denied', 'You cannot delete this configuration.');
      return;
    }

    console.log('✅ Permission granted, executing delete (confirmation already handled by ConfigurationCard)');
    
    try {
      console.log('🗑️ Proceeding with deletion:', config.variationName);
      const success = await deleteConfiguration(configId);
      console.log('📤 Delete API response:', success);
      
      if (success) {
        console.log('✅ Delete successful');
        showSuccess('Configuration Deleted', `"${config.variationName}" has been deleted successfully.`);
      } else {
        console.log('❌ Delete failed');
        showError('Delete Failed', 'Failed to delete configuration from server.');
            }
    } catch (error) {
      console.error('💥 Error deleting configuration:', error);
      showError('Delete Failed', 'Failed to delete configuration.');
    }
  };

  const handleDuplicateConfiguration = async (config: APIConfiguration) => {
    try {
      const newConfig = {
        ...config,
        id: `config-${Date.now()}`, // Ensure a unique ID for the new config
        userId: user?.id, // Set current user as owner
        variationName: `${config.variationName} (Copy)`,
        isSystemResource: false, // User copies are never system resources
      };
      await addConfiguration(newConfig);
      showSuccess('Configuration Duplicated', `"${config.variationName}" has been successfully duplicated.`);
    } catch (error) {
      showError('Duplication Failed', 'Failed to duplicate configuration.');
    }
  };

  const handleDebugAuth = async () => {
    await debugAuthState();
  };

  const handleClearAuth = async () => {
    await clearAllAuthData();
    showInfo('Auth Cleared', 'All authentication data has been cleared. Please refresh the page.');
  };

  const handleCreateTestUser = async () => {
    const result = await createTestUser();
    if (result) {
      showSuccess('Test User Created', `Created test user: ${result.user.username}`);
      // Reload the page to refresh auth state
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } else {
      showError('Test User Failed', 'Failed to create test user. Check console for details.');
    }
  };

  const renderDebugSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🔧 Debug Tools</Text>
      </View>
      
      <View style={styles.debugButtonContainer}>
        <TouchableOpacity style={styles.debugButton} onPress={handleDebugAuth}>
          <Ionicons name="bug" size={16} color="#007AFF" />
          <Text style={styles.debugButtonText}>Debug Auth State</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.debugButton} onPress={handleCreateTestUser}>
          <Ionicons name="person-add" size={16} color="#34C759" />
          <Text style={styles.debugButtonText}>Create Test User</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.debugButton} onPress={handleClearAuth}>
          <Ionicons name="trash" size={16} color="#FF3B30" />
          <Text style={styles.debugButtonText}>Clear Auth Data</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.debugHint}>
        Use these tools to diagnose authentication and API connectivity issues. Check browser console for detailed logs.
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <Text style={styles.title}>⚙️ Configuration</Text>
        <TouchableOpacity
          style={styles.sessionButton}
          onPress={() => setShowSessionManager(true)}
        >
          <Ionicons name="person-circle-outline" size={24} color="#007AFF" />
          <Text style={styles.sessionButtonText}>Session</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderImportExportSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Session Management</Text>
      </View>
      <Text style={styles.sectionDescription}>
        Manage your session data, configurations, and settings.
      </Text>
      
      <View style={styles.sessionButtonsContainer}>
        <TouchableOpacity 
          style={[styles.sessionButton, styles.exportButton]} 
          onPress={handleExportSession}
        >
          <Ionicons name="download-outline" size={20} color="#007AFF" />
          <Text style={styles.exportButtonText}>Export Data</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.sessionButton, styles.clearButton]} 
          onPress={handleClearSession}
        >
          <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.clearButtonText}>Clear Session</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sessionNote}>
        Export: Backup your API settings and configurations{'\n'}
        Clear Session: Remove all saved data and reset to defaults
      </Text>
    </View>
  );

  return (
    <ScreenContainer
      enableScrolling={true}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
        {renderHeader()}
        {renderConfigurationsSection()}
        {renderImportExportSection()}
        {renderDebugSection()}

      {/* Session Manager Modal */}
      <SessionManager
        visible={showSessionManager}
        onClose={() => setShowSessionManager(false)}
      />

      {/* Custom Alert */}
      <CustomAlert />

      {showNewConfigForm && (
        <NewConfigurationFormModal 
          onClose={() => {
            setShowNewConfigForm(false);
            setEditingConfig(null);
          }} 
          editingConfig={editingConfig}
        />
      )}

      {showViewConfigModal && viewingConfig && (
        <ViewConfigurationModal 
          configuration={viewingConfig}
          onClose={() => {
            setShowViewConfigModal(false);
            setViewingConfig(null);
          }} 
        />
      )}
    </ScreenContainer>
  );
};

// New Configuration Form Component - REMOVED since it's unused

// Configuration Form Modal (Create/Edit)
const NewConfigurationFormModal: React.FC<{ 
  onClose: () => void; 
  editingConfig?: APIConfiguration | null; 
}> = ({ onClose, editingConfig }) => {
  const { addConfiguration, updateConfiguration } = useApp();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const isEditing = !!editingConfig;
  
  const [formData, setFormData] = useState({
    variationName: editingConfig?.variationName || '',
    modelName: editingConfig?.modelName || SUPPORTED_MODELS[0].name, // Default to first recommended model
    systemPrompt: editingConfig?.systemPrompt || '',
    temperature: editingConfig?.temperature || 0.5,
    maxTokens: editingConfig?.maxTokens || 500,
  });

  // Temperature and max tokens are now handled by the ParameterSlider components

  const handleSave = async () => {
    if (!formData.variationName.trim()) {
      showError('Missing Name', 'Please enter a variation name');
      return;
    }

    // Values are already validated by the ParameterSlider components
    const finalFormData = formData;

          try {
        if (isEditing && editingConfig) {
          // Update existing configuration
          const updatedConfig: APIConfiguration = {
            ...editingConfig,
            variationName: finalFormData.variationName,
            modelName: finalFormData.modelName,
            systemPrompt: finalFormData.systemPrompt,
            temperature: finalFormData.temperature,
            maxTokens: finalFormData.maxTokens,
          };

        const success = await updateConfiguration(updatedConfig);
        if (success) {
          showSuccess('Configuration Updated', 'Configuration updated successfully!');
          onClose();
        }
        // Error handling is done in updateConfiguration method
      } else {
        // Create new configuration
        const config: APIConfiguration = {
          id: `config-${Date.now()}`,
          userId: user?.id,
          variationName: finalFormData.variationName,
          modelName: finalFormData.modelName,
          systemPrompt: finalFormData.systemPrompt,
          temperature: finalFormData.temperature,
          maxTokens: finalFormData.maxTokens,
          isSystemResource: false,
        };

        await addConfiguration(config);
        showSuccess('Configuration Created', 'Configuration saved successfully!');
        onClose();
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      showError(`${isEditing ? 'Update' : 'Save'} Failed`, `Failed to ${isEditing ? 'update' : 'save'} configuration`);
    }
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView 
          style={styles.modalKeyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? 'Edit Configuration' : 'New Configuration'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.modalContent}
            contentContainerStyle={styles.modalScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.inputLabel}>Variation Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.variationName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, variationName: text }))}
              placeholder="e.g., Creative, Conservative, Balanced"
              returnKeyType="next"
            />
            
            <Text style={styles.inputLabel}>Model</Text>
            <ModelSelector
              selectedModel={formData.modelName}
              onModelChange={(modelName) => setFormData(prev => ({ ...prev, modelName }))}
            />
            
            <TextEditor
              label="🤖 System Prompt"
              value={formData.systemPrompt}
              onChangeText={(text) => setFormData(prev => ({ ...prev, systemPrompt: text }))}
              placeholder="Enter system prompt (optional)..."
              minHeight={120}
              maxHeight={300}
              allowFullscreen={true}
              showCharacterCount={true}
              showWordCount={true}
              showLineNumbers={false}
            />
            
            <ParameterSlider
              label="Temperature"
              value={formData.temperature}
              onValueChange={(newValue) => {
                setFormData(prev => ({ ...prev, temperature: newValue }));
              }}
              min={0}
              max={1}
              step={0.1}
              presets={[
                { label: 'Precise', value: 0.1, description: 'Very focused and deterministic', useCase: 'Facts and analysis' },
                { label: 'Factual', value: 0.3, description: 'Balanced and reliable', useCase: 'General questions' },
                { label: 'Balanced', value: 0.5, description: 'Good mix of accuracy and creativity', useCase: 'Most use cases' },
                { label: 'Creative', value: 0.7, description: 'More varied and imaginative', useCase: 'Writing and brainstorming' },
                { label: 'Wild', value: 0.9, description: 'Very creative and unpredictable', useCase: 'Creative writing' },
              ]}
              helpInfo={{
                title: 'Temperature Control',
                description: 'Temperature controls the randomness and creativity of AI responses. It affects how the model selects words and phrases when generating text.',
                lowValue: 'More predictable, focused, and consistent responses',
                highValue: 'More creative, varied, and sometimes unpredictable responses',
                recommendations: [
                  { task: 'Data Analysis & Facts', range: '0.0 - 0.3', description: 'Use low temperature for factual questions, data analysis, and when you need consistent, reliable answers.' },
                  { task: 'General Q&A', range: '0.3 - 0.5', description: 'Balanced approach for most everyday questions and tasks.' },
                  { task: 'Creative Writing', range: '0.5 - 0.8', description: 'Higher temperature for stories, poems, and creative content generation.' },
                  { task: 'Brainstorming', range: '0.6 - 0.9', description: 'High temperature for generating diverse ideas and creative solutions.' },
                  { task: 'Code Generation', range: '0.1 - 0.4', description: 'Lower temperature for programming tasks to ensure syntax accuracy.' },
                ]
              }}
            />
            
            <ParameterSlider
              label="Max Tokens"
              value={formData.maxTokens}
              onValueChange={(newValue) => {
                setFormData(prev => ({ ...prev, maxTokens: newValue }));
              }}
              min={50}
              max={4000}
              step={50}
              presets={[
                { label: 'Short', value: 150, description: 'Brief responses', useCase: 'Quick answers' },
                { label: 'Standard', value: 500, description: 'Balanced length responses', useCase: 'Most use cases' },
                { label: 'Detailed', value: 1000, description: 'Comprehensive responses', useCase: 'Explanations' },
                { label: 'Long-form', value: 2000, description: 'Extended content', useCase: 'Essays and articles' },
                { label: 'Maximum', value: 4000, description: 'Very long responses', useCase: 'Reports and analysis' },
              ]}
              helpInfo={{
                title: 'Maximum Tokens',
                description: 'Tokens are pieces of words that the AI uses to understand and generate text. This setting controls the maximum length of responses you\'ll receive.',
                lowValue: 'Shorter, more concise responses',
                highValue: 'Longer, more detailed responses (but uses more API credits)',
                recommendations: [
                  { task: 'Quick Q&A', range: '50 - 300', description: 'Perfect for brief answers, definitions, and simple questions.' },
                  { task: 'General Chat', range: '300 - 800', description: 'Good balance for most conversations and explanations.' },
                  { task: 'Detailed Explanations', range: '800 - 1500', description: 'For complex topics that need thorough coverage.' },
                  { task: 'Content Creation', range: '1500 - 3000', description: 'Essays, articles, and comprehensive content.' },
                  { task: 'Code Generation', range: '500 - 2000', description: 'Depends on complexity - simple functions to full applications.' },
                  { task: 'Data Analysis', range: '1000 - 4000', description: 'Detailed analysis and reporting on datasets.' },
                ]
              }}
            />
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save Configuration</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

// View Configuration Modal (Read-only)
const ViewConfigurationModal: React.FC<{ 
  configuration: APIConfiguration;
  onClose: () => void; 
}> = ({ configuration, onClose }) => {
  const { user } = useAuth();
  const ownership = getResourceOwnership(configuration, user?.id);
  
  const getTemperatureDescription = (temperature?: number) => {
    if (!temperature) return 'Default (0.5)';
    if (temperature <= 0.3) return `${temperature} - Conservative (Precise and predictable)`;
    if (temperature <= 0.7) return `${temperature} - Balanced (Good mix of accuracy and creativity)`;
    return `${temperature} - Creative (More varied and imaginative)`;
  };

  const getTokensDescription = (maxTokens?: number) => {
    if (!maxTokens) return 'Default (500)';
    if (maxTokens <= 300) return `${maxTokens} - Short responses`;
    if (maxTokens <= 800) return `${maxTokens} - Standard responses`;
    if (maxTokens <= 1500) return `${maxTokens} - Detailed responses`;
    return `${maxTokens} - Long-form responses`;
  };

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>View Configuration</Text>
          <TouchableOpacity 
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <ScrollView 
          style={styles.modalContent}
          contentContainerStyle={styles.modalScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Configuration Header */}
          <View style={styles.viewHeader}>
            <Text style={styles.viewConfigName}>{configuration.variationName}</Text>
            
            {/* Badges */}
            <View style={styles.viewBadgesContainer}>
              {ownership.ownershipType === 'system' && (
                <View style={styles.systemViewBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#007AFF" />
                  <Text style={styles.systemViewBadgeText}>SYSTEM</Text>
                </View>
              )}
              
              {ownership.ownershipType !== 'system' && ownership.ownerInfo && !ownership.ownerInfo.isCurrentUser && (
                <View style={styles.ownerViewBadge}>
                  <Ionicons name="person" size={12} color="#8E8E93" />
                  <Text style={styles.ownerViewBadgeText}>Other User</Text>
                </View>
              )}
            </View>
          </View>

          {/* Configuration Details */}
          <View style={styles.viewSection}>
            <Text style={styles.viewSectionTitle}>Model Information</Text>
            <View style={styles.viewDetailRow}>
              <Text style={styles.viewDetailLabel}>Model:</Text>
              <Text style={styles.viewDetailValue}>{configuration.modelName}</Text>
            </View>
            
            {configuration.id && (
              <View style={styles.viewDetailRow}>
                <Text style={styles.viewDetailLabel}>Configuration ID:</Text>
                <Text style={styles.viewDetailValue}>{configuration.id}</Text>
              </View>
            )}
          </View>

          {/* Parameters */}
          <View style={styles.viewSection}>
            <Text style={styles.viewSectionTitle}>Parameters</Text>
            <View style={styles.viewDetailRow}>
              <Text style={styles.viewDetailLabel}>Temperature:</Text>
              <Text style={styles.viewDetailValue}>{getTemperatureDescription(configuration.temperature)}</Text>
            </View>
            
            <View style={styles.viewDetailRow}>
              <Text style={styles.viewDetailLabel}>Max Tokens:</Text>
              <Text style={styles.viewDetailValue}>{getTokensDescription(configuration.maxTokens)}</Text>
            </View>
          </View>

          {/* System Prompt */}
          <View style={styles.viewSection}>
            <Text style={styles.viewSectionTitle}>System Prompt</Text>
            <View style={styles.viewPromptContainer}>
              <Text style={styles.viewPromptText}>
                {configuration.systemPrompt || 'No system prompt specified'}
              </Text>
            </View>
          </View>

          {/* Additional Info */}
          {ownership.ownershipType === 'system' && (
            <View style={styles.viewInfoSection}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.viewInfoText}>
                This is a system-provided configuration. You can duplicate it to create your own customizable version.
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Increased padding to account for tab bar + UserStatusBar
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  sessionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  sessionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  section: {
    ...containerStyles.primaryContainer,
    marginHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginTop: 8,
  },
  editButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  settingDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    ...webInputStyles,
  },
  disabledInput: {
    backgroundColor: '#F2F2F7',
    color: '#8E8E93',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    marginTop: 8,
  },
  formContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  formField: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    ...webInputStyles,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  modelSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modelOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modelOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modelOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  modelOptionTextSelected: {
    color: '#FFFFFF',
  },
  modelOptionDescription: {
    fontSize: 12,
    color: '#8E8E93',
  },
  parameterRow: {
    flexDirection: 'row',
    gap: 16,
  },
  parameterField: {
    flex: 1,
  },
  parameterLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipButton: {
    padding: 4,
  },
  parameterInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
  },
  tooltipOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  tooltipContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: width * 0.8,
    alignItems: 'center',
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  tooltipCloseButton: {
    padding: 4,
  },
  tooltipDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 15,
  },
  tooltipExamples: {
    width: '100%',
  },
  tooltipExamplesTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  tooltipExample: {
    fontSize: 13,
    color: '#8E8E93',
    marginBottom: 4,
  },
  sessionSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  sessionButtonsContainer: {
    flexDirection: 'row',
    gap: 12,
  },

  exportButton: {
    backgroundColor: '#F2F2F7',
  },
  exportButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  clearButton: {
    borderColor: '#FF3B30',
    borderWidth: 1,
  },
  clearButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  sessionNote: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
  latencyText: {
    fontSize: 12,
    color: '#C7C7CC',
  },
  subsectionContainer: {
    marginTop: 24,
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subsectionCount: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalKeyboardView: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
    minHeight: 44,
  },
  numericInputContainer: {
    marginBottom: 20,
  },
  inputError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    marginLeft: 4,
  },
  modalFooter: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 50,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Debug section styles
  debugButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  debugButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9ECEF',
    gap: 6,
  },
  debugButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#495057',
  },
  debugHint: {
    fontSize: 12,
    color: '#6C757D',
    fontStyle: 'italic',
    lineHeight: 16,
  },
  
  // View Configuration Modal Styles
  viewHeader: {
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
    marginBottom: 20,
  },
  viewConfigName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  viewBadgesContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  systemViewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  systemViewBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#007AFF',
  },
  ownerViewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  ownerViewBadgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
  },
  viewSection: {
    marginBottom: 24,
  },
  viewSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  viewDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  viewDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    flex: 1,
  },
  viewDetailValue: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 2,
    textAlign: 'right',
  },
  viewPromptContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  viewPromptText: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  viewInfoSection: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 20,
  },
  viewInfoText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
    flex: 1,
  },
});

export default ConfigureScreen; 