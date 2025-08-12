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
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
// Conditional haptics import - fallback if not available
let Haptics: any = null;
try {
  Haptics = require('expo-haptics');
} catch (e) {
  // expo-haptics not available, will use fallback
}
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useFormState } from '../context/FormStateContext';
import { useToast } from '../context/ToastContext';
import LoadingScreen from '../components/LoadingScreen';
import { goGentAPI } from '../api/client';
import { secureStorage } from '../utils/secureStorage';
import { backendApiKeys } from '../utils/backendApiKeys';
import { ExecutionResult, APIConfiguration, ComparisonMetric, FunctionDefinition, Agent, FunctionApiKeyRequirements, UserApiKey, Team } from '../types';
import { AlertAPI } from '../components/CustomAlert';
import AgentAvatar from '../components/AgentAvatar';
import ExecutionResultsViewer from '../components/ExecutionResultsViewer';
import EnhancedTextEditor from '../components/EnhancedTextEditor';
import ExecutionLoadingIndicator from '../components/ExecutionLoadingIndicator';
import LiveExecutionViewer from '../components/LiveExecutionViewer';
import ModelKeyModal from '../components/ModelKeyModal';
import ExecutionTags from '../components/ExecutionTags';
import ConfigurationModal from '../components/ConfigurationModal';
import FunctionsModal from '../components/FunctionsModal';
import OtherOptionsModal from '../components/OtherOptionsModal';
import { webInputStyles } from '../styles/containers';
import { getModelKeyRequirements, areModelKeysConfigured, ModelKeyRequirement } from '../utils/modelKeyUtils';
import ScreenContainer from '../components/ScreenContainer';

interface ParameterValue {
  name: string;
  value: string;
  isRequired: boolean;
  description?: string;
}

// Execution mode types
type ExecutionMode = 'agent' | 'template' | 'experiment';

interface ExecutionModeInfo {
  mode: ExecutionMode;
  title: string;
  description: string;
  icon: string;
  color: string;
  allowMultipleConfigs: boolean;
}

