import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Switch,
  FlatList,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import EnhancedTextEditor from './EnhancedTextEditor';
import { FunctionSelector } from './FunctionSelector';
import { AlertAPI } from './CustomAlert';
import ConfigurationModal from './ConfigurationModal';

import { ExecutionTemplate, TemplateFormData, TemplateParameter } from '../types/templates';
import { FunctionDefinition, APIConfiguration } from '../types';
import { useTheme, useThemedStyles } from '../theme';
import { spacing, radius, typography } from '../theme';
import { useContainerStyles } from '../styles/useContainerStyles';

interface TemplateFormProps {
  template: ExecutionTemplate | null;
  isEditMode: boolean;
  isViewMode: boolean;
  configurations: any[];
  availableFunctions: FunctionDefinition[];
  onSave: (
    formData: TemplateFormData,
    parameters: Omit<TemplateParameter, 'id'>[],
    selectedFunctions: string[]
  ) => Promise<boolean>;
  onClose: () => void;
}

interface ValidationError {
  field: string;
  message: string;
}

interface TooltipProps {
  title: string;
  content: string;
  icon: string;
  visible: boolean;
  onClose: () => void;
}

interface TooltipInternalProps extends TooltipProps {
  themedStyles: any;
  themeColors: any;
}

// Memoized Tooltip component for performance
const TooltipComponent: React.FC<TooltipInternalProps> = React.memo(({ title, content, icon, visible, onClose, themedStyles, themeColors }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={themedStyles.tooltipOverlay}>
      <View style={themedStyles.tooltipContainer}>
        <View style={themedStyles.tooltipHeader}>
          <Ionicons name={icon as any} size={24} color={themeColors.accent} />
          <Text style={themedStyles.tooltipTitle}>{title}</Text>
          <TouchableOpacity
            onPress={onClose}
            style={themedStyles.tooltipClose}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Close tooltip"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color={themeColors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={themedStyles.tooltipContent}>{content}</Text>
      </View>
    </View>
  </Modal>
));

const TEMPLATE_VARIABLES = [
  '{{user_input}}',
  '{{context}}',
  '{{parameter_name}}',
];

// Input sanitization utility
const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input || typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
};

// Extract parameters from template prompt
const extractParametersFromPrompt = (prompt: string): string[] => {
  const regex = /\{\{([^}]+)\}\}/g;
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(prompt)) !== null) {
    const paramName = match[1].trim();
    if (paramName && !matches.includes(paramName)) {
      matches.push(paramName);
    }
  }
  return matches;
};

