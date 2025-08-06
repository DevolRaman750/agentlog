import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goGentAPI } from '../api/client';
import { AlertAPI } from './CustomAlert';
import AgentAvatar from './AgentAvatar';
import { Agent, ExecutionRun, LifecycleStatus } from '../types';

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
  const [executions, setExecutions] = useState<ExecutionRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agentStats, setAgentStats] = useState<{
    totalExecutions: number;
    completedExecutions: number;
    failedExecutions: number;
    totalTokensUsed: number;
    averageExecutionTime: number;
  } | null>(null);

  useEffect(() => {
    loadExecutions();
  }, [agent.id]);

  const loadExecutions = async () => {
    try {
      setIsLoading(true);
      const response = await goGentAPI.getAgentExecutions(agent.id, 50, 0);
      if (response.success && response.data) {
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
        setAgentStats(stats);
      } else {
        console.error('Failed to load agent executions:', response.error);
      }
    } catch (error) {
      console.error('Error loading executions:', error);
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
      case 'ACTIVE': return '#28a745';
      case 'STANDBY': return '#ffc107';
      case 'PAUSED': return '#6c757d';
      case 'KILLED': return '#dc3545';
      default: return '#6c757d';
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
      case 'completed': return '#28a745';
      case 'running': return '#007AFF';
      case 'failed': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
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
          <Ionicons name="time-outline" size={14} color="#666" />
          <Text style={styles.executionDetailText}>
            {formatDate(execution.created_at || execution.createdAt || '')}
          </Text>
        </View>
        
        {execution.total_time && (
          <View style={styles.executionDetailRow}>
            <Ionicons name="speedometer-outline" size={14} color="#666" />
            <Text style={styles.executionDetailText}>
              {Math.round(execution.total_time / 1000)}s
            </Text>
          </View>
        )}
        
        {execution.totalTokens && (
          <View style={styles.executionDetailRow}>
            <Ionicons name="flash-outline" size={14} color="#666" />
            <Text style={styles.executionDetailText}>
              {execution.totalTokens.toLocaleString()} tokens
            </Text>
          </View>
        )}
        
        {execution.enableFunctionCalling && (
          <View style={styles.executionDetailRow}>
            <Ionicons name="extension-puzzle-outline" size={14} color="#007AFF" />
            <Text style={[styles.executionDetailText, { color: '#007AFF' }]}>
              Functions
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.executionActions}>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  const renderEmptyExecutions = () => (
    <View style={styles.emptyExecutions}>
      <Ionicons name="analytics-outline" size={48} color="#ccc" />
      <Text style={styles.emptyExecutionsText}>No executions yet</Text>
      <Text style={styles.emptyExecutionsSubtext}>
        This agent hasn't run any executions
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
            <Ionicons name="close" size={24} color="#666" />
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
              <Ionicons name="document-text" size={14} color="#007AFF" />
              <Text style={styles.templateName}>{agent.templateName || 'Unknown Archetype Template'}</Text>
              {onNavigateToTemplate && (
                <Ionicons name="arrow-forward" size={14} color="#007AFF" style={styles.templateArrow} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            onPress={onEdit} 
            style={styles.editButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="pencil" size={20} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={onDelete} 
            style={styles.deleteButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={20} color="#dc3545" />
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
                <Ionicons name="analytics" size={24} color="#007AFF" />
                <Text style={styles.statValue}>{agentStats.totalExecutions}</Text>
                <Text style={styles.statLabel}>Total Executions</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle" size={24} color="#28a745" />
                <Text style={styles.statValue}>{agentStats.completedExecutions}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="close-circle" size={24} color="#dc3545" />
                <Text style={styles.statValue}>{agentStats.failedExecutions}</Text>
                <Text style={styles.statLabel}>Failed</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="flash" size={24} color="#FF9500" />
                <Text style={styles.statValue}>{agentStats.totalTokensUsed.toLocaleString()}</Text>
                <Text style={styles.statLabel}>Tokens Used</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="speedometer" size={24} color="#6f42c1" />
                <Text style={styles.statValue}>{agentStats.averageExecutionTime.toFixed(1)}s</Text>
                <Text style={styles.statLabel}>Avg Duration</Text>
              </View>
              
              <View style={styles.statCard}>
                <Ionicons name="trending-up" size={24} color="#17a2b8" />
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
                    backgroundColor: agent.tokensUsedToday > agent.maxTokensPerDay * 0.9 ? '#dc3545' : '#007AFF'
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
                <Ionicons name="refresh" size={20} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading executions...</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: 'white',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  templateName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'transparent',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  // Stats Grid Styles
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statusItem: {
    flex: 1,
    minWidth: '45%',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
  },
  tokenUsage: {
    alignItems: 'center',
  },
  tokenProgress: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  tokenProgressBar: {
    height: '100%',
    borderRadius: 4,
  },
  tokenText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  tokenResetText: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  executionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  executionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  executionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    marginRight: 12,
  },
  executionDescription: {
    fontSize: 14,
    color: '#666',
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
    fontWeight: '600',
    color: 'white',
  },
  executionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  executionActions: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  executionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  executionDetailText: {
    fontSize: 12,
    color: '#666',
  },
  emptyExecutions: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyExecutionsText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
    marginTop: 12,
  },
  emptyExecutionsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  infoGrid: {
    gap: 12,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    flex: 2,
    textAlign: 'right',
  },
  templateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  templateArrow: {
    marginLeft: 4,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 6,
    minWidth: 36,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AgentDetailView; 