import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useApp } from '../context/AppContext';
import { goGentAPI } from '../api/client';

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
}

const ExecutionFlowGraph: React.FC<ExecutionFlowGraphProps> = ({
  executionRunId,
  visible,
  onClose,
}) => {
  const [flowData, setFlowData] = useState<ExecutionFlowGraph | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFunctionCallsOnly, setShowFunctionCallsOnly] = useState(false);
  const { state } = useApp();
  const backendUrl = state.config.backendUrl;

  useEffect(() => {
    if (visible && executionRunId) {
      fetchExecutionFlowData();
    }
  }, [visible, executionRunId]);

  const fetchExecutionFlowData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await goGentAPI.api.get(`/api/execution-flow/${executionRunId}`);
      const data: ExecutionFlowGraph = response.data;
      setFlowData(data);
    } catch (err: any) {
      console.error('Error fetching execution flow data:', err);
      const message = err.response?.data || err.message || 'Failed to fetch execution flow data';
      setError(typeof message === 'string' ? message : JSON.stringify(message));
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
      case 'prompt_start': return '#007AFF';
      case 'ai_model_call': return '#5856D6';
      case 'function_call_start': return '#FF9500';
      case 'function_call_end': return '#34C759';
      case 'ai_response': return '#32D74B';
      case 'error_occurred': return '#FF3B30';
      case 'retry_attempt': return '#FF9500';
      case 'execution_complete': return '#30B0C7';
      default: return '#8E8E93';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'success': return '#34C759';
      case 'error': return '#FF3B30';
      case 'timeout': return '#FF9500';
      case 'pending': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const formatDuration = (durationMs?: number): string => {
    if (!durationMs) return '';
    if (durationMs < 1000) return `${durationMs}ms`;
    return `${(durationMs / 1000).toFixed(2)}s`;
  };

  const filteredEvents = showFunctionCallsOnly 
    ? flowData?.events.filter(event => 
        event.eventType === 'function_call_start' || 
        event.eventType === 'function_call_end'
      ) || []
    : flowData?.events || [];

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Execution Flow Graph</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1D1D1F" />
        </TouchableOpacity>
      </View>

      {/* Filter Controls */}
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
            Function Calls Only ({flowData?.functionCalls?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Summary */}
      {flowData?.stats && (
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

      {/* Content */}
      <ScrollView style={styles.content}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
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
            {filteredEvents.map((event, index) => (
              <View key={event.id} style={styles.eventItem}>
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
                      <Text style={styles.eventData} numberOfLines={2}>
                        {JSON.stringify(event.eventData, null, 2)}
                      </Text>
                    )}
                    
                    {event.errorMessage && (
                      <Text style={styles.errorMessage}>
                        Error: {event.errorMessage}
                      </Text>
                    )}
                  </View>
                </View>
                
                {/* Connection line to next event */}
                {index < filteredEvents.length - 1 && (
                  <View style={styles.connectionLine} />
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  closeButton: {
    padding: 4,
  },
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    gap: 12,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
  },
  activeFilterButton: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  eventsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  eventItem: {
    marginBottom: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  eventIconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  eventIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  sequenceNumber: {
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  sequenceText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  eventContent: {
    flex: 1,
  },
  eventTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  eventType: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  eventMeta: {
    alignItems: 'flex-end',
  },
  eventStatus: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  eventDuration: {
    fontSize: 10,
    color: '#8E8E93',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  eventData: {
    fontSize: 11,
    color: '#6B7280',
    fontFamily: 'monospace',
    marginTop: 4,
    backgroundColor: '#F8F9FA',
    padding: 8,
    borderRadius: 6,
  },
  errorMessage: {
    fontSize: 11,
    color: '#FF3B30',
    marginTop: 4,
    fontStyle: 'italic',
  },
  connectionLine: {
    width: 2,
    height: 12,
    backgroundColor: '#E5E5EA',
    marginLeft: 31,
    marginVertical: 2,
  },
});

export default ExecutionFlowGraph; 