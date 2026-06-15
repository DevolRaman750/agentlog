import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform, Pressable, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useApp } from '../context/AppContext';
import { goGentAPI } from '../api/client';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
// import ExecutionFlowGraphVisualization from './ExecutionFlowGraphVisualization';

// Type definitions for the execution flow
interface ExecutionFlowEvent {
  id: string;
  executionRunId: string;
  requestId?: string;
  eventType: 'prompt_start' | 'ai_model_call' | 'function_call_start' | 'function_call_end' | 'ai_response' | 'error_occurred' | 'retry_attempt' | 'execution_complete';
  sequenceNumber: number;
  parentEventId?: string;
  eventData?: any;
  durationMs?: number;
  status: 'pending' | 'success' | 'error' | 'timeout';
  errorMessage?: string;
  createdAt: string;
}

interface FunctionCall {
  id: string;
  request_id: string;
  function_name: string;
  function_arguments: any;
  function_response?: any;
  execution_status: string;
  execution_time_ms?: number;
  error_details?: string;
  created_at: string;
  sequence_number: number;
  parent_call_id?: string;
  execution_depth: number;
}

interface ExecutionStats {
  id: string;
  executionRunId: string;
  totalFunctionCalls: number;
  totalAIModelCalls: number;
  totalErrors: number;
  totalRetries: number;
  totalExecutionTimeMs: number;
  avgFunctionCallTimeMs: number;
  avgAIResponseTimeMs: number;
  maxExecutionDepth: number;
  functionCallBreakdown?: any;
  createdAt: string;
  updatedAt: string;
}

interface ExecutionFlowGraph {
  executionRunId: string;
  events: ExecutionFlowEvent[];
  functionCalls: FunctionCall[];
  stats?: ExecutionStats;
  graphYaml: string;
}

export interface ExecutionFlowGraphProps {
  executionRunId: string;
  visible: boolean;
  onClose: () => void;
  configurationId?: string; // Optional - if provided, filter flow data by this configuration
}

