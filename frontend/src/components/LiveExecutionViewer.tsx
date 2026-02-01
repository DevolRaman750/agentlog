import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goGentAPI } from '../api/client';
import { ExecutionLog, ExecutionFlowEvent } from '../types';
import ExecutionFlowGraph from './ExecutionFlowGraph';
import ExecutionLogsCard from './ExecutionLogsCard';
import { useTheme, useThemedStyles } from '../theme';
import type { ThemeColors } from '../theme';

const createStyles = (colors: ThemeColors) => ({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden' as const,
    flex: 1,
    minHeight: 800,
    maxHeight: '100%' as const,
  },
  progressHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  progressInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  progressIconContainer: {
    position: 'relative' as const,
    marginRight: 12,
  },
  progressRing: {
    position: 'absolute' as const,
    bottom: -8,
    right: -8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.textInverse,
  },
  progressDetails: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  progressSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  temporaryIdNote: {
    fontSize: 12,
    color: colors.statusWarning,
    fontStyle: 'italic' as const,
    marginTop: 2,
  },
  headerControls: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgCard,
  },
  activeControlButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  cancelButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE4E1',
    gap: 4,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.statusError,
  },
  viewModeSelector: {
    flexDirection: 'row' as const,
    padding: 12,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 8,
  },
  viewModeButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgCard,
    gap: 4,
  },
  activeViewModeButton: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  activeViewModeText: {
    color: colors.textInverse,
  },
  errorBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E1',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: colors.statusError,
    flex: 1,
  },
  content: {
    flex: 1,
    minHeight: 700,
  },
  logsContainer: {
    flex: 1,
  },
  logsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  logsConfigIndicator: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  logsStats: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  logsCount: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logsScrollView: {
    flex: 1,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    minHeight: 400,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  logEntry: {
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  logHeader: {
    flexDirection: 'row' as const,
    padding: 12,
  },
  logIcon: {
    marginRight: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  logEmoji: {
    fontSize: 16,
  },
  logContent: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 4,
  },
  logCategory: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.accent,
    textTransform: 'uppercase' as const,
  },
  logTimestamp: {
    fontSize: 12,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  flowContainer: {
    flex: 1,
  },
  flowHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  bothContainer: {
    flexDirection: 'row' as const,
    flex: 1,
  },
  bothSection: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.borderLight,
  },
  // Simulated flow styles
  simulatedFlowContainer: {
    flex: 1,
    padding: 16,
  },
  simulatedFlowEvent: {
    marginBottom: 12,
  },
  simulatedEventHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  simulatedEventStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  simulatedEventIcon: {
    fontSize: 16,
  },
  simulatedEventContent: {
    flex: 1,
  },
  simulatedEventType: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  simulatedEventMessage: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  simulatedEventStatusText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textTransform: 'uppercase' as const,
  },
  simulatedEventConnector: {
    width: 2,
    height: 12,
    backgroundColor: colors.borderLight,
    marginLeft: 27,
    marginVertical: 4,
  },
  simulatedStatsContainer: {
    backgroundColor: colors.bgSurface,
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  simulatedStatsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 12,
  },
  simulatedStatsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  simulatedStatItem: {
    alignItems: 'center' as const,
    flex: 1,
  },
  simulatedStatValue: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.accent,
  },
  simulatedStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginTop: 2,
  },
  // Configuration tabs styles
  configTabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  configTabsTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  configTabsScroll: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    paddingHorizontal: 4,
  },
  configTab: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.borderLight,
    backgroundColor: colors.bgCard,
  },
  activeConfigTab: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  configTabContent: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  configTabText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  activeConfigTabText: {
    color: colors.textInverse,
  },
  configTabBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  activeConfigTabBadge: {
    backgroundColor: colors.textInverse,
    borderColor: colors.textInverse,
  },
  configTabBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: colors.textInverse,
  },
  activeConfigTabBadgeText: {
    color: colors.accent,
  },
});

interface LiveExecutionViewerProps {
  executionId: string;
  progress: number;
  maxProgress: number;
  onCancel: () => void;
  isExecuting: boolean;
  executionResult?: any; // Add execution result to get configuration info
}

type ViewMode = 'logs' | 'flow' | 'both';

// Configuration info for tabs
interface ConfigurationTab {
  id: string;
  name: string;
  logCount: number;
}

