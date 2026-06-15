import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, Modal, Clipboard } from 'react-native';
import {
  ExecutionLog,
  LogLevel,
  LogCategory,
  ExecutionResult,
} from '../types';
import { Ionicons } from '@expo/vector-icons';
import { AlertAPI } from './CustomAlert';
import { goGentAPI } from '../api/client';
import { generateRerunName } from '../utils/executionNaming';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

export interface ExecutionLogsCardProps {
  executionResult: ExecutionResult;
  onClose: () => void;
  onReExecute: (data: any) => void;
  visible: boolean;
  configurationId?: string; // Optional - if provided, filter logs by this configuration
}

const ExecutionLogsCard: React.FC<ExecutionLogsCardProps> = ({
  executionResult,
  visible,
  onClose,
  onReExecute,
  configurationId,
}) => {
  const { colors } = useTheme();
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'ALL'>('ALL');
  const [expandedConfigurations, setExpandedConfigurations] = useState<Set<string>>(new Set());
  const [configFilteredLogs, setConfigFilteredLogs] = useState<ExecutionLog[] | null>(null);
  const [isLoadingFilteredLogs, setIsLoadingFilteredLogs] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgSurface,
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
    title: {
      ...typography.h2,
      color: colors.textPrimary,
      flex: 1,
      marginRight: spacing.lg,
    },
    closeButton: {
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.bgApp,
    },
    headerLeft: {
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    copyAllButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgHover,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    copyAllText: {
      ...typography.bodyStrong,
      color: colors.accent,
    },
    copyLogButton: {
      padding: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: colors.bgHover,
      marginRight: spacing.sm,
    },
    statsContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
    },
    statPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.bgSurface,
    },
    activeFilterPill: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    statText: {
      ...typography.caption,
      fontWeight: '500' as const,
      color: colors.textSecondary,
    },
    activeStatText: {
      color: colors.textInverse,
      fontWeight: '600' as const,
    },
    filtersContainer: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    filterSection: {
      marginBottom: spacing.md,
    },
    filterSectionTitle: {
      ...typography.label,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    listContainer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: 80,
    },
    logItem: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 3,
    },
    logHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    logIconContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginRight: spacing.md,
      minWidth: 40,
    },
    logIndicator: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 6,
    },
    logEmoji: {
      fontSize: 16,
    },
    logMainContent: {
      flex: 1,
      minHeight: 40,
    },
    logTitleRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.xs,
    },
    logCategory: {
      ...typography.micro,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    logMetaCompact: {
      alignItems: 'flex-end' as const,
    },
    logMessage: {
      ...typography.body,
      color: colors.textPrimary,
    },
    logTimestamp: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      fontFamily: 'monospace',
      marginBottom: 2,
    },
    logLevel: {
      ...typography.micro,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.3,
    },
    expandIcon: {
      marginLeft: spacing.sm,
      paddingTop: 2,
    },
    logDetails: {
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.bgApp,
    },
    detailsTitle: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    detailsScrollContainer: {
      maxHeight: 120,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.sm,
      padding: spacing.sm,
    },
    detailsContent: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      fontFamily: 'monospace',
      lineHeight: 16,
    },
    footer: {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    footerSpacer: {
      height: 20,
    },
    reExecuteButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.accent,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      justifyContent: 'center' as const,
    },
    reExecuteButtonText: {
      ...typography.title,
      color: colors.textInverse,
      marginLeft: spacing.sm,
    },
    configurationSection: {
      marginBottom: spacing.lg,
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden' as const,
    },
    configurationHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
      backgroundColor: colors.bgSurface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    configHeaderLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
    },
    configIconContainer: {
      marginRight: spacing.md,
      width: 24,
      alignItems: 'center' as const,
    },
    configHeaderContent: {
      flex: 1,
    },
    configTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    configSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    configLogCount: {
      ...typography.micro,
      color: colors.textSecondary,
    },
    configHeaderRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    copyConfigButton: {
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.bgHover,
    },
    configurationLogs: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
    },
    filtersHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
      backgroundColor: colors.bgSurface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    filtersHeaderContent: {
      flex: 1,
    },
    filtersHeaderTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    filtersHeaderStats: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    filtersHeaderSubtitle: {
      ...typography.caption,
      fontWeight: '500' as const,
      color: colors.textSecondary,
    },
    activeFiltersCompact: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    activeFilterChip: {
      backgroundColor: colors.borderLight,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    activeFilterChipText: {
      ...typography.micro,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    filtersExpandedContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.bgSurface,
    },
    clearFiltersButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: `${colors.statusError}15`,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      marginTop: spacing.md,
    },
    clearFiltersText: {
      ...typography.bodyStrong,
      color: colors.statusError,
      marginLeft: spacing.sm,
    },
  }));

  // Helper function to create proper reExecutionData structure
  const createReExecutionData = () => {
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

    const basePrompt = executionResult.results?.[0]?.request?.prompt || executionResult.executionRun.basePrompt || '';
    const context = executionResult.results?.[0]?.request?.context || executionResult.executionRun.contextPrompt || '';

    return {
      executionRunName: generateRerunName(executionResult.executionRun.name),
      description: executionResult.executionRun.description || '',
      basePrompt: basePrompt,
      context: context,
      configurations: executionResult.results?.map(r => r.configuration) || [],
      enableFunctionCalling: executionResult.executionRun.enableFunctionCalling || functionTools.length > 0,
      functionTools: functionTools,
      agentId: executionResult.executionRun.agentId || undefined
    };
  };

  // Fetch logs filtered by configuration when configurationId is provided
  useEffect(() => {
    if (visible && configurationId) {
      setIsLoadingFilteredLogs(true);
      goGentAPI.getExecutionLogsByConfiguration(executionResult.executionRun.id, configurationId)
        .then((response) => {
          if (response.success && response.data) {
            setConfigFilteredLogs(response.data);
          } else {
            console.warn('Failed to fetch filtered logs:', response.error);
            setConfigFilteredLogs([]);
          }
        })
        .catch((error) => {
          console.error('Error fetching filtered logs:', error);
          setConfigFilteredLogs([]);
        })
        .finally(() => {
          setIsLoadingFilteredLogs(false);
        });
    } else {
      setConfigFilteredLogs(null);
    }
  }, [visible, configurationId, executionResult.executionRun.id]);

  if (!visible) {
    return null;
  }

  const logs = configFilteredLogs || executionResult.logs || [];

  // Expand all configuration sections by default
  React.useEffect(() => {
    if (visible && logs.length > 0) {
      const configIds = new Set<string>();
      logs.forEach(log => {
        const configId = log.configurationId || 'general';
        configIds.add(configId);
      });
      setExpandedConfigurations(configIds);
    }
  }, [visible, logs]);
  const title = `Execution Logs for ${executionResult.executionRun.name}`;

  const filteredLogs = logs.filter(log => {
    const levelMatch = levelFilter === 'ALL' || log.logLevel === levelFilter;
    const categoryMatch = categoryFilter === 'ALL' || log.logCategory === categoryFilter;
    return levelMatch && categoryMatch;
  });

  const groupedLogs = useMemo(() => {
    const groups: Record<string, ExecutionLog[]> = {};
    filteredLogs.forEach(log => {
      const configId = log.configurationId || 'general';
      if (!groups[configId]) {
        groups[configId] = [];
      }
      groups[configId].push(log);
    });
    return groups;
  }, [filteredLogs]);

  const configurationDetails = useMemo(() => {
    const details: Record<string, any> = {};
    if (executionResult.results) {
      executionResult.results.forEach(result => {
        if (result.configuration.id) {
          details[result.configuration.id] = result.configuration;
        }
      });
    }
    return details;
  }, [executionResult.results]);

  const toggleLogExpansion = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const toggleConfigurationExpansion = (configId: string) => {
    const newExpanded = new Set(expandedConfigurations);
    if (newExpanded.has(configId)) {
      newExpanded.delete(configId);
    } else {
      newExpanded.add(configId);
    }
    setExpandedConfigurations(newExpanded);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      AlertAPI.alert('Copied!', `${label} copied to clipboard`);
    } catch (error) {
      AlertAPI.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const copyAllLogs = async () => {
    try {
      const allLogsText = Object.entries(groupedLogs)
        .map(([configId, configLogs]) => {
          const configName = configId === 'general'
            ? 'General Execution Logs'
            : configurationDetails[configId]?.variationName || `Configuration ${configId}`;

          const configHeader = `=== ${configName} ===`;
          const configLogsText = configLogs.map(log => {
            const timestamp = formatTimestamp(log.timestamp);
            const details = typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2);
            return `[${timestamp}] ${log.logLevel} - ${log.logCategory}\n${log.message}\n${details ? `Details: ${details}` : ''}\n---`;
          }).join('\n\n');

          return `${configHeader}\n\n${configLogsText}`;
        })
        .join('\n\n\n');

      await Clipboard.setString(allLogsText);
      AlertAPI.alert('Copied!', `All ${filteredLogs.length} logs copied to clipboard`);
    } catch (error) {
      AlertAPI.alert('Error', 'Failed to copy logs to clipboard');
    }
  };

  const getLogLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'SUCCESS': return colors.statusSuccess;
      case 'ERROR': return colors.statusError;
      case 'WARN': return colors.statusWarning;
      case 'INFO': return colors.accent;
      case 'DEBUG': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getLogEmoji = (level: LogLevel, category: LogCategory): string => {
    switch (level) {
      case 'SUCCESS': return '✅';
      case 'ERROR': return '❌';
      case 'WARN': return '⚠️';
      default:
        switch (category) {
          case 'API_CALL': return '📞';
          case 'FUNCTION_CALL': return '🔧';
          case 'SETUP': return '🛠️';
          case 'EXECUTION': return '🚀';
          case 'COMPLETION': return '🎯';
          default: return '📝';
        }
    }
  };

  const formatTimestamp = (timestamp: string | Date): string => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const getCategoryColor = (category: LogCategory): string => {
    switch (category) {
      case 'FUNCTION_CALL': return colors.statusError;
      case 'API_CALL': return colors.accent;
      case 'SETUP': return colors.accentSecondary;
      case 'EXECUTION': return colors.statusWarning;
      case 'COMPLETION': return colors.statusSuccess;
      case 'ERROR': return colors.statusError;
      default: return colors.textSecondary;
    }
  };

  const renderLogStats = () => {
    const levelStats = logs.reduce((acc, log) => {
      acc[log.logLevel] = (acc[log.logLevel] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);

    const categoryStats = logs.reduce((acc, log) => {
      acc[log.logCategory] = (acc[log.logCategory] || 0) + 1;
      return acc;
    }, {} as Record<LogCategory, number>);

    const totalLogs = logs.length;
    const filteredCount = filteredLogs.length;
    const activeFilters = [
      levelFilter !== 'ALL' ? levelFilter : null,
      categoryFilter !== 'ALL' ? categoryFilter : null
    ].filter(Boolean);

    return (
      <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={styles.filtersHeader}
          onPress={() => setFiltersExpanded(!filtersExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.filtersHeaderContent}>
            <Text style={styles.filtersHeaderTitle}>
              Filters {activeFilters.length > 0 && `(${activeFilters.length} active)`}
            </Text>
            <View style={styles.filtersHeaderStats}>
              <Text style={styles.filtersHeaderSubtitle}>
                {filteredCount} of {totalLogs} logs
              </Text>
              {activeFilters.length > 0 && (
                <View style={styles.activeFiltersCompact}>
                  {activeFilters.map((filter, index) => (
                    <View key={filter} style={styles.activeFilterChip}>
                      <Text style={styles.activeFilterChipText}>{filter}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          <Ionicons
            name={filtersExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {filtersExpanded && (
          <View style={styles.filtersExpandedContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Log Levels:</Text>
              <View style={styles.statsContainer}>
                {Object.entries(levelStats).map(([level, count]) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.statPill,
                      levelFilter === level && styles.activeFilterPill,
                      { borderColor: getLogLevelColor(level as LogLevel) }
                    ]}
                    onPress={() => setLevelFilter(level as LogLevel)}
                  >
                    <Text style={[
                      styles.statText,
                      { color: getLogLevelColor(level as LogLevel) },
                      levelFilter === level && styles.activeStatText
                    ]}>
                      {level}: {count}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.statPill, levelFilter === 'ALL' && styles.activeFilterPill]}
                  onPress={() => setLevelFilter('ALL')}
                >
                  <Text style={[styles.statText, levelFilter === 'ALL' && styles.activeStatText]}>ALL</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Categories:</Text>
              <View style={styles.statsContainer}>
                {Object.entries(categoryStats).map(([category, count]) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.statPill,
                      categoryFilter === category && styles.activeFilterPill,
                      { borderColor: getCategoryColor(category as LogCategory) }
                    ]}
                    onPress={() => setCategoryFilter(category as LogCategory)}
                  >
                    <Text style={[
                      styles.statText,
                      { color: getCategoryColor(category as LogCategory) },
                      categoryFilter === category && styles.activeStatText
                    ]}>
                      {category}: {count}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.statPill, categoryFilter === 'ALL' && styles.activeFilterPill]}
                  onPress={() => setCategoryFilter('ALL')}
                >
                  <Text style={[styles.statText, categoryFilter === 'ALL' && styles.activeStatText]}>ALL</Text>
                </TouchableOpacity>
              </View>
            </View>

            {activeFilters.length > 0 && (
              <TouchableOpacity
                style={styles.clearFiltersButton}
                onPress={() => {
                  setLevelFilter('ALL');
                  setCategoryFilter('ALL');
                }}
              >
                <Ionicons name="refresh" size={16} color={colors.statusError} />
                <Text style={styles.clearFiltersText}>Clear All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderLogItem = (log: ExecutionLog) => {
    const isExpanded = expandedLog === log.id;
    const color = getLogLevelColor(log.logLevel);
    const emoji = getLogEmoji(log.logLevel, log.logCategory);

    return (
      <TouchableOpacity
        key={log.id}
        style={[styles.logItem, { borderLeftColor: color }]}
        onPress={() => toggleLogExpansion(log.id)}
        activeOpacity={0.7}
      >
        <View style={styles.logHeader}>
          <View style={styles.logIconContainer}>
            <View style={[styles.logIndicator, { backgroundColor: color }]} />
            <Text style={styles.logEmoji}>{emoji}</Text>
          </View>

          <View style={styles.logMainContent}>
            <View style={styles.logTitleRow}>
              <Text style={styles.logCategory}>{log.logCategory}</Text>
              <View style={styles.logMetaCompact}>
                <TouchableOpacity
                  style={styles.copyLogButton}
                  hitSlop={{ top: 11, bottom: 11, left: 11, right: 11 }}
                  onPress={() => {
                    const logText = `[${formatTimestamp(log.timestamp)}] ${log.logLevel} - ${log.logCategory}\n${log.message}${log.details ? `\nDetails: ${typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}` : ''}`;
                    copyToClipboard(logText, 'Log entry');
                  }}
                >
                  <Ionicons name="copy" size={14} color={colors.accent} />
                </TouchableOpacity>
                <Text style={styles.logTimestamp}>
                  {formatTimestamp(log.timestamp)}
                </Text>
                <Text style={[styles.logLevel, { color }]}>
                  {log.logLevel}
                </Text>
              </View>
            </View>
            <Text style={styles.logMessage} numberOfLines={isExpanded ? undefined : 2}>
              {log.message}
            </Text>
          </View>

          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textTertiary}
            style={styles.expandIcon}
          />
        </View>

        {isExpanded && log.details && (
          <View style={styles.logDetails}>
            <Text style={styles.detailsTitle}>Details</Text>
            <ScrollView
              style={styles.detailsScrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              <Text style={styles.detailsContent}>
                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderConfigurationHeader = (configId: string, configLogs: ExecutionLog[]) => {
    const isExpanded = expandedConfigurations.has(configId);
    const config = configurationDetails[configId];
    const isGeneral = configId === 'general';

    const configName = isGeneral
      ? 'General Execution Logs'
      : config?.variationName || `Configuration ${configId}`;

    return (
      <TouchableOpacity
        style={styles.configurationHeader}
        onPress={() => toggleConfigurationExpansion(configId)}
        activeOpacity={0.7}
      >
        <View style={styles.configHeaderLeft}>
          <View style={styles.configIconContainer}>
            <Ionicons
              name={isGeneral ? "settings" : "hardware-chip"}
              size={18}
              color={isGeneral ? colors.textSecondary : colors.accent}
            />
          </View>
          <View style={styles.configHeaderContent}>
            <Text style={styles.configTitle}>{configName}</Text>
            {!isGeneral && config && (
              <Text style={styles.configSubtitle}>
                {config.modelName} - Temp: {config.temperature || 0}
              </Text>
            )}
            <Text style={styles.configLogCount}>
              {configLogs.length} log{configLogs.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <View style={styles.configHeaderRight}>
          <TouchableOpacity
            style={styles.copyConfigButton}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            onPress={(e) => {
              e.stopPropagation();
              const configLogsText = configLogs.map(log => {
                const timestamp = formatTimestamp(log.timestamp);
                const details = typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2);
                return `[${timestamp}] ${log.logLevel} - ${log.logCategory}\n${log.message}\n${details ? `Details: ${details}` : ''}\n---`;
              }).join('\n\n');
              copyToClipboard(configLogsText, `${configName} logs`);
            }}
          >
            <Ionicons name="copy" size={16} color={colors.accent} />
          </TouchableOpacity>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderConfigurationSection = (configId: string, configLogs: ExecutionLog[]) => {
    const isExpanded = expandedConfigurations.has(configId);

    return (
      <View key={configId} style={styles.configurationSection}>
        {renderConfigurationHeader(configId, configLogs)}
        {isExpanded && (
          <View style={styles.configurationLogs}>
            {configLogs.map(log => renderLogItem(log))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={copyAllLogs} style={styles.copyAllButton}>
              <Ionicons name="copy" size={20} color={colors.accent} />
              <Text style={styles.copyAllText}>Copy All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {renderLogStats()}

        <ScrollView
          style={styles.listContainer}
          showsVerticalScrollIndicator={true}
          bounces={true}
        >
          {Object.entries(groupedLogs).map(([configId, configLogs]) =>
            renderConfigurationSection(configId, configLogs)
          )}
          <View style={styles.footerSpacer} />
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.reExecuteButton}
            onPress={() => onReExecute(createReExecutionData())}
          >
            <Ionicons name="repeat" size={18} color={colors.textInverse} />
            <Text style={styles.reExecuteButtonText}>Re-Execute</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ExecutionLogsCard;
