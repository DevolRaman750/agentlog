import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../theme';
import { spacing, radius, typography, touchTarget } from '../theme';
import { Task, TaskState } from '../types';
import type { ThemeColors } from '../theme';

interface TaskCardProps {
  task: Task;
  onPress: (task: Task) => void;
  onTransition?: (task: Task) => void;
  showParentInfo?: boolean;
}

export const getTaskStateColor = (state: TaskState, colors: ThemeColors): string => {
  switch (state) {
    case 'defining': return colors.textSecondary;
    case 'compiling': return '#F59E0B';
    case 'compiled': return '#3B82F6';
    case 'in_progress': return '#8B5CF6';
    case 'completed': return '#10B981';
    case 'failed': return '#EF4444';
    default: return colors.textSecondary;
  }
};

export const getTaskStateIcon = (state: TaskState): keyof typeof Ionicons.glyphMap => {
  switch (state) {
    case 'defining': return 'pencil-outline';
    case 'compiling': return 'build-outline';
    case 'compiled': return 'checkmark-circle-outline';
    case 'in_progress': return 'play-circle-outline';
    case 'completed': return 'checkmark-done-circle-outline';
    case 'failed': return 'close-circle-outline';
    default: return 'help-circle-outline';
  }
};

export const getPriorityColor = (priority: string, colors: ThemeColors): string => {
  switch (priority) {
    case 'urgent': return '#EF4444';
    case 'high': return '#F59E0B';
    case 'medium': return '#3B82F6';
    case 'low': return colors.textSecondary;
    default: return colors.textSecondary;
  }
};

export const getPriorityIcon = (priority: string): keyof typeof Ionicons.glyphMap => {
  switch (priority) {
    case 'urgent': return 'alert-circle';
    case 'high': return 'arrow-up-circle';
    case 'medium': return 'remove-circle';
    case 'low': return 'arrow-down-circle';
    default: return 'remove-circle-outline';
  }
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHrs = Math.floor(diffMins / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, showParentInfo }) => {
  const styles = useThemedStyles(createStyles);

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: getPriorityColor(task.priority, styles._colors) }]}
      onPress={() => onPress(task)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{task.title}</Text>
        <View style={[styles.stateBadge, { backgroundColor: getTaskStateColor(task.state, styles._colors) + '20' }]}>
          <Ionicons
            name={getTaskStateIcon(task.state)}
            size={14}
            color={getTaskStateColor(task.state, styles._colors)}
          />
          <Text style={[styles.stateText, { color: getTaskStateColor(task.state, styles._colors) }]}>
            {task.state.replace('_', ' ')}
          </Text>
        </View>
      </View>

      {task.description ? (
        <Text style={styles.description} numberOfLines={2}>{task.description}</Text>
      ) : null}

      <View style={styles.metaRow}>
        <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority, styles._colors) + '15' }]}>
          <Ionicons name={getPriorityIcon(task.priority)} size={14} color={getPriorityColor(task.priority, styles._colors)} />
          <Text style={[styles.priorityText, { color: getPriorityColor(task.priority, styles._colors) }]}>{task.priority}</Text>
        </View>

        {(task.child_count || 0) > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="git-branch-outline" size={14} color={styles._colors.textSecondary} />
            <Text style={styles.metaText}>{task.child_count}</Text>
          </View>
        )}

        {(task.dependencies?.length || 0) > 0 && (
          <View style={styles.metaItem}>
            <Ionicons name="link-outline" size={14} color={styles._colors.textSecondary} />
            <Text style={styles.metaText}>{task.dependencies!.length}</Text>
          </View>
        )}

        {task.deadline && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color={styles._colors.textSecondary} />
            <Text style={styles.metaText}>{new Date(task.deadline).toLocaleDateString()}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>{formatDate(task.created_at)}</Text>
        {task.agent_id && (
          <Text style={styles.footerText} numberOfLines={1}>Agent: {task.agent_id.substring(0, 8)}...</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => ({
  _colors: colors,
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.textSecondary,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.textPrimary,
    flex: 1,
  },
  stateBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  stateText: {
    ...typography.micro,
    textTransform: 'capitalize' as const,
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  priorityBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
  priorityText: {
    ...typography.micro,
    textTransform: 'capitalize' as const,
  },
  metaItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  footerText: {
    ...typography.micro,
    color: colors.textSecondary,
  },
});

export default TaskCard;
