import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
  Switch,
  FlatList,
  Alert,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import TextEditor from './TextEditor';
import { FunctionSelector } from './FunctionSelector';

import { ExecutionTemplate, TemplateFormData, TemplateParameter } from '../types/templates';
import { FunctionDefinition, GEMINI_MODELS } from '../types';
import { containerStyles, shadowPresets, textInputStyles, containerColors } from '../styles/containers';

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

// Memoized Tooltip component for performance
const Tooltip: React.FC<TooltipProps> = React.memo(({ title, content, icon, visible, onClose }) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.tooltipOverlay}>
      <View style={styles.tooltipContainer}>
        <View style={styles.tooltipHeader}>
          <Ionicons name={icon as any} size={24} color="#007AFF" />
          <Text style={styles.tooltipTitle}>{title}</Text>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.tooltipClose}
            accessibilityLabel="Close tooltip"
            accessibilityRole="button"
          >
            <Ionicons name="close" size={20} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        <Text style={styles.tooltipContent}>{content}</Text>
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
    modelName: 'gemini-1.5-flash',
  });

  const [parameters, setParameters] = useState<Omit<TemplateParameter, 'id'>[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [loading, setSaving] = useState(false);
  const [showFunctionSelector, setShowFunctionSelector] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Modal states
  const [showModelSelector, setShowModelSelector] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string>('');

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize form with template data (optimized with useMemo)
  const initialFormData = useMemo(() => {
    if (!template) return null;
    
    return {
      name: sanitizeInput(template.name || '', VALIDATION_RULES.templateName.maxLength),
      description: sanitizeInput(template.description || '', VALIDATION_RULES.description.maxLength),
      prompt: sanitizeInput((template.prompt || template.templatePrompt || ''), VALIDATION_RULES.prompt.maxLength),
      context: sanitizeInput((template.context || template.contextTemplate || '')),
      enableFunctionCalling: Boolean(template.enableFunctionCalling),
      tags: Array.isArray(template.tags) ? template.tags.join(', ') : '',
      modelName: template.modelName || 'gemini-1.5-flash',
    };
  }, [template]);

  // Initialize form when template changes
  useEffect(() => {
    if (initialFormData) {
      setFormData(initialFormData);
      
      if (template?.parameters) {
        const sanitizedParams = template.parameters.map(p => ({
          name: sanitizeInput(p.name, VALIDATION_RULES.parameterName.maxLength),
          parameterType: p.parameterType || p.type || 'text',
          type: p.type || p.parameterType || 'text',
          description: sanitizeInput(p.description || ''),
          defaultValue: sanitizeInput(p.defaultValue || ''),
          isRequired: Boolean(p.isRequired),
          options: Array.isArray(p.options) ? p.options : [],
        }));
        setParameters(sanitizedParams);
      }

      if (template?.functionIds) {
        setSelectedFunctions(template.functionIds);
      }
    }
  }, [initialFormData, template]);

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
        Alert.alert(
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
      
      const success = await onSave(sanitizedFormData, sanitizedParameters, selectedFunctions);
      
      if (success && isMountedRef.current) {
        onClose();
      }
    } catch (error) {
      console.error('Error saving template:', error);
      if (isMountedRef.current) {
        Alert.alert(
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
      parameterType: 'text',
      type: 'text',
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
    Alert.alert(
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
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors(prev => prev.filter(e => e.field !== field));
  }, []);

  const getFieldError = useCallback((field: string) => {
    return errors.find(e => e.field === field)?.message;
  }, [errors]);

  // Memoized model info
  const getModelInfo = useCallback((modelName: string) => {
    const model = GEMINI_MODELS.find(m => m.value === modelName);
    return {
      name: model?.label || modelName,
      description: model?.description || '',
      maxTokens: model?.maxTokens || 'Unknown',
      isRecommended: modelName === 'gemini-1.5-flash',
    };
  }, []);

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
      content: "The core AI instruction that will be executed. Use variables like {{user_input}} for dynamic content. This is the primary instruction that guides the AI's response. Minimum 10 characters required.",
      icon: "chatbox"
    },
    context: {
      title: "Context Template",
      content: "Additional context or system instructions that provide background information to the AI. This helps set the tone, style, and constraints for responses.",
      icon: "library"
    },
    model: {
      title: "AI Model Selection",
      content: "Choose the AI model that will process this template. Different models have varying capabilities, speed, and cost. Gemini 1.5 Flash is recommended for most use cases.",
      icon: "hardware-chip"
    },
    functions: {
      title: "Function Calling",
      content: "Enable the AI to call external functions and APIs. When enabled, you can select which functions this template can access, allowing for dynamic data retrieval and actions.",
      icon: "extension-puzzle"
    },
    parameters: {
      title: "Template Parameters",
      content: "Define input variables that users can provide when executing this template. Parameters make templates flexible and reusable for different scenarios. Parameter names can only contain letters, numbers, and underscores.",
      icon: "options"
    }
  }), []);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={onClose}>
        <Ionicons name="close" size={24} color="#007AFF" />
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
          <ActivityIndicator size="small" color="#007AFF" />
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
        <Ionicons name="help-circle" size={20} color="#007AFF" />
        <Text style={styles.sectionTitle}>What is an Execution Template?</Text>
        <TouchableOpacity 
          style={styles.tooltipButton}
          onPress={() => setShowTooltip('overview')}
        >
          <Ionicons name="information-circle" size={20} color="#007AFF" />
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
        <Ionicons name="information-circle" size={20} color="#007AFF" />
        <Text style={styles.sectionTitle}>Basic Information</Text>
      </View>
      
      <View style={styles.inputRow}>
        <View style={styles.inputContainer}>
          <View style={styles.labelContainer}>
            <Text style={styles.fieldLabel}>Template Name</Text>
            <TouchableOpacity onPress={() => setShowTooltip('name')}>
              <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <TextEditor
            value={formData.name}
            onChangeText={(text) => updateFormData('name', text)}
            placeholder="Enter template name"
            style={[textInputStyles.base, getFieldError('name') && textInputStyles.error]}
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
          <TouchableOpacity onPress={() => setShowTooltip('description')}>
            <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>
        <TextEditor
          value={formData.description}
          onChangeText={(text) => updateFormData('description', text)}
          placeholder="Describe what this template does and when to use it"
          style={[textInputStyles.base, styles.textArea]}
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
        <Ionicons name="chatbox" size={20} color="#007AFF" />
        <Text style={styles.sectionTitle}>Template Prompt</Text>
        <TouchableOpacity onPress={() => setShowTooltip('prompt')}>
          <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
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

      <TextEditor
        value={formData.prompt}
        onChangeText={(text) => updateFormData('prompt', text)}
        placeholder="Enter your template prompt. Use {{variables}} for dynamic content."
        style={[textInputStyles.base, styles.promptArea, getFieldError('prompt') && textInputStyles.error]}
        editable={!isViewMode}
      />
      {getFieldError('prompt') && (
        <Text style={styles.errorText}>{getFieldError('prompt')}</Text>
      )}
    </View>
  );

  const renderContextSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="library" size={20} color="#007AFF" />
        <Text style={styles.sectionTitle}>Context Template</Text>
        <TouchableOpacity onPress={() => setShowTooltip('context')}>
          <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
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

      <TextEditor
        value={formData.context}
        onChangeText={(text) => updateFormData('context', text)}
        placeholder="Additional context or system instructions (optional)"
        style={[textInputStyles.base, styles.promptArea]}
        editable={!isViewMode}
      />
    </View>
  );

  const renderModelSection = () => {
    const modelInfo = getModelInfo(formData.modelName);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="hardware-chip" size={20} color="#007AFF" />
          <Text style={styles.sectionTitle}>AI Model</Text>
          <TouchableOpacity onPress={() => setShowTooltip('model')}>
            <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowModelSelector(true)}
          disabled={isViewMode}
        >
          <View style={styles.selectorContent}>
            <View style={styles.selectorMain}>
              <Text style={styles.selectorLabel}>Selected Model</Text>
              <Text style={styles.selectorValue}>{modelInfo.name}</Text>
              {modelInfo.isRecommended && (
                <View style={styles.recommendedBadge}>
                  <Text style={styles.badgeText}>Recommended</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFunctionsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name="extension-puzzle" size={20} color="#007AFF" />
        <Text style={styles.sectionTitle}>Function Calling</Text>
        <TouchableOpacity onPress={() => setShowTooltip('functions')}>
          <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
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
          trackColor={{ false: '#E1E5E9', true: '#007AFF' }}
          thumbColor={Platform.OS === 'android' ? (formData.enableFunctionCalling ? '#FFFFFF' : '#F4F3F4') : ''}
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
                <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
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
                        <Ionicons name="cube" size={16} color="#007AFF" />
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
        <Ionicons name="options" size={20} color="#007AFF" />
        <Text style={styles.sectionTitle}>Parameters</Text>
        <TouchableOpacity onPress={() => setShowTooltip('parameters')}>
          <Ionicons name="help-circle-outline" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {parameters.map((param, index) => (
        <View key={index} style={styles.parameterCard}>
          <View style={styles.parameterHeader}>
            <Text style={styles.parameterTitle}>Parameter {index + 1}</Text>
            <TouchableOpacity
              onPress={() => removeParameter(index)}
              disabled={isViewMode}
              style={styles.removeButton}
            >
              <Ionicons name="trash" size={16} color="#FF3B30" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.parameterRow}>
            <View style={styles.parameterField}>
              <Text style={styles.parameterFieldLabel}>Name</Text>
              <TextEditor
                value={param.name}
                onChangeText={(text) => updateParameter(index, 'name', text)}
                placeholder="parameter_name"
                style={[textInputStyles.base, styles.parameterInput]}
                editable={!isViewMode}
              />
              {getFieldError(`parameter_${index}_name`) && (
                <Text style={styles.errorText}>{getFieldError(`parameter_${index}_name`)}</Text>
              )}
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
                  <Picker.Item label="Text" value="text" />
                  <Picker.Item label="Number" value="number" />
                  <Picker.Item label="Boolean" value="boolean" />
                  <Picker.Item label="Select" value="select" />
                </Picker>
              </View>
            </View>
          </View>

          <TextEditor
            value={param.description}
            onChangeText={(text) => updateParameter(index, 'description', text)}
            placeholder="Parameter description"
            style={[textInputStyles.base, styles.parameterInput]}
            editable={!isViewMode}
          />
          {getFieldError(`parameter_${index}_description`) && (
            <Text style={styles.errorText}>{getFieldError(`parameter_${index}_description`)}</Text>
          )}
        </View>
      ))}

      {!isViewMode && (
        <TouchableOpacity style={styles.addParameterButton} onPress={addParameter}>
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.addParameterText}>Add Parameter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderModelSelector = () => (
    <Modal visible={showModelSelector} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select AI Model</Text>
          <TouchableOpacity 
            style={styles.modalCloseButton}
            onPress={() => setShowModelSelector(false)}
          >
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={GEMINI_MODELS}
          style={styles.modelList}
          keyExtractor={(item) => item.value}
          renderItem={({ item }) => {
            const isSelected = formData.modelName === item.value;
            const isRecommended = item.value === 'gemini-1.5-flash';
            
            return (
              <TouchableOpacity
                style={[styles.modelCard, isSelected && styles.modelCardSelected]}
                onPress={() => {
                  updateFormData('modelName', item.value);
                  setShowModelSelector(false);
                }}
              >
                <View style={styles.modelCardHeader}>
                  <Text style={[styles.modelCardTitle, isSelected && styles.modelCardTitleSelected]}>
                    {item.label}
                  </Text>
                  {isRecommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.badgeText}>Recommended</Text>
                    </View>
                  )}
                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                    </View>
                  )}
                </View>
                <Text style={[styles.modelCardDescription, isSelected && styles.modelCardDescriptionSelected]}>
                  {item.description}
                </Text>
                <Text style={[styles.modelCardTokens, isSelected && styles.modelCardDescriptionSelected]}>
                  Max tokens: {item.maxTokens?.toLocaleString() || 'Unknown'}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </Modal>
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
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {renderTemplateOverview()}
        {renderBasicInfo()}
        {renderPromptSection()}
        {renderContextSection()}
        {renderModelSection()}
        {renderFunctionsSection()}
        {renderParametersSection()}
      </ScrollView>

      {renderModelSelector()}

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
        <Tooltip
          key={key}
          title={tooltip.title}
          content={tooltip.content}
          icon={tooltip.icon}
          visible={showTooltip === key}
          onClose={() => setShowTooltip('')}
        />
      ))}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: containerColors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
    ...shadowPresets.subtle,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  saveTextDisabled: {
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  tooltipButton: {
    padding: 4,
  },
  infoCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  infoText: {
    fontSize: 14,
    color: '#5A6C7D',
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputContainer: {
    flex: 1,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  promptArea: {
    minHeight: 120,
    textAlignVertical: 'top',
  },
  variablesContainer: {
    marginBottom: 12,
  },
  variablesLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 8,
  },
  variableChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variableChip: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  variableChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  selectorButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    ...shadowPresets.subtle,
  },
  selectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorMain: {
    flex: 1,
  },
  selectorLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  selectorValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    ...shadowPresets.subtle,
  },
  switchLabel: {
    flex: 1,
    marginRight: 16,
  },
  switchText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 12,
    color: '#8E8E93',
  },
  functionsButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    ...shadowPresets.subtle,
  },
  functionsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  functionsLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  functionsViewContainer: {
    marginTop: 12,
  },
  functionsViewLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  functionsList: {
    gap: 8,
  },
  functionItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  functionItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  functionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  functionDescription: {
    fontSize: 12,
    color: '#8E8E93',
    lineHeight: 16,
  },
  noFunctionsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  noFunctionsText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  parameterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    ...shadowPresets.subtle,
  },
  parameterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  parameterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  removeButton: {
    padding: 8,
  },
  parameterRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  parameterField: {
    flex: 1,
  },
  parameterFieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  parameterInput: {
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
  },
  picker: {
    height: 44,
  },
  addParameterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    gap: 8,
  },
  addParameterText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: containerColors.background,
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
  modalCloseButton: {
    padding: 4,
  },
  
  // Model Selector
  modelList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modelCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    position: 'relative',
    ...shadowPresets.subtle,
  },
  modelCardSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modelCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modelCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    marginRight: 8,
  },
  modelCardTitleSelected: {
    color: '#FFFFFF',
  },
  modelCardDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 4,
  },
  modelCardDescriptionSelected: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  modelCardTokens: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  recommendedBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  
  // Tooltip Styles
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  tooltipContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    maxWidth: '90%',
    ...shadowPresets.dramatic,
  },
  tooltipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
    flex: 1,
  },
  tooltipClose: {
    padding: 4,
  },
  tooltipContent: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});

export default TemplateForm; 