// Animated log item component
const AnimatedLogItem: React.FC<{ log: ExecutionLog; index: number }> = ({ log, index }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Stagger animations based on index
    const delay = Math.min(index * 100, 500); // Max 500ms delay

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim, index]);

  const getLogEmoji = (logLevel: string, logCategory: string) => {
    const category = logCategory?.toLowerCase() || '';
    const level = logLevel?.toLowerCase() || '';

    if (category.includes('setup') || category.includes('init')) return '🔧';
    if (category.includes('execution') || category.includes('processing')) return '⚡';
    if (category.includes('function') || category.includes('api')) return '🔗';
    if (category.includes('completion') || category.includes('success')) return '✅';
    if (category.includes('error') || level.includes('error')) return '❌';
    if (category.includes('warning') || level.includes('warn')) return '⚠️';
    if (category.includes('comparison') || category.includes('analysis')) return '📊';
    return '📋';
  };

  const getLogLevelColor = (logLevel: string) => {
    switch (logLevel?.toLowerCase()) {
      case 'error': return colors.statusError;
      case 'warn': case 'warning': return colors.statusWarning;
      case 'info': return colors.accent;
      case 'debug': return colors.textSecondary;
      case 'success': return colors.statusSuccess;
      default: return colors.textPrimary;
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <Animated.View
      style={[
        styles.logEntry,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.logHeader}>
        <View style={styles.logIcon}>
          <Text style={styles.logEmoji}>{getLogEmoji(log.logLevel, log.logCategory)}</Text>
        </View>
        <View style={styles.logContent}>
          <View style={styles.logTitleRow}>
            <Text style={styles.logCategory}>{log.logCategory}</Text>
            <Text style={styles.logTimestamp}>{formatTimestamp(log.timestamp)}</Text>
          </View>
          <Text style={styles.logMessage} numberOfLines={3}>
            {log.message}
          </Text>
          <Text style={[styles.logLevel, { color: getLogLevelColor(log.logLevel) }]}>
            {log.logLevel} • Seq #{log.sequenceNumber}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

const LiveExecutionViewer: React.FC<LiveExecutionViewerProps> = ({
  executionId,
  progress,
  maxProgress,
  onCancel,
  isExecuting,
  executionResult,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [viewMode, setViewMode] = useState<ViewMode>('logs');
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Configuration tabs state
  const [configurationTabs, setConfigurationTabs] = useState<ConfigurationTab[]>([]);
  const [activeConfigTab, setActiveConfigTab] = useState<string>('all'); // 'all' or configuration ID
  const [logsByConfiguration, setLogsByConfiguration] = useState<Record<string, ExecutionLog[]>>({});

  // Track seen log IDs to prevent duplicates
  const seenLogIds = useRef(new Set<string>()).current;
  const lastProgressRef = useRef(0);

  const logsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const flatListRef = useRef<FlatList>(null);

  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);

  // Helper function to add new logs incrementally and organize by configuration
  const addNewLogs = useCallback((newLogs: ExecutionLog[]) => {
    const unseenLogs = newLogs.filter(log => !seenLogIds.has(log.id));
    if (unseenLogs.length === 0) return;

    // Add new log IDs to seen set
    unseenLogs.forEach(log => seenLogIds.add(log.id));

    setLogs(prevLogs => {
      // Sort by sequence number to maintain chronological order
      const combined = [...prevLogs, ...unseenLogs].sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

      // Auto-scroll to bottom for new logs
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      return combined;
    });

    // Organize logs by configuration
    setLogsByConfiguration(prevLogsByConfig => {
      const updatedLogsByConfig = { ...prevLogsByConfig };

      unseenLogs.forEach(log => {
        const configId = log.configurationId || 'unknown';
        if (!updatedLogsByConfig[configId]) {
          updatedLogsByConfig[configId] = [];
        }
        updatedLogsByConfig[configId].push(log);
        // Sort each configuration's logs by sequence number
        updatedLogsByConfig[configId] = updatedLogsByConfig[configId].sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
      });

      return updatedLogsByConfig;
    });

    // Update configuration tabs based on logs and execution result
    const updateConfigurationTabs = () => {
      const configIds = new Set<string>();
      const configNames = new Map<string, string>();

      // Get configuration IDs from logs
      [...logs, ...unseenLogs].forEach(log => {
        if (log.configurationId) {
          configIds.add(log.configurationId);
        }
      });

      // Get configuration names from execution result if available
      if (executionResult?.results) {
        executionResult.results.forEach((result: any) => {
          if (result.configuration?.id && result.configuration?.variationName) {
            configIds.add(result.configuration.id);
            configNames.set(result.configuration.id, result.configuration.variationName);
          }
        });
      }

      // Create tabs for each configuration
      const tabs: ConfigurationTab[] = Array.from(configIds).map(configId => {
        const configLogs = [...logs, ...unseenLogs].filter(log => log.configurationId === configId);
        return {
          id: configId,
          name: configNames.get(configId) || `Config ${configId.slice(-8)}`, // Use variation name or short ID
          logCount: configLogs.length,
        };
      }).sort((a, b) => a.name.localeCompare(b.name));

      setConfigurationTabs(tabs);
    };

    updateConfigurationTabs();
  }, [logs, executionResult]);

  // Generate incremental simulated logs
  const generateNewSimulatedLogs = useCallback((currentProgress: number): ExecutionLog[] => {
    const newLogs: ExecutionLog[] = [];
    const lastProgress = lastProgressRef.current;

    // Only generate logs for new progress increments
    if (currentProgress <= lastProgress) return newLogs;

    // Generate logs for each new progress step
    for (let i = lastProgress + 1; i <= currentProgress; i++) {
      if (i === 1 && lastProgress === 0) {
        // Initial setup log
        newLogs.push({
          id: 'setup-1',
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'INFO',
          logCategory: 'SETUP',
          message: '🚀 Execution started successfully',
          details: {},
          timestamp: new Date(Date.now() - (i * 2000)),
          sequenceNumber: 1,
          durationMs: 0,
        });
      }

      if (i === 2 && !seenLogIds.has('ai-call-1')) {
        newLogs.push({
          id: 'ai-call-1',
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'INFO',
          logCategory: 'EXECUTION',
          message: '🤖 AI model processing started',
          details: {},
          timestamp: new Date(Date.now() - (i * 1800)),
          sequenceNumber: 2,
          durationMs: 0,
        });
      }

      if (i >= 5 && i % 5 === 0) {
        // Progress milestone logs
        newLogs.push({
          id: `milestone-${i}`,
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'INFO',
          logCategory: 'EXECUTION',
          message: `📊 Processing milestone reached (${i}/${maxProgress})`,
          details: {},
          timestamp: new Date(Date.now() - (currentProgress - i) * 1000),
          sequenceNumber: 10 + i,
          durationMs: 0,
        });
      }

      if (i >= maxProgress * 0.8 && !seenLogIds.has('completion-warning')) {
        newLogs.push({
          id: 'completion-warning',
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'INFO',
          logCategory: 'COMPLETION',
          message: '🎯 Nearing completion - finalizing results',
          details: {},
          timestamp: new Date(Date.now() - 300),
          sequenceNumber: 90,
          durationMs: 0,
        });
      }
    }

    // Current status log (always update)
    const currentStatusId = `current-${currentProgress}`;
    if (!seenLogIds.has(currentStatusId)) {
      newLogs.push({
        id: currentStatusId,
        executionRunId: executionId,
        configurationId: '',
        requestId: '',
        logLevel: 'INFO',
        logCategory: 'EXECUTION',
        message: `🔄 Currently processing... (${currentProgress}/${maxProgress})`,
        details: {},
        timestamp: new Date(),
        sequenceNumber: 100 + currentProgress,
        durationMs: 0,
      });
    }

    lastProgressRef.current = currentProgress;
    return newLogs;
  }, [executionId, maxProgress]);

  // Fetch live logs during execution
  const fetchLiveLogs = useCallback(async () => {
    if (!isExecuting || !executionId) return;

    try {
      setIsLoadingLogs(true);

      if (executionId.startsWith('exec-')) {
        // Generate new simulated logs based on progress
        console.log('🔄 Generating new simulated logs for progress:', progress, 'of', maxProgress);
        const newLogs = generateNewSimulatedLogs(progress);

        if (newLogs.length > 0) {
          console.log('📋 Adding', newLogs.length, 'new simulated logs');
          addNewLogs(newLogs);
        }
      } else {
        // This is a real execution ID, try to get actual logs
        try {
          const response = await goGentAPI.getExecutionLogsByRun(executionId);

          if (response.success && response.data) {
            // Convert response to expected format and filter for new logs
            const newLogs = response.data
              .filter((log: ExecutionLog) => !seenLogIds.has(log.id))
              .map((log: ExecutionLog) => ({
                id: log.id,
                executionRunId: log.executionRunId,
                configurationId: log.configurationId || '',
                requestId: log.requestId || '',
                logLevel: log.logLevel,
                logCategory: log.logCategory,
                message: log.message,
                details: log.details || {},
                timestamp: new Date(log.timestamp),
                sequenceNumber: log.sequenceNumber || 0,
                durationMs: log.durationMs || 0,
              }));

            if (newLogs.length > 0) {
              console.log('📋 Adding', newLogs.length, 'new real logs');
              addNewLogs(newLogs);
            }
          }
        } catch (apiErr) {
          console.warn('Failed to fetch real execution logs:', apiErr);
        }
      }

    } catch (err: any) {
      console.warn('Failed to fetch live logs:', err);
      if (!executionId.startsWith('exec-')) {
        setError(err.message);
      }
    } finally {
      setIsLoadingLogs(false);
    }
  }, [executionId, isExecuting, progress, maxProgress, generateNewSimulatedLogs, addNewLogs]);

  // Set up live refresh intervals
  useEffect(() => {
    if (isExecuting && autoRefresh) {
      console.log('🔄 Setting up live refresh for execution:', executionId);

      // Fetch initial data immediately
      fetchLiveLogs();

      // Set up intervals for live updates
      logsIntervalRef.current = setInterval(() => {
        console.log('🔄 Refreshing logs for:', executionId);
        fetchLiveLogs();
      }, 3000); // Every 3 seconds
    }

    return () => {
      if (logsIntervalRef.current) {
        clearInterval(logsIntervalRef.current);
        logsIntervalRef.current = null;
      }
    };
  }, [isExecuting, autoRefresh, executionId, fetchLiveLogs]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered for:', executionId);
    fetchLiveLogs();
  }, [fetchLiveLogs]);

  // Clear logs when execution changes
  useEffect(() => {
    setLogs([]);
    setLogsByConfiguration({});
    setConfigurationTabs([]);
    setActiveConfigTab('all');
    seenLogIds.clear();
    lastProgressRef.current = 0;
  }, [executionId]);

  const getLogLevelColor = (level: string): string => {
    switch (level?.toLowerCase()) {
      case 'error': return colors.statusError;
      case 'warning': return colors.statusWarning;
      case 'info': return colors.accent;
      case 'debug': return colors.textSecondary;
      case 'success': return colors.statusSuccess;
      default: return colors.textPrimary;
    }
  };

  const getLogEmoji = (level: string, category: string): string => {
    if (level?.toLowerCase() === 'error') return '❌';
    if (level?.toLowerCase() === 'warning') return '⚠️';

    switch (category?.toLowerCase()) {
      case 'setup': return '⚙️';
      case 'execution': return '🚀';
      case 'function_call': return '🔧';
      case 'api_call': return '📡';
      case 'completion': return '✅';
      default: return '📝';
    }
  };

  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const renderViewModeSelector = () => (
    <View style={styles.viewModeSelector}>
      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'logs' && styles.activeViewModeButton]}
        onPress={() => setViewMode('logs')}
      >
        <Ionicons
          name="list"
          size={16}
          color={viewMode === 'logs' ? colors.textInverse : colors.accent}
        />
        <Text style={[styles.viewModeText, viewMode === 'logs' && styles.activeViewModeText]}>
          Logs
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'flow' && styles.activeViewModeButton]}
        onPress={() => setViewMode('flow')}
      >
        <Ionicons
          name="git-network"
          size={16}
          color={viewMode === 'flow' ? colors.textInverse : colors.accent}
        />
        <Text style={[styles.viewModeText, viewMode === 'flow' && styles.activeViewModeText]}>
          Flow
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.viewModeButton, viewMode === 'both' && styles.activeViewModeButton]}
        onPress={() => setViewMode('both')}
      >
        <Ionicons
          name="apps"
          size={16}
          color={viewMode === 'both' ? colors.textInverse : colors.accent}
        />
        <Text style={[styles.viewModeText, viewMode === 'both' && styles.activeViewModeText]}>
          Both
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConfigurationTabs = () => {
    if (configurationTabs.length === 0) return null;

    const allLogsCount = logs.length;

    return (
      <View style={styles.configTabsContainer}>
        <Text style={styles.configTabsTitle}>📋 Logs by Configuration</Text>
        <View style={styles.configTabsScroll}>
          {/* All logs tab */}
          <TouchableOpacity
            style={[
              styles.configTab,
              activeConfigTab === 'all' && styles.activeConfigTab
            ]}
            onPress={() => setActiveConfigTab('all')}
          >
            <View style={styles.configTabContent}>
              <Text style={[
                styles.configTabText,
                activeConfigTab === 'all' && styles.activeConfigTabText
              ]}>
                All
              </Text>
              <View style={[
                styles.configTabBadge,
                activeConfigTab === 'all' && styles.activeConfigTabBadge
              ]}>
                <Text style={[
                  styles.configTabBadgeText,
                  activeConfigTab === 'all' && styles.activeConfigTabBadgeText
                ]}>
                  {allLogsCount}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Configuration-specific tabs */}
          {configurationTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.configTab,
                activeConfigTab === tab.id && styles.activeConfigTab
              ]}
              onPress={() => setActiveConfigTab(tab.id)}
            >
              <View style={styles.configTabContent}>
                <Text style={[
                  styles.configTabText,
                  activeConfigTab === tab.id && styles.activeConfigTabText
                ]}>
                  {tab.name}
                </Text>
                <View style={[
                  styles.configTabBadge,
                  activeConfigTab === tab.id && styles.activeConfigTabBadge
                ]}>
                  <Text style={[
                    styles.configTabBadgeText,
                    activeConfigTab === tab.id && styles.activeConfigTabBadgeText
                  ]}>
                    {tab.logCount}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderProgressHeader = () => {
    const isTemporaryId = executionId.startsWith('exec-');

    return (
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <View style={styles.progressIconContainer}>
            <Ionicons name="rocket" size={24} color={colors.accent} />
            <View style={styles.progressRing}>
              <Text style={styles.progressText}>{Math.round(progressPercentage)}%</Text>
            </View>
          </View>
          <View style={styles.progressDetails}>
            <Text style={styles.progressTitle}>🤖 AI Models Processing</Text>
            <Text style={styles.progressSubtitle}>
              Step {progress} of {maxProgress} • {isTemporaryId ? 'Simulated' : 'Live'} Updates
            </Text>
            {isTemporaryId && (
              <Text style={styles.temporaryIdNote}>
                ⏳ Real-time logs will be available after execution completes
              </Text>
            )}
          </View>
        </View>

        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[styles.controlButton, autoRefresh && styles.activeControlButton]}
            onPress={() => setAutoRefresh(!autoRefresh)}
          >
            <Ionicons
              name={autoRefresh ? "pause" : "play"}
              size={16}
              color={autoRefresh ? colors.textInverse : colors.accent}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={16} color={colors.accent} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Ionicons name="stop-circle" size={16} color={colors.statusError} />
            <Text style={styles.cancelButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLogs = () => {
    // Filter logs based on active configuration tab
    const filteredLogs = activeConfigTab === 'all'
      ? logs
      : logs.filter(log => log.configurationId === activeConfigTab);

    return (
      <View style={styles.logsContainer}>
        <View style={styles.logsHeader}>
          <Text style={styles.logsTitle}>
            📋 Live Execution Logs
            {activeConfigTab !== 'all' && (
              <Text style={styles.logsConfigIndicator}>
                {' '}• {configurationTabs.find(tab => tab.id === activeConfigTab)?.name || 'Unknown Config'}
              </Text>
            )}
          </Text>
          <View style={styles.logsStats}>
            <Text style={styles.logsCount}>{filteredLogs.length} entries</Text>
            {isLoadingLogs && <ActivityIndicator size="small" color={colors.accent} />}
          </View>
        </View>

        <FlatList
          ref={flatListRef}
          data={filteredLogs}
          renderItem={({ item, index }) => <AnimatedLogItem log={item} index={index} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={filteredLogs.length === 0 ? styles.emptyListContainer : styles.logsScrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoadingLogs} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="hourglass-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyStateText}>
                {activeConfigTab === 'all'
                  ? 'Waiting for execution logs...'
                  : `No logs found for ${configurationTabs.find(tab => tab.id === activeConfigTab)?.name || 'this configuration'}...`
                }
              </Text>
            </View>
          }
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
        />
      </View>
    );
  };

  const renderFlow = () => {
    const isTemporaryId = executionId.startsWith('exec-');

    return (
      <View style={styles.flowContainer}>
        <View style={styles.flowHeader}>
          <Text style={styles.flowTitle}>🔄 Live Execution Flow</Text>
          {/* ExecutionFlowGraph handles its own loading/error states */}
        </View>

        {isTemporaryId ? (
          // Show simulated flow for temporary IDs
          <ScrollView style={styles.simulatedFlowContainer}>
            {/* Simulated flow based on current progress */}
            <View style={styles.simulatedFlowEvent}>
              <View style={styles.simulatedEventHeader}>
                <View style={[
                  styles.simulatedEventStatus,
                  { backgroundColor: '#34C759' }
                ]}>
                  <Text style={styles.simulatedEventIcon}>🚀</Text>
                </View>
                <View style={styles.simulatedEventContent}>
                  <Text style={styles.simulatedEventType}>EXECUTION STARTED</Text>
                  <Text style={styles.simulatedEventMessage}>Initializing AI models...</Text>
                  <Text style={styles.simulatedEventStatusText}>Status: COMPLETED</Text>
                </View>
              </View>
              <View style={styles.simulatedEventConnector} />
            </View>

            <View style={styles.simulatedFlowEvent}>
              <View style={styles.simulatedEventHeader}>
                <View style={[
                  styles.simulatedEventStatus,
                  { backgroundColor: progress < maxProgress ? '#FF9500' : '#34C759' }
                ]}>
                  <Text style={styles.simulatedEventIcon}>🤖</Text>
                </View>
                <View style={styles.simulatedEventContent}>
                  <Text style={styles.simulatedEventType}>AI MODEL PROCESSING</Text>
                  <Text style={styles.simulatedEventMessage}>
                    Processing step {progress} of {maxProgress}...
                  </Text>
                  <Text style={styles.simulatedEventStatusText}>
                    Status: {progress < maxProgress ? 'RUNNING' : 'COMPLETED'}
                  </Text>
                </View>
              </View>
              {progress >= maxProgress * 0.8 && (
                <View style={styles.simulatedEventConnector} />
              )}
            </View>

            {progress >= maxProgress * 0.8 && (
              <View style={styles.simulatedFlowEvent}>
                <View style={styles.simulatedEventHeader}>
                  <View style={[
                    styles.simulatedEventStatus,
                    { backgroundColor: progress >= maxProgress ? '#34C759' : '#FF9500' }
                  ]}>
                    <Text style={styles.simulatedEventIcon}>✅</Text>
                  </View>
                  <View style={styles.simulatedEventContent}>
                    <Text style={styles.simulatedEventType}>COMPLETION</Text>
                    <Text style={styles.simulatedEventMessage}>
                      {progress >= maxProgress ? 'Execution completed successfully!' : 'Finalizing results...'}
                    </Text>
                    <Text style={styles.simulatedEventStatusText}>
                      Status: {progress >= maxProgress ? 'COMPLETED' : 'RUNNING'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View style={styles.simulatedStatsContainer}>
              <Text style={styles.simulatedStatsTitle}>📊 Live Statistics</Text>
              <View style={styles.simulatedStatsGrid}>
                <View style={styles.simulatedStatItem}>
                  <Text style={styles.simulatedStatValue}>{Math.max(1, Math.floor(progress / 2))}</Text>
                  <Text style={styles.simulatedStatLabel}>AI Calls</Text>
                </View>
                <View style={styles.simulatedStatItem}>
                  <Text style={styles.simulatedStatValue}>{Math.floor(progress * 0.8)}s</Text>
                  <Text style={styles.simulatedStatLabel}>Runtime</Text>
                </View>
                <View style={styles.simulatedStatItem}>
                  <Text style={styles.simulatedStatValue}>0</Text>
                  <Text style={styles.simulatedStatLabel}>Errors</Text>
                </View>
              </View>
            </View>

            {progress === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="git-network-outline" size={48} color={colors.textSecondary} />
                <Text style={styles.emptyStateText}>Building execution flow...</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          // Show real ExecutionFlowGraph for real IDs - it handles its own loading/error states
          // Force key prop to ensure component remounts when execution ID changes
          <ExecutionFlowGraph
            key={`flow-${executionId}`}
            executionRunId={executionId}
            visible={true}
            onClose={() => {}} // No close in live view
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderViewModeSelector()}
      {renderConfigurationTabs()}
      {renderProgressHeader()}

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color={colors.statusError} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={16} color={colors.statusError} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {viewMode === 'logs' && renderLogs()}
        {viewMode === 'flow' && renderFlow()}
        {viewMode === 'both' && (
          <View style={styles.bothContainer}>
            <View style={styles.bothSection}>
              {renderLogs()}
            </View>
            <View style={styles.bothSection}>
              {renderFlow()}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default LiveExecutionViewer;
