import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AgentAvatar from './AgentAvatar';
import { Agent, LifecycleStatus } from '../types';
import { shadowPresets } from '../styles/containers';
import { useResponsive } from '../context/ResponsiveContext';

interface AgentBusinessCardProps {
  agent: Agent;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNavigateToTemplate: (templateId: string) => void;
  onToggleStatus: () => void;
  onExecuteNow: () => void;
  onGoLive: () => void;
  onViewMemory: () => void;
  animated?: boolean;
}

const AgentBusinessCard: React.FC<AgentBusinessCardProps> = ({
  agent,
  onPress,
  onEdit,
  onDelete,
  onNavigateToTemplate,
  onToggleStatus,
  onExecuteNow,
  onGoLive,
  onViewMemory,
  animated = false
}) => {
  const { screenWidth, isSidebarLayout } = useResponsive();
  const formatTokenUsage = (used: number, max: number): string => {
    const percentage = max > 0 ? Math.round((used / max) * 100) : 0;
    return `${percentage}%`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Never';
    }
  };

  const getStatusColor = (status: LifecycleStatus): string => {
    switch (status) {
      case 'ACTIVE': return '#28a745';
      case 'STANDBY': return '#ffc107';
      case 'PAUSED': return '#6c757d';
      case 'KILLED': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: LifecycleStatus): string => {
    switch (status) {
      case 'ACTIVE': return 'play-circle';
      case 'STANDBY': return 'pause-circle';
      case 'PAUSED': return 'stop-circle';
      case 'KILLED': return 'close-circle';
      default: return 'help-circle';
    }
  };

  const getTemplateIcon = (templateName: string): string => {
    const name = templateName.toLowerCase();
    if (name.includes('engineer')) return 'code-slash';
    if (name.includes('analyst')) return 'analytics';
    if (name.includes('writer')) return 'document-text';
    if (name.includes('assistant')) return 'chatbubble-ellipses';
    if (name.includes('researcher')) return 'search';
    if (name.includes('manager')) return 'people';
    return 'document';
  };

  const getToggleStatusIcon = () => {
    return agent.lifecycleStatus === 'PAUSED' ? 'play' : 'pause';
  };

  const getToggleStatusColor = (): string => {
    return agent.lifecycleStatus === 'PAUSED' ? '#28a745' : '#ffc107';
  };

  const getGoLiveIcon = () => {
    return agent.lifecycleStatus === 'ACTIVE' ? 'stop' : 'radio';
  };

  const getGoLiveColor = (): string => {
    return agent.lifecycleStatus === 'ACTIVE' ? '#dc3545' : '#28a745';
  };

  const isInLiveMode = () => {
    return agent.lifecycleStatus === 'ACTIVE';
  };

  const canExecuteNow = (): boolean => {
    return agent.status !== 'KILLED';
  };

  const tokenPercentage = agent.maxTokensPerDay > 0 ? (agent.tokensUsedToday / agent.maxTokensPerDay) * 100 : 0;
  const tokenColor = tokenPercentage > 90 ? '#dc3545' : tokenPercentage > 70 ? '#ffc107' : '#28a745';

  // Determine layout based on screen size
  const isCompactMode = screenWidth < 480; // Very small mobile screens
  const isMobile = !isSidebarLayout; // Use responsive context mobile detection

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {/* Card Header with Avatar and Status */}
      <View style={[styles.cardHeader, isCompactMode && styles.cardHeaderCompact]}>
        <AgentAvatar 
          agent={agent} 
          size={isCompactMode ? "medium" : "large"} 
          showStatus={true}
          animated={animated}
        />
        
        <View style={[styles.headerInfo, isCompactMode && styles.headerInfoCompact]}>
          <Text style={[styles.agentName, isCompactMode && styles.agentNameCompact]} numberOfLines={isCompactMode ? 2 : 1}>
            {agent.firstName} {agent.lastName}
          </Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(agent.lifecycleStatus) }]}>
              <Ionicons 
                name={getStatusIcon(agent.lifecycleStatus) as any} 
                size={12} 
                color="white" 
              />
              <Text style={styles.statusText}>{agent.lifecycleStatus}</Text>
            </View>
            {agent.memory && (
              <TouchableOpacity 
                style={styles.memoryIndicator}
                onPress={(e) => {
                  e.stopPropagation();
                  onViewMemory();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="library" size={12} color="#34C759" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Quick Actions - Responsive layout */}
        {isCompactMode ? (
          <View style={styles.quickActionsCompact}>
            {/* Most important actions only on very small screens */}
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                isInLiveMode() ? styles.liveStopAction : styles.goLiveAction,
                styles.actionButtonCompact
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onGoLive();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons 
                name={getGoLiveIcon()} 
                size={14} 
                color={getGoLiveColor()} 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryAction, styles.actionButtonCompact]}
              onPress={(e) => {
                e.stopPropagation();
                onToggleStatus();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons 
                name={getToggleStatusIcon()} 
                size={14} 
                color={getToggleStatusColor()} 
              />
            </TouchableOpacity>

            {agent.memory && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.memoryAction, styles.actionButtonCompact]}
                onPress={(e) => {
                  e.stopPropagation();
                  onViewMemory();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="library" size={14} color="#34C759" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.actionButtonCompact]}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="pencil" size={14} color="#007AFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.quickActions, isMobile && styles.quickActionsMobile]}>
            {/* Go Live / Stop Live */}
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                isInLiveMode() ? styles.liveStopAction : styles.goLiveAction,
                isMobile && styles.actionButtonMobile
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onGoLive();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons 
                name={getGoLiveIcon()} 
                size={isMobile ? 14 : 16} 
                color={getGoLiveColor()} 
              />
            </TouchableOpacity>

            {/* Play/Pause Toggle */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryAction, isMobile && styles.actionButtonMobile]}
              onPress={(e) => {
                e.stopPropagation();
                onToggleStatus();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons 
                name={getToggleStatusIcon()} 
                size={isMobile ? 14 : 16} 
                color={getToggleStatusColor()} 
              />
            </TouchableOpacity>
            
            {/* Execute Now */}
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.executeAction,
                isMobile && styles.actionButtonMobile,
                !canExecuteNow() && styles.disabledAction
              ]}
              onPress={(e) => {
                e.stopPropagation();
                if (canExecuteNow()) {
                  onExecuteNow();
                }
              }}
              disabled={!canExecuteNow()}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons 
                name="flash" 
                size={isMobile ? 14 : 16} 
                color={canExecuteNow() ? "#FF6B35" : "#ccc"} 
              />
            </TouchableOpacity>

            {/* Memory */}
            {agent.memory && (
              <TouchableOpacity 
                style={[styles.actionButton, styles.memoryAction, isMobile && styles.actionButtonMobile]}
                onPress={(e) => {
                  e.stopPropagation();
                  onViewMemory();
                }}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Ionicons name="library" size={isMobile ? 14 : 16} color="#34C759" />
              </TouchableOpacity>
            )}

            {/* Edit */}
            <TouchableOpacity 
              style={[styles.actionButton, isMobile && styles.actionButtonMobile]}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="pencil" size={isMobile ? 14 : 16} color="#007AFF" />
            </TouchableOpacity>
            
            {/* Delete */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteAction, isMobile && styles.actionButtonMobile]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="trash" size={isMobile ? 14 : 16} color="#dc3545" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Secondary Actions Row for Compact Mode */}
      {isCompactMode && (
        <View style={styles.secondaryActionsRow}>
          <TouchableOpacity 
            style={[
              styles.secondaryActionButton, 
              styles.executeAction,
              !canExecuteNow() && styles.disabledAction
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (canExecuteNow()) {
                onExecuteNow();
              }
            }}
            disabled={!canExecuteNow()}
            activeOpacity={0.7}
          >
            <Ionicons 
              name="flash" 
              size={12} 
              color={canExecuteNow() ? "#FF6B35" : "#ccc"} 
            />
            <Text style={[styles.secondaryActionText, !canExecuteNow() && styles.disabledText]}>Execute</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.secondaryActionButton, styles.deleteAction]}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash" size={12} color="#dc3545" />
            <Text style={styles.secondaryActionText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Template Information */}
      <TouchableOpacity 
        style={styles.templateSection}
        onPress={(e) => {
          e.stopPropagation();
          onNavigateToTemplate(agent.templateId);
        }}
      >
        <View style={styles.templateInfo}>
          <Ionicons 
            name={getTemplateIcon(agent.templateName || '') as any} 
            size={20} 
            color="#007AFF" 
          />
          <View style={styles.templateText}>
                              <Text style={styles.templateLabel}>Archetype Template</Text>
            <Text style={styles.templateName} numberOfLines={1}>
                              {agent.templateName || 'Unknown Archetype Template'}
            </Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={16} color="#007AFF" />
      </TouchableOpacity>

      {/* Agent Statistics */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {/* Execution Count */}
          <View style={styles.statItem}>
            <Ionicons name="analytics" size={16} color="#666" />
            <Text style={styles.statValue}>{agent.totalExecutions}</Text>
            <Text style={styles.statLabel}>Executions</Text>
          </View>

          {/* Heartbeat */}
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#666" />
            <Text style={styles.statValue}>{agent.heartbeatMinutes}m</Text>
            <Text style={styles.statLabel}>Heartbeat</Text>
          </View>

          {/* Token Usage */}
          <View style={styles.statItem}>
            <Ionicons name="flash" size={16} color={tokenColor} />
            <Text style={[styles.statValue, { color: tokenColor }]}>
              {formatTokenUsage(agent.tokensUsedToday, agent.maxTokensPerDay)}
            </Text>
            <Text style={styles.statLabel}>Tokens</Text>
          </View>

          {/* Last Run */}
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={16} color="#666" />
            <Text style={styles.statValue}>
              {agent.lastExecutionAt ? formatDate(agent.lastExecutionAt) : 'Never'}
            </Text>
            <Text style={styles.statLabel}>Last Run</Text>
          </View>
        </View>
      </View>

      {/* Token Usage Progress Bar */}
      <View style={styles.progressSection}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                width: `${Math.min(tokenPercentage, 100)}%`,
                backgroundColor: tokenColor
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {agent.tokensUsedToday.toLocaleString()} / {agent.maxTokensPerDay.toLocaleString()} tokens today
        </Text>
      </View>

      {/* Card Footer with Gradient */}
      <View style={styles.cardFooter}>
        <View style={styles.footerGradient} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...shadowPresets.medium,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    overflow: 'hidden',
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderCompact: {
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    marginRight: 8,
  },
  headerInfoCompact: {
    marginLeft: 12,
    marginRight: 4,
    flex: 1,
    minWidth: 0, // Prevents text overflow
  },
  agentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  agentNameCompact: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  memoryIndicator: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
  },
  quickActionsMobile: {
    gap: 6,
  },
  quickActionsCompact: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  actionButtonMobile: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  actionButtonCompact: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  deleteAction: {
    backgroundColor: '#fff5f5',
    borderColor: '#fed7d7',
  },
  primaryAction: {
    backgroundColor: '#f0f8ff',
    borderColor: '#cce7ff',
  },
  executeAction: {
    backgroundColor: '#fff4f0',
    borderColor: '#ffd7cc',
  },
  goLiveAction: {
    backgroundColor: '#f0fff4',
    borderColor: '#c6f6d5',
  },
  liveStopAction: {
    backgroundColor: '#fff5f5',
    borderColor: '#fec6cb',
  },
  memoryAction: {
    backgroundColor: '#f0fff4',
    borderColor: '#c6f6d5',
  },
  disabledAction: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
    opacity: 0.6,
  },
  templateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  templateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  templateText: {
    marginLeft: 12,
    flex: 1,
  },
  templateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  statsSection: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  progressSection: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  cardFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  footerGradient: {
    flex: 1,
    backgroundColor: 'linear-gradient(90deg, #007AFF, #5856D6)',
    opacity: 0.1,
  },
  // Secondary actions row for compact mode
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  secondaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e9ecef',
    gap: 4,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  disabledText: {
    color: '#ccc',
  },
});

export default AgentBusinessCard; 