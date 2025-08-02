import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  SafeAreaView,
  Switch,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AlertAPI } from '../components/CustomAlert';
import { goGentAPI } from '../api/client';
import { FunctionSelector } from '../components/FunctionSelector';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

interface ExecutionTemplate {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  templatePrompt?: string; // API field name
  context?: string;
  contextTemplate?: string; // API field name
  enableFunctionCalling: boolean;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
  parameters?: TemplateParameter[];
  authTokens?: AuthToken[];
  modelName?: string;
  functionIds?: string[];
}

interface TemplateParameter {
  id: string;
  name: string;
  parameterName?: string; // API field name
  description: string;
  parameterType: string;
  isRequired: boolean;
  defaultValue?: string;
  validationRules?: any;
}

interface AuthToken {
  id: string;
  tokenName: string;
  description: string;
  tokenValue: string;
  isActive: boolean;
  allowedOrigins?: Record<string, boolean>;
  customRateLimitPerHour?: number;
  expiresAt?: string;
  createdAt: string;
  totalUses?: number; // Added for enhanced token details
}

const ExecutionTemplatesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { state: appState, setReExecutionData } = useApp();
  const configurations = appState.configurations || [];
  const [templates, setTemplates] = useState<ExecutionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFunctionSelector, setShowFunctionSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state for creating/editing templates
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    prompt: '',
    context: '',
    enableFunctionCalling: true,
    tags: '',
    modelName: '', // Will be set to first available configuration
  });

  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [availableFunctions, setAvailableFunctions] = useState<any[]>([]);

  const [parameters, setParameters] = useState<Omit<TemplateParameter, 'id'>[]>([]);

  // Auto-detect parameters from prompt text
  const detectParametersFromPrompt = (promptText: string) => {
    const parameterRegex = /\{\{([^}]+)\}\}/g;
    const detectedParams = new Set<string>();
    let match;
    
    while ((match = parameterRegex.exec(promptText)) !== null) {
      const paramName = match[1].trim();
      if (paramName) {
        detectedParams.add(paramName);
      }
    }
    
    return Array.from(detectedParams);
  };

  // Update parameters when prompt changes
  const handlePromptChange = (newPrompt: string) => {
    setFormData({...formData, prompt: newPrompt});
    
    const detectedParams = detectParametersFromPrompt(newPrompt);
    const currentParamNames = parameters.map(p => p.name);
    
    // Keep existing parameters that are still in the prompt
    const existingParams = parameters.filter(p => detectedParams.includes(p.name));
    
    // Add new parameters that were detected but don't exist yet
    const newParams = detectedParams
      .filter(paramName => !currentParamNames.includes(paramName))
      .map(paramName => ({
        name: paramName,
        description: `Documentation for ${paramName} parameter`,
        parameterType: 'string',
        isRequired: true,
        defaultValue: '',
        validationRules: null,
      }));
    
    // Update parameters list
    setParameters([...existingParams, ...newParams]);
  };



  useEffect(() => {
    fetchTemplates();
    fetchAvailableFunctions();
    
    // Check if we're creating a template from an execution
    const params = route.params as any;
    if (params?.createFromExecution) {
      const templateData = params.createFromExecution;
      console.log('🔄 Processing createFromExecution params:', templateData);
      
      setFormData({
        name: templateData.name || '',
        description: templateData.description || '',
        prompt: templateData.prompt || '',
        context: templateData.context || '',
        enableFunctionCalling: templateData.enableFunctionCalling || true,
        tags: Array.isArray(templateData.tags) ? templateData.tags.join(', ') : '',
        modelName: templateData.modelName || (configurations.length > 0 ? configurations[0].id || '' : ''),
      });
      
      // Set selected functions using functionIds array
      if (templateData.functionIds && Array.isArray(templateData.functionIds)) {
        console.log('✅ Setting selected functions from functionIds:', templateData.functionIds);
        setSelectedFunctions(templateData.functionIds);
      } else if (templateData.functions && Array.isArray(templateData.functions)) {
        // Fallback for old format (functions array)
        console.log('🔄 Using fallback functions format:', templateData.functions);
        setSelectedFunctions(templateData.functions.map((f: any) => f.id || f.name));
      } else {
        console.log('ℹ️ No functions provided in template data');
        setSelectedFunctions([]);
      }
      
      setShowCreateModal(true);
    }
  }, [route.params, configurations]);

  // Set default configuration when configurations load
  useEffect(() => {
    if (configurations.length > 0 && !formData.modelName) {
      setFormData(prev => ({
        ...prev,
        modelName: configurations[0].id || ''
      }));
    }
  }, [configurations, formData.modelName]);

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

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await goGentAPI.getTemplates();
      
      if (response.success && response.data) {
        // Ensure all templates have proper default values
        const templatesWithDefaults = (response.data.templates || []).map(template => ({
          ...template,
          parameters: template.parameters || [],
          authTokens: template.authTokens || [],
          functionIds: template.functionIds || [],
          tags: template.tags || [],
        }));
        
        console.log('📋 Templates loaded:', templatesWithDefaults.map(t => ({
          id: t.id,
          name: t.name,
          functionIds: t.functionIds,
          functionIdsCount: t.functionIds?.length || 0,
          enableFunctionCalling: t.enableFunctionCalling,
          hasAuthTokens: !!t.authTokens?.length
        })));
        
        setTemplates(templatesWithDefaults);
      } else {
        throw new Error(response.error || 'Failed to fetch templates');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('Failed to load execution templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!formData.name.trim() || !formData.prompt.trim()) {
      AlertAPI.alert(
        'Validation Error',
        'Template name and prompt are required',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Validate parameter data to prevent database errors
    for (const param of parameters) {
      if (!param.name || param.name.trim().length === 0) {
        AlertAPI.alert(
          'Validation Error',
          'All parameters must have a name',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      if (param.name.length > 50) {
        AlertAPI.alert(
          'Validation Error',
          `Parameter name "${param.name}" is too long. Maximum 50 characters.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      if (param.description && param.description.length > 500) {
        AlertAPI.alert(
          'Validation Error',
          `Parameter description for "${param.name}" is too long. Maximum 500 characters.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
      if (param.parameterType && param.parameterType.length > 20) {
        AlertAPI.alert(
          'Validation Error',
          `Parameter type for "${param.name}" is too long. Maximum 20 characters.`,
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }
    }

    try {
      const templateData = {
        template: {
          name: formData.name.trim(),
          description: formData.description.trim(),
          templatePrompt: formData.prompt.trim(),
          contextTemplate: formData.context.trim() || undefined,
          enableFunctionCalling: formData.enableFunctionCalling,
          isActive: true,
          isPublic: false,
          category: 'user',
          tags: formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0).length > 0 
            ? formData.tags.split(',').map(t => t.trim()).filter(t => t.length > 0).reduce((acc, tag) => {
                acc[tag] = true;
                return acc;
              }, {} as Record<string, boolean>)
            : null,
          executionTimeoutSeconds: 300,
          rateLimitPerHour: 100,
          rateLimitPerDay: 1000,
          rateLimitBurst: 10,
        },
        parameters: parameters.map(p => ({
          parameterName: p.name.trim(),
          description: p.description?.trim() || '',
          parameterType: p.parameterType || 'string',
          isRequired: p.isRequired,
          defaultValue: p.defaultValue?.trim() || undefined,
          validationRules: p.validationRules || {},
        })),
        // Include function selections when saving templates
        functionIds: selectedFunctions,
      };

      console.log('📋 Sending template data:', {
        templateName: templateData.template.name,
        parametersCount: templateData.parameters.length,
        functionIds: templateData.functionIds,
        functionIdsCount: templateData.functionIds.length,
        enableFunctionCalling: templateData.template.enableFunctionCalling,
        parameters: templateData.parameters.map(p => ({
          name: p.parameterName,
          type: p.parameterType,
          descriptionLength: p.description.length
        }))
      });

      let response;
      if (isEditMode && editingTemplateId) {
        response = await goGentAPI.updateTemplate(editingTemplateId, templateData);
      } else {
        response = await goGentAPI.createTemplate(templateData);
      }

      if (!response.success) {
        throw new Error(response.error || `Failed to ${isEditMode ? 'update' : 'create'} template`);
      }

      setShowCreateModal(false);
      resetForm();
      fetchTemplates();
      
      AlertAPI.alert(
        'Success',
        `Execution template ${isEditMode ? 'updated' : 'created'} successfully!`,
        [{ text: 'OK', style: 'default' }]
      );
    } catch (err) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} template:`, err);
      AlertAPI.alert(
        'Error',
        `Failed to ${isEditMode ? 'update' : 'create'} execution template. Please try again.`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    AlertAPI.alert(
      'Confirm Delete',
      'Are you sure you want to delete this execution template? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await goGentAPI.deleteTemplate(templateId);

              if (!response.success) {
                throw new Error(response.error || 'Failed to delete template');
              }

              fetchTemplates();
              AlertAPI.alert(
                'Success',
                'Template deleted successfully',
                [{ text: 'OK', style: 'default' }]
              );
            } catch (err) {
              console.error('Error deleting template:', err);
              AlertAPI.alert(
                'Error',
                'Failed to delete template. Please try again.',
                [{ text: 'OK', style: 'destructive' }]
              );
            }
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      prompt: '',
      context: '',
      enableFunctionCalling: true,
      tags: '',
      modelName: configurations.length > 0 ? configurations[0].id || '' : '',
    });
    setParameters([]);
    setSelectedFunctions([]);
    setIsViewMode(false);
    setIsEditMode(false);
    setEditingTemplateId(null);
  };

  const addParameter = () => {
    setParameters([...parameters, {
      name: '',
      description: '',
      parameterType: 'string',
      isRequired: true,
      defaultValue: '',
      validationRules: null,
    }]);
  };

  const updateParameter = (index: number, field: string, value: any) => {
    const updatedParams = [...parameters];
    updatedParams[index] = { ...updatedParams[index], [field]: value };
    setParameters(updatedParams);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const openTemplateDetails = (template: ExecutionTemplate) => {
    // Populate form with template data for viewing
    setFormData({
      name: template.name,
      description: template.description || '',
      prompt: (template as any).templatePrompt || template.prompt || '',
      context: (template as any).contextTemplate || template.context || '',
      enableFunctionCalling: template.enableFunctionCalling,
      tags: template.tags && Array.isArray(template.tags) ? template.tags.join(', ') : '',
      modelName: template.modelName || (configurations.length > 0 ? configurations[0].id || '' : ''),
    });
    
    // Populate function selections
    setSelectedFunctions(template.functionIds || []);
    
    // Populate parameters
    setParameters(template.parameters?.map(param => ({
      name: (param as any).parameterName || param.name,
      description: param.description || '',
      parameterType: param.parameterType || 'string',
      isRequired: param.isRequired || false,
      defaultValue: param.defaultValue || '',
      validationRules: param.validationRules || null,
    })) || []);
    
    // Set view mode (not edit mode)
    setIsViewMode(true);
    setIsEditMode(false);
    setEditingTemplateId(template.id);
    setShowCreateModal(true);
  };

  const openTokenManager = (template: ExecutionTemplate) => {
    navigation.navigate('TemplateTokenManager', { 
      templateId: template.id, 
      templateName: template.name 
    });
  };

  const executeTemplate = async (template: ExecutionTemplate) => {
    console.log('🚀 Starting template execution navigation for:', template.name);
    console.log('📋 Template function IDs:', template.functionIds);
    
    try {
      // Ensure we have configurations loaded
      if (configurations.length === 0) {
        AlertAPI.alert(
          'No Configurations',
          'Please configure at least one AI configuration before executing templates.',
          [{ text: 'OK', style: 'default' }]
        );
        return;
      }

      // Get available functions for mapping
      const functionsResponse = await goGentAPI.getFunctions();
      const availableFunctions = functionsResponse.success && functionsResponse.data ? functionsResponse.data : [];
      console.log('📋 Available functions for mapping:', availableFunctions.map(f => ({ id: f.id, name: f.name })));

      // Map template function IDs to function tools
      const functionTools = template.functionIds?.map(functionId => {
        const func = availableFunctions.find(f => f.id === functionId);
        console.log(`🔍 Mapping function ID "${functionId}" -> ${func ? `${func.name} (${func.id})` : 'NOT FOUND'}`);
        if (func) {
          return {
            name: func.name,
            description: func.description,
            parameters: func.parametersSchema || {}
          };
        }
        return null;
      }).filter((tool): tool is { name: string; description: string; parameters: Record<string, any> } => tool !== null) || [];

      console.log('🎯 Final function tools for execution:', functionTools.map(t => t.name));

      // Use a reasonable default configuration (first available)
      const defaultConfigurations = configurations.slice(0, 1);

      // Create reExecutionData structure for the template
      const templateExecutionData = {
        executionRunName: `Execute: ${template.name}`,
        description: template.description || `Executing template: ${template.name}`,
        basePrompt: (template as any).templatePrompt || template.prompt || '',
        context: (template as any).contextTemplate || template.context || '',
        configurations: defaultConfigurations,
        enableFunctionCalling: template.enableFunctionCalling && functionTools.length > 0,
        functionTools: functionTools,
        comparisonEnabled: false,
        selectedMetrics: [],
        functionExecutionMode: 'auto' as const
      };

      console.log('📋 Template execution data prepared:', {
        templateName: template.name,
        prompt: templateExecutionData.basePrompt ? templateExecutionData.basePrompt.substring(0, 100) + '...' : 'EMPTY',
        context: templateExecutionData.context ? templateExecutionData.context.substring(0, 100) + '...' : 'EMPTY',
        configurationsCount: templateExecutionData.configurations.length,
        functionsCount: functionTools.length,
        hasParameters: template.parameters?.length || 0,
        functionToolNames: functionTools.map(t => t.name)
      });

      // Set the data in AppContext and navigate to Execute
      setReExecutionData(templateExecutionData);
      navigation.navigate('Execute');
      
    } catch (error) {
      console.error('❌ Template execution preparation failed:', error);
      AlertAPI.alert(
        'Error',
        `Failed to prepare template execution: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const openTemplateEdit = (template: ExecutionTemplate) => {
    console.log('📝 Opening template for edit:', {
      templateId: template.id,
      templateName: template.name,
      functionIds: template.functionIds,
      functionIdsCount: template.functionIds?.length || 0,
      enableFunctionCalling: template.enableFunctionCalling
    });
    
    // Populate form with existing template data
    setFormData({
      name: template.name,
      description: template.description || '',
      prompt: (template as any).templatePrompt || template.prompt || '',
      context: (template as any).contextTemplate || template.context || '',
      enableFunctionCalling: template.enableFunctionCalling,
      tags: template.tags && Array.isArray(template.tags) ? template.tags.join(', ') : '',
      modelName: template.modelName || (configurations.length > 0 ? configurations[0].id || '' : ''),
    });
    
    // Populate function selections
    const functionIdsToSelect = template.functionIds || [];
    console.log('🔧 Setting selected functions:', functionIdsToSelect);
    setSelectedFunctions(functionIdsToSelect);
    
    // Populate parameters
    setParameters(template.parameters?.map(param => ({
      name: (param as any).parameterName || param.name,
      description: param.description || '',
      parameterType: param.parameterType || 'string',
      isRequired: param.isRequired || false,
      defaultValue: param.defaultValue || '',
      validationRules: param.validationRules || null,
    })) || []);
    
    // Set edit mode
    setIsViewMode(false);
    setIsEditMode(true);
    setEditingTemplateId(template.id);
    setShowCreateModal(true);
  };

  const renderTemplateCard = (template: ExecutionTemplate) => (
    <View key={template.id} style={styles.templateCard}>
      <View style={styles.templateHeader}>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{template.name}</Text>
          <Text style={styles.templateDescription}>{template.description || 'No description available'}</Text>
        </View>
        <View style={styles.templateActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => executeTemplate(template)}
          >
            <Ionicons name="play-outline" size={20} color="#34C759" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openTokenManager(template)}
          >
            <Ionicons name="key-outline" size={20} color="#34C759" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openTemplateDetails(template)}
          >
            <Ionicons name="eye-outline" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => openTemplateEdit(template)}
          >
            <Ionicons name="pencil-outline" size={20} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteTemplate(template.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.templateMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="cube-outline" size={14} color="#007AFF" />
          <Text style={styles.metaText}>
            {template.modelName || 'No model set'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="settings-outline" size={14} color="#8E8E93" />
          <Text style={styles.metaText}>
            {template.parameters?.length || 0} parameter{template.parameters?.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="code-slash-outline" size={14} color="#34C759" />
          <Text style={styles.metaText}>
            {template.functionIds?.length || 0} function{(template.functionIds?.length || 0) !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="key-outline" size={14} color="#8E8E93" />
          <Text style={styles.metaText}>
            {template.authTokens?.filter(t => t.isActive).length || 0} active token{template.authTokens?.filter(t => t.isActive).length !== 1 ? 's' : ''}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons 
            name={template.enableFunctionCalling ? "flash" : "flash-off"} 
            size={14} 
            color={template.enableFunctionCalling ? "#34C759" : "#8E8E93"} 
          />
          <Text style={styles.metaText}>
            Function calling {template.enableFunctionCalling ? 'enabled' : 'disabled'}
          </Text>
        </View>
      </View>

      {(template.tags?.length || 0) > 0 && (
        <View style={styles.tagsContainer}>
          {template.tags?.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderParameterForm = (param: Omit<TemplateParameter, 'id'>, index: number) => (
    <View key={index} style={styles.parameterForm}>
      <View style={styles.parameterHeader}>
        <Text style={styles.parameterTitle}>{`{{${param.name}}}`}</Text>
        <TouchableOpacity
          style={styles.removeParameterButton}
          onPress={() => removeParameter(index)}
        >
          <Ionicons name="close-circle" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Parameter Name</Text>
        <Text style={styles.inputDescription}>This is automatically detected from your prompt</Text>
                  <TextInput
            style={[styles.input, styles.readOnlyInput]}
            placeholder="Parameter name"
            value={param.name || ''}
            onChangeText={(value) => updateParameter(index, 'name', value)}
            editable={false}
          />
      </View>
      
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description</Text>
        <Text style={styles.inputDescription}>Help users understand what this parameter does</Text>
                  <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="e.g., The customer's full name for personalization"
            value={param.description || ''}
            onChangeText={(value) => updateParameter(index, 'description', value)}
            multiline
            numberOfLines={2}
          />
      </View>
      
      <View style={styles.inputGroup}>
        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>Required Parameter</Text>
            <Text style={styles.switchDescription}>Must be provided when using this template</Text>
          </View>
          <Switch
            value={param.isRequired}
            onValueChange={(value) => updateParameter(index, 'isRequired', value)}
          />
        </View>
      </View>
      
      {!param.isRequired && (
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Default Value</Text>
          <Text style={styles.inputDescription}>Value to use when parameter is not provided</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter default value"
            value={param.defaultValue || ''}
            onChangeText={(value) => updateParameter(index, 'defaultValue', value)}
          />
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading execution templates...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Execution Templates</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.createButtonText}>Create Template</Text>
          </TouchableOpacity>
        </View>
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
            <Ionicons name="document-text-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyTitle}>No Execution Templates</Text>
            <Text style={styles.emptyDescription}>
              Create your first execution template to enable parameterized prompt execution via API.
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.createFirstButtonText}>Create Your First Template</Text>
            </TouchableOpacity>
          </View>
        ) : (
          templates.map(renderTemplateCard)
        )}
      </ScrollView>

      {/* Create Template Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalCloseText}>
                {isViewMode ? 'Close' : 'Cancel'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {isViewMode ? 'View Template' : isEditMode ? 'Edit Execution Template' : 'Create Execution Template'}
            </Text>
            {!isViewMode && (
              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleCreateTemplate}
              >
                <Text style={styles.modalSaveText}>
                  {isEditMode ? 'Update' : 'Create'}
                </Text>
              </TouchableOpacity>
            )}
            {isViewMode && <View style={styles.modalHeaderSpacer} />}
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.helpBanner}>
              <Ionicons name="information-circle" size={20} color="#007AFF" />
              <Text style={styles.helpBannerText}>
                💡 Create  manually or from successful executions, then use them in your applications via API calls for consistent results.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Basic Information</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Template Name *</Text>
                <Text style={styles.inputDescription}>A unique name for your execution template</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Customer Support Response, Content Generator"
                  value={formData.name}
                  onChangeText={(value) => setFormData({...formData, name: value})}
                  editable={!isViewMode}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <Text style={styles.inputDescription}>Brief description of what this template does</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Generates personalized customer support responses"
                  value={formData.description}
                  onChangeText={(value) => setFormData({...formData, description: value})}
                  multiline
                  numberOfLines={2}
                  editable={!isViewMode}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Prompt Template *</Text>
                <Text style={styles.inputDescription}>
                  Use {`{{parameter_name}}`} for dynamic parameters. Parameters will be auto-detected below.
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., Hello {{customer_name}}, thank you for contacting us about {{issue_type}}..."
                  value={formData.prompt}
                  onChangeText={isViewMode ? undefined : handlePromptChange}
                  multiline
                  numberOfLines={4}
                  editable={!isViewMode}
                />
              </View>

              {/* Parameters Section - Moved directly below prompt */}
              {parameters.length > 0 && (
                <View style={styles.parametersSection}>
                  <Text style={styles.parametersSectionTitle}>Template Parameters</Text>
                  <Text style={styles.parametersSectionDescription}>
                    Auto-detected from {'{{}}'} placeholders in your prompt. Add descriptions to help users understand each parameter.
                  </Text>
                  
                  {parameters.map((param, index) => (
                    <View key={index} style={styles.compactParameterCard}>
                      <View style={styles.compactParameterHeader}>
                        <Text style={styles.compactParameterTitle}>{`{{${param.name}}}`}</Text>
                        <TouchableOpacity
                          style={styles.compactRemoveParameterButton}
                          onPress={() => removeParameter(index)}
                        >
                          <Ionicons name="close-circle" size={18} color="#FF3B30" />
                        </TouchableOpacity>
                      </View>
                      
                      <TextInput
                        style={styles.compactInput}
                        placeholder={`Describe the ${param.name} parameter...`}
                        value={param.description || ''}
                        onChangeText={isViewMode ? undefined : (value) => updateParameter(index, 'description', value)}
                        multiline
                        numberOfLines={2}
                        editable={!isViewMode}
                      />
                      
                      <View style={styles.parameterRow}>
                        <View style={styles.parameterTypeContainer}>
                          <Text style={styles.parameterLabel}>Type:</Text>
                          <TouchableOpacity
                            style={styles.typeSelector}
                            onPress={isViewMode ? undefined : () => {/* Could add type selection modal */}}
                            disabled={isViewMode}
                          >
                            <Text style={styles.typeSelectorText}>{param.parameterType}</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <View style={styles.requiredToggle}>
                          <Text style={styles.parameterLabel}>Required:</Text>
                          <Switch
                            value={param.isRequired}
                            onValueChange={isViewMode ? undefined : (value) => updateParameter(index, 'isRequired', value)}
                            trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                            thumbColor="#FFFFFF"
                            disabled={isViewMode}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Configuration</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Context (Optional)</Text>
                <Text style={styles.inputDescription}>Additional context or instructions for the AI</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="e.g., You are a helpful customer support representative..."
                  value={formData.context}
                  onChangeText={(value) => setFormData({...formData, context: value})}
                  multiline
                  numberOfLines={3}
                  editable={!isViewMode}
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>AI Configuration</Text>
                <Text style={styles.inputDescription}>Choose which AI configuration to use for this template</Text>
                <View style={styles.modelSelector}>
                  {configurations.length === 0 ? (
                    <View style={styles.emptyConfigurationsMessage}>
                      <Ionicons name="warning-outline" size={20} color="#FF9500" />
                      <Text style={styles.emptyConfigurationsText}>
                        No configurations available. Please create at least one AI configuration in the Configure tab.
                      </Text>
                    </View>
                  ) : (
                    configurations.map((config) => (
                      <TouchableOpacity
                        key={config.id || Math.random().toString()}
                        style={[
                          styles.modelOption,
                          formData.modelName === (config.id || '') && styles.modelOptionSelected
                        ]}
                        onPress={isViewMode ? undefined : () => setFormData({...formData, modelName: config.id || ''})}
                        disabled={isViewMode}
                      >
                        <View style={styles.modelOptionContent}>
                          <Text style={[
                            styles.modelOptionText,
                            formData.modelName === (config.id || '') && styles.modelOptionTextSelected
                          ]}>
                            {config.variationName || 'Unnamed Configuration'}
                          </Text>
                          <Text style={[
                            styles.modelOptionDescription,
                            formData.modelName === (config.id || '') && styles.modelOptionDescriptionSelected
                          ]}>
                            {config.modelName} • {config.systemPrompt ? config.systemPrompt.substring(0, 50) + '...' : 'No system prompt'}
                          </Text>
                        </View>
                        {formData.modelName === (config.id || '') && (
                          <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                        )}
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              </View>
              
              <View style={styles.inputGroup}>
                <View style={styles.switchRow}>
                  <View style={styles.switchInfo}>
                    <Text style={styles.switchLabel}>Enable Function Calling</Text>
                    <Text style={styles.switchDescription}>Allow the AI to call external functions for enhanced capabilities</Text>
                  </View>
                  <Switch
                    value={formData.enableFunctionCalling}
                    onValueChange={isViewMode ? undefined : (value) => setFormData({...formData, enableFunctionCalling: value})}
                    trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                    disabled={isViewMode}
                  />
                </View>
              </View>

              {formData.enableFunctionCalling && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Functions</Text>
                  <Text style={styles.inputDescription}>Select which functions this template can access when executed</Text>
                  <TouchableOpacity
                    style={[styles.functionSelectorButton, isViewMode && styles.disabledButton]}
                    onPress={isViewMode ? undefined : () => setShowFunctionSelector(true)}
                    disabled={isViewMode}
                  >
                    <View style={styles.functionSelectorContent}>
                      <Ionicons name="code" size={20} color="#007AFF" />
                      <Text style={styles.functionSelectorText}>
                        {selectedFunctions.length === 0 
                          ? 'Select Functions' 
                          : `${selectedFunctions.length} function${selectedFunctions.length > 1 ? 's' : ''} selected`}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tags</Text>
                <Text style={styles.inputDescription}>Comma-separated tags for organization and discovery</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., support, customer-service, automated"
                  value={formData.tags}
                  onChangeText={(value) => setFormData({...formData, tags: value})}
                  editable={!isViewMode}
                />
              </View>
            </View>


          </ScrollView>
        </SafeAreaView>
      </Modal>





      {/* Function Selector Modal */}
      <FunctionSelector
        visible={showFunctionSelector}
        onClose={() => setShowFunctionSelector(false)}
        functions={availableFunctions}
        selectedFunctions={selectedFunctions}
        onSelectionChange={setSelectedFunctions}
        title="Select Functions for Template"
        subtitle="Choose which functions this template can access when executed"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  createFirstButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  templateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  templateActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  templateMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#E5F4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  modalSaveButton: {
    padding: 4,
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalHeaderSpacer: {
    width: 60,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalScrollContent: {
    flexGrow: 1,
  },
  modalKeyboardView: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  readOnlyInput: {
    backgroundColor: '#F8F9FA',
    color: '#8E8E93',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchInfo: {
    flex: 1,
    paddingRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  switchDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
  },
  addParameterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  addParameterText: {
    fontSize: 16,
    color: '#007AFF',
  },
  parameterForm: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  parameterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parameterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  removeParameterButton: {
    padding: 4,
  },

  tokenMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  tokenStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  tokenActive: {
    color: '#34C759',
  },
  tokenInactive: {
    color: '#8E8E93',
  },
  tokenRateLimit: {
    fontSize: 12,
    color: '#8E8E93',
  },
  tokenCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteTokenButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#FEF2F2',
  },
  tokenValueContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  tokenValueLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000',
    lineHeight: 16,
  },
  // Model selector styles
  modelSelector: {
    gap: 8,
  },
  modelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  modelOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  modelOptionContent: {
    flex: 1,
  },
  modelOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  modelOptionTextSelected: {
    color: '#007AFF',
  },
  modelOptionDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  modelOptionDescriptionSelected: {
    color: '#007AFF',
  },
  // Function selection styles
  emptyFunctions: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  emptyFunctionsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyFunctionsSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  functionsList: {
    gap: 8,
  },
  functionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  functionOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  functionOptionContent: {
    flex: 1,
  },
  functionOptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  functionOptionTitleSelected: {
    color: '#007AFF',
  },
  functionOptionDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  functionOptionDescriptionSelected: {
    color: '#007AFF',
  },
  // Template preview styles
  previewContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  previewText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // New styles for reorganized UI
  helpBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  helpBannerContent: {
    marginLeft: 12,
    flex: 1,
  },
  helpBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  helpBannerText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  parametersSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  parametersSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  parametersSectionDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 18,
    marginBottom: 16,
  },
  compactParameterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  compactParameterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactParameterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  compactRemoveParameterButton: {
    padding: 4,
  },
  compactInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    padding: 8,
    fontSize: 14,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
    minHeight: 36,
  },
  parameterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parameterTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  parameterLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    marginRight: 8,
    fontWeight: '500',
  },
  typeSelector: {
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  typeSelectorText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  requiredToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  functionSelectorButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  functionSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  functionSelectorText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
  },

  disabledButton: {
    opacity: 0.5,
  },
  executionStatusContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  executionStatusText: {
    fontSize: 18,
    color: '#007AFF',
    marginBottom: 8,
  },
  executionStatusSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  executionResultsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#34C759',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34C759',
  },
  resultDescription: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  resultConfigName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  resultContent: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  usageInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  usageText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '600',
  },
  // Empty configurations styles
  emptyConfigurationsMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFB300',
  },
  emptyConfigurationsText: {
    fontSize: 14,
    color: '#E65100',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
});

export default ExecutionTemplatesScreen; 