import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExecutionResult, VariationResult } from '../types';
import { formatConfigId } from '../utils/comparisonUtils';
import { generateRerunName } from '../utils/executionNaming';
import ExecutionLogsCard from './ExecutionLogsCard';
import ExecutionFlowGraph from './ExecutionFlowGraph';
import ExecutionComparisonChart from './ExecutionComparisonChart';
import { AlertAPI } from './CustomAlert';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

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
  const { colors } = useTheme();
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);
  const [showExecutionFlowGraph, setShowExecutionFlowGraph] = useState(false);
  const [showDetailedComparison, setShowDetailedComparison] = useState(false);
  const [selectedConfigurationId, setSelectedConfigurationId] = useState<string | undefined>(undefined);
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

  const styles = useThemedStyles((colors) => ({
    modalContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    embeddedContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalTitle: {
      ...typography.h1,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center' as const,
    },
    modalCancelButton: {
      ...typography.title,
      fontWeight: '500' as const,
      color: colors.accent,
    },
    headerSpacer: {
      width: 50,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    summarySection: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      ...typography.h1,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    summaryGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
    },
    summaryCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center' as const,
      minWidth: 80,
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    summaryValue: {
      ...typography.display,
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    summaryLabel: {
      ...typography.caption,
      fontWeight: '500' as const,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    promptSection: {
      marginBottom: spacing.xl,
    },
    promptCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    promptHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    promptLabel: {
      ...typography.title,
      color: colors.textPrimary,
    },
    promptText: {
      ...typography.body,
      color: colors.textPrimary,
    },
    copyButton: {
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.bgHover,
    },
    comparisonSection: {
      marginBottom: spacing.xl,
    },
    comparisonHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
    },
    detailedComparisonButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      gap: spacing.sm,
    },
    detailedComparisonButtonText: {
      ...typography.bodyStrong,
      color: colors.textInverse,
    },
    comparisonCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 2,
      borderColor: colors.statusWarning,
    },
    bestConfigHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    bestConfigTitle: {
      ...typography.h2,
      fontWeight: '700' as const,
      color: colors.statusWarning,
      marginLeft: spacing.sm,
    },
    bestConfigDetails: {
      gap: spacing.sm,
    },
    bestConfigId: {
      ...typography.title,
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    analysisNotesContainer: {
      backgroundColor: `${colors.statusWarning}10`,
      borderRadius: radius.md,
      padding: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.statusWarning,
    },
    analysisNotesLabel: {
      ...typography.bodyStrong,
      color: colors.statusWarning,
      marginBottom: spacing.xs,
    },
    analysisNotes: {
      ...typography.body,
      color: colors.textPrimary,
    },
    noComparisonCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    noComparisonText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      fontStyle: 'italic' as const,
    },
    noComparisonHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
      gap: spacing.md,
    },
    noComparisonTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    quickMetricsPreview: {
      marginTop: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    quickMetricsTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    quickMetricsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    quickMetricCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      padding: spacing.md,
      flex: 1,
      minWidth: 150,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    bestQuickMetricCard: {
      backgroundColor: `${colors.statusSuccess}15`,
      borderColor: colors.statusSuccess,
    },
    quickMetricName: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    bestQuickMetricText: {
      color: colors.statusSuccess,
    },
    quickMetricStats: {
      gap: spacing.xs,
    },
    quickMetricStat: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    quickMetricScore: {
      ...typography.bodyStrong,
      fontWeight: 'bold' as const,
      color: colors.accent,
    },
    bestQuickMetricScore: {
      color: colors.statusSuccess,
    },
    modalCloseButton: {
      padding: spacing.sm,
    },
    resultsSection: {
      marginBottom: spacing.xl,
    },
    resultCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden' as const,
    },
    bestResultCard: {
      borderWidth: 2,
      borderColor: colors.statusWarning,
    },
    resultHeader: {
      padding: spacing.lg,
    },
    resultTitleRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    resultConfigName: {
      ...typography.h2,
      color: colors.textPrimary,
      flex: 1,
    },
    bestConfigName: {
      color: colors.statusWarning,
    },
    bestBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.statusWarning,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      gap: spacing.xs,
    },
    bestBadgeText: {
      ...typography.micro,
      fontWeight: '700' as const,
      color: colors.statusWarning,
    },
    resultMeta: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.lg,
      marginBottom: spacing.sm,
    },
    metaRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    metaText: {
      ...typography.body,
      fontWeight: '500' as const,
      color: colors.textSecondary,
    },
    resultDetails: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.bgApp,
    },
    responseContainer: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.statusSuccess,
    },
    responseHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    responseLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    responseText: {
      ...typography.body,
      color: colors.textPrimary,
    },
    errorContainer: {
      backgroundColor: `${colors.statusError}15`,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.statusError,
    },
    errorLabel: {
      ...typography.bodyStrong,
      color: colors.statusError,
      marginBottom: spacing.sm,
    },
    errorText: {
      ...typography.body,
      color: colors.statusError,
    },
    usageContainer: {
      backgroundColor: colors.bgHover,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    usageLabel: {
      ...typography.bodyStrong,
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    usageText: {
      ...typography.body,
      color: colors.accent,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    functionsContainer: {
      backgroundColor: `${colors.statusWarning}15`,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    functionsLabel: {
      ...typography.bodyStrong,
      color: colors.statusWarning,
      marginBottom: spacing.sm,
    },
    functionCall: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      borderLeftWidth: 2,
      borderLeftColor: colors.statusWarning,
    },
    functionName: {
      ...typography.label,
      fontWeight: '600' as const,
      color: colors.statusWarning,
      marginBottom: spacing.xs,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    functionResult: {
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    actionButtons: {
      flexDirection: 'row' as const,
      gap: spacing.md,
      marginTop: spacing.lg,
    },
    actionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      flex: 1,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    reExecuteButton: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    actionButtonText: {
      ...typography.title,
      color: colors.accent,
      marginLeft: spacing.sm,
    },
    reExecuteButtonText: {
      color: colors.textInverse,
    },
    configActionButtons: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      marginTop: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.bgApp,
    },
    configActionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      padding: spacing.md,
      flex: 1,
      justifyContent: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    configActionButtonText: {
      ...typography.bodyStrong,
      color: colors.accent,
      marginLeft: spacing.sm,
    },
  }));

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

    // Use function tools from the execution run if available
    let functionTools: any[] = [];
    if (executionResult.executionRun.functionTools && executionResult.executionRun.functionTools.length > 0) {
      // Use the stored function tools from the execution run
      functionTools = executionResult.executionRun.functionTools;
      console.log('Using stored function tools from execution run:', functionTools.length);
    } else if (executionResult.results && executionResult.results.length > 0) {
      // Fallback: Extract function tools from the execution data (for backward compatibility)
      console.log('No function tools in executionRun, falling back to extraction from results');
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
      executionRunName: generateRerunName(executionResult.executionRun.name),
      description: executionResult.executionRun.description || '',
      basePrompt: basePrompt,
      context: context,
      configurations: executionResult.results?.map(r => r.configuration) || [],
      enableFunctionCalling: executionResult.executionRun.enableFunctionCalling || functionTools.length > 0,
      functionTools: functionTools,
      // Pass agent information if this was an agent execution
      agentId: executionResult.executionRun.agentId || undefined
    };

    if (functionTools.length === 0 && executionResult.executionRun.enableFunctionCalling) {
      console.log('No function tools found for re-execution despite function calling being enabled');
    }

    onReExecute(reExecutionData);
  };

  const renderExecutionSummary = () => (
    <View style={styles.summarySection}>
      <Text style={styles.sectionTitle}>Execution Summary</Text>
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
            <Ionicons name="trophy" size={20} color={colors.statusWarning} />
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
        <Text style={styles.sectionTitle}>Original Prompt</Text>

        {basePrompt && (
          <View style={styles.promptCard}>
            <View style={styles.promptHeader}>
              <Text style={styles.promptLabel}>Base Prompt</Text>
              <TouchableOpacity
                style={styles.copyButton}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => copyToClipboard(basePrompt, 'Base prompt')}
              >
                <Ionicons name="copy" size={16} color={colors.accent} />
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
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                onPress={() => copyToClipboard(context, 'Context')}
              >
                <Ionicons name="copy" size={16} color={colors.accent} />
              </TouchableOpacity>
            </View>
            <Text style={styles.promptText}>{context}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderComparisonAnalysis = () => {
    if (!executionResult.comparison && (!executionResult.results || executionResult.results.length <= 1)) return null;

    return (
      <View style={styles.comparisonSection}>
        <View style={styles.comparisonHeader}>
          <Text style={styles.sectionTitle}>Comparison Analysis</Text>

          {/* Detailed Comparison Button */}
          <TouchableOpacity
            style={styles.detailedComparisonButton}
            onPress={() => setShowDetailedComparison(true)}
          >
            <Ionicons name="analytics" size={18} color={colors.textInverse} />
            <Text style={styles.detailedComparisonButtonText}>Detailed Analysis</Text>
          </TouchableOpacity>
        </View>

        {executionResult.comparison?.bestConfigurationId ? (
          <View style={styles.comparisonCard}>
            <View style={styles.bestConfigHeader}>
              <Ionicons name="trophy" size={24} color={colors.statusWarning} />
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
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    onPress={() => copyToClipboard(executionResult.comparison!.analysisNotes!, 'Analysis notes')}
                  >
                    <Ionicons name="copy" size={16} color={colors.accent} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Quick Metrics Preview */}
            {executionResult.comparison.configurationScores && (
              <View style={styles.quickMetricsPreview}>
                <Text style={styles.quickMetricsTitle}>Quick Metrics:</Text>
                <View style={styles.quickMetricsGrid}>
                  {executionResult.results.map((result) => {
                    const scores = executionResult.comparison!.configurationScores![result.configuration.id!] || {};
                    const isBest = result.configuration.id === executionResult.comparison!.bestConfigurationId;

                    return (
                      <View key={result.configuration.id} style={[styles.quickMetricCard, isBest && styles.bestQuickMetricCard]}>
                        <Text style={[styles.quickMetricName, isBest && styles.bestQuickMetricText]}>
                          {result.configuration.variationName}
                        </Text>
                        <View style={styles.quickMetricStats}>
                          <Text style={styles.quickMetricStat}>
                            {result.executionTime}ms
                          </Text>
                          {result.response.usageMetadata && (
                            <Text style={styles.quickMetricStat}>
                              {result.response.usageMetadata.totalTokens || result.response.usageMetadata.total_tokens || 'N/A'} tokens
                            </Text>
                          )}
                          {scores.overall_score && (
                            <Text style={[styles.quickMetricScore, isBest && styles.bestQuickMetricScore]}>
                              {Math.round(scores.overall_score * 100)}%
                            </Text>
                          )}
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.comparisonCard}>
            <View style={styles.noComparisonHeader}>
              <Ionicons name="analytics-outline" size={24} color={colors.textSecondary} />
              <Text style={styles.noComparisonTitle}>Multiple Configurations Detected</Text>
            </View>
            <Text style={styles.noComparisonText}>
              {executionResult.results?.length || 0} configurations executed.
              Use detailed analysis to compare performance metrics.
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderConfigurationResults = () => {
    if (!executionResult.results || executionResult.results.length === 0) return null;

    return (
      <View style={styles.resultsSection}>
        <Text style={styles.sectionTitle}>AI Responses</Text>

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
                      <Ionicons name="trophy" size={12} color={colors.statusWarning} />
                      <Text style={styles.bestBadgeText}>BEST</Text>
                    </View>
                  )}
                </View>

                <View style={styles.resultMeta}>
                  <View style={styles.metaRow}>
                    <Ionicons name="hardware-chip" size={14} color={colors.accent} />
                    <Text style={styles.metaText}>{result.configuration.modelName}</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="time" size={14} color={colors.statusWarning} />
                    <Text style={styles.metaText}>{result.response.responseTimeMs || 0}ms</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons
                      name={result.response.responseStatus === 'success' ? 'checkmark-circle' : 'close-circle'}
                      size={14}
                      color={result.response.responseStatus === 'success' ? colors.statusSuccess : colors.statusError}
                    />
                    <Text style={[
                      styles.metaText,
                      { color: result.response.responseStatus === 'success' ? colors.statusSuccess : colors.statusError }
                    ]}>
                      {result.response.responseStatus}
                    </Text>
                  </View>
                </View>

                <Ionicons
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textSecondary}
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
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          onPress={() => copyToClipboard(result.response.responseText!, 'AI response')}
                        >
                          <Ionicons name="copy" size={16} color={colors.accent} />
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
                    console.log('Usage Metadata:', JSON.stringify(result.response.usageMetadata, null, 2));

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
                            {typeof funcCall.functionResponse === 'string' ? funcCall.functionResponse : JSON.stringify(funcCall.functionResponse || {})}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Per-configuration action buttons */}
                  <View style={styles.configActionButtons}>
                    <TouchableOpacity
                      style={styles.configActionButton}
                      onPress={() => {
                        setSelectedConfigurationId(result.configuration.id);
                        setShowExecutionLogs(true);
                      }}
                    >
                      <Ionicons name="document-text" size={16} color={colors.accent} />
                      <Text style={styles.configActionButtonText}>View Logs</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.configActionButton}
                      onPress={() => {
                        setSelectedConfigurationId(result.configuration.id);
                        setShowExecutionFlowGraph(true);
                      }}
                    >
                      <Ionicons name="git-network" size={16} color={colors.accent} />
                      <Text style={styles.configActionButtonText}>Flow Graph</Text>
                    </TouchableOpacity>
                  </View>
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
      {showReExecuteButton && onReExecute && (
        <TouchableOpacity
          style={[styles.actionButton, styles.reExecuteButton]}
          onPress={handleReExecute}
        >
          <Ionicons name="refresh" size={20} color={colors.textInverse} />
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
            configurationId={selectedConfigurationId}
          />
        )}

        {/* Execution Flow Graph Modal */}
        {showExecutionFlowGraph && (
          <Modal visible={showExecutionFlowGraph} animationType="slide" presentationStyle="pageSheet">
            <ExecutionFlowGraph
              key={`modal-flow-${executionResult.executionRun.id}-${selectedConfigurationId || 'default'}`}
              executionRunId={executionResult.executionRun.id}
              visible={showExecutionFlowGraph}
              onClose={() => setShowExecutionFlowGraph(false)}
              configurationId={selectedConfigurationId}
            />
          </Modal>
        )}

        {/* Detailed Comparison Modal */}
        {showDetailedComparison && (
          <Modal visible={showDetailedComparison} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detailed Configuration Comparison</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  onPress={() => setShowDetailedComparison(false)}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ExecutionComparisonChart
                executionResult={executionResult}
                visible={showDetailedComparison}
                onConfigurationSelect={(configId) => {
                  setSelectedConfigurationId(configId);
                }}
              />
            </View>
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
            configurationId={selectedConfigurationId}
          />
        )}

        {/* Execution Flow Graph Modal */}
        {showExecutionFlowGraph && (
          <Modal visible={showExecutionFlowGraph} animationType="slide" presentationStyle="pageSheet">
            <ExecutionFlowGraph
              key={`modal-flow-${executionResult.executionRun.id}-${selectedConfigurationId || 'default'}`}
              executionRunId={executionResult.executionRun.id}
              visible={showExecutionFlowGraph}
              onClose={() => setShowExecutionFlowGraph(false)}
              configurationId={selectedConfigurationId}
            />
          </Modal>
        )}

        {/* Detailed Comparison Modal */}
        {showDetailedComparison && (
          <Modal visible={showDetailedComparison} animationType="slide" presentationStyle="pageSheet">
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Detailed Configuration Comparison</Text>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                  onPress={() => setShowDetailedComparison(false)}
                >
                  <Ionicons name="close" size={24} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <ExecutionComparisonChart
                executionResult={executionResult}
                visible={showDetailedComparison}
                onConfigurationSelect={(configId) => {
                  setSelectedConfigurationId(configId);
                }}
              />
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

export default ExecutionResultsViewer;
