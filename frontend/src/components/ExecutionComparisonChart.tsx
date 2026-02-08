import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExecutionResult, VariationResult, ComparisonResult } from '../types';
import { formatConfigId } from '../utils/comparisonUtils';
import { useTheme, useThemedStyles } from '../theme';

interface ExecutionComparisonChartProps {
  executionResult: ExecutionResult;
  visible?: boolean;
  onConfigurationSelect?: (configId: string) => void;
}

interface MetricDisplay {
  label: string;
  key: string;
  unit?: string;
  format?: (value: any, result?: VariationResult) => string;
  getDisplayValue?: (value: any, result?: VariationResult, allResults?: VariationResult[]) => { value: string; label: string; color: string; icon?: string };
  higherIsBetter?: boolean;
  color?: string;
  description?: string;
}

// Note: These functions use hardcoded colors because they return color values
// that will be used dynamically. The colors will be applied by the component.
const getQualityLabel = (score: number, colors?: any) => {
  const statusSuccess = colors?.statusSuccess || '#4CAF50';
  const statusWarning = colors?.statusWarning || '#FFC107';
  const statusError = colors?.statusError || '#F44336';

  if (score >= 0.8) return { label: 'Excellent', color: statusSuccess, icon: 'star' };
  if (score >= 0.6) return { label: 'Good', color: statusSuccess, icon: 'thumbs-up' };
  if (score >= 0.4) return { label: 'Fair', color: statusWarning, icon: 'remove' };
  if (score >= 0.2) return { label: 'Poor', color: statusWarning, icon: 'thumbs-down' };
  return { label: 'Very Poor', color: statusError, icon: 'close' };
};

const getSpeedLabel = (timeMs: number, allTimes: number[], colors?: any) => {
  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);
  const relative = (timeMs - minTime) / (maxTime - minTime);

  const statusSuccess = colors?.statusSuccess || '#4CAF50';
  const statusWarning = colors?.statusWarning || '#FFC107';
  const statusError = colors?.statusError || '#FF5722';

  if (timeMs === minTime) return { label: 'Fastest', color: statusSuccess, icon: 'flash' };
  if (relative <= 0.3) return { label: 'Fast', color: statusSuccess, icon: 'rocket' };
  if (relative <= 0.7) return { label: 'Moderate', color: statusWarning, icon: 'time' };
  return { label: 'Slow', color: statusError, icon: 'hourglass' };
};

const getTokenEfficiencyDisplay = (score: number, result: VariationResult, colors?: any) => {
  const usage = result.response.usageMetadata;
  const textSecondary = colors?.textSecondary || '#9E9E9E';
  const statusSuccess = colors?.statusSuccess || '#4CAF50';
  const statusWarning = colors?.statusWarning || '#FFC107';
  const statusError = colors?.statusError || '#FF5722';

  if (!usage) return { value: 'N/A', label: 'No data', color: textSecondary };

  const totalTokens = usage.totalTokens || usage.total_tokens || 0;
  const completionTokens = usage.completionTokens || usage.completion_tokens || usage.candidatesTokenCount || 0;
  const promptTokens = usage.promptTokens || usage.prompt_tokens || 0;

  if (totalTokens === 0) return { value: 'N/A', label: 'No tokens', color: textSecondary };

  const efficiency = completionTokens / totalTokens;
  const tokensPerSecond = Math.round(totalTokens / (result.executionTime / 1000));

  let label = '';
  let color = '';

  if (efficiency >= 0.4) {
    label = `Efficient (${tokensPerSecond}/s)`;
    color = statusSuccess;
  } else if (efficiency >= 0.25) {
    label = `Moderate (${tokensPerSecond}/s)`;
    color = statusWarning;
  } else {
    label = `Low efficiency (${tokensPerSecond}/s)`;
    color = statusError;
  }

  return {
    value: `${Math.round(efficiency * 100)}%`,
    label,
    color,
    icon: 'speedometer'
  };
};

