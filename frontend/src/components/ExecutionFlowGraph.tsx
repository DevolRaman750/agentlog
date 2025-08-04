import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform, Pressable } from 'react-native';
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
  const { state } = useApp();
  const backendUrl = state.config.backendUrl;

  useEffect(() => {
    if (visible && executionRunId && !executionRunId.startsWith('exec-')) {
      // Only fetch data for real execution IDs, not temporary ones
      fetchExecutionFlowData();
    }
  }, [visible, executionRunId, configurationId]);

  const fetchExecutionFlowData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = configurationId 
        ? await goGentAPI.getExecutionFlowGraphByConfiguration(executionRunId, configurationId)
        : await goGentAPI.getExecutionFlowGraph(executionRunId);
      
      if (response.success && response.data) {
        const data: ExecutionFlowGraph = response.data;
        setFlowData(data);
      } else {
        throw new Error(response.error || 'Failed to fetch execution flow data');
      }
    } catch (err: any) {
      console.error('Error fetching execution flow data:', err);
      const message = err.message || 'Failed to fetch execution flow data';
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
            Function Calls Only ({functionCallEventsCount})
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

      {/* Timeline Overview */}
      {flowData && flowData.events && flowData.events.length > 0 && (
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
                                        color="#007AFF" 
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
                                  color="#007AFF" 
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
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    paddingVertical: 4,
  },
  expandButtonText: {
    fontSize: 11,
    color: '#007AFF',
    fontWeight: '600',
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
  parallelGroup: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  parallelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  parallelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9500',
  },
  parallelCount: {
    fontSize: 12,
    color: '#8E8E93',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  parallelContainer: {
    gap: 8,
  },
  parallelEvent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  parallelConnection: {
    width: 1,
    height: 8,
    backgroundColor: '#E5E5EA',
    marginLeft: 31,
    marginVertical: 2,
  },
  timelineOverview: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  timelineHeader: {
    marginBottom: 12,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  timelineSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  timelineBar: {
    flexDirection: 'row',
    height: 24, // Increased height for better touch targets
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    overflow: 'hidden',
    padding: 2,
  },
  timelineEvent: {
    flex: 1,
    height: '100%',
    marginRight: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    minHeight: 20, // Touch target height
  },
  timelineEventTooltip: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  timelineEventText: {
    fontSize: 10,
    opacity: 0.9,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  modalCloseButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1D1D1F',
  },
  headerSpacer: {
    width: 50,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  eventDetailContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  eventDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  eventDetailIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventDetailIconText: {
    fontSize: 24,
  },
  eventDetailInfo: {
    flex: 1,
  },
  eventDetailType: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  eventDetailSequence: {
    fontSize: 14,
    color: '#8E8E93',
  },
  eventDetailStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  eventDetailStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  eventDetailSection: {
    marginBottom: 20,
  },
  eventDetailSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  eventDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventDetailLabel: {
    fontSize: 14,
    color: '#8E8E93',
    fontWeight: '500',
    flex: 1,
  },
  eventDetailValue: {
    fontSize: 14,
    color: '#1D1D1F',
    fontWeight: '400',
    flex: 2,
    textAlign: 'right',
  },
  eventDetailDataContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
  },
  eventDetailData: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1D1D1F',
    lineHeight: 16,
  },
  eventDetailErrorContainer: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  eventDetailError: {
    fontSize: 14,
    color: '#FF3B30',
    lineHeight: 20,
  },
});

export default ExecutionFlowGraph; 