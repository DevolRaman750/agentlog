import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goGentAPI } from '../api/client';
import { ExecutionLog, ExecutionFlowEvent } from '../types';
import ExecutionFlowGraph from './ExecutionFlowGraph';
import ExecutionLogsCard from './ExecutionLogsCard';

interface LiveExecutionViewerProps {
  executionId: string;
  progress: number;
  maxProgress: number;
  onCancel: () => void;
  isExecuting: boolean;
}

type ViewMode = 'logs' | 'flow' | 'both';

const LiveExecutionViewer: React.FC<LiveExecutionViewerProps> = ({
  executionId,
  progress,
  maxProgress,
  onCancel,
  isExecuting,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('both');
  const [logs, setLogs] = useState<ExecutionLog[]>([]);
  const [flowData, setFlowData] = useState<any>(null);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [isLoadingFlow, setIsLoadingFlow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  const logsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const flowIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);

  // Fetch live logs during execution
  const fetchLiveLogs = useCallback(async () => {
    if (!isExecuting || !executionId) return;

    try {
      setIsLoadingLogs(true);
      
      // During execution, the executionId might be a temporary ID (like exec-1754262781970)
      // The real logs won't be available until the execution completes and gets a real ID
      // For now, we'll show simulated logs based on the execution status
      
      if (executionId.startsWith('exec-')) {
        // This is a temporary ID during execution
        // Create simulated logs based on progress
        console.log('🔄 Generating simulated logs for progress:', progress, 'of', maxProgress);
        const simulatedLogs: ExecutionLog[] = [];
        
        // Always add initial setup log
        simulatedLogs.push({
          id: 'setup-1',
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'info',
          logCategory: 'SETUP',
          message: '🚀 Execution started successfully',
          details: {},
          timestamp: new Date(Date.now() - (progress * 2000)),
          sequenceNumber: 1,
          durationMs: 0,
        });

        // Add progress-based logs
        if (progress >= 1) {
          simulatedLogs.push({
            id: 'ai-call-1',
            executionRunId: executionId,
            configurationId: '',
            requestId: '',
            logLevel: 'info',
            logCategory: 'EXECUTION',
            message: '🤖 AI model processing started',
            details: {},
            timestamp: new Date(Date.now() - ((progress - 1) * 1500)),
            sequenceNumber: 2,
            durationMs: 0,
          });
        }

        if (progress >= 2) {
          simulatedLogs.push({
            id: 'processing-1',
            executionRunId: executionId,
            configurationId: '',
            requestId: '',
            logLevel: 'info',
            logCategory: 'EXECUTION',
            message: `📊 Processing step ${Math.min(progress, maxProgress)} of ${maxProgress}`,
            details: {},
            timestamp: new Date(Date.now() - ((progress - 2) * 1000)),
            sequenceNumber: 3,
            durationMs: 0,
          });
        }

        if (progress >= Math.max(3, Math.floor(maxProgress * 0.3))) {
          simulatedLogs.push({
            id: 'api-calls',
            executionRunId: executionId,
            configurationId: '',
            requestId: '',
            logLevel: 'info',
            logCategory: 'API_CALL',
            message: '📡 Making API calls to AI service',
            details: {},
            timestamp: new Date(Date.now() - 800),
            sequenceNumber: 4,
            durationMs: 0,
          });
        }

        if (progress >= Math.max(5, Math.floor(maxProgress * 0.5))) {
          simulatedLogs.push({
            id: 'midpoint-1',
            executionRunId: executionId,
            configurationId: '',
            requestId: '',
            logLevel: 'info',
            logCategory: 'EXECUTION',
            message: '⚡ Execution is progressing well - halfway through',
            details: {},
            timestamp: new Date(Date.now() - 600),
            sequenceNumber: 5,
            durationMs: 0,
          });
        }

        if (progress >= Math.max(8, Math.floor(maxProgress * 0.8))) {
          simulatedLogs.push({
            id: 'nearing-completion',
            executionRunId: executionId,
            configurationId: '',
            requestId: '',
            logLevel: 'info',
            logCategory: 'COMPLETION',
            message: '🎯 Nearing completion - finalizing results',
            details: {},
            timestamp: new Date(Date.now() - 300),
            sequenceNumber: 6,
            durationMs: 0,
          });
        }

        // Add current status log
        simulatedLogs.push({
          id: `current-${progress}`,
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'info',
          logCategory: 'EXECUTION',
          message: `🔄 Currently processing... (${progress}/${maxProgress})`,
          details: {},
          timestamp: new Date(),
          sequenceNumber: 100 + progress,
          durationMs: 0,
        });

        console.log('📋 Generated', simulatedLogs.length, 'simulated logs');
        setLogs(simulatedLogs);
      } else {
        // This is a real execution ID, try to get actual logs
        try {
          const response = await goGentAPI.getExecutionLogs(100, 0);
          
          if (response.success && response.data?.rows) {
            const logs = response.data.rows
              .filter((row: any[]) => {
                const rowExecutionId = row[1];
                return rowExecutionId === executionId;
              })
              .map((row: any[]) => ({
                id: row[0] || `log-${Date.now()}-${Math.random()}`,
                executionRunId: row[1] || executionId,
                configurationId: row[2] || '',
                requestId: row[3] || '',
                logLevel: (row[4] || 'info') as any,
                logCategory: (row[5] || 'execution') as any,
                message: row[6] || 'Unknown log message',
                details: row[7] || {},
                timestamp: new Date(row[8] || Date.now()),
                sequenceNumber: row[9] || 0,
                durationMs: row[10] || 0,
              }))
              .sort((a, b) => b.sequenceNumber - a.sequenceNumber);

            setLogs(logs);
          }
        } catch (apiErr) {
          console.warn('Failed to fetch real execution logs:', apiErr);
        }
      }
      
      // Auto-scroll to bottom for new logs
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
    } catch (err: any) {
      console.warn('Failed to fetch live logs:', err);
      // Don't set error for temporary ID issues during execution
      if (!executionId.startsWith('exec-')) {
        setError(err.message);
      }
    } finally {
      setIsLoadingLogs(false);
    }
  }, [executionId, isExecuting, progress, maxProgress]);

  // Fetch live flow data during execution
  const fetchLiveFlow = useCallback(async () => {
    if (!isExecuting || !executionId) return;

    try {
      setIsLoadingFlow(true);
      
      if (executionId.startsWith('exec-')) {
        // Temporary execution ID - flow data not available yet
        // Create a simulated flow structure to show progress
        console.log('🔄 Generating simulated flow for progress:', progress, 'of', maxProgress);
        
        const events = [];
        
        // Always add prompt start
        events.push({
          id: 'event-1',
          executionRunId: executionId,
          eventType: 'prompt_start',
          sequenceNumber: 1,
          status: 'success',
          createdAt: new Date(Date.now() - (progress * 2000)).toISOString(),
          eventData: { message: 'Execution started' }
        });

        // Add AI model call if progress > 1
        if (progress >= 1) {
          events.push({
            id: 'event-2',
            executionRunId: executionId,
            eventType: 'ai_model_call',
            sequenceNumber: 2,
            status: progress >= maxProgress * 0.8 ? 'success' : 'pending',
            createdAt: new Date(Date.now() - ((progress - 1) * 1500)).toISOString(),
            eventData: { message: 'AI processing in progress' }
          });
        }

        // Add function calls if progress > maxProgress * 0.3
        if (progress >= Math.max(3, Math.floor(maxProgress * 0.3))) {
          events.push({
            id: 'event-3',
            executionRunId: executionId,
            eventType: 'function_call_start',
            sequenceNumber: 3,
            status: progress >= maxProgress * 0.6 ? 'success' : 'pending',
            createdAt: new Date(Date.now() - 1200).toISOString(),
            eventData: { message: 'Function calls initiated' }
          });
        }

        // Add AI response if progress > maxProgress * 0.5
        if (progress >= Math.max(5, Math.floor(maxProgress * 0.5))) {
          events.push({
            id: 'event-4',
            executionRunId: executionId,
            eventType: 'ai_response',
            sequenceNumber: 4,
            status: progress >= maxProgress * 0.9 ? 'success' : 'pending',
            createdAt: new Date(Date.now() - 800).toISOString(),
            eventData: { message: 'AI response generated' }
          });
        }

        const simulatedFlow = {
          executionRunId: executionId,
          events: events,
          functionCalls: [],
          stats: {
            totalFunctionCalls: events.filter(e => e.eventType.includes('function')).length,
            totalAIModelCalls: events.filter(e => e.eventType.includes('ai')).length,
            totalErrors: 0,
            totalRetries: 0,
            totalExecutionTimeMs: progress * 2000,
            avgFunctionCallTimeMs: 0,
            avgAIResponseTimeMs: 2000,
            maxExecutionDepth: 1
          }
        };
        
        console.log('🔄 Generated simulated flow with', events.length, 'events');
        setFlowData(simulatedFlow);
      } else {
        // Real execution ID - try to get actual flow data
        try {
          const response = await goGentAPI.getExecutionFlowGraph(executionId);
          
          if (response.success && response.data) {
            setFlowData(response.data);
          }
        } catch (apiErr: any) {
          console.warn('Failed to fetch real execution flow:', apiErr);
          // Don't show error for temporary IDs during execution
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch live flow:', err);
      // Don't set error for temporary ID issues during execution
      if (!executionId.startsWith('exec-')) {
        setError(err.message);
      }
    } finally {
      setIsLoadingFlow(false);
    }
  }, [executionId, isExecuting, progress, maxProgress]);

  // Set up live refresh intervals
  useEffect(() => {
    if (isExecuting && autoRefresh) {
      console.log('🔄 Setting up live refresh for execution:', executionId);
      
      // Fetch initial data immediately
      fetchLiveLogs();
      fetchLiveFlow();

      // Set up intervals for live updates
      logsIntervalRef.current = setInterval(() => {
        console.log('🔄 Refreshing logs for:', executionId);
        fetchLiveLogs();
      }, 3000); // Every 3 seconds
      
      flowIntervalRef.current = setInterval(() => {
        console.log('🔄 Refreshing flow for:', executionId);
        fetchLiveFlow();
      }, 5000); // Every 5 seconds
    }

    return () => {
      if (logsIntervalRef.current) {
        clearInterval(logsIntervalRef.current);
        logsIntervalRef.current = null;
      }
      if (flowIntervalRef.current) {
        clearInterval(flowIntervalRef.current);
        flowIntervalRef.current = null;
      }
    };
  }, [isExecuting, autoRefresh, executionId]); // Removed functions from deps to avoid infinite loops

  // Manual refresh
  const handleRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered for:', executionId);
    fetchLiveLogs();
    fetchLiveFlow();
  }, [fetchLiveLogs, fetchLiveFlow]);

  // Update simulated data when progress changes
  useEffect(() => {
    if (isExecuting && executionId.startsWith('exec-')) {
      console.log('🔄 Progress changed, updating simulated data:', progress, 'of', maxProgress);
      
      // Directly generate simulated data here instead of calling functions
      // to avoid dependency issues
      
      // Generate simulated logs
      const simulatedLogs: ExecutionLog[] = [];
      
      simulatedLogs.push({
        id: 'setup-1',
        executionRunId: executionId,
        configurationId: '',
        requestId: '',
        logLevel: 'info',
        logCategory: 'SETUP',
        message: '🚀 Execution started successfully',
        details: {},
        timestamp: new Date(Date.now() - (progress * 2000)),
        sequenceNumber: 1,
        durationMs: 0,
      });

      if (progress >= 1) {
        simulatedLogs.push({
          id: 'ai-call-1',
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'info',
          logCategory: 'EXECUTION',
          message: '🤖 AI model processing started',
          details: {},
          timestamp: new Date(Date.now() - ((progress - 1) * 1500)),
          sequenceNumber: 2,
          durationMs: 0,
        });
      }

      if (progress >= 2) {
        simulatedLogs.push({
          id: 'processing-1',
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'info',
          logCategory: 'EXECUTION',
          message: `📊 Processing step ${Math.min(progress, maxProgress)} of ${maxProgress}`,
          details: {},
          timestamp: new Date(Date.now() - ((progress - 2) * 1000)),
          sequenceNumber: 3,
          durationMs: 0,
        });
      }

      if (progress >= Math.max(3, Math.floor(maxProgress * 0.3))) {
        simulatedLogs.push({
          id: 'api-calls',
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'info',
          logCategory: 'API_CALL',
          message: '📡 Making API calls to AI service',
          details: {},
          timestamp: new Date(Date.now() - 800),
          sequenceNumber: 4,
          durationMs: 0,
        });
      }

      if (progress >= Math.max(5, Math.floor(maxProgress * 0.5))) {
        simulatedLogs.push({
          id: 'midpoint-1',
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'info',
          logCategory: 'EXECUTION',
          message: '⚡ Execution is progressing well - halfway through',
          details: {},
          timestamp: new Date(Date.now() - 600),
          sequenceNumber: 5,
          durationMs: 0,
        });
      }

      if (progress >= Math.max(8, Math.floor(maxProgress * 0.8))) {
        simulatedLogs.push({
          id: 'nearing-completion',
          executionRunId: executionId,
          configurationId: '',
          requestId: '',
          logLevel: 'info',
          logCategory: 'COMPLETION',
          message: '🎯 Nearing completion - finalizing results',
          details: {},
          timestamp: new Date(Date.now() - 300),
          sequenceNumber: 6,
          durationMs: 0,
        });
      }

      simulatedLogs.push({
        id: `current-${progress}`,
        executionRunId: executionId,
        configurationId: '',
        requestId: '',
        logLevel: 'info',
        logCategory: 'EXECUTION',
        message: `🔄 Currently processing... (${progress}/${maxProgress})`,
        details: {},
        timestamp: new Date(),
        sequenceNumber: 100 + progress,
        durationMs: 0,
      });

      console.log('📋 Updated simulated logs with', simulatedLogs.length, 'entries');
      setLogs(simulatedLogs);
      
      // Generate simulated flow
      const events = [];
      
      events.push({
        id: 'event-1',
        executionRunId: executionId,
        eventType: 'prompt_start',
        sequenceNumber: 1,
        status: 'success',
        createdAt: new Date(Date.now() - (progress * 2000)).toISOString(),
        eventData: { message: 'Execution started' }
      });

      if (progress >= 1) {
        events.push({
          id: 'event-2',
          executionRunId: executionId,
          eventType: 'ai_model_call',
          sequenceNumber: 2,
          status: progress >= maxProgress * 0.8 ? 'success' : 'pending',
          createdAt: new Date(Date.now() - ((progress - 1) * 1500)).toISOString(),
          eventData: { message: 'AI processing in progress' }
        });
      }

      if (progress >= Math.max(3, Math.floor(maxProgress * 0.3))) {
        events.push({
          id: 'event-3',
          executionRunId: executionId,
          eventType: 'function_call_start',
          sequenceNumber: 3,
          status: progress >= maxProgress * 0.6 ? 'success' : 'pending',
          createdAt: new Date(Date.now() - 1200).toISOString(),
          eventData: { message: 'Function calls initiated' }
        });
      }

      if (progress >= Math.max(5, Math.floor(maxProgress * 0.5))) {
        events.push({
          id: 'event-4',
          executionRunId: executionId,
          eventType: 'ai_response',
          sequenceNumber: 4,
          status: progress >= maxProgress * 0.9 ? 'success' : 'pending',
          createdAt: new Date(Date.now() - 800).toISOString(),
          eventData: { message: 'AI response generated' }
        });
      }

      const simulatedFlow = {
        executionRunId: executionId,
        events: events,
        functionCalls: [],
        stats: {
          totalFunctionCalls: events.filter(e => e.eventType.includes('function')).length,
          totalAIModelCalls: events.filter(e => e.eventType.includes('ai')).length,
          totalErrors: 0,
          totalRetries: 0,
          totalExecutionTimeMs: progress * 2000,
          avgFunctionCallTimeMs: 0,
          avgAIResponseTimeMs: 2000,
          maxExecutionDepth: 1
        }
      };
      
      console.log('🔄 Updated simulated flow with', events.length, 'events');
      setFlowData(simulatedFlow);
    }
  }, [progress, maxProgress, isExecuting, executionId]); // Trigger when progress changes

  const getLogLevelColor = (level: string): string => {
    switch (level?.toLowerCase()) {
      case 'error': return '#FF3B30';
      case 'warning': return '#FF9500';
      case 'info': return '#007AFF';
      case 'debug': return '#8E8E93';
      case 'success': return '#34C759';
      default: return '#1A1A1A';
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
          color={viewMode === 'logs' ? '#FFFFFF' : '#007AFF'} 
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
          color={viewMode === 'flow' ? '#FFFFFF' : '#007AFF'} 
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
          color={viewMode === 'both' ? '#FFFFFF' : '#007AFF'} 
        />
        <Text style={[styles.viewModeText, viewMode === 'both' && styles.activeViewModeText]}>
          Both
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderProgressHeader = () => {
    const isTemporaryId = executionId.startsWith('exec-');
    
    return (
      <View style={styles.progressHeader}>
        <View style={styles.progressInfo}>
          <View style={styles.progressIconContainer}>
            <Ionicons name="rocket" size={24} color="#007AFF" />
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
              color={autoRefresh ? "#FFFFFF" : "#007AFF"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton} onPress={handleRefresh}>
            <Ionicons name="refresh" size={16} color="#007AFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Ionicons name="stop-circle" size={16} color="#FF3B30" />
            <Text style={styles.cancelButtonText}>Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLogs = () => (
    <View style={styles.logsContainer}>
      <View style={styles.logsHeader}>
        <Text style={styles.logsTitle}>📋 Live Execution Logs</Text>
        <View style={styles.logsStats}>
          <Text style={styles.logsCount}>{logs.length} entries</Text>
          {isLoadingLogs && <ActivityIndicator size="small" color="#007AFF" />}
        </View>
      </View>
      
      <ScrollView 
        ref={scrollViewRef}
        style={styles.logsScrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoadingLogs} onRefresh={handleRefresh} />
        }
      >
        {logs.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="hourglass-outline" size={48} color="#8E8E93" />
            <Text style={styles.emptyStateText}>Waiting for execution logs...</Text>
          </View>
        ) : (
          logs.map((log) => (
            <View key={log.id} style={styles.logEntry}>
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
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );

  const renderFlow = () => {
    const isTemporaryId = executionId.startsWith('exec-');
    
    return (
      <View style={styles.flowContainer}>
        <View style={styles.flowHeader}>
          <Text style={styles.flowTitle}>🔄 Live Execution Flow</Text>
          {isLoadingFlow && <ActivityIndicator size="small" color="#007AFF" />}
        </View>
        
        {isTemporaryId ? (
          // Show simulated flow for temporary IDs
          <ScrollView style={styles.simulatedFlowContainer}>
            {flowData?.events?.map((event: any, index: number) => (
              <View key={event.id} style={styles.simulatedFlowEvent}>
                <View style={styles.simulatedEventHeader}>
                  <View style={[
                    styles.simulatedEventStatus,
                    { backgroundColor: event.status === 'success' ? '#34C759' : event.status === 'pending' ? '#FF9500' : '#8E8E93' }
                  ]}>
                    <Text style={styles.simulatedEventIcon}>
                      {event.eventType === 'prompt_start' ? '🚀' : 
                       event.eventType === 'ai_model_call' ? '🤖' : 
                       event.eventType === 'ai_response' ? '💬' : '📝'}
                    </Text>
                  </View>
                  <View style={styles.simulatedEventContent}>
                    <Text style={styles.simulatedEventType}>
                      {event.eventType.replace('_', ' ').toUpperCase()}
                    </Text>
                    <Text style={styles.simulatedEventMessage}>
                      {event.eventData?.message || 'Processing...'}
                    </Text>
                                         <Text style={styles.simulatedEventStatusText}>
                       Status: {event.status.toUpperCase()}
                     </Text>
                  </View>
                </View>
                {index < (flowData?.events?.length || 0) - 1 && (
                  <View style={styles.simulatedEventConnector} />
                )}
              </View>
            ))}
            
            {flowData?.stats && (
              <View style={styles.simulatedStatsContainer}>
                <Text style={styles.simulatedStatsTitle}>📊 Live Statistics</Text>
                <View style={styles.simulatedStatsGrid}>
                  <View style={styles.simulatedStatItem}>
                    <Text style={styles.simulatedStatValue}>{flowData.stats.totalAIModelCalls}</Text>
                    <Text style={styles.simulatedStatLabel}>AI Calls</Text>
                  </View>
                  <View style={styles.simulatedStatItem}>
                    <Text style={styles.simulatedStatValue}>{Math.round(flowData.stats.totalExecutionTimeMs / 1000)}s</Text>
                    <Text style={styles.simulatedStatLabel}>Runtime</Text>
                  </View>
                  <View style={styles.simulatedStatItem}>
                    <Text style={styles.simulatedStatValue}>{flowData.stats.totalErrors}</Text>
                    <Text style={styles.simulatedStatLabel}>Errors</Text>
                  </View>
                </View>
              </View>
            )}
            
            {(!flowData || !flowData.events || flowData.events.length === 0) && (
              <View style={styles.emptyState}>
                <Ionicons name="git-network-outline" size={48} color="#8E8E93" />
                <Text style={styles.emptyStateText}>Building execution flow...</Text>
              </View>
            )}
          </ScrollView>
        ) : (
          // Show real ExecutionFlowGraph for real IDs
          flowData ? (
            <ExecutionFlowGraph
              executionRunId={executionId}
              visible={true}
              onClose={() => {}} // No close in live view
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="git-network-outline" size={48} color="#8E8E93" />
              <Text style={styles.emptyStateText}>Loading execution flow...</Text>
            </View>
          )
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderProgressHeader()}
      {renderViewModeSelector()}
      
      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning" size={16} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Ionicons name="close" size={16} color="#FF3B30" />
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

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressIconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  progressRing: {
    position: 'absolute',
    bottom: -8,
    right: -8,
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressDetails: {
    flex: 1,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  temporaryIdNote: {
    fontSize: 12,
    color: '#FF9500',
    fontStyle: 'italic',
    marginTop: 2,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  activeControlButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
    color: '#FF3B30',
  },
  viewModeSelector: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 8,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    gap: 4,
  },
  activeViewModeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  activeViewModeText: {
    color: '#FFFFFF',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4E1',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
  },
  content: {
    flex: 1,
    minHeight: 400,
  },
  logsContainer: {
    flex: 1,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  logsStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logsCount: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  logsScrollView: {
    flex: 1,
    maxHeight: 350,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  logEntry: {
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  logHeader: {
    flexDirection: 'row',
    padding: 12,
  },
  logIcon: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logEmoji: {
    fontSize: 16,
  },
  logContent: {
    flex: 1,
  },
  logTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    textTransform: 'uppercase',
  },
  logTimestamp: {
    fontSize: 12,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  logMessage: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 12,
    fontWeight: '500',
  },
  flowContainer: {
    flex: 1,
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  bothContainer: {
    flexDirection: 'row',
    flex: 1,
  },
  bothSection: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  simulatedEventStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  simulatedEventMessage: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 2,
  },
  simulatedEventStatusText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'uppercase',
  },
  simulatedEventConnector: {
    width: 2,
    height: 12,
    backgroundColor: '#E5E5EA',
    marginLeft: 27,
    marginVertical: 4,
  },
  simulatedStatsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  simulatedStatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  simulatedStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  simulatedStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  simulatedStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#007AFF',
  },
  simulatedStatLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default LiveExecutionViewer; 