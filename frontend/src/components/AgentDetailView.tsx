import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';
import { goGentAPI } from '../api/client';
import { AlertAPI } from './CustomAlert';
import AgentAvatar from './AgentAvatar';
import { Agent, ExecutionRun, LifecycleStatus } from '../types';
import { AgentMemoryViewer } from './AgentMemoryViewer';
import AgentApiKeyManager from './AgentApiKeyManager';

interface AgentDetailViewProps {
  agent: Agent;
  onEdit: () => void;
  onClose: () => void;
  onDelete: () => void;
  onRefresh?: () => void;
  onNavigateToTemplate?: (templateId: string) => void;
  onNavigateToExecution?: (executionId: string) => void;
}

const AgentDetailView: React.FC<AgentDetailViewProps> = ({
  agent,
  onEdit,
  onClose,
  onDelete,
  onRefresh,
  onNavigateToTemplate,
  onNavigateToExecution
}) => {
  const { colors } = useTheme();
  const [executions, setExecutions] = useState<ExecutionRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [agentStats, setAgentStats] = useState<{
    totalExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    totalTokensUsed: number;
    averageExecutionTime: number;
  } | null>(null);
  const [showMemoryViewer, setShowMemoryViewer] = useState(false);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.bgCard,
    },
    headerLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
      gap: 16,
    },
    closeButton: {
      padding: 12,
      marginRight: 8,
      borderRadius: 8,
      backgroundColor: 'transparent',
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    headerInfo: {
      flex: 1,
    },
    agentName: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    templateName: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    headerActions: {
      flexDirection: 'row' as const,
      gap: 12,
    },
    memoryButton: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: 'transparent',
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    apiKeyButton: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: 'transparent',
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    editButton: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: 'transparent',
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    deleteButton: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: 'transparent',
      minWidth: 44,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingBottom: 20,
    },
    section: {
      backgroundColor: colors.bgCard,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: 12,
      padding: 20,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    // Stats Grid Styles
    statsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 12,
    },
    statCard: {
      flex: 1,
      minWidth: '30%' as any,
      backgroundColor: colors.bgSurface,
      borderRadius: 12,
      padding: 16,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    statValue: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginTop: 8,
      marginBottom: 4,
    },
    statLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      fontWeight: '500' as const,
    },
    statusGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 16,
    },
    statusItem: {
      flex: 1,
      minWidth: '45%' as any,
    },
    statusBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      gap: 6,
      alignSelf: 'flex-start' as const,
    },
    statusText: {
      color: colors.textInverse,
      fontSize: 14,
      fontWeight: '600' as const,
    },
    statusLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statusValue: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.textPrimary,
    },
    tokenUsage: {
      alignItems: 'center' as const,
    },
    tokenProgress: {
      width: '100%' as any,
      height: 8,
      backgroundColor: colors.borderLight,
      borderRadius: 4,
      marginBottom: 12,
      overflow: 'hidden' as const,
    },
    tokenProgressBar: {
      height: '100%' as any,
      borderRadius: 4,
    },
    tokenText: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    tokenResetText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    loadingContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 20,
      gap: 8,
    },
    loadingText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    errorContainer: {
      alignItems: 'center' as const,
      paddingVertical: 24,
      paddingHorizontal: 16,
    },
    errorText: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.statusError,
      marginTop: 12,
      marginBottom: 4,
      textAlign: 'center' as const,
    },
    errorSubtext: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center' as const,
      marginBottom: 16,
    },
    retryButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgHover,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.accent,
      gap: 6,
    },
    retryButtonText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '500' as const,
    },
    executionCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    executionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    executionName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      flex: 1,
      marginRight: 12,
    },
    executionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 12,
    },
    executionStatus: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    executionStatusText: {
      fontSize: 10,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    executionDetails: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 16,
      marginBottom: 8,
    },
    executionActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'flex-end' as const,
      gap: 8,
    },
    viewLogsHint: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: colors.bgHover,
      borderRadius: 6,
    },
    viewLogsText: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '500' as const,
    },
    executionDetailRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    executionDetailText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    emptyExecutions: {
      alignItems: 'center' as const,
      paddingVertical: 32,
    },
    emptyExecutionsText: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.textSecondary,
      marginTop: 12,
    },
    emptyExecutionsSubtext: {
      fontSize: 14,
      color: colors.textTertiary,
      marginTop: 4,
    },
    infoGrid: {
      gap: 12,
    },
    infoItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    infoLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
    },
    infoValue: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      flex: 2,
      textAlign: 'right' as const,
    },
    templateContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 8,
      backgroundColor: colors.bgSurface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    templateArrow: {
      marginLeft: 4,
    },
    refreshButton: {
      padding: 8,
      borderRadius: 6,
      minWidth: 36,
      minHeight: 36,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  }));

  useEffect(() => {
    loadExecutions();
  }, [agent.id]);

  const loadExecutions = async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      console.log('🔍 Loading executions for agent:', agent.id);

      // Use reasonable limits - only load 20 recent executions initially
      const response = await goGentAPI.getAgentExecutions(agent.id, 20, 0);
      console.log('📡 Agent executions response:', response);

      if (response.success && response.data) {
        console.log('✅ Executions data:', response.data);
        console.log('📊 Executions count:', response.data.length);

        // Log sample execution data for debugging
        if (response.data.length > 0) {
          console.log('📝 Sample execution:', response.data[0]);
        }

        setExecutions(response.data);

        // Calculate agent statistics
        const stats = {
          totalExecutions: response.data.length,
          completedExecutions: response.data.filter(e => e.status?.toLowerCase() === 'completed').length,
          failedExecutions: response.data.filter(e => e.status?.toLowerCase() === 'failed').length,
          totalTokensUsed: response.data.reduce((sum, e) => sum + (e.totalTokens || 0), 0),
          averageExecutionTime: response.data.length > 0
            ? response.data.reduce((sum, e) => sum + (e.total_time || 0), 0) / response.data.length / 1000
            : 0
        };
        console.log('📈 Calculated stats:', stats);
        setAgentStats(stats);
      } else {
        const errorMessage = response.error || 'Unknown error';
        console.error('❌ Failed to load agent executions:', errorMessage);
        setLoadError(errorMessage);
        // Don't show alert for failed loading, just show in UI
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error('💥 Error loading executions:', error);
      setLoadError(errorMessage);
      // Don't show alert for failed loading, just show in UI
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadExecutions();
    onRefresh?.();
    setIsRefreshing(false);
  };

  const getLifecycleStatusColor = (status: LifecycleStatus): string => {
    switch (status) {
      case 'ACTIVE': return colors.statusSuccess;
      case 'STANDBY': return colors.statusWarning;
      case 'PAUSED': return colors.textSecondary;
      case 'KILLED': return colors.statusError;
      default: return colors.textSecondary;
    }
  };

  const getLifecycleStatusIcon = (status: LifecycleStatus): keyof typeof Ionicons.glyphMap => {
    switch (status) {
      case 'ACTIVE': return 'play-circle';
      case 'STANDBY': return 'pause-circle';
      case 'PAUSED': return 'stop-circle';
      case 'KILLED': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const formatDate = (dateInput: string | Date): string => {
    try {
      if (dateInput instanceof Date) {
        return dateInput.toLocaleString();
      }
      return new Date(dateInput).toLocaleString();
    } catch {
      return 'Never';
    }
  };

  const formatTokenUsage = (used: number, max: number): string => {
    const percentage = max > 0 ? Math.round((used / max) * 100) : 0;
    return `${used.toLocaleString()} / ${max.toLocaleString()} (${percentage}%)`;
  };

  const getExecutionStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case 'completed': return colors.statusSuccess;
      case 'running': return colors.accent;
      case 'failed': return colors.statusError;
      case 'pending': return colors.statusWarning;
      default: return colors.textSecondary;
    }
  };

  const handleExecutionPress = (execution: ExecutionRun) => {
    if (onNavigateToExecution) {
      onNavigateToExecution(execution.id);
    } else {
      console.log('Navigate to execution details:', execution.id);
      AlertAPI.alert(
        'Navigation Not Available',
        'Execution details navigation is not implemented in this context.',
        [{ text: 'OK' }]
      );
    }
  };

  const renderExecutionItem = ({ item: execution }: { item: ExecutionRun }) => (
    <TouchableOpacity
      style={styles.executionCard}
      onPress={() => handleExecutionPress(execution)}
      activeOpacity={0.7}
    >
      <View style={styles.executionHeader}>
        <Text style={styles.executionName} numberOfLines={1}>
          {execution.name || 'Execution'}
        </Text>
        <View style={[styles.executionStatus, { backgroundColor: getExecutionStatusColor(execution.status || 'unknown') }]}>
          <Text style={styles.executionStatusText}>{execution.status?.toUpperCase() || 'UNKNOWN'}</Text>
        </View>
      </View>

      {execution.description && (
        <Text style={styles.executionDescription} numberOfLines={2}>
          {execution.description}
        </Text>
      )}

      <View style={styles.executionDetails}>
        <View style={styles.executionDetailRow}>
          <Ionicons name="time-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.executionDetailText}>
            {formatDate(execution.created_at || execution.createdAt || '')}
          </Text>
        </View>

        {execution.total_time && (
          <View style={styles.executionDetailRow}>
            <Ionicons name="speedometer-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.executionDetailText}>
              {Math.round(execution.total_time / 1000)}s
            </Text>
          </View>
        )}

        {execution.totalTokens && execution.totalTokens > 0 && (
          <View style={styles.executionDetailRow}>
            <Ionicons name="flash-outline" size={14} color={colors.textSecondary} />
            <Text style={styles.executionDetailText}>
              {execution.totalTokens.toLocaleString()} tokens
            </Text>
          </View>
        )}

        {execution.enableFunctionCalling && (
          <View style={styles.executionDetailRow}>
            <Ionicons name="extension-puzzle-outline" size={14} color={colors.accent} />
            <Text style={[styles.executionDetailText, { color: colors.accent }]}>
              Functions
            </Text>
          </View>
        )}
      </View>

      <View style={styles.executionActions}>
        <View style={styles.viewLogsHint}>
          <Text style={styles.viewLogsText}>View Logs</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.accent} />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyExecutions = () => (
    <View style={styles.emptyExecutions}>
      <Ionicons name="analytics-outline" size={48} color={colors.borderLight} />
      <Text style={styles.emptyExecutionsText}>No executions yet</Text>
      <Text style={styles.emptyExecutionsSubtext}>
        This agent hasn't run any executions. Execute the agent from the main screen to see execution history here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <AgentAvatar
            agent={agent}
            size="large"
            showStatus={true}
            animated={true}
          />

          <View style={styles.headerInfo}>
            <Text style={styles.agentName}>{agent.firstName} {agent.lastName}</Text>
            <TouchableOpacity
              style={styles.templateContainer}
              onPress={() => onNavigateToTemplate?.(agent.templateId)}
              disabled={!onNavigateToTemplate}
              activeOpacity={0.7}
              hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
            >
              <Ionicons name="document-text" size={14} color={colors.accent} />
              <Text style={styles.templateName}>{agent.templateName || 'Unknown Archetype Template'}</Text>
              {onNavigateToTemplate && (
                <Ionicons name="arrow-forward" size={14} color={colors.accent} style={styles.templateArrow} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowMemoryViewer(true)}
            style={styles.memoryButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="library-outline" size={20} color={colors.statusSuccess} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowApiKeyManager(true)}
            style={styles.apiKeyButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="key-outline" size={20} color={colors.statusWarning} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onEdit}
            style={styles.editButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={20} color={colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={20} color={colors.statusError} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        bounces={true}
        alwaysBounceVertical={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Performance Statistics */}
        {agentStats && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Statistics</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="analytics" size={24} color={colors.accent} />
                <Text style={styles.statValue}>{agentStats.totalExecutions}</Text>
                <Text style={styles.statLabel}>Total Executions</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color={colors.statusSuccess} />
                <Text style={styles.statValue}>{agentStats.completedExecutions}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="close-circle" size={24} color={colors.statusError} />
                <Text style={styles.statValue}>{agentStats.failedExecutions}</Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="flash" size={24} color={colors.statusWarning} />
                <Text style={styles.statValue}>{agentStats.totalTokensUsed.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Tokens Used</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="speedometer" size={24} color={colors.accent} />
                <Text style={styles.statValue}>{agentStats.averageExecutionTime.toFixed(1)}s</Text>
                <Text style={styles.statLabel}>Avg Duration</Text>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={24} color={colors.accent} />
                <Text style={styles.statValue}>
                  {agentStats.totalExecutions > 0
                    ? Math.round((agentStats.completedExecutions / agentStats.totalExecutions) * 100)
                    : 0}%
                </Text>
                <Text style={styles.statLabel}>Success Rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Status & Configuration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status & Configuration</Text>

          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <View style={[styles.statusBadge, { backgroundColor: getLifecycleStatusColor(agent.lifecycleStatus) }]}>
                <Ionicons
                  name={getLifecycleStatusIcon(agent.lifecycleStatus)}
                  size={20}
                  color="white"
                />
                <Text style={styles.statusText}>{agent.lifecycleStatus}</Text>
              </View>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Heartbeat</Text>
              <Text style={styles.statusValue}>Every {agent.heartbeatMinutes} min</Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Total Executions</Text>
              <Text style={styles.statusValue}>{agent.totalExecutions}</Text>
            </View>

            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Last Execution</Text>
              <Text style={styles.statusValue}>
                {agent.lastExecutionAt ? formatDate(agent.lastExecutionAt) : 'Never'}
              </Text>
            </View>
          </View>
        </View>

        {/* Token Usage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Token Usage (Today)</Text>

          <View style={styles.tokenUsage}>
            <View style={styles.tokenProgress}>
              <View
                style={[
                  styles.tokenProgressBar,
                  {
                    width: `${Math.min((agent.tokensUsedToday / agent.maxTokensPerDay) * 100, 100)}%`,
                    backgroundColor: agent.tokensUsedToday > agent.maxTokensPerDay * 0.9 ? colors.statusError : colors.accent
                  }
                ]}
              />
            </View>
            <Text style={styles.tokenText}>
              {formatTokenUsage(agent.tokensUsedToday, agent.maxTokensPerDay)}
            </Text>
            <Text style={styles.tokenResetText}>
              Resets: {formatDate(agent.tokensResetDate)}
            </Text>
          </View>
        </View>

        {/* Execution History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Executions</Text>
            {executions.length > 0 && (
              <TouchableOpacity
                onPress={loadExecutions}
                style={styles.refreshButton}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="refresh" size={20} color={colors.accent} />
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Loading executions...</Text>
            </View>
          ) : loadError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="warning-outline" size={24} color={colors.statusError} />
              <Text style={styles.errorText}>Failed to load executions</Text>
              <Text style={styles.errorSubtext}>{loadError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={loadExecutions}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh" size={16} color={colors.accent} />
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : executions.length > 0 ? (
            <FlatList
              data={executions}
              renderItem={renderExecutionItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            renderEmptyExecutions()
          )}
        </View>

        {/* Agent Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Agent Information</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Agent ID</Text>
              <Text style={styles.infoValue}>{agent.id}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Archetype Template ID</Text>
              <Text style={styles.infoValue}>{agent.templateId}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatDate(agent.createdAt)}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Last Updated</Text>
              <Text style={styles.infoValue}>{formatDate(agent.updatedAt)}</Text>
            </View>

            {agent.nextScheduledAt && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Next Scheduled</Text>
                <Text style={styles.infoValue}>{formatDate(agent.nextScheduledAt)}</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Memory Viewer Modal */}
      <Modal visible={showMemoryViewer} animationType="slide" presentationStyle="pageSheet">
        {showMemoryViewer && (
          <AgentMemoryViewer
            agent={agent}
            onClose={() => setShowMemoryViewer(false)}
          />
        )}
      </Modal>

      {/* API Key Manager Modal */}
      <AgentApiKeyManager
        agent={agent}
        visible={showApiKeyManager}
        onClose={() => setShowApiKeyManager(false)}
      />
    </View>
  );
};

export default AgentDetailView;
