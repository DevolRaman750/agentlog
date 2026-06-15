import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
import { goGentAPI } from '../api/client';
import { AlertAPI } from './CustomAlert';
import TaskCard, { getTaskStateColor, getTaskStateIcon, getPriorityColor, getPriorityIcon } from './TaskCard';
import TaskForm from './TaskForm';
import { Task, TaskState, VALID_TRANSITIONS } from '../types';
import type { ThemeColors } from '../theme';

interface TaskDetailViewProps {
  task: Task;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onRefresh?: () => void;
  onNavigateToTask?: (task: Task) => void;
}

const formatTimestamp = (ts?: string): string => {
  if (!ts) return '-';
  return new Date(ts).toLocaleString();
};

const getContextIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'github': return 'logo-github';
    case 'slack': return 'chatbubbles-outline';
    case 'jira': return 'ticket-outline';
    default: return 'extension-puzzle-outline';
  }
};

const TaskDetailView: React.FC<TaskDetailViewProps> = ({
  task,
  onClose,
  onEdit,
  onDelete,
  onRefresh,
  onNavigateToTask,
}) => {
  const styles = useThemedStyles(createStyles);
  const [children, setChildren] = useState<Task[]>([]);
  const [blockers, setBlockers] = useState<Task[]>([]);
  const [ancestors, setAncestors] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showCreateSubtaskModal, setShowCreateSubtaskModal] = useState(false);

  useEffect(() => {
    loadRelatedData();
  }, [task.id]);

  const loadRelatedData = async () => {
    try {
      setIsLoading(true);
      const [childrenRes, blockersRes, ancestorsRes] = await Promise.all([
        goGentAPI.getTaskChildren(task.id),
        goGentAPI.getTaskBlockers(task.id),
        task.parent_task_id ? goGentAPI.getTaskAncestors(task.id) : Promise.resolve({ success: true, data: { tasks: [] } }),
      ]);

      if (childrenRes.success && childrenRes.data?.tasks) setChildren(childrenRes.data.tasks);
      if (blockersRes.success && blockersRes.data?.tasks) setBlockers(blockersRes.data.tasks);
      if (ancestorsRes.success && (ancestorsRes.data as any)?.tasks) setAncestors((ancestorsRes.data as any).tasks);
    } catch (err) {
      console.error('Error loading related task data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadRelatedData();
    onRefresh?.();
    setIsRefreshing(false);
  };

  const handleTransition = async (targetState: TaskState) => {
    setIsTransitioning(true);
    try {
      const response = await goGentAPI.transitionTask(task.id, {
        task_id: task.id,
        target_state: targetState,
      });
      if (response.success) {
        onRefresh?.();
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to transition task');
      }
    } catch (err) {
      AlertAPI.alert('Error', 'Failed to transition task');
    } finally {
      setIsTransitioning(false);
    }
  };

  const handleDelete = () => {
    AlertAPI.alert(
      'Delete Task',
      `Are you sure you want to delete "${task.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const handleRemoveContext = async (index: number) => {
    const response = await goGentAPI.removeTaskContext(task.id, index);
    if (response.success) {
      onRefresh?.();
    } else {
      AlertAPI.alert('Error', response.error || 'Failed to remove context');
    }
  };

  const validNextStates = VALID_TRANSITIONS[task.state] || [];

  const getTransitionButtonColor = (state: TaskState): string => {
    return getTaskStateColor(state, styles._colors);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Ionicons name="close" size={24} color={styles._colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={2}>{task.title}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onEdit} style={styles.headerButton}>
            <Ionicons name="pencil-outline" size={20} color={styles._colors.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
            <Ionicons name="trash-outline" size={20} color={styles._colors.statusError} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* State & Transitions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>State</Text>
          <View style={styles.stateRow}>
            <View style={[styles.currentStateBadge, { backgroundColor: getTaskStateColor(task.state, styles._colors) + '20' }]}>
              <Ionicons name={getTaskStateIcon(task.state)} size={18} color={getTaskStateColor(task.state, styles._colors)} />
              <Text style={[styles.currentStateText, { color: getTaskStateColor(task.state, styles._colors) }]}>
                {task.state.replace('_', ' ')}
              </Text>
            </View>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(task.priority, styles._colors) + '15' }]}>
              <Ionicons name={getPriorityIcon(task.priority)} size={16} color={getPriorityColor(task.priority, styles._colors)} />
              <Text style={[styles.priorityText, { color: getPriorityColor(task.priority, styles._colors) }]}>
                {task.priority}
              </Text>
            </View>
          </View>

          {validNextStates.length > 0 && (
            <View style={styles.transitionRow}>
              {isTransitioning ? (
                <ActivityIndicator size="small" color={styles._colors.accent} />
              ) : (
                validNextStates.map(state => (
                  <TouchableOpacity
                    key={state}
                    style={[styles.transitionButton, { borderColor: getTransitionButtonColor(state) }]}
                    onPress={() => handleTransition(state)}
                  >
                    <Ionicons name={getTaskStateIcon(state)} size={14} color={getTransitionButtonColor(state)} />
                    <Text style={[styles.transitionButtonText, { color: getTransitionButtonColor(state) }]}>
                      {state.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </View>
          )}
        </View>

        {/* Breadcrumb (ancestors) */}
        {ancestors.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Path</Text>
            <View style={styles.breadcrumb}>
              {ancestors.map((a, i) => (
                <View key={a.id} style={styles.breadcrumbItem}>
                  {i > 0 && <Ionicons name="chevron-forward" size={14} color={styles._colors.textSecondary} />}
                  <TouchableOpacity onPress={() => onNavigateToTask?.(a)}>
                    <Text style={styles.breadcrumbText}>{a.title}</Text>
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.breadcrumbItem}>
                {ancestors.length > 0 && <Ionicons name="chevron-forward" size={14} color={styles._colors.textSecondary} />}
                <Text style={styles.breadcrumbCurrent}>{task.title}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Task Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>

          {task.description ? (
            <Text style={styles.descriptionText}>{task.description}</Text>
          ) : (
            <Text style={styles.emptyText}>No description</Text>
          )}

          <View style={styles.infoGrid}>
            {task.deadline && (
              <View style={styles.infoItem}>
                <Ionicons name="calendar-outline" size={16} color={styles._colors.textSecondary} />
                <Text style={styles.infoLabel}>Deadline</Text>
                <Text style={styles.infoValue}>{new Date(task.deadline).toLocaleDateString()}</Text>
              </View>
            )}
            {task.estimated_duration && (
              <View style={styles.infoItem}>
                <Ionicons name="time-outline" size={16} color={styles._colors.textSecondary} />
                <Text style={styles.infoLabel}>Estimated</Text>
                <Text style={styles.infoValue}>{task.estimated_duration}</Text>
              </View>
            )}
            {task.actual_duration && (
              <View style={styles.infoItem}>
                <Ionicons name="timer-outline" size={16} color={styles._colors.textSecondary} />
                <Text style={styles.infoLabel}>Actual</Text>
                <Text style={styles.infoValue}>{task.actual_duration}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={styles._colors.textSecondary} />
              <Text style={styles.infoLabel}>Created</Text>
              <Text style={styles.infoValue}>{formatTimestamp(task.created_at)}</Text>
            </View>
            {task.started_at && (
              <View style={styles.infoItem}>
                <Ionicons name="play-outline" size={16} color={styles._colors.textSecondary} />
                <Text style={styles.infoLabel}>Started</Text>
                <Text style={styles.infoValue}>{formatTimestamp(task.started_at)}</Text>
              </View>
            )}
            {task.completed_at && (
              <View style={styles.infoItem}>
                <Ionicons name="checkmark-outline" size={16} color={styles._colors.textSecondary} />
                <Text style={styles.infoLabel}>Completed</Text>
                <Text style={styles.infoValue}>{formatTimestamp(task.completed_at)}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Failure Info */}
        {task.failure_type && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: styles._colors.statusError }]}>Failure Info</Text>
            <View style={styles.failureBanner}>
              <Text style={styles.failureType}>{task.failure_type}</Text>
              {task.failure_reason ? (
                <Text style={styles.failureReason}>{task.failure_reason}</Text>
              ) : null}
              <Text style={styles.failureRetry}>Retry count: {task.retry_count}</Text>
            </View>
          </View>
        )}

        {/* Context Sources */}
        {(task.context_sources?.length || 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Context Sources</Text>
            {task.context_sources!.map((source, i) => (
              <View key={i} style={styles.contextItem}>
                <Ionicons name={getContextIcon(source.type)} size={18} color={styles._colors.accent} />
                <View style={styles.contextInfo}>
                  <Text style={styles.contextType}>{source.type}</Text>
                  <Text style={styles.contextData} numberOfLines={1}>
                    {JSON.stringify(source.data).substring(0, 60)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveContext(i)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close-circle-outline" size={20} color={styles._colors.statusError} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Dependencies / Blockers */}
        {blockers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blockers ({blockers.length})</Text>
            {blockers.map(blocker => (
              <TouchableOpacity
                key={blocker.id}
                style={styles.miniCard}
                onPress={() => onNavigateToTask?.(blocker)}
              >
                <Ionicons name={getTaskStateIcon(blocker.state)} size={16} color={getTaskStateColor(blocker.state, styles._colors)} />
                <Text style={styles.miniCardTitle} numberOfLines={1}>{blocker.title}</Text>
                <Text style={[styles.miniCardState, { color: getTaskStateColor(blocker.state, styles._colors) }]}>
                  {blocker.state.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Subtasks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Subtasks ({children.length})</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowCreateSubtaskModal(true)}
            >
              <Ionicons name="add" size={18} color={styles._colors.accent} />
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <ActivityIndicator size="small" color={styles._colors.accent} />
          ) : children.length === 0 ? (
            <Text style={styles.emptyText}>No subtasks</Text>
          ) : (
            children.map(child => (
              <TaskCard
                key={child.id}
                task={child}
                onPress={(t) => onNavigateToTask?.(t)}
              />
            ))
          )}
        </View>

        {/* Artifacts */}
        {(task.artifacts?.length || 0) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Artifacts</Text>
            {task.artifacts!.map((artifact, i) => (
              <View key={i} style={styles.artifactItem}>
                <Ionicons name="document-outline" size={16} color={styles._colors.accent} />
                <View style={styles.artifactInfo}>
                  <Text style={styles.artifactType}>{artifact.type}</Text>
                  <Text style={styles.artifactId}>{artifact.identifier}</Text>
                  {artifact.url ? <Text style={styles.artifactUrl}>{artifact.url}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Results */}
        {task.results && Object.keys(task.results).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Results</Text>
            <View style={styles.jsonBlock}>
              <Text style={styles.jsonText}>{JSON.stringify(task.results, null, 2)}</Text>
            </View>
          </View>
        )}

        {/* Completion Notes */}
        {task.completion_notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completion Notes</Text>
            <Text style={styles.descriptionText}>{task.completion_notes}</Text>
          </View>
        )}

        {/* Task ID */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metadata</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Task ID</Text>
              <Text style={styles.infoValueMono}>{task.id}</Text>
            </View>
            {task.agent_id && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Agent ID</Text>
                <Text style={styles.infoValueMono}>{task.agent_id}</Text>
              </View>
            )}
            {task.team_id && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Team ID</Text>
                <Text style={styles.infoValueMono}>{task.team_id}</Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Depth</Text>
              <Text style={styles.infoValue}>{task.depth}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Create Subtask Modal */}
      <Modal visible={showCreateSubtaskModal} animationType="slide" presentationStyle="pageSheet">
        <TaskForm
          parentTaskId={task.id}
          teamId={task.team_id}
          agentId={task.agent_id}
          onSuccess={(newTask) => {
            setShowCreateSubtaskModal(false);
            setChildren(prev => [...prev, newTask]);
            onRefresh?.();
          }}
          onCancel={() => setShowCreateSubtaskModal(false)}
        />
      </Modal>
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  _colors: colors,
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  header: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgCard,
    gap: spacing.sm,
  },
  headerButton: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    ...typography.h2,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
  },
  headerActions: {
    flexDirection: 'row' as const,
    gap: spacing.xs,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  stateRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  currentStateBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    gap: spacing.sm,
  },
  currentStateText: {
    ...typography.label,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  priorityBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.lg,
    gap: spacing.xs,
  },
  priorityText: {
    ...typography.label,
    textTransform: 'capitalize' as const,
  },
  transitionRow: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.sm,
  },
  transitionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    backgroundColor: colors.bgCard,
    minHeight: touchTarget.min,
  },
  transitionButtonText: {
    ...typography.label,
    textTransform: 'capitalize' as const,
  },
  breadcrumb: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.xs,
  },
  breadcrumbItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.xs,
  },
  breadcrumbText: {
    ...typography.label,
    fontWeight: '400' as const,
    color: colors.accent,
  },
  breadcrumbCurrent: {
    ...typography.label,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  descriptionText: {
    ...typography.body,
    color: colors.textPrimary,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic' as const,
  },
  infoGrid: {
    gap: spacing.sm,
  },
  infoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    ...typography.label,
    fontWeight: '400' as const,
    color: colors.textSecondary,
    minWidth: 80,
  },
  infoValue: {
    ...typography.label,
    fontWeight: '400' as const,
    color: colors.textPrimary,
    flex: 1,
  },
  infoValueMono: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    flex: 1,
  },
  failureBanner: {
    backgroundColor: '#FEF2F2',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  failureType: {
    ...typography.bodyStrong,
    color: colors.statusError,
  },
  failureReason: {
    ...typography.label,
    fontWeight: '400' as const,
    color: '#B91C1C',
  },
  failureRetry: {
    ...typography.caption,
    color: '#DC2626',
  },
  contextItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  contextInfo: {
    flex: 1,
  },
  contextType: {
    ...typography.label,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textTransform: 'capitalize' as const,
  },
  contextData: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  miniCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
    minHeight: touchTarget.min,
  },
  miniCardTitle: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  miniCardState: {
    ...typography.caption,
    fontWeight: '500' as const,
    textTransform: 'capitalize' as const,
  },
  addButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSurface,
    gap: spacing.xs,
    minHeight: touchTarget.min,
  },
  addButtonText: {
    ...typography.label,
    color: colors.accent,
  },
  artifactItem: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: spacing.sm,
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  artifactInfo: {
    flex: 1,
  },
  artifactType: {
    ...typography.label,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textTransform: 'capitalize' as const,
  },
  artifactId: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  artifactUrl: {
    ...typography.caption,
    color: colors.accent,
    marginTop: 2,
  },
  jsonBlock: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  jsonText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontFamily: 'monospace',
  },
});

export default TaskDetailView;
