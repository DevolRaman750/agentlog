import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExecutionResult, VariationResult, ComparisonResult } from '../types';
import { formatConfigId } from '../utils/comparisonUtils';

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
  getDisplayValue?: (value: any, result?: VariationResult) => { value: string; label: string; color: string; icon?: string };
  higherIsBetter?: boolean;
  color?: string;
  description?: string;
}

const getQualityLabel = (score: number) => {
  if (score >= 0.8) return { label: 'Excellent', color: '#4CAF50', icon: 'star' };
  if (score >= 0.6) return { label: 'Good', color: '#8BC34A', icon: 'thumbs-up' };
  if (score >= 0.4) return { label: 'Fair', color: '#FFC107', icon: 'remove' };
  if (score >= 0.2) return { label: 'Poor', color: '#FF9800', icon: 'thumbs-down' };
  return { label: 'Very Poor', color: '#F44336', icon: 'close' };
};

const getSpeedLabel = (timeMs: number, allTimes: number[]) => {
  const minTime = Math.min(...allTimes);
  const maxTime = Math.max(...allTimes);
  const relative = (timeMs - minTime) / (maxTime - minTime);
  
  if (timeMs === minTime) return { label: 'Fastest', color: '#4CAF50', icon: 'flash' };
  if (relative <= 0.3) return { label: 'Fast', color: '#8BC34A', icon: 'rocket' };
  if (relative <= 0.7) return { label: 'Moderate', color: '#FFC107', icon: 'time' };
  return { label: 'Slow', color: '#FF5722', icon: 'hourglass' };
};

const getTokenEfficiencyDisplay = (score: number, result: VariationResult) => {
  const usage = result.response.usageMetadata;
  if (!usage) return { value: 'N/A', label: 'No data', color: '#9E9E9E' };
  
  const totalTokens = usage.totalTokens || usage.total_tokens || 0;
  const completionTokens = usage.completionTokens || usage.completion_tokens || usage.candidatesTokenCount || 0;
  const promptTokens = usage.promptTokens || usage.prompt_tokens || 0;
  
  if (totalTokens === 0) return { value: 'N/A', label: 'No tokens', color: '#9E9E9E' };
  
  const efficiency = completionTokens / totalTokens;
  const tokensPerSecond = Math.round(totalTokens / (result.executionTime / 1000));
  
  let label = '';
  let color = '';
  
  if (efficiency >= 0.4) {
    label = `Efficient (${tokensPerSecond}/s)`;
    color = '#4CAF50';
  } else if (efficiency >= 0.25) {
    label = `Moderate (${tokensPerSecond}/s)`;
    color = '#FFC107';
  } else {
    label = `Low efficiency (${tokensPerSecond}/s)`;
    color = '#FF5722';
  }
  
  return {
    value: `${Math.round(efficiency * 100)}%`,
    label,
    color,
    icon: 'speedometer'
  };
};

