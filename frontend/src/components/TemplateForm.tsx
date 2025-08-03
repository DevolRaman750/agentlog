import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import TextEditor from './TextEditor';
import { FunctionSelector } from './FunctionSelector';

import { ExecutionTemplate, TemplateFormData, TemplateParameter } from '../types/templates';
import { FunctionDefinition, GEMINI_MODELS } from '../types';
import { webInputStyles } from '../styles/containers';

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

const PARAMETER_TYPES = [
  { value: 'text', label: 'Text Input', icon: 'text-outline' },
  { value: 'textarea', label: 'Text Area', icon: 'document-text-outline' },
  { value: 'number', label: 'Number', icon: 'calculator-outline' },
  { value: 'boolean', label: 'Boolean (Yes/No)', icon: 'checkmark-circle-outline' },
  { value: 'select', label: 'Select Option', icon: 'list-outline' },
  { value: 'multiselect', label: 'Multiple Select', icon: 'checkbox-outline' },
  { value: 'date', label: 'Date', icon: 'calendar-outline' },
  { value: 'file', label: 'File Path', icon: 'document-outline' },
  { value: 'json', label: 'JSON Object', icon: 'code-outline' },
];

const TEMPLATE_VARIABLES = [
  '{{user_input}}',
  '{{context}}',
  '{{current_date}}',
  '{{current_time}}',
  '{{parameter_name}}',
];

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  isEditMode,
  isViewMode,
  configurations,
  availableFunctions,
  onSave,
  onClose,
}) => {
  // Form state
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
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
  }>({ visible: false, title: '', message: '', type: 'info' });

  // Initialize form with template data
  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        prompt: template.prompt || template.templatePrompt || '',
        context: template.context || template.contextTemplate || '',
        enableFunctionCalling: template.enableFunctionCalling || false,
        tags: Array.isArray(template.tags) ? template.tags.join(', ') : '',
        modelName: template.modelName || 'gemini-1.5-flash',
      });

      if (template.parameters) {
        setParameters(template.parameters.map(p => ({
          name: p.name,
          type: p.type || 'text',
          description: p.description || '',
          defaultValue: p.defaultValue || '',
          isRequired: p.isRequired || false,
          options: p.options || [],
        })));
      }

      if (template.functionIds) {
        setSelectedFunctions(template.functionIds);
      }
    }
  }, [template]);

  const validateForm = useCallback((): ValidationError[] => {
    const newErrors: ValidationError[] = [];

    if (!formData.name.trim()) {
      newErrors.push({ field: 'name', message: 'Template name is required' });
    }

    if (!formData.prompt.trim()) {
      newErrors.push({ field: 'prompt', message: 'Template prompt is required' });
    }

    // Validate parameters
    parameters.forEach((param, index) => {
      if (!param.name.trim()) {
        newErrors.push({ field: `parameter_${index}_name`, message: `Parameter ${index + 1} name is required` });
      }
      if (!param.type) {
        newErrors.push({ field: `parameter_${index}_type`, message: `Parameter ${index + 1} type is required` });
      }
    });

    return newErrors;
  }, [formData, parameters]);

  const handleSave = async () => {
    const validationErrors = validateForm();
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      setAlertConfig({
        visible: true,
        title: 'Validation Error',
        message: 'Please fix the validation errors before saving.',
        type: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const success = await onSave(formData, parameters, selectedFunctions);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Save error:', error);
      setAlertConfig({
        visible: true,
        title: 'Save Error',
        message: 'Failed to save template. Please try again.',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const addParameter = () => {
    const newParam: Omit<TemplateParameter, 'id'> = {
      name: '',
      type: 'text',
      description: '',
      defaultValue: '',
      isRequired: false,
      options: [],
    };
    setParameters([...parameters, newParam]);
  };

  const updateParameter = (index: number, field: keyof Omit<TemplateParameter, 'id'>, value: any) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const insertVariable = useCallback((variable: string, field: 'prompt' | 'context') => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] || '') + variable,
    }));
  }, []);

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerButton} onPress={onClose}>
        <Ionicons name="close" size={24} color="#007AFF" />
      </TouchableOpacity>
      <Text style={styles.title}>
        {isViewMode ? 'View Template' : isEditMode ? 'Edit Template' : 'Create Template'}
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

  const renderTemplateVariables = (targetField: 'prompt' | 'context') => (
    <View style={styles.variablesContainer}>
      <Text style={styles.variablesLabel}>Quick Variables:</Text>
      <View style={styles.variableChips}>
        {TEMPLATE_VARIABLES.map((variable) => (
          <TouchableOpacity
            key={variable}
            style={styles.variableChip}
            onPress={() => insertVariable(variable, targetField)}
          >
            <Text style={styles.variableChipText}>{variable}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBasicFields = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Ionicons name="create-outline" size={20} color="#007AFF" />
        <Text style={styles.fieldLabel}>Template Name</Text>
        <Text style={styles.requiredText}>Required</Text>
      </View>
      <TextEditor
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder="Enter template name"
        style={[styles.input, webInputStyles]}
        editable={!isViewMode}
        multiline={false}
      />
      {errors.find(e => e.field === 'name') && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{errors.find(e => e.field === 'name')?.message}</Text>
        </View>
      )}
    </View>
  );

  const renderDescriptionField = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Ionicons name="document-text-outline" size={20} color="#007AFF" />
        <Text style={styles.fieldLabel}>Description</Text>
        <Text style={styles.optionalText}>Optional</Text>
      </View>
      <Text style={styles.fieldDescription}>
        Describe what this template does and when to use it
      </Text>
      <TextEditor
        value={formData.description}
        onChangeText={(text) => setFormData({ ...formData, description: text })}
        placeholder="Enter template description"
        style={[styles.input, styles.textArea, webInputStyles]}
        editable={!isViewMode}
        multiline={true}
      />
    </View>
  );

  const renderPromptField = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#007AFF" />
        <Text style={styles.fieldLabel}>Template Prompt</Text>
        <Text style={styles.requiredText}>Required</Text>
      </View>
      <Text style={styles.fieldDescription}>
        Use {'{{parameter_name}}'} syntax for dynamic parameters
      </Text>
      {renderTemplateVariables('prompt')}
      <TextEditor
        value={formData.prompt}
        onChangeText={(text) => setFormData({ ...formData, prompt: text })}
        placeholder="Enter your template prompt..."
        style={[styles.input, styles.textArea, webInputStyles]}
        editable={!isViewMode}
        multiline={true}
      />
      {errors.find(e => e.field === 'prompt') && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{errors.find(e => e.field === 'prompt')?.message}</Text>
        </View>
      )}
    </View>
  );

  const renderContextField = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Ionicons name="library-outline" size={20} color="#007AFF" />
        <Text style={styles.fieldLabel}>Context Template</Text>
        <Text style={styles.optionalText}>Optional</Text>
      </View>
      <Text style={styles.fieldDescription}>
        Additional context or instructions for the AI
      </Text>
      {renderTemplateVariables('context')}
      <TextEditor
        value={formData.context}
        onChangeText={(text) => setFormData({ ...formData, context: text })}
        placeholder="Enter context template..."
        style={[styles.input, styles.textArea, webInputStyles]}
        editable={!isViewMode}
        multiline={true}
      />
    </View>
  );

  const renderFunctionCalling = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Ionicons name="extension-puzzle-outline" size={20} color="#007AFF" />
        <Text style={styles.fieldLabel}>Function Calling</Text>
      </View>
      <Text style={styles.fieldDescription}>
        Enable AI functions for enhanced capabilities
      </Text>
      
      <View style={styles.toggleContainer}>
        <Switch
          value={formData.enableFunctionCalling}
          onValueChange={(value) => setFormData({ ...formData, enableFunctionCalling: value })}
          disabled={isViewMode}
          trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
          thumbColor="#FFFFFF"
        />
        <Text style={styles.toggleText}>
          {formData.enableFunctionCalling ? 'Enabled' : 'Disabled'}
        </Text>
      </View>

      {formData.enableFunctionCalling && (
        <View style={styles.functionsContainer}>
          <TouchableOpacity
            style={styles.selectorButton}
            onPress={() => setShowFunctionSelector(true)}
            disabled={isViewMode}
          >
            <View style={styles.selectorContent}>
              <View style={styles.selectorLeft}>
                <Ionicons name="extension-puzzle" size={20} color="#007AFF" />
                <Text style={styles.selectorText}>
                  {selectedFunctions.length > 0
                    ? `${selectedFunctions.length} function${selectedFunctions.length > 1 ? 's' : ''} selected`
                    : 'Tap to select functions'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
            </View>
          </TouchableOpacity>

          {selectedFunctions.length > 0 && (
            <View style={styles.selectedFunctions}>
              {selectedFunctions.map((functionId) => {
                const func = availableFunctions.find(f => f.id === functionId);
                return func ? (
                  <View key={functionId} style={styles.functionChip}>
                    <Text style={styles.functionChipText}>{func.displayName || func.name}</Text>
                    {!isViewMode && (
                      <TouchableOpacity
                        onPress={() => setSelectedFunctions(prev => prev.filter(id => id !== functionId))}
                        style={styles.removeChipButton}
                      >
                        <Ionicons name="close" size={14} color="#007AFF" />
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null;
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );

  const renderParameters = () => (
    <View style={styles.fieldContainer}>
      <View style={styles.labelContainer}>
        <Ionicons name="settings-outline" size={20} color="#007AFF" />
        <Text style={styles.fieldLabel}>Template Parameters</Text>
        <Text style={styles.optionalText}>Optional</Text>
      </View>
      <Text style={styles.fieldDescription}>
        Define parameters that users can customize when using this template
      </Text>

      {parameters.map((param, index) => (
        <View key={index} style={styles.parameterCard}>
          <View style={styles.parameterHeader}>
            <Text style={styles.parameterTitle}>Parameter {index + 1}</Text>
            {!isViewMode && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeParameter(index)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.parameterGrid}>
            <View style={styles.parameterField}>
              <Text style={styles.parameterLabel}>Name</Text>
              <TextEditor
                value={param.name}
                onChangeText={(text) => updateParameter(index, 'name', text)}
                placeholder="parameter_name"
                style={[styles.parameterInput, webInputStyles]}
                editable={!isViewMode}
                multiline={false}
              />
            </View>
            <View style={styles.parameterField}>
              <Text style={styles.parameterLabel}>Type</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={param.type}
                  onValueChange={(value) => updateParameter(index, 'type', value)}
                  style={styles.parameterPicker}
                  enabled={!isViewMode}
                >
                  {PARAMETER_TYPES.map((type) => (
                    <Picker.Item key={type.value} label={type.label} value={type.value} />
                  ))}
                </Picker>
              </View>
            </View>
          </View>

          <View style={styles.parameterField}>
            <Text style={styles.parameterLabel}>Description</Text>
            <TextEditor
              value={param.description}
              onChangeText={(text) => updateParameter(index, 'description', text)}
              placeholder="Parameter description"
              style={[styles.parameterInput, webInputStyles]}
              editable={!isViewMode}
              multiline={false}
            />
          </View>

          <View style={styles.parameterGrid}>
            <View style={styles.parameterField}>
              <Text style={styles.parameterLabel}>Default Value</Text>
              <TextEditor
                value={param.defaultValue}
                onChangeText={(text) => updateParameter(index, 'defaultValue', text)}
                placeholder="Default value"
                style={[styles.parameterInput, webInputStyles]}
                editable={!isViewMode}
                multiline={false}
              />
            </View>
            <View style={styles.parameterOptions}>
              <Switch
                value={param.isRequired}
                onValueChange={(value) => updateParameter(index, 'isRequired', value)}
                disabled={isViewMode}
                trackColor={{ false: '#E5E5EA', true: '#FF3B30' }}
                thumbColor="#FFFFFF"
              />
              <Text style={styles.toggleText}>Required</Text>
            </View>
          </View>
        </View>
      ))}

      {!isViewMode && (
        <TouchableOpacity style={styles.addButton} onPress={addParameter}>
          <Ionicons name="add" size={20} color="#007AFF" />
          <Text style={styles.addButtonText}>Add Parameter</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderAdvancedSection = () => (
    <View style={styles.optionalSection}>
      <TouchableOpacity
        style={styles.optionalHeader}
        onPress={() => setShowAdvanced(!showAdvanced)}
      >
        <View style={styles.optionalHeaderLeft}>
          <Ionicons 
            name={showAdvanced ? "chevron-down" : "chevron-forward"} 
            size={20} 
            color="#6B6B6B" 
          />
          <Text style={styles.optionalHeaderText}>Advanced Settings</Text>
        </View>
        <View style={styles.optionalBadge}>
          <Text style={styles.optionalBadgeText}>2</Text>
        </View>
      </TouchableOpacity>

      {showAdvanced && (
        <View style={styles.optionalFields}>
          <View style={styles.compactFieldContainer}>
            <View style={styles.compactLabelContainer}>
              <Ionicons name="pricetag-outline" size={16} color="#007AFF" />
              <Text style={styles.compactFieldLabel}>Tags</Text>
            </View>
            <TextEditor
              value={formData.tags}
              onChangeText={(text) => setFormData({ ...formData, tags: text })}
              placeholder="tag1, tag2, tag3"
              style={[styles.compactInput, webInputStyles]}
              editable={!isViewMode}
              multiline={false}
            />
          </View>

          <View style={styles.compactFieldContainer}>
            <View style={styles.compactLabelContainer}>
              <Ionicons name="hardware-chip-outline" size={16} color="#007AFF" />
              <Text style={styles.compactFieldLabel}>AI Model</Text>
            </View>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={formData.modelName}
                onValueChange={(value) => setFormData({ ...formData, modelName: value })}
                style={styles.picker}
                enabled={!isViewMode}
              >
                {GEMINI_MODELS.map((model) => (
                  <Picker.Item key={model.value} label={model.label} value={model.value} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  return (
    <Modal visible={true} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderBasicFields()}
          {renderDescriptionField()}
          {renderPromptField()}
          {renderContextField()}
          {renderFunctionCalling()}
          {renderParameters()}
          {renderAdvancedSection()}
        </ScrollView>

        {/* Function Selector Modal */}
        <FunctionSelector
          visible={showFunctionSelector}
          functions={availableFunctions}
          selectedFunctions={selectedFunctions}
          onSelectionChange={setSelectedFunctions}
          onClose={() => setShowFunctionSelector(false)}
        />

        {/* Custom Alert */}
        <Modal visible={alertConfig.visible} transparent animationType="fade">
          <View style={styles.alertOverlay}>
            <View style={styles.alertContainer}>
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setAlertConfig({ ...alertConfig, visible: false })}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
    alignItems: 'center',
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    textAlign: 'center',
  },
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  saveTextDisabled: {
    color: '#C7C7CC',
  },
  content: {
    flex: 1,
    padding: 16,
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
  variablesContainer: {
    marginBottom: 12,
  },
  variablesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B6B6B',
    marginBottom: 8,
  },
  variableChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  variableChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F0F9FF',
    borderRadius: 6,
    margin: 4,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  variableChipText: {
    color: '#007AFF',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontWeight: '500',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toggleText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  functionsContainer: {
    marginTop: 16,
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
    flex: 1,
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
  selectedFunctions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    marginHorizontal: -4,
  },
  functionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    margin: 4,
  },
  functionChipText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '500',
  },
  removeChipButton: {
    marginLeft: 6,
    padding: 2,
  },
  parameterCard: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F8F9FA',
  },
  parameterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  parameterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  removeButton: {
    padding: 4,
  },
  parameterGrid: {
    flexDirection: 'row',
    marginHorizontal: -8,
    marginBottom: 12,
  },
  parameterField: {
    flex: 1,
    marginHorizontal: 8,
  },
  parameterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  parameterInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1A1A1A',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
  },
  parameterPicker: {
    height: 44,
  },
  picker: {
    height: 44,
  },
  parameterOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginTop: 8,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 6,
  },
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
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginLeft: 6,
    flex: 1,
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: 300,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  alertMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  alertButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TemplateForm; 