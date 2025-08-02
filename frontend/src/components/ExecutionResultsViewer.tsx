import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExecutionResult, VariationResult } from '../types';
import { formatConfigId } from '../utils/comparisonUtils';
import ExecutionLogsCard from './ExecutionLogsCard';
import ExecutionFlowGraph from './ExecutionFlowGraph';
import { AlertAPI } from './CustomAlert';

interface ExecutionResultsViewerProps {
  executionResult: ExecutionResult;
  visible: boolean;
  onClose: () => void;
  onReExecute?: (data: any) => void;
  showReExecuteButton?: boolean;
  embedded?: boolean; // For inline display vs modal
}

const ExecutionResultsViewer: React.FC<ExecutionResultsViewerProps> = ({
  executionResult,
  visible,
  onClose,
  onReExecute,
  showReExecuteButton = true,
  embedded = false,
}) => {
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);
  const [showExecutionFlowGraph, setShowExecutionFlowGraph] = useState(false);
  // Initialize with all result indices expanded by default
  const [expandedResults, setExpandedResults] = useState<Set<number>>(() => {
    const initialExpanded = new Set<number>();
    if (executionResult.results) {
      executionResult.results.forEach((_, index) => {
        initialExpanded.add(index);
      });
    }
    return initialExpanded;
  });

  // Update expanded results when execution result changes
  React.useEffect(() => {
    if (executionResult.results) {
      const newExpanded = new Set<number>();
      executionResult.results.forEach((_, index) => {
        newExpanded.add(index);
      });
      setExpandedResults(newExpanded);
    }
  }, [executionResult]);

  const toggleResultExpansion = (index: number) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedResults(newExpanded);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      AlertAPI.alert('Copied!', `${label} copied to clipboard`);
    } catch (error) {
      AlertAPI.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleReExecute = () => {
    if (!onReExecute) return;
    
    // Extract function tools from the execution data
    const functionTools: any[] = [];
    if (executionResult.results && executionResult.results.length > 0) {
      executionResult.results.forEach(result => {
        if (result.functionCalls && result.functionCalls.length > 0) {
          result.functionCalls.forEach(functionCall => {
            const funcName = functionCall.functionName;
            if (funcName && !functionTools.find(t => t.name === funcName)) {
              functionTools.push({
                name: funcName,
                description: `${funcName} function`,
                parameters: {}
              });
            }
          });
        }
      });
    }

    // Extract the original base prompt and context
    const basePrompt = executionResult.results?.[0]?.request?.prompt || executionResult.executionRun.basePrompt || '';
    const context = executionResult.results?.[0]?.request?.context || executionResult.executionRun.contextPrompt || '';

    const reExecutionData = {
      executionRunName: `${executionResult.executionRun.name} (Re-run)`,
      description: executionResult.executionRun.description || '',
      basePrompt: basePrompt,
      context: context,
      configurations: executionResult.results?.map(r => r.configuration) || [],
      enableFunctionCalling: executionResult.executionRun.enableFunctionCalling || functionTools.length > 0,
      functionTools: functionTools
    };
    
    onReExecute(reExecutionData);
  };

  const renderExecutionSummary = () => (
    <View style={styles.summarySection}>
      <Text style={styles.sectionTitle}>📊 Execution Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{executionResult.results?.length || 0}</Text>
          <Text style={styles.summaryLabel}>Configurations</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>
            {executionResult.results?.length > 0 
              ? Math.round((executionResult.successCount / executionResult.results.length) * 100)
              : 0}%
          </Text>
          <Text style={styles.summaryLabel}>Success Rate</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{executionResult.totalTime || 0}ms</Text>
          <Text style={styles.summaryLabel}>Total Time</Text>
        </View>
        {executionResult.comparison?.bestConfigurationId && (
          <View style={styles.summaryCard}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
            <Text style={styles.summaryLabel}>Best Found</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderOriginalPrompt = () => {
    const basePrompt = executionResult.results?.[0]?.request?.prompt || executionResult.executionRun.basePrompt || '';
    const context = executionResult.results?.[0]?.request?.context || executionResult.executionRun.contextPrompt || '';
    
    if (!basePrompt && !context) return null;

    return (
      <View style={styles.promptSection}>
        <Text style={styles.sectionTitle}>📝 Original Prompt</Text>
        
        {basePrompt && (
          <View style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <Text style={styles.promptLabel}>Base Prompt</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyToClipboard(basePrompt, 'Base prompt')}
              >
                <Ionicons name="copy" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.promptText}>{basePrompt}</Text>
          </View>
        )}
        
        {context && (
          <View style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <Text style={styles.promptLabel}>Context</Text>
              <TouchableOpacity 
                style={styles.copyButton}
                onPress={() => copyToClipboard(context, 'Context')}
              >
                <Ionicons name="copy" size={16} color="#007AFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.promptText}>{context}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderComparisonAnalysis = () => {
    if (!executionResult.comparison) return null;

    return (
      <View style={styles.comparisonSection}>
        <Text style={styles.sectionTitle}>🏆 Comparison Analysis</Text>
        
        {executionResult.comparison.bestConfigurationId ? (
          <View style={styles.comparisonCard}>
            <View style={styles.bestConfigHeader}>
              <Ionicons name="trophy" size={24} color="#FFD700" />
              <Text style={styles.bestConfigTitle}>Best Configuration</Text>
            </View>
            
            <View style={styles.bestConfigDetails}>
              <Text style={styles.bestConfigId}>
                ID: {formatConfigId(executionResult.comparison.bestConfigurationId)}
              </Text>
              
              {executionResult.comparison.analysisNotes && (
                <View style={styles.analysisNotesContainer}>
                  <Text style={styles.analysisNotesLabel}>Analysis:</Text>
                  <Text style={styles.analysisNotes}>
                    {executionResult.comparison.analysisNotes}
                  </Text>
                  <TouchableOpacity 
                    style={styles.copyButton}
                    onPress={() => copyToClipboard(executionResult.comparison!.analysisNotes!, 'Analysis notes')}
                  >
                    <Ionicons name="copy" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.noComparisonCard}>
            <Text style={styles.noComparisonText}>No best configuration determined</Text>
          </View>
        )}
      </View>
    );
  };

  const renderConfigurationResults = () => {
    if (!executionResult.results || executionResult.results.length === 0) return null;

    return (
      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>🤖 AI Responses</Text>
        
        {executionResult.results.map((result, index) => {
          const isBestConfig = executionResult.comparison?.bestConfigurationId === result.configuration.id;
          const isExpanded = expandedResults.has(index);
          
          return (
            <View key={index} style={[
              styles.resultCard,
              isBestConfig && styles.bestResultCard
            ]}>
              <TouchableOpacity 
                style={styles.resultHeader}
                onPress={() => toggleResultExpansion(index)}
                activeOpacity={0.7}
              >
                <View style={styles.resultTitleRow}>
                  <Text style={[
                    styles.resultConfigName,
                    isBestConfig && styles.bestConfigName
                  ]}>
                    {result.configuration.variationName}
                  </Text>
                  {isBestConfig && (
                    <View style={styles.bestBadge}>
                      <Ionicons name="trophy" size={12} color="#FFD700" />
                      <Text style={styles.bestBadgeText}>BEST</Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.resultMeta}>
                  <View style={styles.metaRow}>
                    <Ionicons name="hardware-chip" size={14} color="#007AFF" />
                    <Text style={styles.metaText}>{result.configuration.modelName}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time" size={14} color="#FF9500" />
                    <Text style={styles.metaText}>{result.response.responseTimeMs || 0}ms</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons 
                      name={result.response.responseStatus === 'success' ? 'checkmark-circle' : 'close-circle'} 
                      size={14} 
                      color={result.response.responseStatus === 'success' ? '#34C759' : '#FF3B30'} 
                    />
                    <Text style={[
                      styles.metaText,
                      { color: result.response.responseStatus === 'success' ? '#34C759' : '#FF3B30' }
                    ]}>
                      {result.response.responseStatus}
                    </Text>
                  </View>
                </View>
                
                <Ionicons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
              
              {isExpanded && (
                <View style={styles.resultDetails}>
                  {result.response.responseText && (
                    <View style={styles.responseContainer}>
                      <View style={styles.responseHeader}>
                        <Text style={styles.responseLabel}>AI Response:</Text>
                        <TouchableOpacity 
                          style={styles.copyButton}
                          onPress={() => copyToClipboard(result.response.responseText!, 'AI response')}
                        >
                          <Ionicons name="copy" size={16} color="#007AFF" />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.responseText}>
                        {result.response.responseText}
                      </Text>
                    </View>
                  )}
                  
                  {result.response.responseStatus === 'error' && result.response.errorMessage && (
                    <View style={styles.errorContainer}>
                      <Text style={styles.errorLabel}>Error:</Text>
                      <Text style={styles.errorText}>
                        {result.response.errorMessage}
                      </Text>
                    </View>
                  )}
                  
                  {result.response.usageMetadata && (() => {
                    // Debug: Log the usage metadata structure
                    console.log('🔍 Usage Metadata:', JSON.stringify(result.response.usageMetadata, null, 2));
                    
                    return (
                      <View style={styles.usageContainer}>
                        <Text style={styles.usageLabel}>Token Usage:</Text>
                        <Text style={styles.usageText}>
                          Total: {result.response.usageMetadata.total_tokens || result.response.usageMetadata.totalTokens || 'N/A'}
                          {(result.response.usageMetadata.prompt_tokens || result.response.usageMetadata.promptTokens) && 
                           (result.response.usageMetadata.completion_tokens || result.response.usageMetadata.completionTokens) && 
                            ` (${result.response.usageMetadata.prompt_tokens || result.response.usageMetadata.promptTokens} prompt + ${result.response.usageMetadata.completion_tokens || result.response.usageMetadata.completionTokens} completion)`
                          }
                        </Text>
                      </View>
                    );
                  })()}
                  
                  {result.functionCalls && result.functionCalls.length > 0 && (
                    <View style={styles.functionsContainer}>
                      <Text style={styles.functionsLabel}>Function Calls ({result.functionCalls.length}):</Text>
                      {result.functionCalls.map((funcCall, funcIndex) => (
                        <View key={funcIndex} style={styles.functionCall}>
                          <Text style={styles.functionName}>{funcCall.functionName}</Text>
                          <Text style={styles.functionResult} numberOfLines={2}>
                            {typeof funcCall.result === 'string' ? funcCall.result : JSON.stringify(funcCall.result)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtons}>
      {executionResult.logs && executionResult.logs.length > 0 && (
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => setShowExecutionLogs(true)}
        >
          <Ionicons name="document-text" size={20} color="#007AFF" />
          <Text style={styles.actionButtonText}>
            View Logs ({executionResult.logs.length})
          </Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => setShowExecutionFlowGraph(true)}
      >
        <Ionicons name="git-network" size={20} color="#007AFF" />
        <Text style={styles.actionButtonText}>
          Flow Graph
        </Text>
      </TouchableOpacity>
      
      {showReExecuteButton && onReExecute && (
        <TouchableOpacity
          style={[styles.actionButton, styles.reExecuteButton]}
          onPress={handleReExecute}
        >
          <Ionicons name="refresh" size={20} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, styles.reExecuteButtonText]}>
            Re-Execute
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const content = (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {renderExecutionSummary()}
      {renderOriginalPrompt()}
      {renderComparisonAnalysis()}
      {renderConfigurationResults()}
      {renderActionButtons()}
    </ScrollView>
  );

  if (embedded) {
    return (
      <View style={styles.embeddedContainer}>
        {content}
        
        {/* Execution Logs Modal */}
        {showExecutionLogs && (
          <ExecutionLogsCard
            executionResult={executionResult}
            visible={showExecutionLogs}
            onClose={() => setShowExecutionLogs(false)}
            onReExecute={onReExecute || (() => {})}
          />
        )}
        
        {/* Execution Flow Graph Modal */}
        {showExecutionFlowGraph && (
          <Modal visible={showExecutionFlowGraph} animationType="slide" presentationStyle="pageSheet">
            <ExecutionFlowGraph
              executionRunId={executionResult.executionRun.id}
              visible={showExecutionFlowGraph}
              onClose={() => setShowExecutionFlowGraph(false)}
            />
          </Modal>
        )}
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalCancelButton}>Close</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{executionResult.executionRun.name}</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {content}
        
        {/* Execution Logs Modal */}
        {showExecutionLogs && (
          <ExecutionLogsCard
            executionResult={executionResult}
            visible={showExecutionLogs}
            onClose={() => setShowExecutionLogs(false)}
            onReExecute={onReExecute || (() => {})}
          />
        )}
        
        {/* Execution Flow Graph Modal */}
        {showExecutionFlowGraph && (
          <Modal visible={showExecutionFlowGraph} animationType="slide" presentationStyle="pageSheet">
            <ExecutionFlowGraph
              executionRunId={executionResult.executionRun.id}
              visible={showExecutionFlowGraph}
              onClose={() => setShowExecutionFlowGraph(false)}
            />
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  embeddedContainer: {
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
    flex: 1,
    textAlign: 'center',
  },
  modalCancelButton: {
    fontSize: 17,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  summarySection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 80,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    fontWeight: '500',
  },
  promptSection: {
    marginBottom: 24,
  },
  promptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  promptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  promptLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  promptText: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  copyButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F0F8FF',
  },
  comparisonSection: {
    marginBottom: 24,
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bestConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bestConfigTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#B8860B',
    marginLeft: 8,
  },
  bestConfigDetails: {
    gap: 8,
  },
  bestConfigId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  analysisNotesContainer: {
    backgroundColor: '#FFFEF7',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD700',
  },
  analysisNotesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#B8860B',
    marginBottom: 4,
  },
  analysisNotes: {
    fontSize: 15,
    color: '#000000',
    lineHeight: 22,
  },
  noComparisonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  noComparisonText: {
    fontSize: 16,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  bestResultCard: {
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  resultHeader: {
    padding: 16,
  },
  resultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultConfigName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
  },
  bestConfigName: {
    color: '#B8860B',
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B8860B',
  },
  resultMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
  },
  resultDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  responseContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  responseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  responseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#D32F2F',
  },
  usageContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  usageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  usageText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  functionsContainer: {
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
    padding: 12,
  },
  functionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 8,
  },
  functionCall: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#FF9500',
  },
  functionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  functionResult: {
    fontSize: 13,
    color: '#000000',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reExecuteButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  reExecuteButtonText: {
    color: '#FFFFFF',
  },
});

export default ExecutionResultsViewer; 