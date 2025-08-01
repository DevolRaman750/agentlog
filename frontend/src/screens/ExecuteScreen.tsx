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
import LoadingScreen from '../components/LoadingScreen';
import { goGentAPI } from '../api/client';
import { secureStorage } from '../utils/secureStorage';
import { ExecutionResult, APIConfiguration, ComparisonMetric, FunctionDefinition } from '../types';
import { AlertAPI } from '../components/CustomAlert';
import ExecutionResultsViewer from '../components/ExecutionResultsViewer';

const ExecuteScreen: React.FC = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { state } = useApp();
  const configurations = state.configurations || [];
  const isConnected = state.isConnected;
  const { state: formState, updateField } = useFormState();

  // Execution state (doesn't need to persist across remounts)
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [showConfigSelector, setShowConfigSelector] = useState(false);
  const [showFunctionSelector, setShowFunctionSelector] = useState(false);
  const [showExecutionResults, setShowExecutionResults] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [availableFunctions, setAvailableFunctions] = useState<FunctionDefinition[]>([]);
  const [apiKeyStatus, setApiKeyStatus] = useState<{ hasGeminiKey: boolean; hasFunctionKeys: boolean }>({ 
    hasGeminiKey: false, 
    hasFunctionKeys: false 
  });
  
  // Ref to prevent multiple concurrent API calls
  const isLoadingFunctions = useRef(false);

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

  // Check API key status
  useEffect(() => {
    checkApiKeyStatus();
  }, []);

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

  const checkApiKeyStatus = async () => {
    try {
      const apiKeys = await secureStorage.loadApiKeys();
      const hasGeminiKey = !!(apiKeys.geminiApiKey && apiKeys.geminiApiKey.trim());
      
      // Check function-specific keys
      let hasFunctionKeys = true;
      if (formState.selectedFunctions.length > 0) {
        const selectedFuncs = availableFunctions.filter(f => 
          formState.selectedFunctions.includes(f.id)
        );
        
        for (const func of selectedFuncs) {
          if (func.requiredApiKeys && func.requiredApiKeys.length > 0) {
            for (const keyType of func.requiredApiKeys) {
              const keyName = `${keyType}ApiKey` as keyof typeof apiKeys;
              if (!apiKeys[keyName] || !apiKeys[keyName]?.trim()) {
                hasFunctionKeys = false;
                break;
              }
            }
          }
          if (!hasFunctionKeys) break;
        }
      }
      
      setApiKeyStatus({ hasGeminiKey, hasFunctionKeys });
    } catch (error) {
      console.warn('🟡 API key check failed:', error);
      setApiKeyStatus({ hasGeminiKey: false, hasFunctionKeys: false });
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

  const handleReExecute = (reExecutionData: any) => {
    // Update form state with the re-execution data
    updateField('executionName', reExecutionData.executionRunName);
    updateField('description', reExecutionData.description);
    updateField('prompt', reExecutionData.basePrompt);
    updateField('context', reExecutionData.context);
    
    // Find and select the configurations
    const configIds = reExecutionData.configurations
      .map((config: any) => config.id)
      .filter((id: string) => id);
    updateField('selectedConfigs', configIds);
    
    // Set function selection if any
    if (reExecutionData.functionTools && reExecutionData.functionTools.length > 0) {
      const functionIds = reExecutionData.functionTools
        .map((tool: any) => availableFunctions.find(f => f.name === tool.name)?.id)
        .filter((id: string) => id);
      updateField('selectedFunctions', functionIds);
    }
    
    // Close the results viewer
    setShowExecutionResults(false);
    setExecutionResult(null);
    
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

    if (!apiKeyStatus.hasGeminiKey) {
      AlertAPI.alert('Missing API Key', 'Please add your Gemini API key in the API Keys section');
      return;
    }

    if (formState.selectedFunctions.length > 0 && !apiKeyStatus.hasFunctionKeys) {
      AlertAPI.alert('Missing API Keys', 'Please add the required API keys for the selected functions');
      return;
    }

    setIsExecuting(true);
    setExecutionResult(null);
    setPollCount(0);

    try {
      const selectedConfigurations = configurations.filter(config =>
        formState.selectedConfigs.includes(config.id || '')
      );

      const request = {
        executionRunName: formState.executionName || generateDefaultExecutionName(),
        description: formState.description,
        basePrompt: formState.prompt,
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
      };

      console.log('🚀 Starting multi-variant execution with request:', request);
      const response = await goGentAPI.executeMultiVariation(request, formState.functionExecutionMode);

      if (response.success && response.data) {
        const executionId = response.data.executionRun.id;
        setCurrentExecutionId(executionId);
        console.log('✅ Execution started:', executionId);
        pollExecutionStatus(executionId);
      } else {
        throw new Error(response.error || 'Failed to start execution');
      }
    } catch (error) {
      console.error('❌ Execution failed:', error);
      AlertAPI.alert('Error', `Failed to start execution: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsExecuting(false);
    }
  };

  const pollExecutionStatus = async (executionId: string) => {
    const maxPolls = 60;
    let polls = 0;

    const poll = async () => {
      if (polls >= maxPolls) {
        setIsExecuting(false);
        AlertAPI.alert('Timeout', 'Execution is taking longer than expected. Please check the history for results.');
        return;
      }

      try {
        const response = await goGentAPI.getExecutionStatus(executionId);
        setPollCount(polls + 1);

        if (response.success && response.data) {
          if (response.data.status === 'completed') {
            // Fetch full execution results
            const resultResponse = await goGentAPI.getExecutionRun(executionId);
            if (resultResponse.success && resultResponse.data) {
              setExecutionResult(resultResponse.data);
              setIsExecuting(false);
              setShowExecutionResults(true);
              console.log('✅ Execution completed successfully');
              return;
            }
          } else if (response.data.status === 'failed') {
            setIsExecuting(false);
            AlertAPI.alert('Error', `Execution failed: ${response.data.error || 'Unknown error'}`);
            return;
          }
        }

        polls++;
        setTimeout(poll, 2000);
      } catch (error) {
        console.error('❌ Polling failed:', error);
        setIsExecuting(false);
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
          {groupedFunctions.map((group) => (
            <View key={group.title} style={styles.functionGroupContainer}>
              <Text style={styles.functionGroupTitle}>{group.title}</Text>
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
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🚀 Execute AI Models</Text>
          <Text style={styles.subtitle}>
            Run your prompts across multiple AI configurations and compare their responses
          </Text>
        </View>

        {/* Main Prompt - First and Most Prominent */}
        <View style={[styles.fieldContainer, styles.primaryField]}>
          <View style={styles.labelContainer}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#007AFF" />
            <Text style={[styles.fieldLabel, styles.primaryFieldLabel]}>What do you want the AI to do?</Text>
            <Text style={styles.requiredText}>Required</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textArea, styles.primaryPrompt]}
            value={formState.prompt}
            onChangeText={(text) => updateField('prompt', text)}
            placeholder="Write a compelling product description for a sustainable water bottle that highlights its eco-friendly features..."
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={6}
          />
        </View>

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
                <View style={styles.compactLabelContainer}>
                  <Ionicons name="document-text" size={14} color="#007AFF" />
                  <Text style={styles.compactFieldLabel}>Description</Text>
                </View>
                <TextInput
                  style={[styles.compactInput, styles.compactTextArea]}
                  value={formState.description}
                  onChangeText={(text) => updateField('description', text)}
                  placeholder="Notes about this execution..."
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={2}
                />
              </View>

              {/* Additional Context */}
              <View style={styles.compactFieldContainer}>
                <View style={styles.compactLabelContainer}>
                  <Ionicons name="information-circle" size={14} color="#007AFF" />
                  <Text style={styles.compactFieldLabel}>Additional Context</Text>
                </View>
                <TextInput
                  style={[styles.compactInput, styles.compactTextArea]}
                  value={formState.context}
                  onChangeText={(text) => updateField('context', text)}
                  placeholder="Target audience, tone, constraints, etc..."
                  placeholderTextColor="#8E8E93"
                  multiline
                  numberOfLines={3}
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
          <TouchableOpacity
            style={[styles.executeButton, (!isConnected || isExecuting) && styles.executeButtonDisabled]}
            onPress={executeMultiVariant}
            disabled={!isConnected || isExecuting}
          >
            <View style={styles.executeContent}>
              {isExecuting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="rocket" size={24} color="#FFFFFF" />
              )}
              <Text style={styles.executeButtonText}>
                {isExecuting ? `Executing... (${pollCount}/60)` : 'Run Execution'}
              </Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.executeDescription}>
            This will run your prompt across all selected AI configurations and provide comparison results
          </Text>
        </View>

        {/* Execution Complete Success Message */}
        {executionResult && !showExecutionResults && (
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
      
      {/* Full Execution Results Viewer */}
      {executionResult && showExecutionResults && (
        <ExecutionResultsViewer
          executionResult={executionResult}
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
    height: 120, // Fixed height for the main prompt
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
    marginBottom: 12,
    paddingLeft: 4,
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
  },
  compactTextArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
});

export default ExecuteScreen; 