const getCostEffectivenessDisplay = (score: number, result: VariationResult) => {
  const usage = result.response.usageMetadata;
  if (!usage) return { value: 'N/A', label: 'No data', color: '#9E9E9E' };
  
  const totalTokens = usage.totalTokens || usage.total_tokens || 0;
  if (totalTokens === 0) return { value: 'N/A', label: 'No tokens', color: '#9E9E9E' };
  
  // Rough cost estimation (these are approximate rates)
  const costPer1kTokens = result.configuration.modelName?.includes('flash') ? 0.00015 : 0.002;
  const estimatedCost = (totalTokens / 1000) * costPer1kTokens;
  
  let label = '';
  let color = '';
  
  if (estimatedCost <= 0.001) {
    label = 'Very economical';
    color = '#4CAF50';
  } else if (estimatedCost <= 0.01) {
    label = 'Cost effective';
    color = '#8BC34A';
  } else if (estimatedCost <= 0.05) {
    label = 'Moderate cost';
    color = '#FFC107';
  } else {
    label = 'Expensive';
    color = '#FF5722';
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
    getDisplayValue: (timeMs: number, result: VariationResult, allResults?: VariationResult[]) => {
      if (!allResults) return { value: `${timeMs}ms`, label: 'Response time', color: '#2196F3' };
      
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
    getDisplayValue: (score: number, result: VariationResult) => getTokenEfficiencyDisplay(score, result)
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
    getDisplayValue: (score: number, result: VariationResult) => getCostEffectivenessDisplay(score, result)
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
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'tokens' | 'performance'>('overview');

  const { width: screenWidth } = Dimensions.get('window');
  const isTablet = screenWidth > 768;
  const isMobile = Platform.OS !== 'web' && screenWidth < 768;

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
          
          // Use variationName as key to match backend structure
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
                onConfigurationSelect?.(configId);
              }}
            >
              {/* Header */}
              <View style={styles.configHeader}>
                <View style={styles.configTitle}>
                  <Text style={[styles.configName, isBest && styles.bestConfigText]}>
                    {result.configuration.variationName}
                  </Text>
                  {isBest && (
                    <Ionicons name="trophy" size={18} color="#FFD700" style={styles.trophyIcon} />
                  )}
                </View>
                <Text style={styles.configId}>
                  {formatConfigId(configId, 12)}
                </Text>
              </View>

              {/* Quick Stats */}
              <View style={styles.quickStats}>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={16} color="#666" />
                  <Text style={styles.statValue}>{(result.executionTime / 1000).toFixed(1)}s</Text>
                </View>
                
                {result.response.usageMetadata && (
                  <View style={styles.statItem}>
                    <Ionicons name="library-outline" size={16} color="#666" />
                    <Text style={styles.statValue}>
                      {result.response.usageMetadata.totalTokens || 
                       result.response.usageMetadata.total_tokens || 'N/A'} tokens
                    </Text>
                  </View>
                )}

                {scores.overall_score && (
                  <View style={styles.statItem}>
                    <Ionicons name="analytics-outline" size={16} color="#666" />
                    <Text style={styles.statValue}>
                      {Math.round(scores.overall_score * 100)} score
                    </Text>
                  </View>
                )}
              </View>

              {/* Score Bar */}
              {scores.overall_score && (
                <View style={styles.scoreBarContainer}>
                  <View style={styles.scoreBarBackground}>
                    <View 
                      style={[
                        styles.scoreBarFill,
                        { 
                          width: `${Math.round(scores.overall_score * 100)}%`,
                          backgroundColor: isBest ? '#4CAF50' : '#2196F3'
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
            
            // Get the raw value based on metric key
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

          // Skip if no meaningful data for this metric
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
                    metric.getDisplayValue(item.value, item.result, executionResult.results) :
                    { value: String(item.value), label: '', color: '#9E9E9E' };

                  return (
                    <View key={item.configId} style={styles.metricItem}>
                      <View style={styles.metricItemHeader}>
                        <Text style={[styles.configNameSmall, item.isBest && styles.bestConfigTextSmall]}>
                          {item.configName}
                        </Text>
                        {item.isBest && (
                          <Ionicons name="trophy" size={14} color="#FFD700" />
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
                {isBest && <Ionicons name="trophy" size={16} color="#FFD700" />}
              </View>

              <View style={styles.tokenMetrics}>
                <View style={styles.tokenMetric}>
                  <Text style={styles.tokenLabel}>Total Tokens</Text>
                  <Text style={styles.tokenValue}>{totalTokens.toLocaleString()}</Text>
                </View>
                
                <View style={styles.tokenBreakdown}>
                  <View style={styles.tokenComponent}>
                    <View style={[styles.tokenIndicator, { backgroundColor: '#4CAF50' }]} />
                    <Text style={styles.tokenComponentLabel}>Prompt: {promptTokens.toLocaleString()}</Text>
                  </View>
                  <View style={styles.tokenComponent}>
                    <View style={[styles.tokenIndicator, { backgroundColor: '#2196F3' }]} />
                    <Text style={styles.tokenComponentLabel}>Completion: {completionTokens.toLocaleString()}</Text>
                  </View>
                </View>

                {/* Token Usage Visualization */}
                <View style={styles.tokenVisualization}>
                  <View 
                    style={[
                      styles.tokenBar,
                      { 
                        backgroundColor: '#4CAF50',
                        flex: promptTokens || 1
                      }
                    ]}
                  />
                  <View 
                    style={[
                      styles.tokenBar,
                      { 
                        backgroundColor: '#2196F3',
                        flex: completionTokens || 1
                      }
                    ]}
                  />
                </View>

                {/* Efficiency Metrics */}
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
        {/* Response Time Comparison */}
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
                          <Ionicons name="flash" size={12} color="#FFF" />
                          <Text style={styles.badgeText}>Fastest</Text>
                        </View>
                      )}
                      {isBest && (
                        <View style={styles.bestBadge}>
                          <Ionicons name="trophy" size={12} color="#FFF" />
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
                            backgroundColor: isFastest ? '#4CAF50' : isBest ? '#2196F3' : '#9E9E9E'
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

        {/* Model Configuration Details */}
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
                  {isBest && <Ionicons name="trophy" size={16} color="#FFD700" />}
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Configuration Comparison</Text>
        <Text style={styles.subtitle}>
          {executionResult.results.length} configurations • Best: {
            executionResult.results.find(r => r.configuration.id === bestConfigId)?.configuration.variationName || 'N/A'
          }
        </Text>
      </View>

      {/* Tab Navigation */}
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
                color={selectedTab === tab.key ? '#2196F3' : '#666'} 
              />
              <Text style={[styles.tabText, selectedTab === tab.key && styles.activeTabText]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tab Content */}
      {renderTabContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  tabContainer: {
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tabScrollView: {
    flexDirection: 'row',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#2196F3',
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
  },
  
  // Overview Tab Styles
  configGrid: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  configGridMobile: {
    flexDirection: 'column',
  },
  configCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: 280,
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  configCardMobile: {
    minWidth: '100%',
    maxWidth: '100%',
    marginBottom: 12,
  },
  bestConfigCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  configHeader: {
    marginBottom: 12,
  },
  configTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  configName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  bestConfigText: {
    color: '#4CAF50',
  },
  bestConfigTextSmall: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  trophyIcon: {
    marginLeft: 8,
  },
  configId: {
    fontSize: 12,
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  scoreBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 8,
  },
  scoreBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    minWidth: 35,
  },

  // Metrics Tab Styles
  metricsContainer: {
    padding: 16,
  },
  metricRow: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  metricHeader: {
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  metricDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  metricItems: {
    gap: 12,
  },
  metricItem: {
    marginBottom: 8,
  },
  metricItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  configNameSmall: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  metricValueContainer: {
    borderLeftWidth: 4,
    paddingLeft: 12,
    paddingVertical: 8,
  },
  metricValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricIcon: {
    marginRight: 8,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  metricLabel_: {
    fontSize: 12,
    color: '#666',
  },

  // Tokens Tab Styles
  tokensContainer: {
    padding: 16,
    gap: 16,
  },
  tokenCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  bestTokenCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  tokenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tokenMetrics: {
    gap: 12,
  },
  tokenMetric: {
    alignItems: 'center',
  },
  tokenLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  tokenBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tokenComponent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  tokenComponentLabel: {
    fontSize: 12,
    color: '#666',
  },
  tokenVisualization: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tokenBar: {
    height: '100%',
  },
  efficiencyMetrics: {
    alignItems: 'center',
    gap: 4,
  },
  efficiencyLabel: {
    fontSize: 12,
    color: '#999',
  },

  // Performance Tab Styles
  performanceContainer: {
    padding: 16,
  },
  performanceSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  performanceSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  performanceItem: {
    marginBottom: 12,
  },
  performanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  performanceBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  fastestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
    marginLeft: 4,
  },
  performanceBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginRight: 12,
  },
  performanceBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  performanceTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    minWidth: 60,
  },
  configDetailsCard: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  bestConfigDetailsCard: {
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  configDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  configDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  configDetail: {
    flex: 1,
    minWidth: 200,
  },
  configDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  configDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  configDetailDescription: {
    fontSize: 10,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ExecutionComparisonChart; 