// Validation rules
const VALIDATION_RULES = {
  templateName: {
    minLength: 2,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s\-_\.]+$/,
  },
  description: {
    maxLength: 500,
  },
  prompt: {
    minLength: 10,
    maxLength: 5000,
  },
  parameterName: {
    minLength: 1,
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_]+$/,
  },
};

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  isEditMode,
  isViewMode,
  configurations,
  availableFunctions,
  onSave,
  onClose,
}) => {
  const { colors } = useTheme();
  const { containerStyles, shadowPresets, textInputStyles } = useContainerStyles();
  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerButton: { padding: spacing.sm },
    headerButtonDisabled: { opacity: 0.5 },
    title: { ...typography.h1, color: colors.textPrimary },
    saveText: { ...typography.title, color: colors.accent },
    saveTextDisabled: { color: colors.textSecondary },
    content: { flex: 1, paddingHorizontal: spacing.lg },
    section: { marginVertical: spacing.lg },
    sectionHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.lg, gap: spacing.sm },
    sectionTitle: { ...typography.h2, color: colors.textPrimary, flex: 1 },
    tooltipButton: { padding: spacing.xs },
    infoCard: { backgroundColor: colors.bgSurface, padding: spacing.md, borderRadius: radius.lg, borderLeftWidth: 4, borderLeftColor: colors.accent },
    infoText: { ...typography.body, color: colors.textSecondary },
    inputRow: { flexDirection: 'row' as const, gap: spacing.md, marginBottom: spacing.lg },
    inputContainer: { flex: 1 },
    labelContainer: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: spacing.sm },
    fieldLabel: { ...typography.label, color: colors.textPrimary },
    textArea: { minHeight: 80, textAlignVertical: 'top' as const },
    promptArea: { minHeight: 120, textAlignVertical: 'top' as const },
    variablesContainer: { marginBottom: spacing.md },
    variablesLabel: { ...typography.caption, fontWeight: '500' as const, color: colors.textSecondary, marginBottom: spacing.sm },
    variableChips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
    variableChip: { backgroundColor: colors.accent, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.xl },
    variableChipText: { ...typography.caption, fontWeight: '500' as const, color: colors.textInverse },
    detectedParametersContainer: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.accent },
    detectedParametersLabel: { ...typography.caption, fontWeight: '600' as const, color: colors.accent, marginBottom: spacing.sm },
    detectedParametersList: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
    detectedParameterChip: { backgroundColor: colors.bgSurface, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.accent },
    detectedParameterText: { ...typography.micro, fontWeight: '600' as const, color: colors.accent, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    selectorButton: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
    selectorContent: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    selectorMain: { flex: 1 },
    selectorLabel: { ...typography.caption, fontWeight: '500' as const, color: colors.textSecondary, marginBottom: spacing.xs },
    selectorValue: { ...typography.title, fontWeight: '500' as const, color: colors.textPrimary },
    enhancedSelectorButton: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
    modelSelectorContent: { flexDirection: 'row' as const, alignItems: 'flex-start' as const, justifyContent: 'space-between' as const },
    modelSelectorMain: { flex: 1, marginRight: spacing.md },
    modelSelectorHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: spacing.xs },
    modelSelectorLabel: { ...typography.caption, fontWeight: '500' as const, color: colors.textSecondary },
    modelSelectorValue: { ...typography.title, color: colors.textPrimary, marginBottom: spacing.xs },
    modelSelectorDescription: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
    modelIdealFor: { ...typography.caption, fontWeight: '500' as const, color: colors.accent, marginBottom: spacing.xs },
    modelTokenInfo: { ...typography.micro, fontWeight: '400' as const, color: colors.textSecondary },
    switchContainer: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, backgroundColor: colors.bgCard, padding: spacing.md, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderLight },
    switchLabel: { flex: 1, marginRight: spacing.lg },
    switchText: { ...typography.title, fontWeight: '500' as const, color: colors.textPrimary, marginBottom: spacing.xs },
    switchDescription: { ...typography.caption, color: colors.textSecondary },
    functionsButton: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, marginTop: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
    functionsContent: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const },
    functionsLabel: { ...typography.title, fontWeight: '500' as const, color: colors.textPrimary },
    functionsViewContainer: { marginTop: spacing.md },
    functionsViewLabel: { ...typography.title, fontWeight: '500' as const, color: colors.textPrimary, marginBottom: spacing.sm },
    functionsList: { gap: spacing.sm },
    functionItem: { backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
    functionItemHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.xs, gap: spacing.sm },
    functionName: { ...typography.bodyStrong, color: colors.textPrimary, flex: 1 },
    functionDescription: { ...typography.caption, color: colors.textSecondary },
    noFunctionsContainer: { backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: spacing.md, alignItems: 'center' as const, borderWidth: 1, borderColor: colors.borderLight },
    noFunctionsText: { ...typography.body, color: colors.textSecondary, fontStyle: 'italic' as const },
    parameterCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
    parameterHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginBottom: spacing.md },
    parameterTitle: { ...typography.title, color: colors.textPrimary },
    removeButton: { padding: spacing.sm },
    parameterRow: { flexDirection: 'row' as const, gap: spacing.md, marginBottom: spacing.md },
    parameterField: { flex: 1 },
    parameterFieldLabel: { ...typography.caption, fontWeight: '500' as const, color: colors.textSecondary, marginBottom: spacing.xs },
    parameterInput: { ...typography.body },
    pickerContainer: { backgroundColor: colors.bgSurface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderLight },
    picker: { height: 44 },
    addParameterButton: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'center' as const, backgroundColor: colors.bgSurface, padding: spacing.md, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.accent, borderStyle: 'dashed' as const, gap: spacing.sm },
    addParameterText: { ...typography.title, fontWeight: '500' as const, color: colors.accent },
    parametersInfo: { backgroundColor: colors.accentSoft, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, borderLeftWidth: 4, borderLeftColor: colors.accent },
    parametersInfoText: { ...typography.body, color: colors.textPrimary },
    parameterHeaderLeft: { flexDirection: 'row' as const, alignItems: 'center' as const, flex: 1, gap: spacing.sm },
    autoDetectedBadge: { backgroundColor: `${colors.statusSuccess}15`, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.statusSuccess },
    autoDetectedText: { ...typography.micro, fontWeight: '600' as const, color: colors.statusSuccess },
    parameterNameContainer: { backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight },
    parameterNameValue: { ...typography.bodyStrong, color: colors.textPrimary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
    parameterNameNote: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
    parameterDescriptionContainer: { marginTop: spacing.md },
    parameterDescriptionInput: { ...typography.body, minHeight: 60, textAlignVertical: 'top' as const },
    errorText: { ...typography.caption, color: colors.statusError, marginTop: spacing.xs },
    modalContainer: { flex: 1, backgroundColor: colors.bgApp },
    modalHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, backgroundColor: colors.bgCard, borderBottomWidth: 1, borderBottomColor: colors.borderLight },
    modalTitle: { ...typography.h1, color: colors.textPrimary },
    modalCloseButton: { padding: spacing.xs },
    modelList: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
    modelCard: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.borderLight, position: 'relative' as const },
    modelCardSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
    modelCardHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: spacing.sm },
    modelCardTitle: { ...typography.title, color: colors.textPrimary, flex: 1, marginRight: spacing.sm },
    modelCardTitleSelected: { color: colors.textInverse },
    modelCardDescription: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.xs },
    modelCardDescriptionSelected: { color: colors.textInverse, opacity: 0.9 },
    modelCardTokens: { ...typography.caption, fontWeight: '500' as const, color: colors.textSecondary },
    recommendedBadge: { backgroundColor: colors.statusWarning, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.sm },
    badgeText: { ...typography.caption, fontWeight: '600' as const, color: colors.textInverse },
    selectedIndicator: { position: 'absolute' as const, top: spacing.lg, right: spacing.lg },
    enhancedModelCard: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.borderLight, position: 'relative' as const },
    enhancedModelCardSelected: { backgroundColor: colors.bgCard, borderColor: colors.accent, borderWidth: 2 },
    enhancedModelCardHeader: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'flex-start' as const, marginBottom: spacing.sm },
    modelCardTitleRow: { flexDirection: 'row' as const, alignItems: 'center' as const, flex: 1, gap: spacing.md },
    enhancedModelCardTitle: { ...typography.h2, fontWeight: '700' as const, color: colors.textPrimary, flex: 1 },
    enhancedModelCardTitleSelected: { color: colors.accent },
    enhancedModelCardDescription: { ...typography.body, color: colors.textSecondary, marginBottom: spacing.sm },
    enhancedModelCardDescriptionSelected: { color: colors.textSecondary, opacity: 1 },
    modelIdealForCard: { ...typography.label, fontWeight: '600' as const, color: colors.accent, marginBottom: spacing.sm, fontStyle: 'italic' as const },
    modelDetailsRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, alignItems: 'center' as const, marginBottom: spacing.md },
    useCasesContainer: { marginTop: spacing.sm },
    useCasesTitle: { ...typography.caption, fontWeight: '600' as const, color: colors.textSecondary, marginBottom: spacing.sm },
    useCasesList: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: spacing.sm },
    useCaseChip: { backgroundColor: colors.accentSoft, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.xl, borderWidth: 1, borderColor: `${colors.accent}40` },
    useCaseText: { ...typography.micro, color: colors.textSecondary },
    useCaseTextSelected: { color: colors.accent },
    tooltipOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center' as const, alignItems: 'center' as const, paddingHorizontal: spacing.lg },
    tooltipContainer: { backgroundColor: colors.bgCard, borderRadius: radius.xl, padding: spacing.md, maxWidth: '90%' as const },
    tooltipHeader: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: spacing.md },
    tooltipTitle: { ...typography.h2, color: colors.textPrimary, marginLeft: spacing.sm, flex: 1 },
    tooltipClose: { padding: spacing.xs },
    tooltipContent: { ...typography.body, color: colors.textSecondary },
  }));

  // Refs for cleanup and focus management
  const scrollViewRef = useRef<ScrollView>(null);
  const isMountedRef = useRef(true);

  // Form state with better initial values
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    prompt: '',
    context: '',
    enableFunctionCalling: false,
    tags: '',
    configurationId: '', // Will be set to first available configuration
  });

  const [parameters, setParameters] = useState<Omit<TemplateParameter, 'id'>[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);

  // Debug logging for function selection changes
  useEffect(() => {
    console.log('🔥 TEMPLATEFORM: selectedFunctions changed:', {
      count: selectedFunctions.length,
      functions: selectedFunctions
    });
  }, [selectedFunctions]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setSaving] = useState(false);
  const [showFunctionSelector, setShowFunctionSelector] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Modal states
  const [showConfigurationSelector, setShowConfigurationSelector] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize form with template data (optimized with useMemo)
  const initialFormData = useMemo(() => {
    console.log('🔥 TEMPLATEFORM: initialFormData useMemo triggered with:', {
      hasTemplate: !!template,
      templateId: template?.id,
      templateName: template?.name,
      preferredConfigurationId: template?.preferredConfigurationId,
      configurationsCount: configurations.length
    });
    
    if (!template) {
      // For new templates, use the first available configuration
      const defaultConfigId = configurations.length > 0 ? configurations[0].id || '' : '';
      console.log('🔥 TEMPLATEFORM: No template, using default config:', defaultConfigId);
      return {
        name: '',
        description: '',
        prompt: '',
        context: '',
        enableFunctionCalling: false,
        tags: '',
        configurationId: defaultConfigId,
      };
    }
    
    const formData = {
      name: sanitizeInput(template.name || '', VALIDATION_RULES.templateName.maxLength),
      description: sanitizeInput(template.description || '', VALIDATION_RULES.description.maxLength),
      prompt: sanitizeInput((template.prompt || template.templatePrompt || ''), VALIDATION_RULES.prompt.maxLength),
      context: sanitizeInput((template.context || template.contextTemplate || '')),
      enableFunctionCalling: Boolean(template.enableFunctionCalling),
      tags: Array.isArray(template.tags) ? template.tags.join(', ') : '',
      configurationId: template.preferredConfigurationId || (configurations.length > 0 ? configurations[0].id || '' : ''),
    };
    
    console.log('🔥 TEMPLATEFORM: Created form data with configurationId:', formData.configurationId);
    return formData;
  }, [template, configurations]);

  // Initialize form when template changes
  useEffect(() => {
    console.log('🔥 TEMPLATEFORM: useEffect triggered - template changed to:', {
      hasTemplate: !!template,
      templateId: template?.id,
      preferredConfigurationId: template?.preferredConfigurationId,
      functionIDs: template?.functionIDs,
      functionCount: template?.functionIDs?.length || 0,
      isEditMode,
      hasInitialFormData: !!initialFormData
    });
    
    if (initialFormData) {
      // ALWAYS update form data - no conditions, just update it
      console.log('🔥 TEMPLATEFORM: FORCE setFormData with:', initialFormData);
      setFormData(initialFormData);
      console.log('🔥 TEMPLATEFORM: FORCE setFormData completed');
      
      if (template?.parameters) {
        const sanitizedParams = template.parameters.map(p => {
          // Convert legacy 'text' type to 'string' to match database enum
          const paramType = (p.parameterType || p.type || 'string') === 'text' ? 'string' : (p.parameterType || p.type || 'string');
          return {
            name: sanitizeInput(p.name, VALIDATION_RULES.parameterName.maxLength),
            parameterType: paramType,
            type: paramType,
            description: sanitizeInput(p.description || ''),
            defaultValue: sanitizeInput(p.defaultValue || ''),
            isRequired: Boolean(p.isRequired),
            options: Array.isArray(p.options) ? p.options : [],
          };
        });
        setParameters(sanitizedParams);
      }

      if (template?.functionIDs) {
        console.log('🔥 TEMPLATEFORM: Setting initial functions from template:', {
          templateId: template.id,
          functionIDs: template.functionIDs,
          functionCount: template.functionIDs.length
        });
        setSelectedFunctions(template.functionIDs);
      } else {
        console.log('🔥 TEMPLATEFORM: No functionIDs found in template:', {
          templateId: template?.id,
          templateKeys: template ? Object.keys(template) : [],
          template: template
        });
        // Log each key explicitly
        if (template) {
          console.log('🔍 TEMPLATEFORM: Template keys analysis:');
          Object.keys(template).forEach(key => {
            console.log(`  - ${key}:`, (template as any)[key]);
          });
          // Check for case variations
          console.log('🔍 Checking case variations:');
          console.log('  - functionIDs:', (template as any).functionIDs);
          console.log('  - functionIds:', (template as any).functionIds);
          console.log('  - function_ids:', (template as any).function_ids);
          console.log('  - functions:', (template as any).functions);
        }
      }
    }
  }, [initialFormData, template]);

  // Set default configuration if none is selected
  // REMOVED: This useEffect was overriding template configuration values
  // Default configuration is now handled in initialFormData useMemo

  // Auto-detect parameters from prompt changes
  useEffect(() => {
    if (!isViewMode && formData.prompt) {
      const extractedParams = extractParametersFromPrompt(formData.prompt);
      const currentParamNames = parameters.map(p => p.name);
      
      // Check if there are any changes needed
      const hasNewParams = extractedParams.some(paramName => !currentParamNames.includes(paramName));
      const hasRemovedParams = currentParamNames.some(paramName => !extractedParams.includes(paramName));
      
      if (hasNewParams || hasRemovedParams) {
        // Add new parameters that were detected
        const newParameters = extractedParams.filter(paramName => 
          !currentParamNames.includes(paramName)
        ).map(paramName => ({
          name: paramName,
          parameterType: 'string' as const,
          type: 'string' as const,
          description: `Auto-detected parameter: ${paramName}`,
          defaultValue: '',
          isRequired: false,
          options: [],
        }));
        
        // Keep existing parameters that are still in the prompt
        const filteredParameters = parameters.filter(param => 
          extractedParams.includes(param.name)
        );
        
        setParameters([...filteredParameters, ...newParameters]);
      }
    }
  }, [formData.prompt, isViewMode]);

  // Enhanced validation with detailed error messages
  const validateForm = useCallback((): ValidationError[] => {
    const newErrors: ValidationError[] = [];
    
    // Template name validation
    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      newErrors.push({ field: 'name', message: 'Template name is required' });
    } else if (trimmedName.length < VALIDATION_RULES.templateName.minLength) {
      newErrors.push({ field: 'name', message: `Template name must be at least ${VALIDATION_RULES.templateName.minLength} characters` });
    } else if (trimmedName.length > VALIDATION_RULES.templateName.maxLength) {
      newErrors.push({ field: 'name', message: `Template name must be less than ${VALIDATION_RULES.templateName.maxLength} characters` });
    } else if (!VALIDATION_RULES.templateName.pattern.test(trimmedName)) {
      newErrors.push({ field: 'name', message: 'Template name can only contain letters, numbers, spaces, hyphens, underscores, and periods' });
    }
    
    // Prompt validation
    const trimmedPrompt = formData.prompt.trim();
    if (!trimmedPrompt) {
      newErrors.push({ field: 'prompt', message: 'Template prompt is required' });
    } else if (trimmedPrompt.length < VALIDATION_RULES.prompt.minLength) {
      newErrors.push({ field: 'prompt', message: `Prompt must be at least ${VALIDATION_RULES.prompt.minLength} characters` });
    } else if (trimmedPrompt.length > VALIDATION_RULES.prompt.maxLength) {
      newErrors.push({ field: 'prompt', message: `Prompt must be less than ${VALIDATION_RULES.prompt.maxLength} characters` });
    }

    // Description validation
    if (formData.description && formData.description.length > VALIDATION_RULES.description.maxLength) {
      newErrors.push({ field: 'description', message: `Description must be less than ${VALIDATION_RULES.description.maxLength} characters` });
    }
    
    // Parameter validation
    parameters.forEach((param, index) => {
      const trimmedParamName = param.name.trim();
      if (!trimmedParamName) {
        newErrors.push({ field: `parameter_${index}_name`, message: `Parameter ${index + 1} name is required` });
      } else if (!VALIDATION_RULES.parameterName.pattern.test(trimmedParamName)) {
        newErrors.push({ field: `parameter_${index}_name`, message: `Parameter ${index + 1} name can only contain letters, numbers, and underscores` });
      }
      
      // Check for duplicate parameter names
      const duplicateIndex = parameters.findIndex((p, i) => i !== index && p.name.trim() === trimmedParamName);
      if (duplicateIndex !== -1) {
        newErrors.push({ field: `parameter_${index}_name`, message: `Parameter name "${trimmedParamName}" is already used` });
      }
    });

    // Function calling validation
    if (formData.enableFunctionCalling && selectedFunctions.length === 0) {
      newErrors.push({ field: 'functions', message: 'Please select at least one function when function calling is enabled' });
    }
    
    return newErrors;
  }, [formData, parameters, selectedFunctions]);

  // Enhanced save handler with better error handling
  const handleSave = useCallback(async () => {
    try {
      // Dismiss keyboard
      Keyboard.dismiss();
      
      const validationErrors = validateForm();
      setErrors(validationErrors);
      
      if (validationErrors.length > 0) {
        // Scroll to first error
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        
        // Show error alert
        AlertAPI.alert(
          'Validation Error',
          validationErrors[0].message,
          [{ text: 'OK' }]
        );
        return;
      }
      
      setSaving(true);
      
      // Sanitize form data before saving
      const sanitizedFormData = {
        ...formData,
        name: sanitizeInput(formData.name, VALIDATION_RULES.templateName.maxLength),
        description: sanitizeInput(formData.description, VALIDATION_RULES.description.maxLength),
        prompt: sanitizeInput(formData.prompt, VALIDATION_RULES.prompt.maxLength),
        context: sanitizeInput(formData.context),
      };
      
      const sanitizedParameters = parameters.map(p => ({
        ...p,
        name: sanitizeInput(p.name, VALIDATION_RULES.parameterName.maxLength),
        description: sanitizeInput(p.description || ''),
        defaultValue: sanitizeInput(p.defaultValue || ''),
      }));
      
      console.log('🔥 TEMPLATEFORM: About to save with data:', {
        templateId: template?.id,
        functionIDs: selectedFunctions,
        functionCount: selectedFunctions.length,
        configurationId: sanitizedFormData.configurationId
      });

      const success = await onSave(sanitizedFormData, sanitizedParameters, selectedFunctions);
      
      if (success && isMountedRef.current) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      if (isMountedRef.current) {
        AlertAPI.alert(
          'Save Error',
          'An error occurred while saving the template. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      if (isMountedRef.current) {
        setSaving(false);
      }
    }
  }, [formData, parameters, selectedFunctions, onSave, onClose, validateForm]);

  // Optimized parameter handlers
  const addParameter = useCallback(() => {
    const newParam: Omit<TemplateParameter, 'id'> = {
      name: '',
      parameterType: 'string',
      type: 'string',
      description: '',
      defaultValue: '',
      isRequired: false,
      options: [],
    };

    setParameters(prev => [...prev, newParam]);
  }, []);

  const updateParameter = useCallback((index: number, field: keyof Omit<TemplateParameter, 'id'>, value: any) => {
    setParameters(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    
    // Clear related error
    setErrors(prev => prev.filter(e => e.field !== `parameter_${index}_${field}`));
  }, []);

  const removeParameter = useCallback((index: number) => {
    AlertAPI.alert(
      'Remove Parameter',
      'Are you sure you want to remove this parameter?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            setParameters(prev => prev.filter((_, i) => i !== index));
          }
        },
      ]
    );
  }, []);

  // Optimized variable insertion
  const insertVariable = useCallback((variable: string, field: 'prompt' | 'context') => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || '') + variable,
    }));
  }, []);

  // Optimized form data updater
  const updateFormData = useCallback((field: keyof TemplateFormData, value: any) => {
    if (field === 'configurationId') {
      console.log('🔧 Configuration updated:', value);
    }
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const getFieldError = useCallback((field: string) => {
    return errors.find(e => e.field === field)?.message;
  }, [errors]);



  // Enhanced tooltips with better content
  const tooltips = useMemo(() => ({
    overview: {
      title: "What is an Execution Template?",
      content: "Execution templates are reusable prompt frameworks that can be parameterized and called via API. They enable consistent, repeatable AI interactions with variable inputs and structured outputs.",
      icon: "help-circle"
    },
    name: {
      title: "Template Name",
      content: "A descriptive name for your template. This will be displayed in lists and used when calling the template via API. Choose something memorable and descriptive. Only letters, numbers, spaces, hyphens, underscores, and periods are allowed.",
      icon: "create"
    },
    description: {
      title: "Template Description", 
      content: "Detailed explanation of what this template does, when to use it, and what kind of results to expect. This helps team members understand the template's purpose.",
      icon: "document-text"
    },
    prompt: {
      title: "Main Prompt",
      content: "The core AI instruction that will be executed. Use variables like {{user_input}} for dynamic content. Parameters are automatically detected when you type {{parameter_name}} and will appear below. Minimum 10 characters required.",
      icon: "chatbox"
    },
    context: {
      title: "Context Template",
      content: "Additional context or system instructions that provide background information to the AI. This helps set the tone, style, and constraints for responses.",
      icon: "library"
    },
    configuration: {
      title: "Configuration Selection",
      content: "Choose a configuration that defines the AI model, temperature, token limits, and other settings. Configurations can be managed in the Configure tab.",
      icon: "settings"
    },
    functions: {
      title: "Function Calling",
      content: "Enable the AI to call external functions and APIs. When enabled, you can select which functions this template can access, allowing for dynamic data retrieval and actions.",
      icon: "extension-puzzle"
    },
    parameters: {
      title: "Template Parameters",
      content: "Parameters are automatically detected from your prompt when you use {{variable}} syntax. You can edit their descriptions and settings here. Parameter names can only contain letters, numbers, and underscores.",
      icon: "options"
    }
  }), []);



  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={24} color={colors.accent} />
      </TouchableOpacity>
      <Text style={styles.title}>
        {isViewMode ? 'Template Details' : isEditMode ? 'Edit Template' : 'Create Template'}
      </Text>
      <TouchableOpacity
        style={[styles.headerButton, (loading || isViewMode) && styles.headerButtonDisabled]}
        onPress={handleSave}
        disabled={loading || isViewMode}
      >
        {loading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text style={[styles.saveText, (loading || isViewMode) && styles.saveTextDisabled]}>
            Save
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderTemplateOverview = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="help-circle" size={20} color={colors.accent} />
        <Text style={styles.sectionTitle}>What is an Execution Template?</Text>
        <TouchableOpacity
          style={styles.tooltipButton}
          onPress={() => setShowTooltip('overview')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="information-circle" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Execution templates are reusable prompt frameworks that can be parameterized and called via API. 
          They enable consistent, repeatable AI interactions with variable inputs and structured outputs.
        </Text>
      </View>
    </View>
  );

  const renderBasicInfo = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="information-circle" size={20} color={colors.accent} />
        <Text style={styles.sectionTitle}>Basic Information</Text>
      </View>
      
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.fieldLabel}>Template Name</Text>
            <TouchableOpacity onPress={() => setShowTooltip('name')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
            </TouchableOpacity>
          </View>
          <EnhancedTextEditor
            value={formData.name}
            onChangeText={(text) => updateFormData('name', text)}
            placeholder="Enter template name"
            minHeight={44}
            maxHeight={120}
            showCharacterCount={false}
            showWordCount={false}
            showLineNumbers={false}
            showToolbar={false}
            enableMarkdown={false}
            editable={!isViewMode}
          />
          {getFieldError('name') && (
            <Text style={styles.errorText}>{getFieldError('name')}</Text>
          )}
        </View>
      </View>

      <View style={styles.inputContainer}>
        <View style={styles.labelContainer}>
          <Text style={styles.fieldLabel}>Description</Text>
          <TouchableOpacity onPress={() => setShowTooltip('description')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>
        <EnhancedTextEditor
          value={formData.description}
          onChangeText={(text) => updateFormData('description', text)}
          placeholder="Describe what this template does and when to use it"
          minHeight={80}
          maxHeight={300}
          showCharacterCount={true}
          showWordCount={false}
          showLineNumbers={false}
          showToolbar={false}
          enableMarkdown={true}
          editable={!isViewMode}
        />
        {getFieldError('description') && (
          <Text style={styles.errorText}>{getFieldError('description')}</Text>
        )}
      </View>
    </View>
  );

  const renderPromptSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="chatbox" size={20} color={colors.accent} />
        <Text style={styles.sectionTitle}>Template Prompt</Text>
        <TouchableOpacity onPress={() => setShowTooltip('prompt')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.variablesContainer}>
        <Text style={styles.variablesLabel}>Quick Variables:</Text>
        <View style={styles.variableChips}>
          {TEMPLATE_VARIABLES.map((variable) => (
            <TouchableOpacity
              key={variable}
              style={styles.variableChip}
              onPress={() => insertVariable(variable, 'prompt')}
            >
              <Text style={styles.variableChipText}>{variable}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <EnhancedTextEditor
        value={formData.prompt}
        onChangeText={(text) => updateFormData('prompt', text)}
        placeholder="Enter your template prompt. Use {{variables}} for dynamic content."
        minHeight={200}
        maxHeight={600}
        allowFullscreen={true}
        showCharacterCount={true}
        showWordCount={true}
        showLineNumbers={false}
        showToolbar={true}
        enableMarkdown={true}
        required={true}
        editable={!isViewMode}
      />
      {getFieldError('prompt') && (
        <Text style={styles.errorText}>{getFieldError('prompt')}</Text>
      )}
      
      {/* Real-time parameter detection feedback */}
      {formData.prompt && !isViewMode && (
        (() => {
          const detectedParams = extractParametersFromPrompt(formData.prompt);
          return detectedParams.length > 0 ? (
            <View style={styles.detectedParametersContainer}>
              <Text style={styles.detectedParametersLabel}>
                🔍 Detected Parameters ({detectedParams.length}):
              </Text>
              <View style={styles.detectedParametersList}>
                {detectedParams.map((param, index) => (
                  <View key={index} style={styles.detectedParameterChip}>
                    <Text style={styles.detectedParameterText}>{`{{${param}}}`}</Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null;
        })()
      )}
    </View>
  );

  const renderContextSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="library" size={20} color={colors.accent} />
        <Text style={styles.sectionTitle}>Context Template</Text>
        <TouchableOpacity onPress={() => setShowTooltip('context')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.variablesContainer}>
        <Text style={styles.variablesLabel}>Quick Variables:</Text>
        <View style={styles.variableChips}>
          {TEMPLATE_VARIABLES.map((variable) => (
            <TouchableOpacity
              key={variable}
              style={styles.variableChip}
              onPress={() => insertVariable(variable, 'context')}
            >
              <Text style={styles.variableChipText}>{variable}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <EnhancedTextEditor
        value={formData.context}
        onChangeText={(text) => updateFormData('context', text)}
        placeholder="Additional context or system instructions (optional)"
        minHeight={120}
        maxHeight={400}
        allowFullscreen={true}
        showCharacterCount={true}
        showWordCount={false}
        showLineNumbers={false}
        showToolbar={true}
        enableMarkdown={true}
        editable={!isViewMode}
      />
    </View>
  );

  const renderConfigurationSection = () => {
    console.log('🔥 TEMPLATEFORM: renderConfigurationSection called with formData.configurationId:', formData.configurationId);
    const selectedConfig = configurations.find(config => config.id === formData.configurationId);
    console.log('🔥 TEMPLATEFORM: selectedConfig found:', selectedConfig?.id);
    
    // Debug logging for troubleshooting
    if (!selectedConfig && formData.configurationId) {
      console.log('🔧 Configuration not found:', {
        searchingFor: formData.configurationId,
        available: configurations.map(c => ({ id: c.id, name: c.variationName }))
      });
    }
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="settings" size={20} color={colors.accent} />
          <Text style={styles.sectionTitle}>Configuration</Text>
          <TouchableOpacity onPress={() => setShowTooltip('configuration')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.enhancedSelectorButton}
          onPress={() => setShowConfigurationSelector(true)}
          disabled={isViewMode}
        >
          <View style={styles.modelSelectorContent}>
            <View style={styles.modelSelectorMain}>
              <View style={styles.modelSelectorHeader}>
                <Text style={styles.modelSelectorLabel}>Selected Configuration</Text>
                {selectedConfig?.isSystemResource && (
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.badgeText}>System</Text>
                  </View>
                )}
              </View>
              <Text style={styles.modelSelectorValue}>
{selectedConfig?.variationName || 'No Configuration Selected'}
                {console.log('🔥 TEMPLATEFORM: Rendering with selectedConfig:', selectedConfig?.id, 'formData.configurationId:', formData.configurationId)}
              </Text>
              <Text style={styles.modelSelectorDescription}>
                Model: {selectedConfig?.modelName || 'Unknown'} | 
                Temp: {selectedConfig?.temperature || 'Default'} | 
                Max Tokens: {selectedConfig?.maxTokens || 'Default'}
              </Text>
              {selectedConfig?.systemPrompt && (
                <Text style={styles.modelIdealFor} numberOfLines={2}>
                  💡 System: {selectedConfig.systemPrompt}
                </Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFunctionsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="extension-puzzle" size={20} color={colors.accent} />
        <Text style={styles.sectionTitle}>Function Calling</Text>
        <TouchableOpacity onPress={() => setShowTooltip('functions')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.switchContainer}>
        <View style={styles.switchLabel}>
          <Text style={styles.switchText}>Enable Function Calling</Text>
          <Text style={styles.switchDescription}>
            Allow AI to call external functions and APIs
          </Text>
        </View>
        <Switch
          value={formData.enableFunctionCalling}
          onValueChange={(value) => updateFormData('enableFunctionCalling', value)}
          disabled={isViewMode}
          trackColor={{ false: colors.borderLight, true: colors.accent }}
          thumbColor={Platform.OS === 'android' ? (formData.enableFunctionCalling ? colors.textInverse : '#F4F3F4') : ''}
        />
      </View>

      {formData.enableFunctionCalling && (
        <>
          {/* Edit Mode: Show button to open selector */}
          {!isViewMode && (
            <TouchableOpacity
              style={styles.functionsButton}
              onPress={() => setShowFunctionSelector(true)}
            >
              <View style={styles.functionsContent}>
                <Text style={styles.functionsLabel}>
                  Selected Functions ({selectedFunctions.length})
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </TouchableOpacity>
          )}

          {/* View Mode: Show expanded function list */}
          {isViewMode && (
            <View style={styles.functionsViewContainer}>
              <Text style={styles.functionsViewLabel}>
                Selected Functions ({selectedFunctions.length})
              </Text>
              {selectedFunctionDetails.length > 0 ? (
                <View style={styles.functionsList}>
                  {selectedFunctionDetails.map((func, index) => func ? (
                    <View key={func.id || index} style={styles.functionItem}>
                      <View style={styles.functionItemHeader}>
                        <Ionicons name="cube" size={16} color={colors.accent} />
                        <Text style={styles.functionName}>{func.name}</Text>
                      </View>
                      {func.description && (
                        <Text style={styles.functionDescription}>{func.description}</Text>
                      )}
                    </View>
                  ) : null)}
                </View>
              ) : (
                <View style={styles.noFunctionsContainer}>
                  <Text style={styles.noFunctionsText}>No functions selected</Text>
                </View>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderParametersSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="options" size={20} color={colors.accent} />
        <Text style={styles.sectionTitle}>Parameters</Text>
        <TouchableOpacity onPress={() => setShowTooltip('parameters')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {parameters.length > 0 ? (
        <View style={styles.parametersInfo}>
          <Text style={styles.parametersInfoText}>
            Parameters are automatically detected from your prompt. Edit their details below:
          </Text>
        </View>
      ) : (
        <View style={styles.parametersInfo}>
          <Text style={styles.parametersInfoText}>
            💡 Add parameters to your prompt using {`{{parameter_name}}`} syntax and they will appear here automatically.
          </Text>
        </View>
      )}

      {parameters.map((param, index) => (
        <View key={index} style={styles.parameterCard}>
          <View style={styles.parameterHeader}>
            <View style={styles.parameterHeaderLeft}>
              <Ionicons name="cube-outline" size={16} color={colors.accent} />
              <Text style={styles.parameterTitle}>{`{{${param.name}}}`}</Text>
              <View style={styles.autoDetectedBadge}>
                <Text style={styles.autoDetectedText}>Auto-detected</Text>
              </View>
            </View>
            {!isViewMode && (
              <TouchableOpacity
                onPress={() => removeParameter(index)}
                style={styles.removeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="trash" size={16} color={colors.statusError} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.parameterRow}>
            <View style={styles.parameterField}>
              <Text style={styles.parameterFieldLabel}>Parameter Name</Text>
              <View style={styles.parameterNameContainer}>
                <Text style={styles.parameterNameValue}>{param.name}</Text>
                <Text style={styles.parameterNameNote}>Detected from prompt</Text>
              </View>
            </View>
            <View style={styles.parameterField}>
              <Text style={styles.parameterFieldLabel}>Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={param.type}
                  onValueChange={(value) => updateParameter(index, 'type', value)}
                  enabled={!isViewMode}
                  style={styles.picker}
                >
                  <Picker.Item label="String" value="string" />
                  <Picker.Item label="Number" value="number" />
                  <Picker.Item label="Boolean" value="boolean" />
                  <Picker.Item label="Array" value="array" />
                  <Picker.Item label="Object" value="object" />
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.parameterDescriptionContainer}>
            <Text style={styles.parameterFieldLabel}>Description</Text>
            <EnhancedTextEditor
              value={param.description}
              onChangeText={(text) => updateParameter(index, 'description', text)}
              placeholder="Describe what this parameter is used for..."
              minHeight={60}
              maxHeight={200}
              showCharacterCount={true}
              showWordCount={false}
              showLineNumbers={false}
              showToolbar={false}
              enableMarkdown={false}
              editable={!isViewMode}
            />
          </View>
          {getFieldError(`parameter_${index}_description`) && (
            <Text style={styles.errorText}>{getFieldError(`parameter_${index}_description`)}</Text>
          )}
        </View>
      ))}
    </View>
  );

  const renderConfigurationSelector = () => (
    <ConfigurationModal
      visible={showConfigurationSelector}
      onClose={() => {
        console.log('🔧 Configuration modal closed');
        setShowConfigurationSelector(false);
      }}
      configurations={configurations}
      selectedConfigurations={formData.configurationId ? [formData.configurationId] : []}
      onSelectionChange={(configIds) => {
        console.log('🔥 TEMPLATEFORM: Current formData.configurationId when selector changes:', formData.configurationId);
        console.log('🔧 Configuration selection changed:', configIds, 'current:', formData.configurationId);
        
        // For templates, we want single-selection behavior
        if (configIds.length === 1) {
          // Perfect - user selected exactly one
          const newConfigId = configIds[0];
          console.log('🔧 Single configuration selected:', newConfigId);
          updateFormData('configurationId', newConfigId);
        } else if (configIds.length > 1) {
          // Multiple selected - enforce single selection by keeping only the most recent
          const newConfigId = configIds[configIds.length - 1];
          console.log('🔧 Multiple selected, enforcing single selection:', newConfigId);
          updateFormData('configurationId', newConfigId);
          // Update the modal's selection to reflect single selection
          // The modal will re-render with the updated selectedConfigurations prop
        } else if (configIds.length === 0) {
          // All deselected - clear the configuration
          console.log('🔧 All configurations deselected');
          updateFormData('configurationId', '');
        }
        // Let user click "Done" to close the modal
      }}
    />
  );

  const selectedFunctionDetails = useMemo(() => {
    return selectedFunctions.map(functionId => 
      availableFunctions.find(func => func.id === functionId)
    ).filter(Boolean);
  }, [selectedFunctions, availableFunctions]);

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {renderTemplateOverview()}
        {renderBasicInfo()}
        {renderPromptSection()}
        {renderParametersSection()}
        {renderContextSection()}
        {renderConfigurationSection()}
        {renderFunctionsSection()}
      </ScrollView>

      {renderConfigurationSelector()}

      <Modal
        visible={showFunctionSelector}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFunctionSelector(false)}
      >
        <FunctionSelector
          visible={showFunctionSelector}
          functions={availableFunctions}
          selectedFunctions={selectedFunctions}
          onSelectionChange={setSelectedFunctions}
          onClose={() => setShowFunctionSelector(false)}
        />
      </Modal>

      {Object.entries(tooltips).map(([key, tooltip]) => (
        <TooltipComponent
          key={key}
          title={tooltip.title}
          content={tooltip.content}
          icon={tooltip.icon}
          visible={showTooltip === key}
          onClose={() => setShowTooltip('')}
          themedStyles={styles}
          themeColors={colors}
        />
      ))}
    </SafeAreaView>
  );
};

export default TemplateForm;