const ExecuteScreen: React.FC = () => {
  const navigation = useNavigation();
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

  // Screen dimensions for responsive design
  const { width: screenWidth } = Dimensions.get('window');
  const isSmallScreen = screenWidth < 375; // iPhone SE and smaller
  const isMobileScreen = screenWidth < 768; // Mobile vs tablet/desktop

  // Execution modes configuration
  const EXECUTION_MODES: ExecutionModeInfo[] = [
    {
      mode: 'agent',
      title: 'Agent Execution',
      description: 'Execute with a specific Agent - all activity tracked within the agent',
      icon: 'person-circle',
      color: '#007AFF',
      allowMultipleConfigs: false
    },
    {
      mode: 'template',
      title: 'Template Execution',
      description: 'Execute a specific template with predefined prompt and settings',
      icon: 'document-text',
      color: '#1976D2',
      allowMultipleConfigs: false
    },
    {
      mode: 'experiment',
      title: 'Experiment Mode',
      description: 'Compare responses across multiple AI configurations',
      icon: 'flask',
      color: '#FF9500',
      allowMultipleConfigs: true
    }
  ];

  // Execution mode state
  const [currentExecutionMode, setCurrentExecutionMode] = useState<ExecutionMode>('experiment');
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [availableTeams, setAvailableTeams] = useState<Team[]>([]);
  const [availableTemplates, setAvailableTemplates] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [showModeTooltip, setShowModeTooltip] = useState<boolean>(false);
  const [showAgentSelector, setShowAgentSelector] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [autoConfigStatus, setAutoConfigStatus] = useState<string | null>(null);

  // UI state (local to component)
  const [showConfigurationModal, setShowConfigurationModal] = useState(false);
  const [showFunctionsModal, setShowFunctionsModal] = useState(false);
  const [showOtherOptionsModal, setShowOtherOptionsModal] = useState(false);
  const [showExecutionResults, setShowExecutionResults] = useState(false);
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
  
  // Template/Agent execution state
  const [templateExecutionData, setTemplateExecutionData] = useState<{
    isTemplateExecution: boolean;
    isAgentExecution: boolean;
    templateId?: string;
    templateParameters?: any[];
    originalPrompt?: string;
  }>({ 
    isTemplateExecution: false, 
    isAgentExecution: false 
  });
  
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
  
  // Animation refs for execution feedback
  const executeButtonScale = useRef(new Animated.Value(1)).current;
  const executeButtonOpacity = useRef(new Animated.Value(1)).current;
  const executionFeedbackOpacity = useRef(new Animated.Value(0)).current;
  const executionFeedbackScale = useRef(new Animated.Value(0.8)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [showExecutionFeedback, setShowExecutionFeedback] = useState(false);

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

  // Load available agents, teams, and templates for mode detection
  const loadAgentsTeamsAndTemplates = useCallback(async () => {
    try {
      const [agentsResponse, teamsResponse, templatesResponse] = await Promise.all([
        goGentAPI.getAgents(),
        goGentAPI.getTeams(),
        goGentAPI.getTemplates()
      ]);

      if (agentsResponse.success && agentsResponse.data) {
        setAvailableAgents(agentsResponse.data);
      }

      if (teamsResponse.success && teamsResponse.data) {
        setAvailableTeams(teamsResponse.data);
      }

      if (templatesResponse.success && templatesResponse.data?.templates) {
        setAvailableTemplates(templatesResponse.data.templates);
      }
    } catch (error) {
      console.error('Error loading agents, teams, and templates:', error);
    }
  }, []);

  // Check if user has agents/teams to determine available modes
  const hasAgentsOrTeams = useMemo(() => {
    return availableAgents.length > 0 || availableTeams.length > 0;
  }, [availableAgents, availableTeams]);

  // Get current mode info
  const currentModeInfo = useMemo(() => {
    return EXECUTION_MODES.find(mode => mode.mode === currentExecutionMode) || EXECUTION_MODES[2]; // Default to experiment
  }, [currentExecutionMode]);

  // Handle mode switching
  const handleModeSwitch = (newMode: ExecutionMode) => {
    if (newMode === currentExecutionMode) return;

    // Reset relevant state when switching modes
    setCurrentExecutionMode(newMode);
    setSelectedAgent(null);
    setSelectedTemplate(null);
    
    // Reset configurations based on mode constraints
    if (!EXECUTION_MODES.find(m => m.mode === newMode)?.allowMultipleConfigs) {
      // For agent/template mode, limit to single config
      if (formState.selectedConfigs.length > 1) {
        updateField('selectedConfigs', formState.selectedConfigs.slice(0, 1));
      }
    }

    // Clear template/agent specific data when not in those modes
    if (newMode !== 'template') {
      setTemplateExecutionData({
        isTemplateExecution: false,
        isAgentExecution: false
      });
    }
    
    if (newMode !== 'agent') {
      setAgentData({
        agent: null,
        isAgentExecution: false,
        showTooltip: false
      });
    }

    // Reset prompt if switching away from template mode
    if (currentExecutionMode === 'template' && newMode !== 'template') {
      updateField('prompt', '');
      updateField('context', '');
    }
  };

  // Validate configuration selection based on current mode
  const validateConfigurationSelection = useCallback((selectedConfigs: string[]) => {
    if (!currentModeInfo.allowMultipleConfigs && selectedConfigs.length > 1) {
      AlertAPI.alert(
        'Configuration Limit',
        `${currentModeInfo.title} mode only allows one configuration. Please select a single configuration.`,
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
    return true;
  }, [currentModeInfo]);

  // Enhanced cost warning for experiment mode
  const showCostWarningIfNeeded = useCallback((selectedConfigs: string[]) => {
    if (currentExecutionMode === 'experiment' && selectedConfigs.length > 1) {
      AlertAPI.alert(
        'Multiple Configuration Execution',
        `You have selected ${selectedConfigs.length} configurations. This will run ${selectedConfigs.length} separate executions and may incur additional costs. Continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Continue', style: 'default', onPress: () => {} }
        ]
      );
    }
  }, [currentExecutionMode]);

  // Auto-configure agent settings
  const configureAgentSettings = useCallback(async (agent: Agent) => {
    try {
      console.log('🤖 Auto-configuring agent settings for:', agent.firstName, agent.lastName);
      console.log('📋 Agent full data:', JSON.stringify(agent, null, 2));
      console.log('📋 Available templates:', availableTemplates.map(t => ({ id: t.id, name: t.name })));
      console.log('🔍 Looking for templateId:', agent.templateId);
      
      setAutoConfigStatus(`Configuring ${agent.firstName} ${agent.lastName}...`);
      
      // If agent has a template, load and configure the template
      if (agent.templateId) {
        console.log('📋 Loading template for agent:', agent.templateId);
        
        // Try to find the template by ID first
        let agentTemplate = availableTemplates.find(t => t.id === agent.templateId);
        console.log('🔍 Template search by ID result:', agentTemplate ? `Found: ${agentTemplate.name}` : 'Not found');
        
        // If not found by ID, try to match by templateName from agent data
        if (!agentTemplate && agent.templateName) {
          console.log('🔍 Trying to match by templateName:', agent.templateName);
          console.log('🔍 Available template names for matching:', availableTemplates.map(t => t.name));
          
          agentTemplate = availableTemplates.find(t => {
            const templateName = t.name.toLowerCase();
            const agentTemplateName = agent.templateName!.toLowerCase();
            
            return templateName === agentTemplateName || 
                   templateName.includes(agentTemplateName) ||
                   agentTemplateName.includes(templateName) ||
                   // Try matching key words
                   (agentTemplateName.includes('intern') && templateName.includes('intern')) ||
                   (agentTemplateName.includes('software') && templateName.includes('software')) ||
                   (agentTemplateName.includes('engineer') && templateName.includes('engineer'));
          });
          console.log('🔍 Template search by name result:', agentTemplate ? `Found: ${agentTemplate.name}` : 'Not found');
        }
        
        if (agentTemplate) {
          console.log('✅ Found agent template:', agentTemplate.name);
          
          // Configure template settings
          await configureTemplateSettings(agentTemplate);
          
          // Set agent execution data
          setAgentData({
            agent: agent,
            isAgentExecution: true,
            showTooltip: false
          });
          
          setAutoConfigStatus(`✅ Agent ${agent.firstName} configured with ${agentTemplate.name}`);
        } else {
          console.warn('⚠️ Agent template not found in available templates');
          console.warn('🔍 Available template IDs:', availableTemplates.map(t => t.id));
          console.warn('🔍 Looking for ID:', agent.templateId);
          setAutoConfigStatus('Loading agent template...');
          
          // Try to load template separately if not in current list
          console.log('🔄 Trying to load templates via API...');
          const templateResponse = await goGentAPI.getTemplates();
          console.log('📡 Template API response:', templateResponse.success ? 'Success' : 'Failed');
          
          if (templateResponse.success && templateResponse.data?.templates) {
            console.log('📋 Templates from API:', templateResponse.data.templates.map(t => ({ id: t.id, name: t.name })));
            
            // Try to find by ID first
            let foundTemplate = templateResponse.data.templates.find(t => t.id === agent.templateId);
            console.log('🔍 Found template via API by ID:', foundTemplate ? `Yes: ${foundTemplate.name}` : 'No');
            
            // If not found by ID, try by name
            if (!foundTemplate && agent.templateName) {
              console.log('🔍 Trying API search by templateName:', agent.templateName);
              console.log('🔍 API template names for matching:', templateResponse.data.templates.map(t => t.name));
              
              foundTemplate = templateResponse.data.templates.find(t => {
                const templateName = t.name.toLowerCase();
                const agentTemplateName = agent.templateName!.toLowerCase();
                
                return templateName === agentTemplateName || 
                       templateName.includes(agentTemplateName) ||
                       agentTemplateName.includes(templateName) ||
                       // Try matching key words
                       (agentTemplateName.includes('intern') && templateName.includes('intern')) ||
                       (agentTemplateName.includes('software') && templateName.includes('software')) ||
                       (agentTemplateName.includes('engineer') && templateName.includes('engineer'));
              });
              console.log('🔍 Found template via API by name:', foundTemplate ? `Yes: ${foundTemplate.name}` : 'No');
            }
            
            if (foundTemplate) {
              console.log('✅ Found agent template via API:', foundTemplate.name);
              // Update available templates cache
              setAvailableTemplates(templateResponse.data.templates);
              await configureTemplateSettings(foundTemplate);
              setAutoConfigStatus(`✅ Agent ${agent.firstName} configured with ${foundTemplate.name}`);
            } else {
              console.error('❌ Template not found even via API');
              console.error('🔍 Agent templateId:', agent.templateId);
              console.error('🔍 Agent templateName:', agent.templateName);
              console.error('🔍 Available template names:', templateResponse.data.templates.map(t => t.name));
              
              // Show available templates as a hint
              const templateNames = templateResponse.data.templates.map(t => t.name).join(', ');
              setAutoConfigStatus(`⚠️ Template "${agent.templateName}" not found. Available: ${templateNames}`);
              // Longer timeout for this informative message
              setTimeout(() => setAutoConfigStatus(null), 8000);
            }
          } else {
            console.error('❌ Failed to load templates via API');
            setAutoConfigStatus('⚠️ Failed to load templates');
          }
        }
      } else {
        console.log('📝 Agent has no templateId');
        setAutoConfigStatus(`✅ Agent ${agent.firstName} selected (no template)`);
        // Clear status after 3 seconds for successful cases
        setTimeout(() => setAutoConfigStatus(null), 3000);
      }
    } catch (error) {
      console.error('❌ Failed to configure agent settings:', error);
      setAutoConfigStatus('❌ Failed to configure agent');
      setTimeout(() => setAutoConfigStatus(null), 3000);
    }
  }, [availableTemplates]);

  // Auto-configure template settings
  const configureTemplateSettings = useCallback(async (template: any) => {
    try {
      console.log('📋 Auto-configuring template settings for:', template.name);
      
      if (currentExecutionMode !== 'agent') {
        setAutoConfigStatus(`Configuring template ${template.name}...`);
      }
      
      // Set template execution data
      setTemplateExecutionData({
        isTemplateExecution: true,
        isAgentExecution: currentExecutionMode === 'agent',
        templateId: template.id,
        templateParameters: template.parameters || [],
        originalPrompt: template.templatePrompt || template.prompt
      });
      
      // Update form with template data
      updateField('prompt', template.templatePrompt || template.prompt || '');
      if (template.context || template.contextTemplate) {
        updateField('context', template.context || template.contextTemplate || '');
      }
      
      // Configure template functions if available
      if (template.functionIds && template.functionIds.length > 0) {
        console.log('🔧 Configuring template functions:', template.functionIds);
        console.log('🔧 Available functions:', availableFunctions.map(f => ({ id: f.id, name: f.name })));
        updateField('selectedFunctions', template.functionIds);
        console.log('✅ Functions configured');
      } else {
        console.log('📝 No template functions to configure');
      }
      
      // Configure preferred configuration if available
      if (template.preferredConfigurationId) {
        console.log('⚙️ Configuring preferred configuration:', template.preferredConfigurationId);
        console.log('⚙️ Available configurations:', configurations.map(c => ({ id: c.id, name: c.variationName })));
        
        // Check if the preferred configuration exists in available configurations
        const preferredConfig = configurations.find(c => c.id === template.preferredConfigurationId);
        if (preferredConfig) {
          console.log('✅ Found preferred configuration:', preferredConfig.variationName);
          updateField('selectedConfigs', [template.preferredConfigurationId]);
          console.log('✅ Configuration set to:', template.preferredConfigurationId);
        } else {
          console.warn('⚠️ Preferred configuration not found, using default');
          console.warn('🔍 Available config IDs:', configurations.map(c => c.id));
          console.warn('🔍 Looking for ID:', template.preferredConfigurationId);
          // Fallback to first available configuration for single-config modes
          if (configurations.length > 0) {
            updateField('selectedConfigs', [configurations[0].id!]);
            console.log('✅ Fallback configuration set to:', configurations[0].id);
          }
        }
      } else {
        console.log('📝 No preferred configuration, using default');
        // Fallback to first available configuration for single-config modes
        if (configurations.length > 0) {
          updateField('selectedConfigs', [configurations[0].id!]);
          console.log('✅ Default configuration set to:', configurations[0].id);
        } else {
          console.warn('⚠️ No configurations available');
        }
      }
      
      if (currentExecutionMode !== 'agent') {
        setAutoConfigStatus(`✅ Template ${template.name} configured`);
        setTimeout(() => setAutoConfigStatus(null), 3000);
      }
      
      console.log('✅ Template settings configured successfully');
    } catch (error) {
      console.error('❌ Failed to configure template settings:', error);
      if (currentExecutionMode !== 'agent') {
        setAutoConfigStatus('❌ Failed to configure template');
        setTimeout(() => setAutoConfigStatus(null), 3000);
      }
    }
  }, [configurations, currentExecutionMode, availableFunctions]);

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

  // Update parameter values when prompt changes or template data is set
  useEffect(() => {
    if (templateExecutionData.isTemplateExecution || templateExecutionData.isAgentExecution) {
      // For template/agent executions, use template parameters
      if (templateExecutionData.templateParameters && templateExecutionData.templateParameters.length > 0) {
        const templateParams = templateExecutionData.templateParameters.map(param => ({
          name: param.name || param.parameter_name || '',
          value: param.defaultValue || param.default_value || '',
          isRequired: param.isRequired ?? param.is_required ?? true,
          description: param.description || `Template parameter: ${param.name || param.parameter_name}`,
        }));
        setParameterValues(templateParams);
        setShowParameters(templateParams.length > 0);
      } else {
        // Detect parameters from the original template prompt
        const detectedParams = detectParametersFromPrompt(templateExecutionData.originalPrompt || formState.prompt || '');
        const newParams = detectedParams.map(paramName => ({
          name: paramName,
          value: '',
          isRequired: true,
          description: `Template parameter: ${paramName}`,
        }));
        setParameterValues(newParams);
        setShowParameters(newParams.length > 0);
      }
    } else {
      // For free-form executions, detect parameters from current prompt
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
    }
  }, [formState.prompt, detectParametersFromPrompt, templateExecutionData]);

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

  // Execution feedback animations
  const showExecutionStartedFeedback = useCallback(() => {
    // Haptic feedback for mobile devices
    if (Platform.OS === 'ios' && Haptics?.impactAsync) {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle?.Medium || 'medium');
      } catch (e) {
        // Haptics not available, continue without feedback
      }
    }

    // Show feedback overlay
    setShowExecutionFeedback(true);

    // Button press animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(executeButtonScale, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(executeButtonOpacity, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(executeButtonScale, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(executeButtonOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // Feedback overlay animation
    Animated.parallel([
      Animated.timing(executionFeedbackOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(executionFeedbackScale, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-hide feedback after 2 seconds and scroll to execution area
    setTimeout(() => {
      hideExecutionFeedback();
      scrollToExecutionArea();
    }, 2000);
  }, []);

  const hideExecutionFeedback = useCallback(() => {
    Animated.parallel([
      Animated.timing(executionFeedbackOpacity, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(executionFeedbackScale, {
        toValue: 0.8,
        duration: 300,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowExecutionFeedback(false);
      // Reset animation values
      executionFeedbackOpacity.setValue(0);
      executionFeedbackScale.setValue(0.8);
    });
  }, []);

  const scrollToExecutionArea = useCallback(() => {
    // Smooth scroll to the execution area
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 500);
  }, []);

  // Count filled other options
  const getOtherOptionsCount = (): number => {
    let count = 0;
    if (formState.executionName?.trim()) count++;
    if (formState.description?.trim()) count++;
    if (formState.context?.trim()) count++;
    return count;
  };

  // Set default execution name if empty
  useEffect(() => {
    if (!formState.executionName || formState.executionName.trim() === '') {
      updateField('executionName', generateDefaultExecutionName());
    }
  }, []);

  // Load API keys, agents, teams, and templates on mount and when screen is focused
  useEffect(() => {
    loadBackendApiKeys();
    loadAgentsTeamsAndTemplates();
  }, [loadBackendApiKeys, loadAgentsTeamsAndTemplates]);

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading execution interface..." />;
  }



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



  const handleReExecute = async (reExecutionData: any) => {
    // Determine if this was an agent execution based on agentId
    const isAgentExec = reExecutionData.agentId || reExecutionData.isAgentExecution || false;
    const isTemplateExec = reExecutionData.isTemplateExecution || false;
    
    // Set the execution mode based on the data
    if (isAgentExec) {
      setCurrentExecutionMode('agent');
      console.log('🤖 Setting execution mode to AGENT for re-execution');
    } else if (isTemplateExec) {
      setCurrentExecutionMode('template');
      console.log('📄 Setting execution mode to TEMPLATE for re-execution');
    } else {
      setCurrentExecutionMode('experiment');
      console.log('🧪 Setting execution mode to EXPERIMENT for re-execution');
    }
    
    setTemplateExecutionData({
      isTemplateExecution: isTemplateExec,
      isAgentExecution: isAgentExec,
      templateId: reExecutionData.templateId,
      templateParameters: reExecutionData.templateParameters || [],
      originalPrompt: reExecutionData.basePrompt
    });
    
    console.log('🔧 Template execution data set:', {
      isTemplateExecution: isTemplateExec,
      isAgentExecution: isAgentExec,
      templateId: reExecutionData.templateId,
      parametersCount: (reExecutionData.templateParameters || []).length,
      hasOriginalPrompt: !!reExecutionData.basePrompt
    });
    
    // Check if this is an agent execution
    if (isAgentExec && reExecutionData.agentId) {
      try {
        console.log('🤖 Loading agent data for execution:', reExecutionData.agentId);
        const agentResponse = await goGentAPI.getAgent(reExecutionData.agentId);
        if (agentResponse.success && agentResponse.data) {
          const agentData = agentResponse.data;
          
          // Set agent data for the execution context
          setAgentData({
            agent: agentData,
            isAgentExecution: true,
            showTooltip: false
          });
          
          // Auto-select the agent in the agent selector
          setSelectedAgent(agentData);
          console.log('🎯 Auto-selected agent for execution:', {
            agentId: agentData.id,
            agentName: `${agentData.firstName} ${agentData.lastName}`,
            templateId: agentData.templateId
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
    
    console.log('📝 Form fields updated:', {
      executionName: reExecutionData.executionRunName,
      basePrompt: reExecutionData.basePrompt ? reExecutionData.basePrompt.substring(0, 100) + '...' : 'EMPTY',
      promptLength: reExecutionData.basePrompt?.length || 0
    });
    
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

    // Validate configuration selection based on current mode
    if (!validateConfigurationSelection(formState.selectedConfigs)) {
      return;
    }

    // Show cost warning for multiple configurations in experiment mode
    if (currentExecutionMode === 'experiment' && formState.selectedConfigs.length > 1) {
      showCostWarningIfNeeded(formState.selectedConfigs);
    }

    // Agent mode specific validation
    if (currentExecutionMode === 'agent' && !selectedAgent) {
      AlertAPI.alert('Error', 'Please select an agent for agent execution mode');
      return;
    }

    // Template mode specific validation
    if (currentExecutionMode === 'template' && !selectedTemplate) {
      AlertAPI.alert('Error', 'Please select a template for template execution mode');
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

    // Show immediate execution feedback animation
    showExecutionStartedFeedback();

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

      // Build execution name based on mode
      const getExecutionRunName = () => {
        const baseName = formState.executionName || generateDefaultExecutionName();
        switch (currentExecutionMode) {
          case 'agent':
            return selectedAgent ? `Agent: ${selectedAgent.firstName} ${selectedAgent.lastName} - ${baseName}` : baseName;
          case 'template':
            return templateExecutionData.isTemplateExecution ? `Template: ${baseName}` : baseName;
          default:
            return baseName;
        }
      };

      const request = {
        executionRunName: getExecutionRunName(),
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
        // Include agentId for agent executions (new logic for agent mode)
        ...(currentExecutionMode === 'agent' && selectedAgent?.id && {
          agentId: selectedAgent.id
        }),
        // Backward compatibility for existing agent execution flow
        ...(agentData.isAgentExecution && agentData.agent?.id && {
          agentId: agentData.agent.id
        }),
        // Include template information for template executions
        ...(currentExecutionMode === 'template' && selectedTemplate?.id && {
          templateId: selectedTemplate.id
        }),
      };

      console.log('🚀 Starting multi-variant execution with request:', request);
      const response = await goGentAPI.executeMultiVariation(request, formState.functionExecutionMode);

      if (response.success && response.data) {
        const executionId = response.data.executionRun.id;
        startExecution(executionId, 300);
        console.log('✅ Execution started:', executionId);
        
        // Add a minimum delay to ensure live view shows even for fast executions
        setTimeout(() => {
          pollExecutionStatus(executionId);
        }, 1000); // 1 second delay to guarantee live view visibility
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



  return (
    <ScreenContainer 
      enableKeyboardAvoiding={true}
      enableScrolling={true}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={styles.scrollContent}
      scrollViewRef={scrollViewRef}
    >
        {/* Execution Mode Selector - Compact Design */}
        <View style={styles.modeSelector}>
          <View style={styles.modeSelectorHeader}>
            <Text style={styles.modeSelectorTitle}>Execution Mode</Text>
            <TouchableOpacity 
              style={styles.modeInfoButton}
              onPress={() => setShowModeTooltip(!showModeTooltip)}
            >
              <Ionicons name="information-circle-outline" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.compactModeButtons}>
            {EXECUTION_MODES.map((mode) => {
              const isSelected = currentExecutionMode === mode.mode;
              const isDisabled = mode.mode === 'agent' && !hasAgentsOrTeams;
              
              return (
                <TouchableOpacity
                  key={mode.mode}
                  style={[
                    styles.compactModeButton,
                    isSelected && [styles.compactModeButtonSelected, { backgroundColor: mode.color }],
                    isDisabled && styles.compactModeButtonDisabled
                  ]}
                  onPress={() => !isDisabled && handleModeSwitch(mode.mode)}
                  disabled={isDisabled}
                >
                  <Ionicons 
                    name={mode.icon as any} 
                    size={16} 
                    color={isSelected ? '#FFFFFF' : (isDisabled ? '#C7C7CC' : mode.color)} 
                  />
                  <Text style={[
                    styles.compactModeButtonText,
                    isSelected && styles.compactModeButtonTextSelected,
                    isDisabled && styles.compactModeButtonTextDisabled
                  ]}>
                    {mode.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* Mode Description Tooltip */}
          {showModeTooltip && (
            <View style={styles.modeDescriptionBox}>
              <Text style={styles.modeDescriptionText}>
                {EXECUTION_MODES.find(m => m.mode === currentExecutionMode)?.description}
              </Text>
              {currentExecutionMode === 'agent' && !hasAgentsOrTeams && (
                <Text style={styles.modeDescriptionNote}>
                  Create an agent first to use this mode.
                </Text>
              )}
            </View>
          )}
          
          {/* Auto-configuration Status */}
          {autoConfigStatus && (
            <View style={styles.autoConfigStatus}>
              <Text style={styles.autoConfigStatusText}>{autoConfigStatus}</Text>
            </View>
          )}
        </View>

        {/* Agent Selection for Agent Mode */}
        {currentExecutionMode === 'agent' && hasAgentsOrTeams && (
          <View style={styles.selectionContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="person-circle" size={18} color="#007AFF" />
              <Text style={styles.fieldLabel}>Select Agent</Text>
              <Text style={styles.requiredText}>Required</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.selector}
              onPress={() => setShowAgentSelector(true)}
            >
              <View style={styles.selectorContent}>
                {selectedAgent ? (
                  <View style={styles.selectedInfo}>
                    <AgentAvatar 
                      agent={{
                        firstName: selectedAgent.firstName,
                        lastName: selectedAgent.lastName,
                        lifecycleStatus: selectedAgent.lifecycleStatus,
                        templateName: selectedAgent.templateName
                      }}
                      size="small"
                      showStatus={true}
                      animated={false}
                    />
                    <View style={styles.selectedDetails}>
                      <Text style={styles.selectedName}>
                        {selectedAgent.firstName} {selectedAgent.lastName}
                      </Text>
                      {selectedAgent.templateName && (
                        <Text style={styles.selectedSubtitle}>
                          {selectedAgent.templateName}
                        </Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.selectorPlaceholder}>
                    Choose an agent for execution...
                  </Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Template Selection for Template Mode */}
        {currentExecutionMode === 'template' && availableTemplates.length > 0 && (
          <View style={styles.selectionContainer}>
            <View style={styles.labelContainer}>
              <Ionicons name="document-text" size={18} color="#1976D2" />
              <Text style={styles.fieldLabel}>Select Template</Text>
              <Text style={styles.requiredText}>Required</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.selector}
              onPress={() => setShowTemplateSelector(true)}
            >
              <View style={styles.selectorContent}>
                {selectedTemplate ? (
                  <View style={styles.selectedInfo}>
                    <View style={styles.templateIcon}>
                      <Ionicons name="document-text" size={20} color="#1976D2" />
                    </View>
                    <View style={styles.selectedDetails}>
                      <Text style={styles.selectedName}>
                        {selectedTemplate.name}
                      </Text>
                      {selectedTemplate.description && (
                        <Text style={styles.selectedSubtitle}>
                          {selectedTemplate.description}
                        </Text>
                      )}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.selectorPlaceholder}>
                    Choose a template for execution...
                  </Text>
                )}
                <Ionicons name="chevron-down" size={20} color="#C7C7CC" />
              </View>
            </TouchableOpacity>
          </View>
        )}

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
        <View style={[styles.header, (agentData.isAgentExecution || currentExecutionMode !== 'experiment') && styles.headerCompact]}>
          <View style={styles.titleContainer}>
            <Ionicons 
              name={currentModeInfo.icon as any} 
              size={24} 
              color={currentModeInfo.color} 
              style={styles.titleIcon}
            />
            <Text style={styles.title}>
              {currentModeInfo.title}
            </Text>
          </View>
          <Text style={styles.subtitle}>
            {currentModeInfo.description}
          </Text>
          
          {/* Mode-specific warnings or info */}
          {currentExecutionMode === 'experiment' && formState.selectedConfigs.length > 1 && (
            <View style={styles.warningContainer}>
              <Ionicons name="warning" size={16} color="#FF9500" />
              <Text style={styles.warningText}>
                Multiple configurations selected - this will run {formState.selectedConfigs.length} separate executions
              </Text>
            </View>
          )}
          
          {currentExecutionMode === 'agent' && !hasAgentsOrTeams && (
            <View style={styles.infoContainer}>
              <Ionicons name="information-circle" size={16} color="#007AFF" />
              <Text style={styles.infoText}>
                Create an agent first to use agent execution mode
              </Text>
            </View>
          )}
        </View>

        {/* Main Prompt - First and Most Prominent */}
        <View style={[styles.fieldContainer, styles.primaryField, (templateExecutionData.isTemplateExecution || templateExecutionData.isAgentExecution) && styles.readOnlyField]}>
          <View style={styles.labelContainer}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#007AFF" />
            <Text style={[styles.fieldLabel, styles.primaryFieldLabel]}>
              {(templateExecutionData.isTemplateExecution || templateExecutionData.isAgentExecution) 
                ? (templateExecutionData.isAgentExecution ? 'Agent Prompt Template' : 'Template Prompt')
                : 'What do you want the AI to do?'
              }
            </Text>
            {(templateExecutionData.isTemplateExecution || templateExecutionData.isAgentExecution) ? (
              <View style={styles.templateBadge}>
                <Text style={styles.templateBadgeText}>Template</Text>
              </View>
            ) : (
              <Text style={styles.requiredText}>Required</Text>
            )}
          </View>
          
          <EnhancedTextEditor
            value={formState.prompt}
            onChangeText={(text) => updateField('prompt', text)}
            placeholder="Write a compelling product description for a sustainable water bottle that highlights its eco-friendly features..."
            label={(templateExecutionData.isTemplateExecution || templateExecutionData.isAgentExecution) 
              ? (templateExecutionData.isAgentExecution ? 'Agent Prompt Template' : 'Template Prompt')
              : 'What do you want the AI to do?'
            }
            minHeight={200}
            maxHeight={600}
            allowFullscreen={true}
            showCharacterCount={true}
            showWordCount={true}
            showLineNumbers={false}
            showToolbar={true}
            enableMarkdown={true}
            required={true}
            helperText={
              (templateExecutionData.isTemplateExecution || templateExecutionData.isAgentExecution) && parameterValues.length > 0
                ? "This prompt is from a template. Use the parameter inputs below to customize the execution."
                : "Provide clear, detailed instructions for what you want the AI to accomplish"
            }
            editable={true}
          />
        </View>

        {/* Execution Tags - Quick Configuration Access */}
        <ExecutionTags
          selectedConfigsCount={formState.selectedConfigs.length}
          selectedFunctionsCount={formState.selectedFunctions.length}
          otherOptionsCount={getOtherOptionsCount()}
          onConfigurationPress={() => setShowConfigurationModal(true)}
          onFunctionsPress={() => setShowFunctionsModal(true)}
          onOtherOptionsPress={() => setShowOtherOptionsModal(true)}
        />

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
                  
                  {param.value.length > 100 || param.description?.toLowerCase().includes('long') || param.description?.toLowerCase().includes('detailed') ? (
                    <EnhancedTextEditor
                      value={param.value}
                      onChangeText={(value) => updateParameterValue(param.name, value)}
                      placeholder={`Enter value for ${param.name}...`}
                      minHeight={80}
                      maxHeight={200}
                      allowFullscreen={true}
                      showCharacterCount={true}
                      showWordCount={false}
                      showLineNumbers={false}
                      showToolbar={false}
                      autoExpandOnFocus={true}
                      required={param.isRequired}
                      helperText={param.description}
                    />
                  ) : (
                    <TextInput
                      style={styles.parameterInput}
                      value={param.value}
                      onChangeText={(value) => updateParameterValue(param.name, value)}
                      placeholder={`Enter value for ${param.name}...`}
                      placeholderTextColor="#8E8E93"
                      multiline={param.value.length > 50}
                      numberOfLines={param.value.length > 50 ? 3 : 1}
                    />
                  )}
                  
                  {param.description && (
                    <Text style={styles.parameterDescription}>{param.description}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}



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
            <Animated.View
              style={{
                transform: [{ scale: executeButtonScale }],
                opacity: executeButtonOpacity,
              }}
            >
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
            </Animated.View>
          )}
          
          <Text style={styles.executeDescription}>
            This will run your prompt across all selected AI configurations and provide comparison results
          </Text>
        </View>

        {/* Execution Started Feedback Overlay */}
        {showExecutionFeedback && (
          <Animated.View 
            style={[
              styles.executionFeedbackOverlay,
              {
                opacity: executionFeedbackOpacity,
                transform: [{ scale: executionFeedbackScale }],
              }
            ]}
          >
            <View style={styles.executionFeedbackContainer}>
              <View style={styles.executionFeedbackIcon}>
                <Ionicons name="rocket" size={32} color="#FFFFFF" />
              </View>
              <Text style={styles.executionFeedbackTitle}>🚀 Execution Started!</Text>
              <Text style={styles.executionFeedbackMessage}>
                Your AI models are now processing your request
              </Text>
              <View style={styles.executionFeedbackProgress}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.executionFeedbackProgressText}>Initializing...</Text>
              </View>
            </View>
          </Animated.View>
        )}

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

      {/* New Modal Components */}
      <ConfigurationModal
        visible={showConfigurationModal}
        onClose={() => setShowConfigurationModal(false)}
        configurations={configurations}
        selectedConfigurations={formState.selectedConfigs}
        onSelectionChange={(configIds) => {
          // Validate configuration selection based on current mode
          if (validateConfigurationSelection(configIds)) {
            updateField('selectedConfigs', configIds);
          }
        }}
        isLoading={!configurations.length}
        maxSelections={currentModeInfo.allowMultipleConfigs ? undefined : 1}
        modeInfo={{
          mode: currentExecutionMode,
          title: currentModeInfo.title,
          allowMultiple: currentModeInfo.allowMultipleConfigs
        }}
      />

      <FunctionsModal
        visible={showFunctionsModal}
        onClose={() => setShowFunctionsModal(false)}
        functions={availableFunctions}
        selectedFunctions={formState.selectedFunctions}
        onSelectionChange={(functionIds) => updateField('selectedFunctions', functionIds)}
        isLoading={isLoadingFunctions.current}
      />

      <OtherOptionsModal
        visible={showOtherOptionsModal}
        onClose={() => setShowOtherOptionsModal(false)}
        executionName={formState.executionName}
        description={formState.description}
        context={formState.context}
        onExecutionNameChange={(value) => updateField('executionName', value)}
        onDescriptionChange={(value) => updateField('description', value)}
        onContextChange={(value) => updateField('context', value)}
        defaultExecutionName={generateDefaultExecutionName()}
      />
      
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
          requirement={missingModelKey!}
          configurationName={pendingConfiguration?.variationName || ''}
        />
      )}
      
      {/* Full Execution Results Viewer */}
      {currentExecution?.executionResult && showExecutionResults && (
        <ExecutionResultsViewer
          executionResult={currentExecution!.executionResult!}
          visible={showExecutionResults}
          onClose={() => setShowExecutionResults(false)}
          onReExecute={handleReExecute}
          showReExecuteButton={true}
          embedded={false}
        />
      )}

      {/* Agent Selection Modal */}
      <Modal visible={showAgentSelector} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAgentSelector(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Agent</Text>
            <TouchableOpacity onPress={() => setShowAgentSelector(false)}>
              <Text style={styles.modalSaveButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {availableAgents.length === 0 ? (
              // No agents screen
              <View style={styles.noAgentsContainer}>
                <View style={styles.noAgentsIconContainer}>
                  <Ionicons name="people-outline" size={80} color="#C7C7CC" />
                </View>
                <Text style={styles.noAgentsTitle}>No Agents Found</Text>
                <Text style={styles.noAgentsDescription}>
                  You don't have any agents created yet. Agents help you automate tasks and execute prompts with predefined configurations.
                </Text>
                <View style={styles.noAgentsActions}>
                  <TouchableOpacity
                    style={styles.noAgentsMarketplaceButton}
                    onPress={() => {
                      setShowAgentSelector(false);
                      // Navigate to marketplace
                      (navigation as any).navigate('Marketplace');
                    }}
                  >
                    <Ionicons name="storefront" size={20} color="#FFFFFF" />
                    <Text style={styles.noAgentsMarketplaceButtonText}>Browse Marketplace</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.noAgentsCreateButton}
                    onPress={() => {
                      setShowAgentSelector(false);
                      // Navigate to agents screen where they can create one
                      (navigation as any).navigate('Agents');
                    }}
                  >
                    <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                    <Text style={styles.noAgentsCreateButtonText}>Create Agent</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.noAgentsHint}>
                  💡 Tip: Try browsing the marketplace to find pre-built agents, or create your own custom agent.
                </Text>
              </View>
            ) : (
              // Existing agents list
              availableAgents.map((agent) => (
                <TouchableOpacity
                  key={agent.id}
                  style={[
                    styles.modalItem,
                    selectedAgent?.id === agent.id && styles.modalItemSelected
                  ]}
                  onPress={() => {
                    setSelectedAgent(agent);
                    // Auto-configure agent settings
                    configureAgentSettings(agent);
                    setShowAgentSelector(false);
                  }}
                >
                  <AgentAvatar 
                    agent={{
                      firstName: agent.firstName,
                      lastName: agent.lastName,
                      lifecycleStatus: agent.lifecycleStatus,
                      templateName: agent.templateName
                    }}
                    size="medium"
                    showStatus={true}
                    animated={false}
                  />
                  <View style={styles.modalItemDetails}>
                    <Text style={styles.modalItemName}>
                      {agent.firstName} {agent.lastName}
                    </Text>
                    {agent.templateName && (
                      <Text style={styles.modalItemSubtitle}>
                        {agent.templateName}
                      </Text>
                    )}
                    <Text style={styles.modalItemMeta}>
                      Status: {agent.lifecycleStatus} • {agent.totalExecutions} executions
                    </Text>
                  </View>
                  {selectedAgent?.id === agent.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Template Selection Modal */}
      <Modal visible={showTemplateSelector} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTemplateSelector(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Template</Text>
            <TouchableOpacity onPress={() => setShowTemplateSelector(false)}>
              <Text style={styles.modalSaveButton}>Done</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {availableTemplates.map((template) => (
              <TouchableOpacity
                key={template.id}
                style={[
                  styles.modalItem,
                  selectedTemplate?.id === template.id && styles.modalItemSelected
                ]}
                onPress={() => {
                  setSelectedTemplate(template);
                  // Auto-configure template settings
                  configureTemplateSettings(template);
                  setShowTemplateSelector(false);
                }}
              >
                <View style={styles.templateIcon}>
                  <Ionicons name="document-text" size={24} color="#1976D2" />
                </View>
                <View style={styles.modalItemDetails}>
                  <Text style={styles.modalItemName}>
                    {template.name}
                  </Text>
                  {template.description && (
                    <Text style={styles.modalItemSubtitle}>
                      {template.description}
                    </Text>
                  )}
                  <Text style={styles.modalItemMeta}>
                    {template.parameters?.length || 0} parameters • {template.category || 'General'}
                  </Text>
                </View>
                {selectedTemplate?.id === template.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#1976D2" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Platform.OS === 'ios' ? 16 : 14, // Slightly less padding on Android
    paddingBottom: Platform.OS === 'ios' ? 120 : 100, // Platform-specific bottom spacing
    minHeight: '100%', // Ensure full height usage
  },
  header: {
    marginBottom: 24,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B6B6B',
    lineHeight: 22,
  },
  fieldContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: Platform.OS === 'ios' ? 16 : 14, // Slightly less padding on Android
    marginBottom: 16, // Reduced margin for better density on mobile
    borderWidth: Platform.OS === 'ios' ? 1 : 0.5, // Thinner borders on Android
    borderColor: '#E5E5EA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap', // Allow wrapping on small screens
    minHeight: 24, // Ensure consistent height even when wrapping
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1, // Allow label to take available space
    minWidth: 100, // Minimum width before wrapping
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
     fontSize: 12, // Slightly smaller on mobile
     color: '#FF3B30',
     marginLeft: 8,
     marginTop: Platform.OS === 'ios' ? 1 : 0, // Slight offset on iOS
     paddingHorizontal: 6,
     paddingVertical: 2,
     backgroundColor: '#FFF5F5',
     borderRadius: 4,
     fontWeight: '500',
     alignSelf: 'flex-start', // Prevent stretching
     flexShrink: 0, // Don't shrink the badge
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
    marginBottom: Platform.OS === 'ios' ? 40 : 30, // Platform-specific margin
    paddingHorizontal: Platform.OS === 'ios' ? 0 : 4, // Slight padding on Android
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
    padding: Platform.OS === 'ios' ? 16 : 14, // Slightly less padding on Android
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Platform.OS === 'ios' ? 32 : 24, // Less margin on Android
    minHeight: 56, // Ensure consistent touch target
    ...Platform.select({
      ios: {
        shadowColor: '#007AFF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
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
   // No agents screen styles
   noAgentsContainer: {
     flex: 1,
     justifyContent: 'center',
     alignItems: 'center',
     paddingHorizontal: 32,
     paddingVertical: 48,
   },
   noAgentsIconContainer: {
     marginBottom: 24,
   },
   noAgentsTitle: {
     fontSize: 24,
     fontWeight: '700',
     color: '#1A1A1A',
     textAlign: 'center',
     marginBottom: 12,
   },
   noAgentsDescription: {
     fontSize: 16,
     color: '#6B6B6B',
     textAlign: 'center',
     lineHeight: 22,
     marginBottom: 32,
   },
   noAgentsActions: {
     width: '100%',
     gap: 12,
     marginBottom: 24,
   },
   noAgentsMarketplaceButton: {
     backgroundColor: '#007AFF',
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 16,
     paddingHorizontal: 24,
     borderRadius: 12,
     gap: 8,
   },
   noAgentsMarketplaceButtonText: {
     color: '#FFFFFF',
     fontSize: 16,
     fontWeight: '600',
   },
   noAgentsCreateButton: {
     backgroundColor: '#FFFFFF',
     borderWidth: 2,
     borderColor: '#007AFF',
     flexDirection: 'row',
     alignItems: 'center',
     justifyContent: 'center',
     paddingVertical: 16,
     paddingHorizontal: 24,
     borderRadius: 12,
     gap: 8,
   },
   noAgentsCreateButtonText: {
     color: '#007AFF',
     fontSize: 16,
     fontWeight: '600',
   },
   noAgentsHint: {
     fontSize: 14,
     color: '#8E8E93',
     textAlign: 'center',
     lineHeight: 20,
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
    padding: Platform.OS === 'ios' ? 12 : 10, // Slightly less padding on Android
    borderWidth: Platform.OS === 'ios' ? 1 : 0.5, // Thinner borders on Android
    borderColor: '#FFE4B8',
    marginBottom: 8, // Add spacing between parameters
  },
  parameterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap', // Allow wrapping for long parameter names
    gap: 8, // Add gap between items when wrapped
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
  // Template execution styles
  readOnlyField: {
    borderColor: '#8E8E93',
    backgroundColor: '#F8F9FA',
  },
  templateBadge: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  templateBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1976D2',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 18,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  // Execution Mode Selector Styles - Compact Design
  modeSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  modeSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modeSelectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modeInfoButton: {
    padding: 4,
  },
  compactModeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  compactModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  compactModeButtonSelected: {
    borderWidth: 2,
  },
  compactModeButtonDisabled: {
    backgroundColor: '#F2F2F7',
    opacity: 0.6,
  },
  compactModeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  compactModeButtonTextSelected: {
    color: '#FFFFFF',
  },
  compactModeButtonTextDisabled: {
    color: '#C7C7CC',
  },
  modeDescriptionBox: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  modeDescriptionText: {
    fontSize: 13,
    color: '#1A1A1A',
    lineHeight: 18,
  },
  modeDescriptionNote: {
    fontSize: 12,
    color: '#FF9500',
    fontStyle: 'italic',
    marginTop: 4,
  },
  autoConfigStatus: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#C8E6C9',
  },
  autoConfigStatusText: {
    fontSize: 13,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Selection Container Styles (shared by agent and template)
  selectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  selector: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 12,
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: '#8E8E93',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedDetails: {
    marginLeft: 12,
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  selectedSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 2,
  },
  templateIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Modal Styles
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalItemSelected: {
    backgroundColor: '#F0F8FF',
  },
  modalItemDetails: {
    flex: 1,
    marginLeft: 12,
  },
  modalItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  modalItemSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 2,
  },
  modalItemMeta: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  // Warning and Info Containers
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8F0',
    borderRadius: 6,
    padding: 8,
    marginTop: 12,
    gap: 6,
  },
  warningText: {
    fontSize: 13,
    color: '#FF9500',
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
    padding: 8,
    marginTop: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#007AFF',
    flex: 1,
  },
  // Execution Feedback Overlay Styles
  executionFeedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  executionFeedbackContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: Dimensions.get('window').width * 0.85,
    minWidth: 280,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  executionFeedbackIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  executionFeedbackTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 8,
  },
  executionFeedbackMessage: {
    fontSize: 16,
    color: '#6B6B6B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  executionFeedbackProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  executionFeedbackProgressText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default ExecuteScreen; 