import React from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AgentAvatar from './AgentAvatar';
import { Agent, LifecycleStatus } from '../types';
import { shadowPresets } from '../styles/containers';
import { useResponsive } from '../context/ResponsiveContext';
import { useTheme, useThemedStyles } from '../theme';
import type { ThemeColors } from '../theme';

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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
      case 'ACTIVE': return colors.statusSuccess;
      case 'STANDBY': return colors.accentSecondary;
      case 'PAUSED': return colors.statusPaused;
      case 'KILLED': return colors.statusError;
      default: return colors.statusPaused;
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
    return agent.lifecycleStatus === 'PAUSED' ? colors.statusSuccess : colors.accentSecondary;
  };

  const getGoLiveIcon = () => {
    return agent.lifecycleStatus === 'ACTIVE' ? 'stop' : 'radio';
  };

  const getGoLiveColor = (): string => {
    return agent.lifecycleStatus === 'ACTIVE' ? colors.statusError : colors.statusSuccess;
  };

  const isInLiveMode = () => {
    return agent.lifecycleStatus === 'ACTIVE';
  };

  const canExecuteNow = (): boolean => {
    return agent.status !== 'KILLED';
  };

  const tokenPercentage = agent.maxTokensPerDay > 0 ? (agent.tokensUsedToday / agent.maxTokensPerDay) * 100 : 0;
  const tokenColor = tokenPercentage > 90 ? colors.statusError : tokenPercentage > 70 ? colors.accentSecondary : colors.statusSuccess;

  // Determine layout based on screen size
  const isCompactMode = screenWidth < 600; // Compact mode for smaller screens
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
            <TouchableOpacity
              style={[styles.memoryIndicator, !agent.memory && styles.memoryIndicatorEmpty]}
              onPress={(e) => {
                e.stopPropagation();
                onViewMemory();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons
                name="library"
                size={12}
                color={agent.memory ? colors.accent : colors.textTertiary}
              />
            </TouchableOpacity>
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

            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.memoryAction,
                styles.actionButtonCompact,
                !agent.memory && styles.memoryActionEmpty
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onViewMemory();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="library"
                size={14}
                color={agent.memory ? colors.accent : colors.textTertiary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonCompact]}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons name="pencil" size={14} color={colors.accent} />
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
                color={canExecuteNow() ? colors.accentSecondary : colors.textTertiary}
              />
            </TouchableOpacity>

            {/* Memory */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.memoryAction,
                isMobile && styles.actionButtonMobile,
                !agent.memory && styles.memoryActionEmpty
              ]}
              onPress={(e) => {
                e.stopPropagation();
                onViewMemory();
              }}
              activeOpacity={0.7}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <Ionicons
                name="library"
                size={isMobile ? 14 : 16}
                color={agent.memory ? colors.accent : colors.textTertiary}
              />
            </TouchableOpacity>

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
              <Ionicons name="pencil" size={isMobile ? 14 : 16} color={colors.accent} />
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
              <Ionicons name="trash" size={isMobile ? 14 : 16} color={colors.statusError} />
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
              color={canExecuteNow() ? colors.accentSecondary : colors.textTertiary}
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
            <Ionicons name="trash" size={12} color={colors.statusError} />
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
            color={colors.accent}
          />
          <View style={styles.templateText}>
                            <Text style={styles.templateLabel}>Archetype Template</Text>
            <Text style={styles.templateName} numberOfLines={1}>
                            {agent.templateName || 'Unknown Archetype Template'}
            </Text>
          </View>
        </View>
        <Ionicons name="arrow-forward" size={16} color={colors.accent} />
      </TouchableOpacity>

      {/* Agent Statistics */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {/* Execution Count */}
          <View style={styles.statItem}>
            <Ionicons name="analytics" size={16} color={colors.textTertiary} />
            <Text style={styles.statValue}>{agent.totalExecutions}</Text>
            <Text style={styles.statLabel}>Executions</Text>
          </View>

          {/* Heartbeat */}
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color={colors.textTertiary} />
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
            <Ionicons name="checkmark-circle" size={16} color={colors.textTertiary} />
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

const createStyles = (colors: ThemeColors) => ({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    ...shadowPresets.medium,
    borderWidth: 1,
    borderColor: colors.borderLight,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  cardHeader: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
    gap: 8,
  },
  cardHeaderCompact: {
    alignItems: 'center' as const,
    marginBottom: 12,
    gap: 6,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    minWidth: 80,
  },
  headerInfoCompact: {
    marginLeft: 8,
    marginRight: 4,
    flex: 1,
    minWidth: 60,
  },
  agentName: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  agentNameCompact: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 2,
  },
  statusContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  statusBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600' as const,
  },
  memoryIndicator: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 8,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  memoryIndicatorEmpty: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderSubtle,
  },
  quickActions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 6,
    justifyContent: 'flex-end' as const,
    maxWidth: 220,
  },
  quickActionsMobile: {
    gap: 4,
    maxWidth: 180,
  },
  quickActionsCompact: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 4,
    justifyContent: 'flex-end' as const,
    maxWidth: 140,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.bgElevated,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  actionButtonMobile: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  actionButtonCompact: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  deleteAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.40)',
  },
  primaryAction: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderAccent,
  },
  executeAction: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderColor: 'rgba(251, 191, 36, 0.40)',
  },
  goLiveAction: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderAccent,
  },
  liveStopAction: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.40)',
  },
  memoryAction: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderAccent,
  },
  memoryActionEmpty: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderSubtle,
  },
  disabledAction: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.borderSubtle,
    opacity: 0.4,
  },
  templateSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.bgElevated,
    borderRadius: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  templateInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  templateText: {
    marginLeft: 12,
    flex: 1,
  },
  templateLabel: {
    fontSize: 12,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  statsSection: {
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  statItem: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
    marginTop: 4,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'center' as const,
  },
  progressSection: {
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.accentSoft,
    borderRadius: 2,
    overflow: 'hidden' as const,
    marginBottom: 6,
  },
  progressFill: {
    height: '100%' as const,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center' as const,
  },
  cardFooter: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  footerGradient: {
    flex: 1,
    backgroundColor: colors.accent,
    opacity: 0.30,
  },
  // Secondary actions row for compact mode
  secondaryActionsRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-around' as const,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.bgElevated,
    borderRadius: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  secondaryActionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    backgroundColor: colors.bgSurface,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  secondaryActionText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.textTertiary,
  },
});

export default AgentBusinessCard;
