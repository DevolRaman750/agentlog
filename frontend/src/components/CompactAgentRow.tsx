import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Agent, LifecycleStatus } from '../types';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
import type { ThemeColors } from '../theme';

interface CompactAgentRowProps {
  agent: Agent;
  onPress: () => void;
  onExecuteNow?: () => void;
  onEdit?: () => void;
  onViewMemory?: () => void;
  indented?: boolean;
}

const getStatusColor = (status: LifecycleStatus, colors: ThemeColors): string => {
  switch (status) {
    case 'ACTIVE': return colors.statusSuccess;
    case 'PAUSED': return colors.statusPaused;
    case 'STANDBY': return colors.accentSecondary;
    case 'KILLED': return colors.statusError;
    default: return colors.textTertiary;
  }
};

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return '';
  try {
    const diff = Date.now() - new Date(dateString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return '';
  }
};

const CompactAgentRow: React.FC<CompactAgentRowProps> = ({
  agent,
  onPress,
  onExecuteNow,
  onEdit,
  onViewMemory,
  indented = true,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const statusColor = getStatusColor(agent.lifecycleStatus, colors);
  const relativeTime = formatRelativeTime(agent.lastExecutionAt);

  return (
    <TouchableOpacity
      style={[styles.container, indented && styles.indented]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
        <View style={styles.nameSection}>
          <Text style={styles.agentName} numberOfLines={1}>
            {agent.firstName} {agent.lastName}
          </Text>
          <Text style={styles.templateName} numberOfLines={1}>
            {agent.templateName || 'No template'}
          </Text>
        </View>
      </View>
      <View style={styles.rightSection}>
        {relativeTime ? (
          <Text style={styles.timeText}>{relativeTime}</Text>
        ) : null}
        {onExecuteNow && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => { e.stopPropagation(); onExecuteNow(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="play" size={14} color={colors.statusSuccess} />
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => { e.stopPropagation(); onEdit(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="pencil" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
        {onViewMemory && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => { e.stopPropagation(); onViewMemory(); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="library-outline" size={14} color={colors.accentSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    height: 48,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  indented: {
    paddingLeft: spacing.xxxl,
  },
  leftSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  nameSection: {
    flex: 1,
  },
  agentName: {
    ...typography.body,
    fontWeight: '500' as const,
    color: colors.textPrimary,
  },
  templateName: {
    ...typography.micro,
    fontWeight: '400' as const,
    color: colors.textTertiary,
    marginTop: 1,
  },
  rightSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  timeText: {
    ...typography.micro,
    fontWeight: '400' as const,
    color: colors.textTertiary,
    marginRight: spacing.xs,
  },
  actionButton: {
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    borderRadius: radius.pill,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});

export default CompactAgentRow;