const getCostEffectivenessDisplay = (score: number, result: VariationResult, colors?: any) => {
  const usage = result.response.usageMetadata;
  const textSecondary = colors?.textSecondary || '#9E9E9E';
  const statusSuccess = colors?.statusSuccess || '#4CAF50';
  const statusWarning = colors?.statusWarning || '#FFC107';
  const statusError = colors?.statusError || '#FF5722';

  if (!usage) return { value: 'N/A', label: 'No data', color: textSecondary };

  const totalTokens = usage.totalTokens || usage.total_tokens || 0;
  if (totalTokens === 0) return { value: 'N/A', label: 'No tokens', color: textSecondary };

  const costPer1kTokens = result.configuration.modelName?.includes('flash') ? 0.00015 : 0.002;
  const estimatedCost = (totalTokens / 1000) * costPer1kTokens;

  let label = '';
  let color = '';

  if (estimatedCost <= 0.001) {
    label = 'Very economical';
    color = statusSuccess;
  } else if (estimatedCost <= 0.01) {
    label = 'Cost effective';
    color = statusSuccess;
  } else if (estimatedCost <= 0.05) {
    label = 'Moderate cost';
    color = statusWarning;
  } else {
    label = 'Expensive';
    color = statusError;
  }

  return {
    value: `$${estimatedCost.toFixed(4)}`,
    label,
    color,
    icon: 'cash'
  };
};

const METRIC_DEFINITIONS: MetricDisplay[] = [
  {
    label: 'Response Speed',
    key: 'response_time_ms',
    description: 'How quickly the model generated the response',
    getDisplayValue: (timeMs: number, result?: VariationResult, allResults?: VariationResult[]) => {
      if (!allResults || !result) return { value: `${timeMs}ms`, label: 'Response time', color: '#2196F3' };

      const allTimes = allResults.map(r => r.executionTime);
      const speedInfo = getSpeedLabel(timeMs, allTimes);

      return {
        value: `${(timeMs / 1000).toFixed(1)}s`,
        label: speedInfo.label,
        color: speedInfo.color,
        icon: speedInfo.icon
      };
    }
  },
  {
    label: 'Token Efficiency',
    key: 'token_efficiency',
    description: 'How efficiently tokens were used to generate the response',
    getDisplayValue: (score: number, result?: VariationResult) => result ? getTokenEfficiencyDisplay(score, result) : { value: 'N/A', label: 'No data', color: '#9E9E9E' }
  },
  {
    label: 'Response Quality',
    key: 'creativity_score',
    description: 'Overall quality and creativity of the response',
    getDisplayValue: (score: number) => {
      const quality = getQualityLabel(score);
      return {
        value: `${Math.round(score * 100)}/100`,
        label: quality.label,
        color: quality.color,
        icon: quality.icon
      };
    }
  },
  {
    label: 'Coherence',
    key: 'coherence_score',
    description: 'How logical and well-structured the response is',
    getDisplayValue: (score: number) => {
      const coherence = getQualityLabel(score);
      return {
        value: `${Math.round(score * 100)}/100`,
        label: coherence.label,
        color: coherence.color,
        icon: 'checkmark-circle'
      };
    }
  },
  {
    label: 'Content Safety',
    key: 'safety_score',
    description: 'How safe and appropriate the content is',
    getDisplayValue: (score: number) => {
      if (score >= 0.9) return { value: 'Safe', label: 'Excellent safety', color: '#4CAF50', icon: 'shield-checkmark' };
      if (score >= 0.7) return { value: 'Safe', label: 'Good safety', color: '#8BC34A', icon: 'shield' };
      if (score >= 0.5) return { value: 'Caution', label: 'Some concerns', color: '#FFC107', icon: 'warning' };
      return { value: 'Risk', label: 'Safety issues', color: '#F44336', icon: 'alert-circle' };
    }
  },
  {
    label: 'Cost Effectiveness',
    key: 'cost_effectiveness',
    description: 'Estimated cost and value for money',
    getDisplayValue: (score: number, result?: VariationResult) => result ? getCostEffectivenessDisplay(score, result) : { value: 'N/A', label: 'No data', color: '#9E9E9E' }
  }
];

const PERFORMANCE_DESCRIPTIONS = {
  temperature: "Controls randomness: 0.0 = deterministic, 1.0 = very creative",
  maxTokens: "Maximum number of tokens the model can generate in response",
  topP: "Nucleus sampling: selects from smallest set of tokens with cumulative probability P"
};