const ExecutionFlowGraph: React.FC<ExecutionFlowGraphProps> = ({
  executionRunId,
  visible,
  onClose,
  configurationId,
}) => {
  const [flowData, setFlowData] = useState<ExecutionFlowGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFunctionCallsOnly, setShowFunctionCallsOnly] = useState(false);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [selectedTimelineEvent, setSelectedTimelineEvent] = useState<ExecutionFlowEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'graph'>('timeline');
  const [showGraphVisualization, setShowGraphVisualization] = useState(false);
  const { state } = useApp();
  const backendUrl = state.config.backendUrl;
  const { colors } = useTheme();
  const { width: screenWidth } = Dimensions.get('window');

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
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    subtitle: {
      ...typography.caption,
      color: colors.textSecondary,
      marginTop: 2,
    },
    viewToggleButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgSurface,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      gap: spacing.sm,
    },
    viewToggleText: {
      ...typography.label,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.xs,
    },
    filtersContainer: {
      flexDirection: 'row' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      gap: spacing.md,
    },
    filterButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
      backgroundColor: colors.bgSurface,
    },
    activeFilterButton: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    filterButtonText: {
      ...typography.label,
      color: colors.textSecondary,
    },
    activeFilterButtonText: {
      color: colors.textInverse,
      fontWeight: '600' as const,
    },
    statsContainer: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    statsTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    statsGrid: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    statItem: {
      alignItems: 'center' as const,
      flex: 1,
    },
    statValue: {
      ...typography.h2,
      fontWeight: '700' as const,
      color: colors.accent,
    },
    statLabel: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: 2,
    },
    content: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.xxl,
    },
    loadingText: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    errorContainer: {
      padding: spacing.lg,
      alignItems: 'center' as const,
    },
    errorText: {
      ...typography.body,
      color: colors.statusError,
      textAlign: 'center' as const,
      marginBottom: spacing.md,
    },
    retryButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
    },
    retryButtonText: {
      ...typography.bodyStrong,
      color: colors.textInverse,
    },
    eventsContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    eventItem: {
      marginBottom: spacing.sm,
    },
    eventHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    eventIconContainer: {
      flexDirection: 'column' as const,
      alignItems: 'center' as const,
      marginRight: spacing.md,
      minWidth: 40,
    },
    eventIcon: {
      fontSize: 20,
      marginBottom: 4,
    },
    sequenceNumber: {
      backgroundColor: colors.borderLight,
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 2,
      minWidth: 24,
      alignItems: 'center' as const,
    },
    sequenceText: {
      ...typography.micro,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    eventContent: {
      flex: 1,
    },
    eventTitleRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.xs,
    },
    eventType: {
      ...typography.label,
      fontWeight: '600' as const,
      textTransform: 'capitalize' as const,
    },
    eventMeta: {
      alignItems: 'flex-end' as const,
    },
    eventStatus: {
      ...typography.micro,
      fontWeight: '700' as const,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    eventDuration: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      fontFamily: 'monospace',
      marginTop: 2,
    },
    eventData: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      fontFamily: 'monospace',
      marginTop: spacing.xs,
      backgroundColor: colors.bgSurface,
      padding: spacing.sm,
      borderRadius: radius.sm,
    },
    expandButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: spacing.xs,
      paddingVertical: spacing.xs,
    },
    expandButtonText: {
      ...typography.micro,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    errorMessage: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.statusError,
      marginTop: spacing.xs,
      fontStyle: 'italic' as const,
    },
    connectionLine: {
      width: 2,
      height: 12,
      backgroundColor: colors.borderLight,
      marginLeft: 31,
      marginVertical: 2,
    },
    parallelGroup: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.statusWarning,
    },
    parallelHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    parallelTitle: {
      ...typography.bodyStrong,
      fontWeight: '700' as const,
      color: colors.statusWarning,
    },
    parallelCount: {
      ...typography.caption,
      color: colors.textSecondary,
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    parallelContainer: {
      gap: spacing.sm,
    },
    parallelEvent: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    parallelConnection: {
      width: 1,
      height: 8,
      backgroundColor: colors.borderLight,
      marginLeft: 31,
      marginVertical: 2,
    },
    timelineOverview: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    timelineHeader: {
      marginBottom: spacing.md,
    },
    timelineTitle: {
      ...typography.title,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    timelineSubtitle: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    timelineBar: {
      flexDirection: 'row' as const,
      height: 24,
      backgroundColor: colors.bgApp,
      borderRadius: 12,
      overflow: 'hidden' as const,
      padding: 2,
    },
    timelineEvent: {
      flex: 1,
      height: '100%' as const,
      marginRight: 1,
      position: 'relative' as const,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderRadius: 8,
      minHeight: 20,
    },
    timelineEventTooltip: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      width: '100%' as const,
      height: '100%' as const,
    },
    timelineEventText: {
      ...typography.micro,
      fontWeight: '600' as const,
      opacity: 0.9,
      textAlign: 'center' as const,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalCloseButton: {
      ...typography.title,
      color: colors.accent,
    },
    modalTitle: {
      ...typography.h2,
      fontWeight: '700' as const,
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 50,
    },
    modalContent: {
      flex: 1,
      padding: spacing.lg,
    },
    eventDetailContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    eventDetailHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
    },
    eventDetailIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.bgSurface,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.md,
    },
    eventDetailIconText: {
      fontSize: 24,
    },
    eventDetailInfo: {
      flex: 1,
    },
    eventDetailType: {
      ...typography.h2,
      fontWeight: '700' as const,
      marginBottom: 2,
    },
    eventDetailSequence: {
      ...typography.body,
      color: colors.textSecondary,
    },
    eventDetailStatus: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    eventDetailStatusText: {
      ...typography.micro,
      fontWeight: '700' as const,
      color: colors.textInverse,
      textTransform: 'uppercase' as const,
    },
    eventDetailSection: {
      marginBottom: spacing.lg,
    },
    eventDetailSectionTitle: {
      ...typography.title,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    eventDetailRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.sm,
    },
    eventDetailLabel: {
      ...typography.body,
      fontWeight: '500' as const,
      color: colors.textSecondary,
      flex: 1,
    },
    eventDetailValue: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 2,
      textAlign: 'right' as const,
    },
    eventDetailDataContainer: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      padding: spacing.md,
    },
    eventDetailData: {
      ...typography.caption,
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    eventDetailErrorContainer: {
      backgroundColor: `${colors.statusError}15`,
      borderRadius: radius.md,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.statusError,
    },
    eventDetailError: {
      ...typography.body,
      color: colors.statusError,
    },
    // Graph Visualization Styles
    graphContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    graphHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    graphTitle: {
      ...typography.h2,
      fontWeight: '700' as const,
      color: colors.textPrimary,
    },
    graphCloseButton: {
      padding: spacing.xs,
    },
    graphContent: {
      flex: 1,
    },
    graphScrollContent: {
      padding: spacing.lg,
    },
    flameGraphScrollContent: {
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.sm,
    },
    flameGraphContainer: {
      position: 'relative' as const,
      minHeight: 200,
      paddingHorizontal: spacing.sm,
    },
    flameGraphSvg: {
      position: 'relative' as const,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      overflow: 'visible' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    flameGraphLevel: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
    },
    flameGraphBar: {
      position: 'absolute' as const,
      height: 28,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    flameGraphBarContent: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    flameGraphBarIcon: {
      fontSize: 16,
      marginRight: 8,
    },
    flameGraphBarText: {
      flex: 1,
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textInverse,
      textShadowColor: 'rgba(0,0,0,0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    flameGraphBarDuration: {
      fontSize: 9,
      color: colors.textInverse,
      fontFamily: 'monospace',
      marginLeft: 4,
      textShadowColor: 'rgba(0,0,0,0.3)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
    flameGraphTimeAxis: {
      position: 'absolute' as const,
      height: 20,
      borderTopWidth: 1,
      borderTopColor: colors.borderMedium,
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    flameGraphTimeLabel: {
      ...typography.micro,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    emptyFlameGraph: {
      height: 200,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    emptyFlameGraphText: {
      ...typography.body,
      color: colors.textSecondary,
    },
    emptyFlameGraphSubtext: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    flameGraphLegend: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginVertical: spacing.lg,
      marginHorizontal: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    flameGraphLegendTitle: {
      ...typography.title,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    flameGraphLegendText: {
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.textSecondary,
    },
    graphNodes: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    graphNode: {
      width: (screenWidth - 48) / 2,
      minHeight: 120,
      borderRadius: radius.xl,
      padding: spacing.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      ...Platform.select({
        ios: {
          shadowColor: colors.shadowColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        android: {
          elevation: 4,
        },
      }),
    },
    graphNodeIcon: {
      fontSize: 24,
      marginBottom: 8,
    },
    graphNodeTitle: {
      ...typography.caption,
      fontWeight: '700' as const,
      color: colors.textInverse,
      textAlign: 'center' as const,
      marginBottom: spacing.xs,
    },
    graphNodeSubtitle: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: 'rgba(255,255,255,0.8)',
      marginBottom: spacing.xs,
    },
    graphNodeDuration: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.7)',
      fontFamily: 'monospace',
    },
    graphStats: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    graphStatsTitle: {
      ...typography.title,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    graphStatsGrid: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
    },
    graphStatItem: {
      alignItems: 'center' as const,
      flex: 1,
    },
    graphStatValue: {
      ...typography.h2,
      fontWeight: '700' as const,
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    graphStatLabel: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
  }));

  useEffect(() => {
    if (visible && executionRunId && executionRunId.trim() !== '') {
      // Always fetch data for valid execution IDs, even if we have cached data
      // This ensures we get the latest data for completed executions
      fetchExecutionFlowData();
    }
  }, [visible, executionRunId, configurationId]);

  // Add a separate effect to handle execution completion
  useEffect(() => {
    if (visible && executionRunId && executionRunId.trim() !== '') {
      // Force refresh data when component becomes visible for completed executions
      // This handles the case where execution just completed
      if (!loading && flowData) {
        // If we have data but execution might have completed, refresh it
        fetchExecutionFlowData();
      }
    }
  }, [visible]);

  const fetchExecutionFlowData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Fetching execution flow data for execution: ${executionRunId}, config: ${configurationId || 'none'}`);
      
      const response = configurationId 
        ? await goGentAPI.getExecutionFlowGraphByConfiguration(executionRunId, configurationId)
        : await goGentAPI.getExecutionFlowGraph(executionRunId);
      
      console.log('📊 Execution flow response:', response);
      
      if (response.success && response.data) {
        const data: ExecutionFlowGraph = response.data;
        
        // Validate that we have meaningful data
        if (!data.events || data.events.length === 0) {
          console.warn('⚠️ Execution flow data has no events');
          setError('No execution events found. This execution may not have generated any flow data.');
        } else {
          console.log(`✅ Loaded execution flow data with ${data.events.length} events`);
          setFlowData(data);
        }
      } else {
        const errorMsg = response.error || 'Failed to fetch execution flow data';
        console.error('❌ Execution flow fetch failed:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      console.error('❌ Error fetching execution flow data:', err);
      const message = err.message || 'Failed to fetch execution flow data';
      setError(typeof message === 'string' ? message : JSON.stringify(message));
      
      // Don't clear existing data on error - keep what we have
      if (!flowData) {
        setFlowData(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const getEventTypeIcon = (eventType: string): string => {
    switch (eventType) {
      case 'prompt_start': return '🚀';
      case 'ai_model_call': return '🤖';
      case 'function_call_start': return '🔧';
      case 'function_call_end': return '✅';
      case 'ai_response': return '💬';
      case 'error_occurred': return '❌';
      case 'retry_attempt': return '🔄';
      case 'execution_complete': return '🎯';
      default: return '📝';
    }
  };

  const getEventTypeColor = (eventType: string): string => {
    switch (eventType) {
      case 'prompt_start': return colors.accent;
      case 'ai_model_call': return colors.accent;
      case 'function_call_start': return colors.statusWarning;
      case 'function_call_end': return colors.statusSuccess;
      case 'ai_response': return colors.statusSuccess;
      case 'error_occurred': return colors.statusError;
      case 'retry_attempt': return colors.statusWarning;
      case 'execution_complete': return colors.accent;
      default: return colors.textSecondary;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success': return colors.statusSuccess;
      case 'error': return colors.statusError;
      case 'timeout': return colors.statusWarning;
      case 'pending': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const formatDuration = (durationMs?: number): string => {
    if (!durationMs) return '';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  // Build hierarchical event structure with proper ordering
  const buildEventHierarchy = (events: ExecutionFlowEvent[]) => {
    if (!events || events.length === 0) return [];
    
    // First, sort events by sequence number and timestamp
    const sortedEvents = [...events].sort((a, b) => {
      // Primary sort: sequence number
      if (a.sequenceNumber !== b.sequenceNumber) {
        return a.sequenceNumber - b.sequenceNumber;
      }
      // Secondary sort: timestamp
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    // Group parallel function calls
    const eventGroups: Array<ExecutionFlowEvent | ExecutionFlowEvent[]> = [];
    let currentGroup: ExecutionFlowEvent[] = [];
    
    for (let i = 0; i < sortedEvents.length; i++) {
      const event = sortedEvents[i];
      const nextEvent = sortedEvents[i + 1];
      
      // Check if this is a function call that could be parallel
      if (event.eventType === 'function_call_start' && 
          nextEvent?.eventType === 'function_call_start' &&
          Math.abs(event.sequenceNumber - nextEvent.sequenceNumber) <= 50) { // Close sequence numbers indicate potential parallelism
        currentGroup.push(event);
      } else if (currentGroup.length > 0 && event.eventType === 'function_call_start') {
        currentGroup.push(event);
        eventGroups.push([...currentGroup]);
        currentGroup = [];
      } else {
        if (currentGroup.length > 0) {
          eventGroups.push([...currentGroup]);
          currentGroup = [];
        }
        eventGroups.push(event);
      }
    }
    
    if (currentGroup.length > 0) {
      eventGroups.push(currentGroup);
    }
    
    return eventGroups;
  };

  const processedEvents = buildEventHierarchy(flowData?.events || []);
  
  // Count function call events from the events array
  const functionCallEventsCount = (flowData?.events || []).filter(event => 
    event.eventType === 'function_call_start' || 
    event.eventType === 'function_call_end'
  ).length;
  
  const filteredEvents = showFunctionCallsOnly 
    ? processedEvents.filter(eventOrGroup => {
        if (Array.isArray(eventOrGroup)) {
          return eventOrGroup.some(event => 
            event.eventType === 'function_call_start' || 
            event.eventType === 'function_call_end'
          );
        }
        return eventOrGroup.eventType === 'function_call_start' || 
               eventOrGroup.eventType === 'function_call_end';
      })
    : processedEvents;

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const handleTimelineEventPress = (event: ExecutionFlowEvent) => {
    setSelectedTimelineEvent(event);
    setShowEventModal(true);
  };

  const closeEventModal = () => {
    setShowEventModal(false);
    setSelectedTimelineEvent(null);
  };

  const toggleViewMode = () => {
    if (viewMode === 'timeline') {
      setViewMode('graph');
      setShowGraphVisualization(true);
    } else {
      setViewMode('timeline');
      setShowGraphVisualization(false);
    }
  };

  const handleGraphNodeClick = (event: ExecutionFlowEvent) => {
    setSelectedTimelineEvent(event);
    setShowEventModal(true);
  };

  // Flame Graph Rendering Function
  const renderFlameGraph = (events: ExecutionFlowEvent[]) => {
    if (!events || events.length === 0) {
      return (
        <View style={styles.emptyFlameGraph}>
          <Text style={styles.emptyFlameGraphText}>
            {loading ? 'Loading execution data...' : 'No execution events to display'}
          </Text>
          {!loading && (
            <Text style={styles.emptyFlameGraphSubtext}>
              This execution may not have generated any flow data, or the data may still be processing.
            </Text>
          )}
        </View>
      );
    }

    // Calculate timing and hierarchy
    const sortedEvents = [...events].sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    const maxWidth = Math.max(screenWidth * 2, 800); // Ensure minimum width for readability
    
    // Group events by depth/level for flame graph
    const levels: ExecutionFlowEvent[][] = [];
    const eventDepths = new Map<string, number>();
    
    // Calculate depths based on sequence order for better visualization
    sortedEvents.forEach((event, index) => {
      let depth = 0;
      
      // Simple depth calculation based on event type and sequence
      if (event.eventType === 'prompt_start') {
        depth = 0; // Always at top
      } else if (event.eventType === 'ai_model_call') {
        depth = 1; // AI calls at level 1
      } else if (event.eventType === 'function_call_start') {
        depth = 2; // Function calls at level 2
      } else if (event.eventType === 'function_call_end') {
        depth = 2; // Function ends at same level as starts
      } else if (event.eventType === 'ai_response') {
        depth = 1; // AI responses back to level 1
      } else if (event.eventType === 'execution_complete') {
        depth = 0; // Complete back at top level
      } else {
        depth = Math.min(index % 3, 2); // Distribute other events across levels
      }
      
      eventDepths.set(event.id, depth);
      
      // Ensure we have enough levels
      while (levels.length <= depth) {
        levels.push([]);
      }
      
      levels[depth].push(event);
    });

    // Calculate positions and widths
    const minStartTime = Math.min(...sortedEvents.map(e => new Date(e.createdAt).getTime()));
    const maxEndTime = Math.max(...sortedEvents.map(e => {
      const start = new Date(e.createdAt).getTime();
      return start + (e.durationMs || 100);
    }));
    const totalTimespan = maxEndTime - minStartTime || 1000;

    const getEventColor = (eventType: string) => {
      switch (eventType) {
        case 'prompt_start': return colors.statusSuccess;
        case 'ai_model_call': return colors.accent;
        case 'function_call_start': return colors.statusWarning;
        case 'function_call_end': return colors.statusSuccess;
        case 'ai_response': return colors.accent;
        case 'error_occurred': return colors.statusError;
        case 'execution_complete': return colors.accent;
        default: return colors.textSecondary;
      }
    };

    const getEventIcon = (eventType: string) => {
      switch (eventType) {
        case 'prompt_start': return '🚀';
        case 'ai_model_call': return '🤖';
        case 'function_call_start': return '🔧';
        case 'function_call_end': return '✅';
        case 'ai_response': return '💬';
        case 'error_occurred': return '❌';
        case 'execution_complete': return '🎯';
        default: return '📝';
      }
    };

    const barHeight = 28;
    const barMargin = 2;
    const levelHeight = barHeight + barMargin;

    return (
      <View style={[styles.flameGraphSvg, { height: levels.length * levelHeight + 40, width: maxWidth + 20 }]}>
        {levels.map((levelEvents, levelIndex) => (
          <View key={levelIndex} style={[styles.flameGraphLevel, { top: levelIndex * levelHeight }]}>
            {levelEvents.map((event) => {
              const startTime = new Date(event.createdAt).getTime();
              const duration = event.durationMs || 100;
              const leftPercent = ((startTime - minStartTime) / totalTimespan) * 100;
              const widthPercent = Math.max((duration / totalTimespan) * 100, 2); // Minimum 2% width
              
              const left = 10 + (leftPercent / 100) * maxWidth; // Add 10px left padding
              const width = Math.max((widthPercent / 100) * maxWidth, 120); // Minimum 120px width for readability

              return (
                <TouchableOpacity
                  key={event.id}
                  style={[
                    styles.flameGraphBar,
                    {
                      left,
                      width,
                      backgroundColor: getEventColor(event.eventType),
                    }
                  ]}
                  onPress={() => handleGraphNodeClick(event)}
                >
                  <View style={styles.flameGraphBarContent}>
                    <Text style={styles.flameGraphBarIcon}>
                      {getEventIcon(event.eventType)}
                    </Text>
                    <Text style={styles.flameGraphBarText} numberOfLines={1}>
                      {(() => {
                        const functionName = event.eventData?.function_name || event.eventData?.functionName;
                        if (functionName) {
                          return functionName.length > 15 ? functionName.substring(0, 15) + '...' : functionName;
                        }
                        const eventTypeLabel = event.eventType.replace('_', ' ').toUpperCase();
                        return eventTypeLabel.length > 15 ? eventTypeLabel.substring(0, 15) + '...' : eventTypeLabel;
                      })()}
                    </Text>
                    <Text style={styles.flameGraphBarDuration}>
                      {formatDuration(event.durationMs)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
        
        {/* Time axis */}
        <View style={[styles.flameGraphTimeAxis, { 
          top: levels.length * levelHeight + 10, 
          left: 10, 
          width: maxWidth 
        }]}>
          <Text style={styles.flameGraphTimeLabel}>0ms</Text>
          <Text style={styles.flameGraphTimeLabel}>
            {formatDuration(totalTimespan)}
          </Text>
        </View>
      </View>
    );
  };

  if (!visible) {
    return null;
  }



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Execution Flow</Text>
          <Text style={styles.subtitle}>{viewMode === 'timeline' ? 'Timeline View' : 'Graph View'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleViewMode} style={styles.viewToggleButton}>
            <Ionicons
              name={viewMode === 'timeline' ? 'git-network-outline' : 'list-outline'}
              size={20}
              color={colors.accent}
            />
            <Text style={styles.viewToggleText}>
              {viewMode === 'timeline' ? 'Graph' : 'Timeline'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Controls - Only show for timeline view */}
      {viewMode === 'timeline' && (
        <View style={styles.filtersContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            !showFunctionCallsOnly && styles.activeFilterButton
          ]}
          onPress={() => setShowFunctionCallsOnly(false)}
        >
          <Text style={[
            styles.filterButtonText,
            !showFunctionCallsOnly && styles.activeFilterButtonText
          ]}>
            All Events ({flowData?.events?.length || 0})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            showFunctionCallsOnly && styles.activeFilterButton
          ]}
          onPress={() => setShowFunctionCallsOnly(true)}
        >
          <Text style={[
            styles.filterButtonText,
            showFunctionCallsOnly && styles.activeFilterButtonText
          ]}>
            Function Calls Only ({functionCallEventsCount})
          </Text>
        </TouchableOpacity>
        </View>
      )}

      {/* Stats Summary - Only show for timeline view */}
      {viewMode === 'timeline' && flowData?.stats && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsTitle}>Execution Statistics</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{flowData.stats.totalFunctionCalls}</Text>
              <Text style={styles.statLabel}>Function Calls</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{flowData.stats.totalAIModelCalls}</Text>
              <Text style={styles.statLabel}>AI Calls</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(flowData.stats.totalExecutionTimeMs)}</Text>
              <Text style={styles.statLabel}>Total Time</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{flowData.stats.totalErrors}</Text>
              <Text style={styles.statLabel}>Errors</Text>
            </View>
          </View>
        </View>
      )}

      {/* Timeline Overview - Only show for timeline view */}
      {viewMode === 'timeline' && flowData && flowData.events && flowData.events.length > 0 && (
        <View style={styles.timelineOverview}>
          <View style={styles.timelineHeader}>
            <Text style={styles.timelineTitle}>📊 Execution Timeline</Text>
            <Text style={styles.timelineSubtitle}>
              Chronological event sequence (seq: {Math.min(...flowData.events.map(e => e.sequenceNumber))} → {Math.max(...flowData.events.map(e => e.sequenceNumber))}) • Tap events for details
            </Text>
          </View>
          <View style={styles.timelineBar}>
            {flowData.events
              .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
              .map((event, index) => (
                <Pressable
                  key={event.id}
                  style={({ pressed }) => [
                    styles.timelineEvent,
                    { 
                      backgroundColor: getEventTypeColor(event.eventType),
                      opacity: pressed ? 0.7 : 1,
                      transform: Platform.OS === 'web' ? [] : [{ scale: pressed ? 0.95 : 1 }]
                    }
                  ]}
                  onPress={() => handleTimelineEventPress(event)}
                  android_ripple={{ color: 'rgba(255,255,255,0.3)', borderless: false }}
                >
                  <View style={styles.timelineEventTooltip}>
                    <Text style={styles.timelineEventText}>
                      {getEventTypeIcon(event.eventType)}
                    </Text>
                  </View>
                </Pressable>
              ))
            }
          </View>
        </View>
      )}

      {/* Content - Timeline View */}
      {viewMode === 'timeline' && (
        <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading execution flow...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>❌ {error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchExecutionFlowData}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {flowData && !loading && !error && (
          <View style={styles.eventsContainer}>
            {filteredEvents.map((eventOrGroup, index) => (
              <View key={Array.isArray(eventOrGroup) ? `group-${index}` : eventOrGroup.id}>
                {Array.isArray(eventOrGroup) ? (
                  // Render parallel function calls
                  <View style={styles.parallelGroup}>
                    <View style={styles.parallelHeader}>
                      <Text style={styles.parallelTitle}>⚡ Parallel Function Calls</Text>
                      <Text style={styles.parallelCount}>{eventOrGroup.length} functions</Text>
                    </View>
                    <View style={styles.parallelContainer}>
                      {eventOrGroup.map((event, parallelIndex) => (
                        <View key={event.id} style={styles.parallelEvent}>
                          <View style={styles.eventHeader}>
                            <View style={styles.eventIconContainer}>
                              <Text style={styles.eventIcon}>{getEventTypeIcon(event.eventType)}</Text>
                              <View style={styles.sequenceNumber}>
                                <Text style={styles.sequenceText}>{event.sequenceNumber}</Text>
                              </View>
                            </View>
                            
                            <View style={styles.eventContent}>
                              <View style={styles.eventTitleRow}>
                                <Text style={[styles.eventType, { color: getEventTypeColor(event.eventType) }]}>
                                  {event.eventType.replace('_', ' ').toUpperCase()}
                                </Text>
                                <View style={styles.eventMeta}>
                                  <Text style={[styles.eventStatus, { color: getStatusColor(event.status) }]}>
                                    {event.status.toUpperCase()}
                                  </Text>
                                  {event.durationMs && (
                                    <Text style={styles.eventDuration}>
                                      {formatDuration(event.durationMs)}
                                    </Text>
                                  )}
                                </View>
                              </View>
                              
                              {event.eventData && (
                                <View>
                                  <Text 
                                    style={styles.eventData} 
                                    numberOfLines={expandedEvents.has(event.id) ? undefined : 2}
                                  >
                                    {JSON.stringify(event.eventData, null, 2)}
                                  </Text>
                                  {JSON.stringify(event.eventData, null, 2).split('\n').length > 2 && (
                                    <TouchableOpacity 
                                      style={styles.expandButton}
                                      onPress={() => toggleEventExpansion(event.id)}
                                    >
                                      <Text style={styles.expandButtonText}>
                                        {expandedEvents.has(event.id) ? 'Show Less' : 'Show More'}
                                      </Text>
                                      <Ionicons
                                        name={expandedEvents.has(event.id) ? 'chevron-up' : 'chevron-down'}
                                        size={12}
                                        color={colors.accent}
                                        style={{ marginLeft: 4 }}
                                      />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              )}
                            </View>
                          </View>
                          {parallelIndex < eventOrGroup.length - 1 && (
                            <View style={styles.parallelConnection} />
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  // Render single event
                  <View style={styles.eventItem}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventIconContainer}>
                        <Text style={styles.eventIcon}>{getEventTypeIcon(eventOrGroup.eventType)}</Text>
                        <View style={styles.sequenceNumber}>
                          <Text style={styles.sequenceText}>{eventOrGroup.sequenceNumber}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.eventContent}>
                        <View style={styles.eventTitleRow}>
                          <Text style={[styles.eventType, { color: getEventTypeColor(eventOrGroup.eventType) }]}>
                            {eventOrGroup.eventType.replace('_', ' ').toUpperCase()}
                          </Text>
                          <View style={styles.eventMeta}>
                            <Text style={[styles.eventStatus, { color: getStatusColor(eventOrGroup.status) }]}>
                              {eventOrGroup.status.toUpperCase()}
                            </Text>
                            {eventOrGroup.durationMs && (
                              <Text style={styles.eventDuration}>
                                {formatDuration(eventOrGroup.durationMs)}
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        {eventOrGroup.eventData && (
                          <View>
                            <Text 
                              style={styles.eventData} 
                              numberOfLines={expandedEvents.has(eventOrGroup.id) ? undefined : 3}
                            >
                              {JSON.stringify(eventOrGroup.eventData, null, 2)}
                            </Text>
                            {JSON.stringify(eventOrGroup.eventData, null, 2).split('\n').length > 3 && (
                              <TouchableOpacity 
                                style={styles.expandButton}
                                onPress={() => toggleEventExpansion(eventOrGroup.id)}
                              >
                                <Text style={styles.expandButtonText}>
                                  {expandedEvents.has(eventOrGroup.id) ? 'Show Less' : 'Show More'}
                                </Text>
                                <Ionicons
                                  name={expandedEvents.has(eventOrGroup.id) ? 'chevron-up' : 'chevron-down'}
                                  size={12}
                                  color={colors.accent}
                                  style={{ marginLeft: 4 }}
                                />
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                        
                        {eventOrGroup.errorMessage && (
                          <Text style={styles.errorMessage}>
                            Error: {eventOrGroup.errorMessage}
                          </Text>
                        )}
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Connection line to next event */}
                {index < filteredEvents.length - 1 && (
                  <View style={styles.connectionLine} />
                )}
              </View>
            ))}
          </View>
        )}
        </ScrollView>
      )}

      {/* Graph Visualization */}
      {showGraphVisualization && flowData && flowData.events && (
        <View style={styles.graphContainer}>
          <View style={styles.graphHeader}>
            <Text style={styles.graphTitle}>🎨 Execution Flow Graph</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowGraphVisualization(false);
                setViewMode('timeline');
              }}
              style={styles.graphCloseButton}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
          
          <ScrollView 
            style={styles.graphContent} 
            contentContainerStyle={styles.flameGraphScrollContent}
            horizontal={true}
            showsHorizontalScrollIndicator={false}
          >
            <View style={styles.flameGraphContainer}>
              {renderFlameGraph(flowData.events || [])}
            </View>
            
            {/* Flame Graph Legend */}
            <View style={styles.flameGraphLegend}>
              <Text style={styles.flameGraphLegendTitle}>🔥 Flame Graph Legend</Text>
              <Text style={styles.flameGraphLegendText}>
                • Horizontal bars show execution duration{'\n'}
                • Vertical stacking shows call hierarchy{'\n'}
                • Colors indicate event types{'\n'}
                • Tap bars for detailed information{'\n'}
                • Scroll horizontally to see full timeline
              </Text>
            </View>
            
            <View style={styles.graphStats}>
              <Text style={styles.graphStatsTitle}>📊 Execution Statistics</Text>
              <View style={styles.graphStatsGrid}>
                <View style={styles.graphStatItem}>
                  <Text style={styles.graphStatValue}>{flowData.events?.length || 0}</Text>
                  <Text style={styles.graphStatLabel}>Events</Text>
                </View>
                <View style={styles.graphStatItem}>
                  <Text style={styles.graphStatValue}>{flowData.functionCalls?.length || 0}</Text>
                  <Text style={styles.graphStatLabel}>Functions</Text>
                </View>
                <View style={styles.graphStatItem}>
                  <Text style={styles.graphStatValue}>
                    {formatDuration(flowData.stats?.totalExecutionTimeMs) || '0ms'}
                  </Text>
                  <Text style={styles.graphStatLabel}>Duration</Text>
                </View>
                <View style={styles.graphStatItem}>
                  <Text style={styles.graphStatValue}>{flowData.stats?.totalErrors || 0}</Text>
                  <Text style={styles.graphStatLabel}>Errors</Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* Event Detail Modal */}
      <Modal
        visible={showEventModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeEventModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={closeEventModal}>
              <Text style={styles.modalCloseButton}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Event Details</Text>
            <View style={styles.headerSpacer} />
          </View>

          {selectedTimelineEvent && (
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={styles.eventDetailContainer}>
                {/* Event Header */}
                <View style={styles.eventDetailHeader}>
                  <View style={styles.eventDetailIcon}>
                    <Text style={styles.eventDetailIconText}>
                      {getEventTypeIcon(selectedTimelineEvent.eventType)}
                    </Text>
                  </View>
                  <View style={styles.eventDetailInfo}>
                    <Text style={[styles.eventDetailType, { color: getEventTypeColor(selectedTimelineEvent.eventType) }]}>
                      {selectedTimelineEvent.eventType.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.eventDetailSequence}>
                      Sequence #{selectedTimelineEvent.sequenceNumber}
                    </Text>
                  </View>
                  <View style={[styles.eventDetailStatus, { backgroundColor: getStatusColor(selectedTimelineEvent.status) }]}>
                    <Text style={styles.eventDetailStatusText}>
                      {selectedTimelineEvent.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Timing Information */}
                <View style={styles.eventDetailSection}>
                  <Text style={styles.eventDetailSectionTitle}>⏱️ Timing</Text>
                  <View style={styles.eventDetailRow}>
                    <Text style={styles.eventDetailLabel}>Created:</Text>
                    <Text style={styles.eventDetailValue}>
                      {new Date(selectedTimelineEvent.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  {selectedTimelineEvent.durationMs && (
                    <View style={styles.eventDetailRow}>
                      <Text style={styles.eventDetailLabel}>Duration:</Text>
                      <Text style={styles.eventDetailValue}>
                        {formatDuration(selectedTimelineEvent.durationMs)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Event Data */}
                {selectedTimelineEvent.eventData && (
                  <View style={styles.eventDetailSection}>
                    <Text style={styles.eventDetailSectionTitle}>📄 Event Data</Text>
                    <View style={styles.eventDetailDataContainer}>
                      <Text style={styles.eventDetailData}>
                        {JSON.stringify(selectedTimelineEvent.eventData, null, 2)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Error Information */}
                {selectedTimelineEvent.errorMessage && (
                  <View style={styles.eventDetailSection}>
                    <Text style={styles.eventDetailSectionTitle}>❌ Error Details</Text>
                    <View style={styles.eventDetailErrorContainer}>
                      <Text style={styles.eventDetailError}>
                        {selectedTimelineEvent.errorMessage}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Relationship Information */}
                {selectedTimelineEvent.parentEventId && (
                  <View style={styles.eventDetailSection}>
                    <Text style={styles.eventDetailSectionTitle}>🔗 Relationships</Text>
                    <View style={styles.eventDetailRow}>
                      <Text style={styles.eventDetailLabel}>Parent Event:</Text>
                      <Text style={styles.eventDetailValue}>
                        {selectedTimelineEvent.parentEventId}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
};

export default ExecutionFlowGraph; 