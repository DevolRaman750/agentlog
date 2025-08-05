import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useFormState } from '../context/FormStateContext';
import { useToast } from '../context/ToastContext';
import LoadingScreen from '../components/LoadingScreen';
import { goGentAPI } from '../api/client';
import { secureStorage } from '../utils/secureStorage';
import { backendApiKeys } from '../utils/backendApiKeys';
import { ExecutionResult, APIConfiguration, ComparisonMetric, FunctionDefinition, Agent, FunctionApiKeyRequirements, UserApiKey } from '../types';
import { AlertAPI } from '../components/CustomAlert';
import AgentAvatar from '../components/AgentAvatar';
import ExecutionResultsViewer from '../components/ExecutionResultsViewer';
import TextEditor from '../components/TextEditor';
import ExecutionLoadingIndicator from '../components/ExecutionLoadingIndicator';
import LiveExecutionViewer from '../components/LiveExecutionViewer';
import ModelKeyModal from '../components/ModelKeyModal';
import { webInputStyles } from '../styles/containers';
import { getModelKeyRequirements, areModelKeysConfigured, ModelKeyRequirement } from '../utils/modelKeyUtils';

interface ParameterValue {
  name: string;
  value: string;
  isRequired: boolean;
  description?: string;
}

const ExecuteScreen: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { 
    state, 
    clearReExecutionData, 
    startExecution, 
    updateExecutionProgress, 
    completeExecution, 
    cancelExecution, 
    clearExecutionResult 
  } = useApp();
  const configurations = state.configurations || [];
  const isConnected = state.isConnected;
  const currentExecution = state.currentExecution;
  const { state: formState, updateField } = useFormState();

  // UI state (local to component)
  const [showConfigSelector, setShowConfigSelector] = useState(false);
  const [showFunctionSelector, setShowFunctionSelector] = useState(false);
  const [showExecutionResults, setShowExecutionResults] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [availableFunctions, setAvailableFunctions] = useState<FunctionDefinition[]>([]);
  
  // Model key validation state
  const [backendApiKeys, setBackendApiKeys] = useState<UserApiKey[]>([]);
  const [showModelKeyModal, setShowModelKeyModal] = useState(false);
  const [missingModelKey, setMissingModelKey] = useState<ModelKeyRequirement | null>(null);
  const [pendingConfiguration, setPendingConfiguration] = useState<APIConfiguration | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<{ 
    hasGeminiKey: boolean; 
    hasFunctionKeys: boolean;
    missingServices: string[];
    validationErrors: string[];
  }>({ 
    hasGeminiKey: false, 
    hasFunctionKeys: false,
    missingServices: [],
    validationErrors: []
  });
  
  // Parameter state for template functionality
  const [parameterValues, setParameterValues] = useState<ParameterValue[]>([]);
  const [showParameters, setShowParameters] = useState(false);
  
  // Agent execution state
  const [agentData, setAgentData] = useState<{
    agent: any;
    isAgentExecution: boolean;
    showTooltip: boolean;
  }>({
    agent: null,
    isAgentExecution: false,
    showTooltip: false
  });
  
  // Ref to prevent multiple concurrent API calls
  const isLoadingFunctions = useRef(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Load backend API keys for validation
  const loadBackendApiKeys = useCallback(async () => {
    try {
      const response = await goGentAPI.getApiKeys();
      if (response.success && response.data) {
        setBackendApiKeys(response.data);
      }
    } catch (error) {
      console.error('Error loading backend API keys:', error);
    }
  }, []);

  // Validate model keys for selected configurations
  const validateModelKeys = useCallback((selectedConfigs: APIConfiguration[]): ModelKeyRequirement | null => {
    for (const config of selectedConfigs) {
      const requirements = getModelKeyRequirements(config, backendApiKeys);
      const missingRequirement = requirements.find(req => !req.isConfigured);
      if (missingRequirement) {
        setPendingConfiguration(config);
        return missingRequirement;
      }
    }
    return null;
  }, [backendApiKeys]);

  // Auto-detect parameters from prompt text
  const detectParametersFromPrompt = useCallback((promptText: string) => {
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
  }, []);

  // Update parameter values when prompt changes
  useEffect(() => {
    const detectedParams = detectParametersFromPrompt(formState.prompt || '');
    const currentParamNames = parameterValues.map(p => p.name);
    
    // Keep existing parameter values that are still in the prompt
    const existingParams = parameterValues.filter(p => detectedParams.includes(p.name));
    
    // Add new parameters that were detected but don't exist yet
    const newParams = detectedParams
      .filter(paramName => !currentParamNames.includes(paramName))
      .map(paramName => ({
        name: paramName,
        value: '',
        isRequired: true,
        description: `Value for ${paramName}`,
      }));
    
    // Update parameters list
    const updatedParams = [...existingParams, ...newParams];
    setParameterValues(updatedParams);
    
    // Show parameters section if we have any
    setShowParameters(updatedParams.length > 0);
  }, [formState.prompt, detectParametersFromPrompt]);

  // Update parameter value
  const updateParameterValue = (paramName: string, value: string) => {
    setParameterValues(prev => 
      prev.map(param => 
        param.name === paramName 
          ? { ...param, value }
          : param
      )
    );
  };

  // Template parameters into prompt
  const templatePrompt = useCallback((promptText: string, parameters: ParameterValue[]) => {
    let templatedPrompt = promptText;
    
    parameters.forEach(param => {
      const pattern = new RegExp(`\\{\\{${param.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\}\\}`, 'g');
      templatedPrompt = templatedPrompt.replace(pattern, param.value || '');
    });
    
    return templatedPrompt;
  }, []);

  // Validate parameters before execution
  const validateParameters = useCallback(() => {
    const missingRequired = parameterValues.filter(p => p.isRequired && !p.value.trim());
    
    if (missingRequired.length > 0) {
      AlertAPI.alert(
        'Missing Parameters',
        `Please provide values for: ${missingRequired.map(p => p.name).join(', ')}`,
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
    
    return true;
  }, [parameterValues]);

  // Generate default execution name
  const generateDefaultExecutionName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { 
      month: 'short', 
      day: '2-digit',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false
    });
    return `Execution ${dateStr} ${timeStr}`;
  };

  // Set default execution name if empty
  useEffect(() => {
    if (!formState.executionName || formState.executionName.trim() === '') {
      updateField('executionName', generateDefaultExecutionName());
    }
  }, []);

  // Load API keys on mount and when screen is focused
  useEffect(() => {
    loadBackendApiKeys();
  }, [loadBackendApiKeys]);

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading execution interface..." />;
  }

  // Group functions by functionGroup for the selector
  const groupedFunctions = useMemo(() => {
    const activeFunctions = availableFunctions.filter(func => func.isActive);
    
    if (activeFunctions.length === 0) {
      return [] as Array<{ title: string; data: FunctionDefinition[] }>;
    }
    
    const groups = activeFunctions.reduce((acc, func) => {
      const group = func.functionGroup || 'Other';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(func);
      return acc;
    }, {} as Record<string, FunctionDefinition[]>);

    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [availableFunctions]);

  // Load functions when component mounts and user is authenticated
  useEffect(() => {
    if (user && isAuthenticated && !isLoadingFunctions.current) {
      loadAvailableFunctions();
    }
  }, [user?.id, isAuthenticated]);

  // Check API key status when functions change
  useEffect(() => {
    checkApiKeyStatus();
  }, [formState.selectedFunctions]);

  // Resume polling if there's an active execution when component mounts or user returns
  useEffect(() => {
    if (currentExecution?.isExecuting && currentExecution.executionId) {
      console.log('🔄 Resuming execution polling for:', currentExecution.executionId);
      resumeExecutionPolling(currentExecution.executionId, currentExecution.pollCount);
    }

    // Cleanup polling when component unmounts
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [currentExecution?.isExecuting, currentExecution?.executionId]);

  // Handle re-execution data from HistoryScreen navigation
  useEffect(() => {
    console.log('🕐 Re-execution useEffect triggered:', {
      hasReExecutionData: !!state.reExecutionData,
      reExecutionDataConfigs: state.reExecutionData?.configurations?.length || 0,
      availableFunctionsCount: availableFunctions.length,
      availableConfigurationsCount: configurations.length,
      isConnected: isConnected,
      userId: user?.id
    });
    
    // Wait for BOTH functions AND configurations to be loaded before applying re-execution data
    if (state.reExecutionData && availableFunctions.length > 0 && configurations.length > 0) {
      console.log('🔄 Applying re-execution data:', state.reExecutionData);
      handleReExecute(state.reExecutionData).then(() => {
        clearReExecutionData(); // Clear it after applying to prevent re-application
      });
    } else if (state.reExecutionData) {
      console.log('⏳ Re-execution data available but waiting for:', {
        functionsLoaded: availableFunctions.length > 0,
        configurationsLoaded: configurations.length > 0
      });
    }
  }, [state.reExecutionData, availableFunctions, configurations]); // Added configurations as dependency

  const loadAvailableFunctions = async () => {
    if (isLoadingFunctions.current) return;
    
    try {
      isLoadingFunctions.current = true;
      console.log('📡 Loading available functions...');
      const resp = await goGentAPI.getFunctions();
      
      if (resp.success && resp.data) {
        setAvailableFunctions(resp.data);
        console.log('✅ Functions loaded successfully:', resp.data.length);
      } else {
        console.warn('🟡 Function loading failed:', resp.error);
        setAvailableFunctions([]);
      }
    } catch (err: any) {
      console.warn('🟡 Function loading error:', err.message);
      setAvailableFunctions([]);
    } finally {
      isLoadingFunctions.current = false;
    }
  };

  const loadTemplateFunctions = async (templateId: string) => {
    try {
      console.log('🔧 Loading template functions for templateId:', templateId);
      const templateResponse = await goGentAPI.getTemplates();
      if (templateResponse.success && templateResponse.data?.templates) {
        const template = templateResponse.data.templates.find(t => t.id === templateId);
        if (template && template.functionIds && template.functionIds.length > 0) {
          console.log('📋 Template has functions:', template.functionIds);
          // Set the selected functions from the template
          updateField('selectedFunctions', template.functionIds);
        }
      }
    } catch (error) {
      console.error('Failed to load template functions:', error);
    }
  };

  // Legacy API key status check - replaced by model key validation
  const checkApiKeyStatus = async () => {
    try {
      // Simplified function validation - just check for missing services
      const validation = { missingServices: [], errors: [] };
      
      setApiKeyStatus({
        hasGeminiKey: true, // Now validated per-configuration 
        hasFunctionKeys: validation.missingServices.length === 0,
        missingServices: validation.missingServices,
        validationErrors: validation.errors
      });
      
      console.log('🔐 Function API key status:', {
        hasFunctionKeys: validation.missingServices.length === 0,
        missingServices: validation.missingServices,
        errors: validation.errors
      });
    } catch (error) {
      console.error('Failed to load function API key status:', error);
      setApiKeyStatus({ 
        hasGeminiKey: true, // Now validated per-configuration
        hasFunctionKeys: false,
        missingServices: [],
        validationErrors: ['Failed to validate function API keys']
      });
    }
  };

  const toggleFunctionSelection = (funcId: string) => {
    const currentSelection = formState.selectedFunctions;
    const isSelected = currentSelection.includes(funcId);
    
    const newSelection = isSelected
      ? currentSelection.filter(id => id !== funcId)
      : [...currentSelection, funcId];
    
    updateField('selectedFunctions', newSelection);
  };

  const toggleCategorySelection = (categoryTitle: string) => {
    const categoryFunctions = groupedFunctions.find(group => group.title === categoryTitle)?.data || [];
    const categoryFunctionIds = categoryFunctions.map(func => func.id);
    const currentSelection = formState.selectedFunctions;
    
    // Check if all functions in this category are selected
    const allCategorySelected = categoryFunctionIds.every(id => currentSelection.includes(id));
    
    let newSelection;
    if (allCategorySelected) {
      // Deselect all functions in this category
      newSelection = currentSelection.filter(id => !categoryFunctionIds.includes(id));
    } else {
      // Select all functions in this category
      const functionsToAdd = categoryFunctionIds.filter(id => !currentSelection.includes(id));
      newSelection = [...currentSelection, ...functionsToAdd];
    }
    
    updateField('selectedFunctions', newSelection);
  };

  const handleReExecute = async (reExecutionData: any) => {
    // Check if this is an agent execution
    if (reExecutionData.isAgentExecution && reExecutionData.agentId) {
      try {
        console.log('🤖 Loading agent data for execution:', reExecutionData.agentId);
        const agentResponse = await goGentAPI.getAgent(reExecutionData.agentId);
        if (agentResponse.success && agentResponse.data) {
          setAgentData({
            agent: agentResponse.data,
            isAgentExecution: true,
            showTooltip: false
          });
          
          // If we have a templateId, ensure template functions are loaded
          if (reExecutionData.templateId) {
            await loadTemplateFunctions(reExecutionData.templateId);
          }
        }
      } catch (error) {
        console.error('Failed to load agent data:', error);
      }
    } else {
      // Reset agent data for non-agent executions
      setAgentData({
        agent: null,
        isAgentExecution: false,
        showTooltip: false
      });
    }

    // Update form state with the re-execution data
    updateField('executionName', reExecutionData.executionRunName);
    updateField('description', reExecutionData.description);
    updateField('prompt', reExecutionData.basePrompt);
    updateField('context', reExecutionData.context);
    
    // Find and select the configurations
    console.log('🔧 Configuration selection debug:', {
      reExecutionConfigurations: reExecutionData.configurations,
      availableConfigurations: configurations.map(c => ({ 
        id: c.id, 
        name: c.variationName, 
        userId: c.userId, 
        isSystemResource: c.isSystemResource 
      })),
      availableConfigurationsCount: configurations.length,
      currentUserId: user?.id
    });
    
    const configIds = reExecutionData.configurations
      .map((config: any) => {
        console.log(`🔍 Mapping config "${config.variationName}" (ID: ${config.id}) from re-execution data`);
        const foundConfig = configurations.find(c => c.id === config.id);
        console.log(`   -> Found in current configs: ${foundConfig ? 'YES' : 'NO'}${foundConfig ? ` (${foundConfig.variationName})` : ''}`);
        return config.id;
      })
      .filter((id: string) => {
        const exists = id && configurations.some(c => c.id === id);
        console.log(`   -> Config ID "${id}" exists in current configs: ${exists}`);
        return exists;
      });
    
    console.log('🎯 Final config IDs to select:', configIds);
    console.log('🎯 Total configs available vs selected:', {
      totalAvailable: configurations.length,
      fromReExecution: reExecutionData.configurations.length,
      finalSelected: configIds.length
    });
    
    updateField('selectedConfigs', configIds);
    
    console.log('🔧 Function selection debug:', {
      reExecutionFunctionTools: reExecutionData.functionTools,
      availableFunctions: availableFunctions.map(f => ({ id: f.id, name: f.name })),
      availableFunctionsCount: availableFunctions.length
    });
    
    // Set function selection if any
    if (reExecutionData.functionTools && reExecutionData.functionTools.length > 0) {
      const functionIds = reExecutionData.functionTools
        .map((tool: any) => {
          const foundFunc = availableFunctions.find(f => f.name === tool.name);
          console.log(`🔍 Mapping function "${tool.name}" -> ${foundFunc ? foundFunc.id : 'NOT FOUND'}`);
          return foundFunc?.id;
        })
        .filter((id: string | undefined): id is string => !!id);
      
      console.log('🎯 Final function IDs to select:', functionIds);
      updateField('selectedFunctions', functionIds);
    } else {
      console.log('⚠️ No function tools in re-execution data');
    }
    
    // Close the results viewer
    setShowExecutionResults(false);
    clearExecutionResult();
    
    // Scroll to top to show the form
    console.log('✅ Form populated for re-execution');
  };

  const executeMultiVariant = async () => {
    if (!formState.prompt.trim()) {
      AlertAPI.alert('Error', 'Please enter a prompt');
      return;
    }

    if (formState.selectedConfigs.length === 0) {
      AlertAPI.alert('Error', 'Please select at least one configuration');
      return;
    }

    // Model API key validation is now handled above via validateModelKeys

    if (formState.selectedFunctions.length > 0 && apiKeyStatus.missingServices.length > 0) {
      const missingServiceNames = apiKeyStatus.missingServices.join(', ');
      AlertAPI.alert(
        'Missing API Keys',
        `The selected functions require API keys for: ${missingServiceNames}. Please configure these keys before execution.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go to API Keys', onPress: () => {} }
        ]
      );
      return;
    }

    if (apiKeyStatus.validationErrors.length > 0) {
      AlertAPI.alert(
        'API Key Validation Failed',
        apiKeyStatus.validationErrors.join('\n'),
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    // Validate parameters if any exist
    if (parameterValues.length > 0 && !validateParameters()) {
      return;
    }

    clearExecutionResult();

    try {
      const selectedConfigurations = configurations.filter(config =>
        formState.selectedConfigs.includes(config.id || '')
      );

      // Validate model API keys before execution
      const missingModelKey = validateModelKeys(selectedConfigurations);
      if (missingModelKey) {
        setMissingModelKey(missingModelKey);
        setShowModelKeyModal(true);
        return; // Stop execution until API key is provided
      }

      // Template the prompt with parameter values
      const templatedPrompt = parameterValues.length > 0 
        ? templatePrompt(formState.prompt, parameterValues)
        : formState.prompt;

      const request = {
        executionRunName: formState.executionName || generateDefaultExecutionName(),
        description: formState.description,
        basePrompt: templatedPrompt, // Use templated prompt
        context: formState.context,
        configurations: selectedConfigurations,
        enableFunctionCalling: formState.selectedFunctions.length > 0,
        functionTools: availableFunctions
          .filter(func => formState.selectedFunctions.includes(func.id))
          .map(func => ({
            name: func.name,
            description: func.description,
            parameters: func.parametersSchema || {}
          })),
        comparisonConfig: {
          enabled: formState.comparisonEnabled,
          metrics: formState.selectedMetrics,
        },
        // Include agentId for agent executions
        ...(agentData.isAgentExecution && agentData.agent?.id && {
          agentId: agentData.agent.id
        }),
      };

      console.log('🚀 Starting multi-variant execution with request:', request);
      const response = await goGentAPI.executeMultiVariation(request, formState.functionExecutionMode);

      if (response.success && response.data) {
        const executionId = response.data.executionRun.id;
        startExecution(executionId, 300);
        console.log('✅ Execution started:', executionId);
        pollExecutionStatus(executionId);
      } else {
        throw new Error(response.error || 'Failed to start execution');
      }
    } catch (error) {
      console.error('❌ Execution failed:', error);
      AlertAPI.alert('Error', `Failed to start execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
      cancelExecution();
    }
  };

  const pollExecutionStatus = async (executionId: string) => {
    const maxPolls = 300; // Increased from 60 to 300 (5x longer timeout)
    let polls = 0;

    const poll = async () => {
      if (polls >= maxPolls) {
        cancelExecution();
        AlertAPI.alert('Timeout', 'Execution is taking longer than expected (10+ minutes). Please check the history for results.');
        return;
      }

      try {
        const response = await goGentAPI.getExecutionStatus(executionId);
        updateExecutionProgress(polls + 1);

        if (response.success && response.data) {
          if (response.data.status === 'completed') {
            // Fetch full execution results
            const resultResponse = await goGentAPI.getExecutionRun(executionId);
            if (resultResponse.success && resultResponse.data) {
              completeExecution(resultResponse.data);
              setShowExecutionResults(true);
              console.log('✅ Execution completed successfully');
              return;
            }
          } else if (response.data.status === 'failed') {
            cancelExecution();
            AlertAPI.alert('Error', `Execution failed: ${response.data.error || 'Unknown error'}`);
            return;
          }
        }

        polls++;
        pollingRef.current = setTimeout(poll, 2000);
      } catch (error) {
        console.error('❌ Polling failed:', error);
        cancelExecution();
        AlertAPI.alert('Error', 'Failed to check execution status');
      }
    };

    poll();
  };

  const resumeExecutionPolling = async (executionId: string, currentPolls: number) => {
    const maxPolls = currentExecution?.maxPolls || 300;

    // Clear any existing polling
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
    }

    const poll = async () => {
      if (currentPolls >= maxPolls) {
        cancelExecution();
        AlertAPI.alert('Timeout', 'Execution is taking longer than expected (10+ minutes). Please check the history for results.');
        return;
      }

      try {
        const response = await goGentAPI.getExecutionStatus(executionId);
        updateExecutionProgress(currentPolls + 1);

        if (response.success && response.data) {
          if (response.data.status === 'completed') {
            // Fetch full execution results
            const resultResponse = await goGentAPI.getExecutionRun(executionId);
            if (resultResponse.success && resultResponse.data) {
              completeExecution(resultResponse.data);
              setShowExecutionResults(true);
              console.log('✅ Execution completed successfully (resumed)');
              return;
            }
          } else if (response.data.status === 'failed') {
            cancelExecution();
            AlertAPI.alert('Error', `Execution failed: ${response.data.error || 'Unknown error'}`);
            return;
          }
        }

        currentPolls++;
        pollingRef.current = setTimeout(poll, 2000);
      } catch (error) {
        console.error('❌ Polling failed (resumed):', error);
        cancelExecution();
        AlertAPI.alert('Error', 'Failed to check execution status');
      }
    };

    poll();
  };

  const renderConfigurationSelector = () => (
    <Modal 
      visible={showConfigSelector} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={() => setShowConfigSelector(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowConfigSelector(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select AI Configurations</Text>
          <TouchableOpacity onPress={() => setShowConfigSelector(false)}>
            <Text style={styles.modalSaveButton}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalSubheader}>
          <Text style={styles.modalSubtitle}>
            Choose the AI model configurations to test your prompt against
          </Text>
          <Text style={styles.selectedCount}>
            {formState.selectedConfigs.length} selected
          </Text>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {configurations.map((item) => {
            const isSelected = formState.selectedConfigs.includes(item.id || '');
            return (
              <TouchableOpacity
                key={item.id || Math.random().toString()}
                style={[
                  styles.configCard,
                  isSelected && styles.configCardSelected
                ]}
                onPress={() => {
                  const itemId = item.id || '';
                  const newSelection = isSelected
                    ? formState.selectedConfigs.filter(id => id !== itemId)
                    : [...formState.selectedConfigs, itemId];
                  updateField('selectedConfigs', newSelection);
                }}
              >
                <View style={styles.configHeader}>
                  <View style={styles.configInfo}>
                    <Text style={styles.configDisplayName}>{item.variationName}</Text>
                    <View style={styles.configMeta}>
                      <View style={styles.metaItem}>
                        <Ionicons name="hardware-chip" size={14} color="#007AFF" />
                        <Text style={styles.metaValue}>{item.modelName}</Text>
                      </View>
                      {item.temperature !== undefined && (
                        <View style={styles.metaItem}>
                          <Ionicons name="thermometer" size={14} color="#FF9500" />
                          <Text style={styles.metaValue}>Temp: {item.temperature}</Text>
                        </View>
                      )}
                    </View>
                    {item.systemPrompt && (
                      <Text style={styles.configDescription} numberOfLines={2}>
                        {item.systemPrompt}
                      </Text>
                    )}
                  </View>
                  <View style={[
                    styles.selectionCheckbox,
                    isSelected && styles.selectionCheckboxSelected
                  ]}>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );

  const renderFunctionSelector = () => (
    <Modal 
      visible={showFunctionSelector} 
      animationType="slide" 
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFunctionSelector(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFunctionSelector(false)}>
            <Text style={styles.modalCancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select Functions</Text>
          <TouchableOpacity onPress={() => setShowFunctionSelector(false)}>
            <Text style={styles.modalSaveButton}>Done</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.modalSubheader}>
          <Text style={styles.modalSubtitle}>
            Add AI functions to extend capabilities with external data and services
          </Text>
          <Text style={styles.selectedCount}>
            {formState.selectedFunctions.length} selected
          </Text>
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {groupedFunctions.map((group) => {
            const categoryFunctionIds = group.data.map(func => func.id);
            const selectedInCategory = categoryFunctionIds.filter(id => formState.selectedFunctions.includes(id));
            const allCategorySelected = categoryFunctionIds.length > 0 && selectedInCategory.length === categoryFunctionIds.length;
            const someCategorySelected = selectedInCategory.length > 0 && selectedInCategory.length < categoryFunctionIds.length;
            
            return (
              <View key={group.title} style={styles.functionGroupContainer}>
                <TouchableOpacity
                  style={styles.functionGroupHeader}
                  onPress={() => toggleCategorySelection(group.title)}
                  activeOpacity={0.7}
                >
                  <View style={styles.functionGroupTitleContainer}>
                    <Text style={styles.functionGroupTitle}>{group.title}</Text>
                    <Text style={styles.functionGroupCount}>
                      {selectedInCategory.length}/{categoryFunctionIds.length} selected
                    </Text>
                  </View>
                  <View style={[
                    styles.categorySelectionCheckbox,
                    allCategorySelected && styles.categorySelectionCheckboxSelected,
                    someCategorySelected && styles.categorySelectionCheckboxPartial
                  ]}>
                    {allCategorySelected && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                    {someCategorySelected && (
                      <Ionicons name="remove" size={16} color="#007AFF" />
                    )}
                  </View>
                </TouchableOpacity>
                
                {group.data.map((func) => {
                  const isSelected = formState.selectedFunctions.includes(func.id);
                  return (
                    <TouchableOpacity
                      key={func.id}
                      style={[
                        styles.functionCard,
                        isSelected && styles.functionCardSelected
                      ]}
                      onPress={() => toggleFunctionSelection(func.id)}
                    >
                      <View style={styles.functionHeader}>
                        <View style={styles.functionInfo}>
                          <Text style={styles.functionDisplayName}>{func.displayName || func.name}</Text>
                          <Text style={styles.functionDescription} numberOfLines={2}>
                            {func.description}
                          </Text>
                          {func.requiredApiKeys && func.requiredApiKeys.length > 0 && (
                            <View style={styles.functionMeta}>
                              <View style={styles.metaItem}>
                                <Ionicons name="key" size={14} color="#FF9500" />
                                <Text style={styles.metaValue}>
                                  Requires: {func.requiredApiKeys.join(', ')} API key{func.requiredApiKeys.length > 1 ? 's' : ''}
                                </Text>
                              </View>
                            </View>
                          )}
                        </View>
                        <View style={[
                          styles.selectionCheckbox,
                          isSelected && styles.selectionCheckboxSelected
                        ]}>
                          {isSelected && (
                            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Agent Header - Only show for agent executions */}
        {agentData.isAgentExecution && agentData.agent && (
          <View style={styles.agentHeader}>
            <View style={styles.agentInfo}>
              <AgentAvatar 
                agent={{
                  firstName: agentData.agent.firstName,
                  lastName: agentData.agent.lastName,
                  lifecycleStatus: agentData.agent.lifecycleStatus,
                  templateName: agentData.agent.templateName
                }}
                size="large"
                showStatus={true}
                animated={false}
              />
              <View style={styles.agentDetails}>
                <View style={styles.agentNameContainer}>
                  <Text style={styles.agentName}>
                    {agentData.agent.firstName} {agentData.agent.lastName}
                  </Text>
                  <TouchableOpacity
                    style={styles.tooltipIcon}
                    onPress={() => setAgentData(prev => ({ ...prev, showTooltip: !prev.showTooltip }))}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="information-circle-outline" size={18} color="#007AFF" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.agentSubtitle}>Agent Execution</Text>
                {agentData.agent.templateName && (
                  <Text style={styles.agentTemplate}>
                    Using: {agentData.agent.templateName}
                  </Text>
                )}
              </View>
            </View>
            
            {/* Tooltip */}
            {agentData.showTooltip && (
              <View style={styles.tooltip}>
                <View style={styles.tooltipArrow} />
                <Text style={styles.tooltipText}>
                  This execution is being run on behalf of the agent "{agentData.agent.firstName} {agentData.agent.lastName}". 
                  The prompt and functions have been pre-configured based on the agent's template settings. 
                  You can modify them before running the execution.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Header */}
        <View style={[styles.header, agentData.isAgentExecution && styles.headerCompact]}>
          <Text style={styles.title}>
            {agentData.isAgentExecution ? '🤖 Agent Execution' : '🚀 Execute AI Models'}
          </Text>
          <Text style={styles.subtitle}>
            {agentData.isAgentExecution 
              ? 'Review and modify the agent\'s execution settings before running'
              : 'Run your prompts across multiple AI configurations and compare their responses'
            }
          </Text>
        </View>

        {/* Main Prompt - First and Most Prominent */}
        <View style={[styles.fieldContainer, styles.primaryField]}>
          <View style={styles.labelContainer}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#007AFF" />
            <Text style={[styles.fieldLabel, styles.primaryFieldLabel]}>What do you want the AI to do?</Text>
            <Text style={styles.requiredText}>Required</Text>
          </View>
          <TextEditor
            value={formState.prompt}
            onChangeText={(text) => updateField('prompt', text)}
            placeholder="Write a compelling product description for a sustainable water bottle that highlights its eco-friendly features..."
            minHeight={140}
            maxHeight={400}
            allowFullscreen={true}
            showCharacterCount={true}
            showWordCount={true}
            showLineNumbers={false}
          />
        </View>

        {/* Template Parameters Section - Show when parameters are detected */}
        {showParameters && parameterValues.length > 0 && (
          <View style={[styles.fieldContainer, styles.parametersField]}>
            <View style={styles.labelContainer}>
              <Ionicons name="code-slash" size={18} color="#FF9500" />
              <Text style={[styles.fieldLabel, styles.parametersFieldLabel]}>Template Parameters</Text>
              <View style={styles.parameterBadge}>
                <Text style={styles.parameterBadgeText}>{parameterValues.length}</Text>
              </View>
            </View>
            <Text style={styles.parametersDescription}>
              Your prompt contains parameters. Please provide values below:
            </Text>
            
            <View style={styles.parametersContainer}>
              {parameterValues.map((param, index) => (
                <View key={param.name} style={styles.parameterInputContainer}>
                  <View style={styles.parameterHeader}>
                    <Text style={styles.parameterName}>{`{{${param.name}}}`}</Text>
                    {param.isRequired && (
                      <Text style={styles.parameterRequired}>Required</Text>
                    )}
                  </View>
                  
                  <TextInput
                    style={styles.parameterInput}
                    value={param.value}
                    onChangeText={(value) => updateParameterValue(param.name, value)}
                    placeholder={`Enter value for ${param.name}...`}
                    placeholderTextColor="#8E8E93"
                    multiline={param.value.length > 50}
                    numberOfLines={param.value.length > 50 ? 3 : 1}
                  />
                  
                  {param.description && (
                    <Text style={styles.parameterDescription}>{param.description}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Optional Details Section - Collapsible */}
        <View style={styles.optionalSection}>
          <TouchableOpacity
            style={styles.optionalHeader}
            onPress={() => setShowOptionalFields(!showOptionalFields)}
            activeOpacity={0.7}
          >
            <View style={styles.optionalHeaderLeft}>
              <Ionicons name="options" size={16} color="#8E8E93" />
              <Text style={styles.optionalHeaderText}>Optional Details</Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalBadgeText}>
                  {[
                    formState.executionName?.trim() && 'Name',
                    formState.description?.trim() && 'Description', 
                    formState.context?.trim() && 'Context'
                  ].filter(Boolean).length || 0}
                </Text>
              </View>
            </View>
            <Ionicons 
              name={showOptionalFields ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#8E8E93" 
            />
          </TouchableOpacity>

          {showOptionalFields && (
            <View style={styles.optionalFields}>
              {/* Execution Name */}
              <View style={styles.compactFieldContainer}>
                <View style={styles.compactLabelContainer}>
                  <Ionicons name="bookmark" size={14} color="#007AFF" />
                  <Text style={styles.compactFieldLabel}>Execution Name</Text>
                </View>
                <TextInput
                  style={styles.compactInput}
                  value={formState.executionName}
                  onChangeText={(text) => updateField('executionName', text)}
                  placeholder={generateDefaultExecutionName()}
                  placeholderTextColor="#8E8E93"
                />
              </View>

              {/* Description */}
              <View style={styles.compactFieldContainer}>
                <TextEditor
                  label="📝 Description"
                  value={formState.description}
                  onChangeText={(text) => updateField('description', text)}
                  placeholder="Notes about this execution..."
                  minHeight={80}
                  maxHeight={200}
                  allowFullscreen={true}
                  showCharacterCount={false}
                  showWordCount={false}
                  showLineNumbers={false}
                />
              </View>

              {/* Additional Context */}
              <View style={styles.compactFieldContainer}>
                <TextEditor
                  label="ℹ️ Additional Context"
                  value={formState.context}
                  onChangeText={(text) => updateField('context', text)}
                  placeholder="Target audience, tone, constraints, etc..."
                  minHeight={100}
                  maxHeight={250}
                  allowFullscreen={true}
                  showCharacterCount={true}
                  showWordCount={false}
                  showLineNumbers={false}
                />
              </View>
            </View>
          )}
        </View>

        {/* Configuration Selection */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Ionicons name="settings" size={16} color="#007AFF" />
            <Text style={styles.fieldLabel}>AI Configurations</Text>
            <Text style={styles.requiredText}>Required</Text>
          </View>
          <Text style={styles.fieldDescription}>
            Choose which AI model configurations to test. Each configuration may use different models, temperature settings, or system prompts.
          </Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowConfigSelector(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorLeft}>
                <Ionicons name="hardware-chip" size={20} color="#007AFF" />
                <Text style={styles.selectorText}>
                  {formState.selectedConfigs.length > 0
                    ? `${formState.selectedConfigs.length} configuration${formState.selectedConfigs.length > 1 ? 's' : ''} selected`
                    : 'Tap to select AI configurations'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Function Selection */}
        <View style={styles.fieldContainer}>
          <View style={styles.labelContainer}>
            <Ionicons name="extension-puzzle" size={16} color="#007AFF" />
            <Text style={styles.fieldLabel}>AI Functions</Text>
            <Text style={styles.optionalText}>Optional</Text>
          </View>
          <Text style={styles.fieldDescription}>
            Enable AI functions to access external services like web search, databases, or APIs during execution
          </Text>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowFunctionSelector(true)}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorLeft}>
                <Ionicons name="extension-puzzle" size={20} color="#007AFF" />
                <Text style={styles.selectorText}>
                  {formState.selectedFunctions.length > 0
                    ? `${formState.selectedFunctions.length} function${formState.selectedFunctions.length > 1 ? 's' : ''} selected`
                    : 'Tap to select AI functions'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Execute Button */}
        <View style={styles.executeContainer}>
          {currentExecution?.isExecuting ? (
            <LiveExecutionViewer
              executionId={currentExecution.executionId || ''}
              progress={currentExecution.pollCount}
              maxProgress={currentExecution.maxPolls}
              onCancel={cancelExecution}
              isExecuting={currentExecution.isExecuting}
            />
          ) : (
            <TouchableOpacity
              style={[styles.executeButton, (!isConnected || currentExecution?.isExecuting) && styles.executeButtonDisabled]}
              onPress={executeMultiVariant}
              disabled={!isConnected || currentExecution?.isExecuting}
            >
              <View style={styles.executeContent}>
                <Ionicons name="rocket" size={24} color="#FFFFFF" />
                <Text style={styles.executeButtonText}>Run Execution</Text>
              </View>
            </TouchableOpacity>
          )}
          
          <Text style={styles.executeDescription}>
            This will run your prompt across all selected AI configurations and provide comparison results
          </Text>
        </View>

        {/* Execution Complete Success Message */}
        {currentExecution?.executionResult && !showExecutionResults && (
          <View style={styles.resultContainer}>
            <View style={styles.resultHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#34C759" />
              <Text style={styles.resultTitle}>Execution Complete!</Text>
            </View>
            <Text style={styles.resultText}>
              Your execution has finished successfully.
            </Text>
            <TouchableOpacity
              style={styles.viewResultsButton}
              onPress={() => setShowExecutionResults(true)}
            >
              <Ionicons name="eye" size={20} color="#FFFFFF" />
              <Text style={styles.viewResultsButtonText}>View Full Results</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      {renderConfigurationSelector()}
      {renderFunctionSelector()}
      
      {/* Model Key Modal */}
      {missingModelKey && pendingConfiguration && (
        <ModelKeyModal
          visible={showModelKeyModal}
          onClose={() => {
            setShowModelKeyModal(false);
            setMissingModelKey(null);
            setPendingConfiguration(null);
          }}
          onSuccess={() => {
            setShowModelKeyModal(false);
            setMissingModelKey(null);
            setPendingConfiguration(null);
            // Reload API keys and retry execution
            loadBackendApiKeys().then(() => {
              // Trigger execution again after key is saved
              setTimeout(() => {
                handleReExecute({});
              }, 500);
            });
          }}
          requirement={missingModelKey}
          configurationName={pendingConfiguration.variationName}
        />
      )}
      
      {/* Full Execution Results Viewer */}
      {currentExecution?.executionResult && showExecutionResults && (
        <ExecutionResultsViewer
          executionResult={currentExecution.executionResult}
          visible={showExecutionResults}
          onClose={() => setShowExecutionResults(false)}
          onReExecute={handleReExecute}
          showReExecuteButton={true}
          embedded={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
    padding: 16,
    paddingBottom: 120, // Extra space for tab bar and execute button on mobile
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    lineHeight: 22,
  },
  fieldContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
     optionalText: {
     fontSize: 14,
     color: '#6B6B6B',
     marginLeft: 8,
     paddingHorizontal: 6,
     paddingVertical: 2,
     backgroundColor: '#F8F9FA',
     borderRadius: 4,
   },
   requiredText: {
     fontSize: 14,
     color: '#FF3B30',
     marginLeft: 8,
     paddingHorizontal: 6,
     paddingVertical: 2,
     backgroundColor: '#FFF5F5',
     borderRadius: 4,
     fontWeight: '500',
   },
  fieldDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  mainPrompt: {
    minHeight: 120, // Minimum height for the main prompt, allowing growth
  },
  selectorButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  executeContainer: {
    marginTop: 20,
    marginBottom: 40, // Extra margin for mobile scrolling
  },
  executingContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  executeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  executeButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  executeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  executeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  executeDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  resultContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D7D32',
    marginLeft: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#2D7D32',
    marginBottom: 16,
  },
  viewResultsButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  viewResultsButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
     modalContainer: {
     flex: 1,
     backgroundColor: '#F2F2F7',
   },
   modalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 20,
     backgroundColor: '#FFFFFF',
     borderBottomWidth: 1,
     borderBottomColor: '#E5E5EA',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.1,
     shadowRadius: 3,
     elevation: 3,
   },
   modalTitle: {
     fontSize: 20,
     fontWeight: '700',
     color: '#000000',
   },
   modalCancelButton: {
     fontSize: 17,
     color: '#8E8E93',
     fontWeight: '500',
   },
   modalSaveButton: {
     fontSize: 17,
     color: '#007AFF',
     fontWeight: '700',
   },
   modalContent: {
     flex: 1,
     padding: 16,
   },
   modalSubheader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 16,
     paddingHorizontal: 4,
   },
   modalSubtitle: {
     fontSize: 14,
     color: '#6B6B6B',
     lineHeight: 20,
     flex: 1,
   },
   selectedCount: {
     fontSize: 14,
     fontWeight: '600',
     color: '#007AFF',
   },
   configCard: {
     backgroundColor: '#FFFFFF',
     borderRadius: 12,
     padding: 16,
     marginBottom: 12,
     borderWidth: 1,
     borderColor: '#E5E5EA',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.05,
     shadowRadius: 2,
     elevation: 1,
   },
   configCardSelected: {
     borderColor: '#007AFF',
     borderWidth: 2,
     shadowColor: '#007AFF',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   configHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
   },
   configInfo: {
     flex: 1,
     marginRight: 12,
   },
   configDisplayName: {
     fontSize: 18,
     fontWeight: '600',
     color: '#000000',
     marginBottom: 8,
   },
   configMeta: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 12,
     marginBottom: 8,
   },
   metaItem: {
     flexDirection: 'row',
     alignItems: 'center',
     gap: 4,
   },
   metaValue: {
     fontSize: 12,
     color: '#000000',
     fontWeight: '600',
   },
   configDescription: {
     fontSize: 14,
     color: '#8E8E93',
     lineHeight: 20,
   },
   selectionCheckbox: {
     width: 28,
     height: 28,
     borderRadius: 8,
     borderWidth: 2,
     borderColor: '#E5E5EA',
     justifyContent: 'center',
     alignItems: 'center',
     backgroundColor: '#FFFFFF',
   },
   selectionCheckboxSelected: {
     backgroundColor: '#007AFF',
     borderColor: '#007AFF',
   },
   functionCard: {
     backgroundColor: '#FFFFFF',
     borderRadius: 12,
     padding: 16,
     marginBottom: 12,
     borderWidth: 1,
     borderColor: '#E5E5EA',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.05,
     shadowRadius: 2,
     elevation: 1,
   },
   functionCardSelected: {
     borderColor: '#34C759',
     borderWidth: 2,
     shadowColor: '#34C759',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.1,
     shadowRadius: 4,
     elevation: 3,
   },
   functionHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'flex-start',
   },
   functionInfo: {
     flex: 1,
     marginRight: 12,
   },
   functionDisplayName: {
     fontSize: 18,
     fontWeight: '600',
     color: '#000000',
     marginBottom: 4,
   },
   functionDescription: {
     fontSize: 14,
     color: '#8E8E93',
     lineHeight: 20,
     marginBottom: 8,
   },
   functionMeta: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 16,
   },
   functionGroupContainer: {
     marginBottom: 24,
   },
         functionGroupTitle: {
   fontSize: 16,
   fontWeight: '600',
   color: '#000000',
 },
  // Primary prompt styles
  primaryField: {
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryFieldLabel: {
    fontSize: 18,
    fontWeight: '700',
  },
  primaryPrompt: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 140,
  },
  // Template parameters styles
  parametersField: {
    borderWidth: 2,
    borderColor: '#FF9500',
    shadowColor: '#FF9500',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  parametersFieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  parameterBadge: {
    backgroundColor: '#FFF0E0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  parameterBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF9500',
  },
  parametersDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 18,
    marginBottom: 16,
  },
  parametersContainer: {
    gap: 12,
  },
  parameterInputContainer: {
    backgroundColor: '#FFF8F0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FFE4B8',
  },
  parameterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  parameterName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  parameterRequired: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '500',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  parameterInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    minHeight: 44,
  },
  parameterDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
    fontStyle: 'italic',
  },
  // Optional section styles
  optionalSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  optionalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
  },
  optionalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionalHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B6B6B',
    marginLeft: 8,
  },
  optionalBadge: {
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  optionalBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6B6B',
  },
  optionalFields: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  // Compact field styles
  compactFieldContainer: {
    marginBottom: 16,
  },
  compactLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  compactFieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 6,
  },
  compactInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...webInputStyles,
  },
  compactTextArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  // Category selection styles
  functionGroupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  functionGroupTitleContainer: {
    flex: 1,
  },
  functionGroupCount: {
    fontSize: 12,
    color: '#6B6B6B',
    marginTop: 2,
    fontWeight: '500',
  },
  categorySelectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  categorySelectionCheckboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  categorySelectionCheckboxPartial: {
    backgroundColor: '#FFFFFF',
    borderColor: '#007AFF',
  },
  // Agent header styles
  agentHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentDetails: {
    marginLeft: 16,
    flex: 1,
  },
  agentNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  tooltipIcon: {
    marginLeft: 8,
    padding: 4,
  },
  agentSubtitle: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 2,
  },
  agentTemplate: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 4,
  },
  tooltip: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    position: 'relative',
  },
  tooltipArrow: {
    position: 'absolute',
    top: -6,
    right: 20,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#F8F9FA',
  },
  tooltipText: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  headerCompact: {
    marginBottom: 16,
  },
});

export default ExecuteScreen; 