const ExecutionComparisonChart: React.FC<ExecutionComparisonChartProps> = ({
  executionResult,
  visible = true,
  onConfigurationSelect,
}) => {
  const { colors } = useTheme();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'tokens' | 'performance'>('overview');

  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth > 768;
  const isMobile = Platform.OS !== 'web' && screenWidth < 768;

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    header: {
      padding: 20,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    tabContainer: {
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    tabScrollView: {
      flexDirection: 'row' as const,
    },
    tab: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 12,
      marginRight: 4,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: colors.accent,
    },
    tabText: {
      marginLeft: 8,
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    activeTabText: {
      color: colors.accent,
      fontWeight: '600' as const,
    },
    tabContent: {
      flex: 1,
    },
    configGrid: {
      flexDirection: 'row' as const,
      padding: 16,
      gap: 16,
    },
    configGridMobile: {
      flexDirection: 'column' as const,
    },
    configCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      flex: 1,
      minWidth: 280,
      maxWidth: 400,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    configCardMobile: {
      minWidth: '100%' as any,
      maxWidth: '100%' as any,
      marginBottom: 12,
    },
    bestConfigCard: {
      borderColor: colors.statusSuccess,
      borderWidth: 2,
    },
    configHeader: {
      marginBottom: 12,
    },
    configTitle: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 4,
    },
    configName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      flex: 1,
    },
    bestConfigText: {
      color: colors.statusSuccess,
    },
    bestConfigTextSmall: {
      color: colors.statusSuccess,
      fontWeight: '600' as const,
    },
    trophyIcon: {
      marginLeft: 8,
    },
    configId: {
      fontSize: 12,
      color: colors.textTertiary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    quickStats: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 12,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    statItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    statValue: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    scoreBarContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    scoreBarBackground: {
      flex: 1,
      height: 8,
      backgroundColor: colors.borderLight,
      borderRadius: 4,
      marginRight: 8,
    },
    scoreBarFill: {
      height: '100%' as any,
      borderRadius: 4,
    },
    scoreText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      minWidth: 35,
    },
    metricsContainer: {
      padding: 16,
    },
    metricRow: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    metricHeader: {
      marginBottom: 16,
    },
    metricLabel: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    metricDescription: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic' as const,
    },
    metricItems: {
      gap: 12,
    },
    metricItem: {
      marginBottom: 8,
    },
    metricItemHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    configNameSmall: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    metricValueContainer: {
      borderLeftWidth: 4,
      paddingLeft: 12,
      paddingVertical: 8,
    },
    metricValueRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 4,
    },
    metricIcon: {
      marginRight: 8,
    },
    metricValue: {
      fontSize: 18,
      fontWeight: 'bold' as const,
    },
    metricLabel_: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tokensContainer: {
      padding: 16,
      gap: 16,
    },
    tokenCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    bestTokenCard: {
      borderColor: colors.statusSuccess,
      borderWidth: 2,
    },
    tokenHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 16,
    },
    tokenMetrics: {
      gap: 12,
    },
    tokenMetric: {
      alignItems: 'center' as const,
    },
    tokenLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    tokenValue: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
    },
    tokenBreakdown: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
    },
    tokenComponent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    tokenIndicator: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    tokenComponentLabel: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tokenVisualization: {
      flexDirection: 'row' as const,
      height: 20,
      borderRadius: 10,
      overflow: 'hidden' as const,
    },
    tokenBar: {
      height: '100%' as any,
    },
    efficiencyMetrics: {
      alignItems: 'center' as const,
      gap: 4,
    },
    efficiencyLabel: {
      fontSize: 12,
      color: colors.textTertiary,
    },
    performanceContainer: {
      padding: 16,
    },
    performanceSection: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    performanceSectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    performanceItem: {
      marginBottom: 12,
    },
    performanceHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    performanceBadges: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    fastestBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.statusSuccess,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    bestBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 10,
      color: colors.textInverse,
      fontWeight: '600' as const,
      marginLeft: 4,
    },
    performanceBarContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    performanceBarBackground: {
      flex: 1,
      height: 8,
      backgroundColor: colors.borderLight,
      borderRadius: 4,
      marginRight: 12,
    },
    performanceBarFill: {
      height: '100%' as any,
      borderRadius: 4,
    },
    performanceTime: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      minWidth: 60,
    },
    configDetailsCard: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: 8,
      padding: 12,
      marginBottom: 12,
    },
    bestConfigDetailsCard: {
      borderColor: colors.statusSuccess,
      borderWidth: 2,
    },
    configDetailsHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 12,
    },
    configDetailsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 12,
    },
    configDetail: {
      flex: 1,
      minWidth: 200,
    },
    configDetailLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    configDetailValue: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    configDetailDescription: {
      fontSize: 10,
      color: colors.textTertiary,
      fontStyle: 'italic' as const,
    },
  }));

  if (!visible || !executionResult.results || executionResult.results.length === 0) {
    return null;
  }

  const configurationScores = executionResult.comparison?.configurationScores || {};
  const bestConfigId = executionResult.comparison?.bestConfigurationId;

  const renderOverviewTab = () => (
    <ScrollView
      style={styles.tabContent}
      horizontal={!isMobile}
      showsHorizontalScrollIndicator={false}
    >
      <View style={[styles.configGrid, isMobile && styles.configGridMobile]}>
        {executionResult.results.map((result, index) => {
          const configId = result.configuration.id;
          const configName = result.configuration.variationName;
          const isBest = configId === bestConfigId;

          const scores = configurationScores[configName] || {};

          return (
            <TouchableOpacity
              key={configId}
              style={[
                styles.configCard,
                isBest && styles.bestConfigCard,
                isMobile && styles.configCardMobile
              ]}
              onPress={() => {
                onConfigurationSelect?.(configId!);
              }}
            >
              <View style={styles.configHeader}>
                <View style={styles.configTitle}>
                  <Text style={[styles.configName, isBest && styles.bestConfigText]}>
                    {result.configuration.variationName}
                  </Text>
                  {isBest && (
                    <Ionicons name="trophy" size={18} color={colors.statusWarning} style={styles.trophyIcon} />
                  )}
                </View>
                <Text style={styles.configId}>
                  {formatConfigId(configId, 12)}
                </Text>
              </View>

              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.statValue}>{(result.executionTime / 1000).toFixed(1)}s</Text>
                </View>

                {result.response.usageMetadata && (
                  <View style={styles.statItem}>
                    <Ionicons name="library-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.statValue}>
                      {result.response.usageMetadata.totalTokens ||
                       result.response.usageMetadata.total_tokens || 'N/A'} tokens
                    </Text>
                  </View>
                )}

                {scores.overall_score && (
                  <View style={styles.statItem}>
                    <Ionicons name="analytics-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.statValue}>
                      {Math.round(scores.overall_score * 100)} score
                    </Text>
                  </View>
                )}
              </View>

              {scores.overall_score && (
                <View style={styles.scoreBarContainer}>
                  <View style={styles.scoreBarBackground}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        {
                          width: `${Math.round(scores.overall_score * 100)}%`,
                          backgroundColor: isBest ? colors.statusSuccess : colors.accent
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.scoreText}>
                    {Math.round(scores.overall_score * 100)}/100
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderMetricsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.metricsContainer}>
        {METRIC_DEFINITIONS.map((metric) => {
          const metricValues = executionResult.results.map(result => {
            const configName = result.configuration.variationName;
            const scores = configurationScores[configName] || {};

            let rawValue;
            if (metric.key === 'response_time_ms') {
              rawValue = result.executionTime;
            } else {
              rawValue = scores[metric.key] || 0;
            }

            return {
              configId: result.configuration.id,
              configName: result.configuration.variationName,
              value: rawValue,
              result: result,
              isBest: result.configuration.id === bestConfigId
            };
          });

          const hasData = metricValues.some(v => v.value > 0);
          if (!hasData && metric.key !== 'response_time_ms') return null;

          return (
            <View key={metric.key} style={styles.metricRow}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricLabel}>{metric.label}</Text>
                {metric.description && (
                  <Text style={styles.metricDescription}>{metric.description}</Text>
                )}
              </View>
              <View style={styles.metricItems}>
                {metricValues.map((item) => {
                  const displayInfo = metric.getDisplayValue ?
                    metric.getDisplayValue(item.value, item.result) :
                    { value: String(item.value), label: '', color: colors.textSecondary };

                  return (
                    <View key={item.configId} style={styles.metricItem}>
                      <View style={styles.metricItemHeader}>
                        <Text style={[styles.configNameSmall, item.isBest && styles.bestConfigTextSmall]}>
                          {item.configName}
                        </Text>
                        {item.isBest && (
                          <Ionicons name="trophy" size={14} color={colors.statusWarning} />
                        )}
                      </View>

                      <View style={[styles.metricValueContainer, { borderLeftColor: displayInfo.color }]}>
                        <View style={styles.metricValueRow}>
                          {displayInfo.icon && (
                            <Ionicons
                              name={displayInfo.icon as any}
                              size={18}
                              color={displayInfo.color}
                              style={styles.metricIcon}
                            />
                          )}
                          <Text style={[styles.metricValue, { color: displayInfo.color }]}>
                            {displayInfo.value}
                          </Text>
                        </View>
                        <Text style={styles.metricLabel_}>
                          {displayInfo.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderTokensTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.tokensContainer}>
        {executionResult.results.map((result) => {
          const usage = result.response.usageMetadata;
          const isBest = result.configuration.id === bestConfigId;

          if (!usage) return null;

          const totalTokens = usage.totalTokens || usage.total_tokens || 0;
          const promptTokens = usage.promptTokens || usage.prompt_tokens || 0;
          const completionTokens = usage.completionTokens || usage.completion_tokens || usage.candidatesTokenCount || 0;

          return (
            <View key={result.configuration.id} style={[styles.tokenCard, isBest && styles.bestTokenCard]}>
              <View style={styles.tokenHeader}>
                <Text style={[styles.configName, isBest && styles.bestConfigText]}>
                  {result.configuration.variationName}
                </Text>
                {isBest && <Ionicons name="trophy" size={16} color={colors.statusWarning} />}
              </View>

              <View style={styles.tokenMetrics}>
                <View style={styles.tokenMetric}>
                  <Text style={styles.tokenLabel}>Total Tokens</Text>
                  <Text style={styles.tokenValue}>{totalTokens.toLocaleString()}</Text>
                </View>

                <View style={styles.tokenBreakdown}>
                  <View style={styles.tokenComponent}>
                    <View style={[styles.tokenIndicator, { backgroundColor: colors.statusSuccess }]} />
                    <Text style={styles.tokenComponentLabel}>Prompt: {promptTokens.toLocaleString()}</Text>
                  </View>
                  <View style={styles.tokenComponent}>
                    <View style={[styles.tokenIndicator, { backgroundColor: colors.accent }]} />
                    <Text style={styles.tokenComponentLabel}>Completion: {completionTokens.toLocaleString()}</Text>
                  </View>
                </View>

                <View style={styles.tokenVisualization}>
                  <View
                    style={[
                      styles.tokenBar,
                      {
                        backgroundColor: colors.statusSuccess,
                        flex: promptTokens || 1
                      }
                    ]}
                  />
                  <View
                    style={[
                      styles.tokenBar,
                      {
                        backgroundColor: colors.accent,
                        flex: completionTokens || 1
                      }
                    ]}
                  />
                </View>

                {totalTokens > 0 && (
                  <View style={styles.efficiencyMetrics}>
                    <Text style={styles.efficiencyLabel}>
                      Output ratio: {Math.round((completionTokens / totalTokens) * 100)}%
                    </Text>
                    {completionTokens > 0 && result.executionTime > 0 && (
                      <Text style={styles.efficiencyLabel}>
                        Speed: {Math.round(totalTokens / (result.executionTime / 1000))} tokens/sec
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );

  const renderPerformanceTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.performanceContainer}>
        <View style={styles.performanceSection}>
          <Text style={styles.performanceSectionTitle}>Response Time Comparison</Text>
          {executionResult.results
            .sort((a, b) => a.executionTime - b.executionTime)
            .map((result, index) => {
              const isBest = result.configuration.id === bestConfigId;
              const isFastest = index === 0;
              const maxTime = Math.max(...executionResult.results.map(r => r.executionTime));
              const percentage = (result.executionTime / maxTime) * 100;

              return (
                <View key={result.configuration.id} style={styles.performanceItem}>
                  <View style={styles.performanceHeader}>
                    <Text style={[styles.configNameSmall, isBest && styles.bestConfigTextSmall]}>
                      {result.configuration.variationName}
                    </Text>
                    <View style={styles.performanceBadges}>
                      {isFastest && (
                        <View style={styles.fastestBadge}>
                          <Ionicons name="flash" size={12} color={colors.textInverse} />
                          <Text style={styles.badgeText}>Fastest</Text>
                        </View>
                      )}
                      {isBest && (
                        <View style={styles.bestBadge}>
                          <Ionicons name="trophy" size={12} color={colors.textInverse} />
                          <Text style={styles.badgeText}>Best</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <View style={styles.performanceBarContainer}>
                    <View style={styles.performanceBarBackground}>
                      <View
                        style={[
                          styles.performanceBarFill,
                          {
                            width: `${percentage}%`,
                            backgroundColor: isFastest ? colors.statusSuccess : isBest ? colors.accent : colors.textSecondary
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.performanceTime}>{(result.executionTime / 1000).toFixed(1)}s</Text>
                  </View>
                </View>
              );
            })}
        </View>

        <View style={styles.performanceSection}>
          <Text style={styles.performanceSectionTitle}>Configuration Details</Text>
          {executionResult.results.map((result) => {
            const isBest = result.configuration.id === bestConfigId;
            const config = result.configuration;

            return (
              <View key={result.configuration.id} style={[styles.configDetailsCard, isBest && styles.bestConfigDetailsCard]}>
                <View style={styles.configDetailsHeader}>
                  <Text style={[styles.configName, isBest && styles.bestConfigText]}>
                    {config.variationName}
                  </Text>
                  {isBest && <Ionicons name="trophy" size={16} color={colors.statusWarning} />}
                </View>

                <View style={styles.configDetailsGrid}>
                  <View style={styles.configDetail}>
                    <Text style={styles.configDetailLabel}>Model</Text>
                    <Text style={styles.configDetailValue}>{config.modelName}</Text>
                  </View>

                  <View style={styles.configDetail}>
                    <Text style={styles.configDetailLabel}>Temperature</Text>
                    <Text style={styles.configDetailValue}>{config.temperature}</Text>
                    <Text style={styles.configDetailDescription}>
                      {PERFORMANCE_DESCRIPTIONS.temperature}
                    </Text>
                  </View>

                  <View style={styles.configDetail}>
                    <Text style={styles.configDetailLabel}>Max Tokens</Text>
                    <Text style={styles.configDetailValue}>{config.maxTokens}</Text>
                    <Text style={styles.configDetailDescription}>
                      {PERFORMANCE_DESCRIPTIONS.maxTokens}
                    </Text>
                  </View>

                  <View style={styles.configDetail}>
                    <Text style={styles.configDetailLabel}>Top P</Text>
                    <Text style={styles.configDetailValue}>{config.topP}</Text>
                    <Text style={styles.configDetailDescription}>
                      {PERFORMANCE_DESCRIPTIONS.topP}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview': return renderOverviewTab();
      case 'metrics': return renderMetricsTab();
      case 'tokens': return renderTokensTab();
      case 'performance': return renderPerformanceTab();
      default: return renderOverviewTab();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuration Comparison</Text>
        <Text style={styles.subtitle}>
          {executionResult.results.length} configurations - Best: {
            executionResult.results.find(r => r.configuration.id === bestConfigId)?.configuration.variationName || 'N/A'
          }
        </Text>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
          {[
            { key: 'overview', label: 'Overview', icon: 'grid-outline' },
            { key: 'metrics', label: 'Metrics', icon: 'analytics-outline' },
            { key: 'tokens', label: 'Tokens', icon: 'library-outline' },
            { key: 'performance', label: 'Performance', icon: 'speedometer-outline' }
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, selectedTab === tab.key && styles.activeTab]}
              onPress={() => setSelectedTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={18}
                color={selectedTab === tab.key ? colors.accent : colors.textSecondary}
              />
              <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {renderTabContent()}
    </View>
  );
};

export default ExecutionComparisonChart;
