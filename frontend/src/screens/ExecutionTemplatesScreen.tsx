import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemedStyles } from '../theme';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ExecutionTemplate, CreateTemplateFromExecutionData, TemplateFormData, TemplateParameter } from '../types/templates';
import { useTemplateManagement } from '../hooks/useTemplateManagement';
import TemplateCard from '../components/TemplateCard';
import TemplateForm from '../components/TemplateForm';
import { goGentAPI } from '../api/client';
import { AlertAPI } from '../components/CustomAlert';

const ExecutionTemplatesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { state: appState, setReExecutionData } = useApp();
  const { user } = useAuth();
  const configurations = appState.configurations || [];
  const styles = useExecutionTemplateStyles();

  // Template management
  const { templates, loading, error, fetchTemplates, createTemplate, updateTemplate, deleteTemplate } = useTemplateManagement();
  
  // Debug: Log whenever templates change
  useEffect(() => {
    if (templates.length > 0) {
      console.log('🔄 Templates state updated in ExecutionTemplatesScreen:', {
        count: templates.length,
        firstTemplate: {
          id: templates[0].id,
          name: templates[0].name,
          functionIDs: templates[0].functionIDs,
          functionIDsLength: templates[0].functionIDs?.length || 0,
          hasField: 'functionIDs' in templates[0]
        }
      });
    }
  }, [templates]);

  // UI state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFunctionSelector, setShowFunctionSelector] = useState(false);
  const [availableFunctions, setAvailableFunctions] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ExecutionTemplate | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  
  // Track processed route params to prevent re-processing
  const processedParamsRef = useRef<string | null>(null);

  useEffect(() => {
    fetchTemplates().then(() => {
      console.log('🔍 ExecutionTemplatesScreen - templates loaded, first template:', templates[0] ? {
        id: templates[0].id,
        name: templates[0].name,
        functionIDs: templates[0].functionIDs,
        functionIDsLength: templates[0].functionIDs?.length || 0,
        allKeys: Object.keys(templates[0])
      } : 'No templates');
    });
    fetchAvailableFunctions();
    
    // Handle creating template from execution (only process once per unique param set)
    const params = route.params as any;
    const paramsKey = params?.createFromExecution ? JSON.stringify(params.createFromExecution) : null;
    
    if (params?.createFromExecution && paramsKey !== processedParamsRef.current) {
      console.log('🔄 Processing createFromExecution params');
      processedParamsRef.current = paramsKey;
      handleCreateFromExecution(params.createFromExecution);
    }
  }, [route.params, configurations]);

  const fetchAvailableFunctions = async () => {
    try {
      const response = await goGentAPI.getFunctions();
      if (response.success && response.data) {
        setAvailableFunctions(response.data);
      }
    } catch (err) {
      console.error('Error fetching functions:', err);
    }
  };

  const handleCreateFromExecution = (templateData: CreateTemplateFromExecutionData) => {
    console.log('🔄 Processing createFromExecution params:', templateData);
    
    // Set selected functions
    if (templateData.functionIDs && Array.isArray(templateData.functionIDs)) {
      console.log('✅ Setting selected functions from functionIDs:', templateData.functionIDs);
    } else if (templateData.functions && Array.isArray(templateData.functions)) {
      console.log('🔄 Using fallback functions format:', templateData.functions);
    }
    
    setSelectedTemplate({
      id: '',
      name: templateData.name || '',
      description: templateData.description || '',
      prompt: templateData.prompt || '',
      templatePrompt: templateData.prompt || '',
      context: templateData.context || '',
      contextTemplate: templateData.context || '',
      enableFunctionCalling: templateData.enableFunctionCalling ?? true,
          isActive: true,
      tags: templateData.tags || [],
      createdAt: new Date().toISOString(),
      functionIDs: templateData.functionIDs || [],
    });
    
    setIsEditMode(false);
    setIsViewMode(false);
    setShowCreateModal(true);
  };

  const handleTemplatePress = (template: ExecutionTemplate) => {
    console.log('🔍 handleTemplatePress - template data:', {
      id: template.id,
      name: template.name,
      functionIDs: template.functionIDs,
      functionIDsLength: template.functionIDs?.length || 0,
      allKeys: Object.keys(template)
    });
    
    // Ensure functionIDs is preserved when setting selected template
    const templateWithFunctionIDs = {
      ...template,
      functionIDs: template.functionIDs || []
    };
    
    console.log('🎯 Setting selectedTemplate with functionIDs:', {
      id: templateWithFunctionIDs.id,
      functionIDs: templateWithFunctionIDs.functionIDs,
      functionIDsLength: templateWithFunctionIDs.functionIDs?.length || 0
    });
    
    setSelectedTemplate(templateWithFunctionIDs);
    setIsViewMode(true);
    setIsEditMode(false);
    setShowCreateModal(true);
  };

  const handleTemplateEdit = async (template: ExecutionTemplate) => {
    // Always fetch fresh templates before editing to ensure we have the latest data
    console.log('🔄 Fetching fresh template data before edit...');
    console.log('🔍 handleTemplateEdit - original template:', {
      id: template.id,
      name: template.name,
      functionIDs: template.functionIDs,
      functionIDsLength: template.functionIDs?.length || 0
    });
    const freshTemplates = await fetchTemplates();
    const freshTemplate = freshTemplates.find(t => t.id === template.id);
    
    if (freshTemplate) {
      console.log('✅ Using fresh template data for edit:', {
        preferredConfigurationId: freshTemplate.preferredConfigurationId,
        functionIDs: freshTemplate.functionIDs,
        functionIDsLength: freshTemplate.functionIDs?.length || 0
      });
      
      // Ensure functionIDs is preserved
      const templateWithFunctionIDs = {
        ...freshTemplate,
        functionIDs: freshTemplate.functionIDs || []
      };
      
      setSelectedTemplate(templateWithFunctionIDs);
    } else {
      console.log('⚠️ Could not find fresh template, using original');
      
      // Ensure functionIDs is preserved even for original template
      const templateWithFunctionIDs = {
        ...template,
        functionIDs: template.functionIDs || []
      };
      
      setSelectedTemplate(templateWithFunctionIDs);
    }
    
    setIsViewMode(false);
    setIsEditMode(true);
    setShowCreateModal(true);
  };

  const handleTemplateExecute = async (template: ExecutionTemplate) => {
    if (!appState.isConnected) {
      AlertAPI.alert('Error', 'Not connected to backend');
      return;
    }

    try {
      // Check if template has a preferred configuration
      let templateConfigurations = configurations;
      
      console.log('🔍 Template execution debug:', {
        templateName: template.name,
        hasPreferredConfig: !!template.preferredConfigurationId,
        preferredConfigId: template.preferredConfigurationId,
        totalAvailableConfigs: configurations.length,
        availableConfigs: configurations.map(c => ({ id: c.id, name: c.variationName }))
      });
      
      if (template.preferredConfigurationId) {
        // Find the preferred configuration
        const preferredConfig = configurations.find(config => config.id === template.preferredConfigurationId);
        if (preferredConfig) {
          // Use only the preferred configuration
          templateConfigurations = [preferredConfig];
          console.log('🎯 Using preferred configuration for template:', template.name, 'Config:', preferredConfig.variationName);
        } else {
          console.warn('⚠️ Preferred configuration not found, falling back to all configurations');
          console.warn('   Searching for:', template.preferredConfigurationId);
          console.warn('   Available IDs:', configurations.map(c => c.id));
        }
      } else {
        console.warn('⚠️ Template has no preferred configuration, defaulting to first available configuration');
        // For template execution, default to first configuration instead of all configurations
        if (configurations.length > 0) {
          templateConfigurations = [configurations[0]];
          console.log('🔧 Using default configuration:', configurations[0].variationName);
        }
      }

      if (templateConfigurations.length === 0) {
        AlertAPI.alert(
          'No Configurations',
          'You need to have at least one API configuration to execute templates. Please go to the Configure tab and add a configuration first.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Get function tools for the template
      const functionTools = template.functionIDs?.map(functionId => {
        const func = availableFunctions.find(f => f.id === functionId);
        if (func) {
          return {
            name: func.name,
            description: func.description,
            parameters: func.parameters || {}
          };
        }
        return null;
      }).filter((tool): tool is { name: string; description: string; parameters: Record<string, any> } => tool !== null) || [];

      const templateExecutionData = {
        executionRunName: `Execute: ${template.name}`,
        description: template.description || '',
        basePrompt: template.templatePrompt || template.prompt || '',
        context: template.contextTemplate || template.context || '',
        configurations: templateConfigurations,
        enableFunctionCalling: template.enableFunctionCalling || functionTools.length > 0,
        functionTools: functionTools,
        isTemplateExecution: true,
        templateId: template.id,
        templateParameters: template.parameters || []
      };

      console.log('📋 Template execution data prepared:', {
        templateName: template.name,
        functionToolsCount: functionTools.length,
        configurationsCount: templateConfigurations.length,
        enableFunctionCalling: templateExecutionData.enableFunctionCalling,
        parametersCount: template.parameters?.length || 0,
        usingPreferredConfig: !!template.preferredConfigurationId
      });

      setReExecutionData(templateExecutionData);
      navigation.navigate('Execute');
    } catch (error) {
      console.error('Template execution error:', error);
      AlertAPI.alert('Error', 'Failed to prepare template for execution');
    }
  };

  const handleTokenManager = (template: ExecutionTemplate) => {
    navigation.navigate('TemplateTokenManager', {
      templateId: template.id,
      templateName: template.name
    });
  };

  const handleCopy = (template: ExecutionTemplate) => {
    console.log('📋 Copying system template:', template.name);
    
    // Create a copy of the template with reset fields for user template
    const copiedTemplate: ExecutionTemplate = {
      ...template,
      id: '', // Reset ID for new template
      name: `${template.name} (Copy)`, // Add (Copy) suffix to name
      userId: user?.id || '', // Set current user as owner
      authTokens: [], // Reset auth tokens
      createdAt: new Date().toISOString(), // Reset creation date
      updatedAt: new Date().toISOString(), // Reset update date
    };

    setSelectedTemplate(copiedTemplate);
    setIsEditMode(false);
    setIsViewMode(false);
    setShowCreateModal(true);
  };

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setIsEditMode(false);
    setIsViewMode(false);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setSelectedTemplate(null);
    setIsEditMode(false);
    setIsViewMode(false);
    // Reset processed params to allow fresh navigation
    processedParamsRef.current = null;
  };

  // Handle both create and update operations - SIMPLIFIED AND ROBUST
  const handleSaveTemplate = async (
    formData: TemplateFormData,
    parameters: Omit<TemplateParameter, 'id'>[],
    selectedFunctions: string[]
  ): Promise<boolean> => {
    if (isEditMode && selectedTemplate?.id) {
      // Update existing template
      console.log('🔄 Updating template:', selectedTemplate.id);
      const success = await updateTemplate(selectedTemplate.id, formData, parameters, selectedFunctions);
      
      if (success) {
        // Refresh templates list and get fresh data
        const freshTemplates = await fetchTemplates();
        
        // Update selectedTemplate with fresh data if it exists in the refreshed list
        if (selectedTemplate?.id) {
          const updatedTemplate = freshTemplates.find(t => t.id === selectedTemplate.id);
          if (updatedTemplate) {
            setSelectedTemplate(updatedTemplate);
            console.log('✅ Updated selectedTemplate with fresh data:', updatedTemplate.preferredConfigurationId);
          } else {
            console.log('❌ Could not find updated template in fresh list');
          }
        }
        
        // Close the modal after update
        handleModalClose();
        
        AlertAPI.alert(
          'Success', 
          'Template updated successfully',
          [{ text: 'OK', style: 'default' }]
        );
      } else {
        AlertAPI.alert(
          'Error',
          'Failed to update template. Please try again.',
          [{ text: 'OK', style: 'destructive' }]
        );
      }
      
      return success;
    } else {
      // Create new template
      console.log('✨ Creating new template');
      const success = await createTemplate(formData, parameters, selectedFunctions);
      if (success) {
        await fetchTemplates();
        handleModalClose();
      }
      return success;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={styles.createButton.backgroundColor} />
          <Text style={styles.loadingText}>Loading execution templates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Execution Templates</Text>
          <TouchableOpacity
            style={styles.createButton}
          onPress={handleCreateNew}
          >
            <Ionicons name="add" size={20} color={styles.createButtonText.color} />
            <Text style={styles.createButtonText}>Create Template</Text>
          </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchTemplates} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content}>
        {templates.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color={styles.emptyDescription.color} />
            <Text style={styles.emptyTitle}>No Execution Templates</Text>
            <Text style={styles.emptyDescription}>
              Create your first execution template to enable parameterized prompt execution via API.
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={handleCreateNew}
            >
              <Text style={styles.createFirstButtonText}>Create Your First Template</Text>
            </TouchableOpacity>
          </View>
        ) : (
          templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onPress={handleTemplatePress}
              onEdit={handleTemplateEdit}
              onDelete={deleteTemplate}
              onExecute={handleTemplateExecute}
              onTokenManager={handleTokenManager}
              onCopy={handleCopy}
            />
          ))
        )}
      </ScrollView>

      {/* Template Form Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleModalClose}
      >
        <TemplateForm
          template={selectedTemplate}
          isEditMode={isEditMode}
          isViewMode={isViewMode}
          configurations={configurations}
          availableFunctions={availableFunctions}
          onSave={handleSaveTemplate}
          onClose={handleModalClose}
        />
      </Modal>
    </SafeAreaView>
  );
};

const useExecutionTemplateStyles = () => useThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  title: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.textPrimary,
  },
  createButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  createButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  errorContainer: {
    backgroundColor: colors.statusError + '15',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  errorText: {
    color: colors.statusError,
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: colors.statusError,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: colors.textTertiary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 32,
  },
  createFirstButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
}));

export default ExecutionTemplatesScreen; 