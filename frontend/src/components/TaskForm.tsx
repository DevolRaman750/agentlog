import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../theme';
import { goGentAPI } from '../api/client';
import { Task, TaskCreateRequest, TaskUpdateRequest } from '../types';
import { getPriorityColor } from './TaskCard';
import type { ThemeColors } from '../theme';
import { spacing, radius, typography } from '../theme';

interface TaskFormProps {
  onSuccess: (task: Task) => void;
  onCancel: () => void;
  existingTask?: Task;
  parentTaskId?: string;
  teamId?: string;
  agentId?: string;
}

const PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;

const TaskForm: React.FC<TaskFormProps> = ({
  onSuccess,
  onCancel,
  existingTask,
  parentTaskId,
  teamId,
  agentId,
}) => {
  const styles = useThemedStyles(createStyles);
  const isEditMode = !!existingTask;

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [priority, setPriority] = useState(existingTask?.priority || 'medium');
  const [estimatedDuration, setEstimatedDuration] = useState(existingTask?.estimated_duration || '');
  const [deadline, setDeadline] = useState(existingTask?.deadline ? existingTask.deadline.split('T')[0] : '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode) {
        const updateData: TaskUpdateRequest = {};
        if (title !== existingTask!.title) updateData.title = title;
        if (description !== (existingTask!.description || '')) updateData.description = description;
        if (priority !== existingTask!.priority) updateData.priority = priority;
        if (estimatedDuration !== (existingTask!.estimated_duration || '')) updateData.estimated_duration = estimatedDuration;
        if (deadline) updateData.deadline = new Date(deadline).toISOString() as any;

        const response = await goGentAPI.updateTask(existingTask!.id, updateData);
        if (response.success && response.data?.task) {
          onSuccess(response.data.task);
        } else {
          setError(response.error || 'Failed to update task');
        }
      } else {
        const createData: TaskCreateRequest = {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          parent_task_id: parentTaskId,
          estimated_duration: estimatedDuration || undefined,
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
        };

        const response = await goGentAPI.createTask(createData, agentId, teamId);
        if (response.success && response.data?.task) {
          onSuccess(response.data.task);
        } else {
          setError(response.error || 'Failed to create task');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Task' : parentTaskId ? 'Create Subtask' : 'Create Task'}
        </Text>
        <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={styles._colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={16} color={styles._colors.statusError} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.field}>
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter task title"
          placeholderTextColor={styles._colors.textSecondary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Describe the task..."
          placeholderTextColor={styles._colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Priority</Text>
        <View style={styles.priorityRow}>
          {PRIORITIES.map(p => (
            <TouchableOpacity
              key={p}
              style={[
                styles.priorityButton,
                priority === p && { backgroundColor: getPriorityColor(p, styles._colors) + '20', borderColor: getPriorityColor(p, styles._colors) },
              ]}
              onPress={() => setPriority(p)}
            >
              <Text style={[
                styles.priorityButtonText,
                priority === p && { color: getPriorityColor(p, styles._colors) },
              ]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Estimated Duration</Text>
        <TextInput
          style={styles.input}
          value={estimatedDuration}
          onChangeText={setEstimatedDuration}
          placeholder="e.g. 2h, 1d, 30m"
          placeholderTextColor={styles._colors.textSecondary}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Deadline</Text>
        <TextInput
          style={styles.input}
          value={deadline}
          onChangeText={setDeadline}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={styles._colors.textSecondary}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator size="small" color={styles._colors.textInverse} />
        ) : (
          <>
            <Ionicons name={isEditMode ? 'checkmark' : 'add'} size={20} color={styles._colors.textInverse} />
            <Text style={styles.submitButtonText}>
              {isEditMode ? 'Save Changes' : 'Create Task'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (colors: ThemeColors) => ({
  _colors: colors,
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.xl,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
  },
  errorBanner: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: `${colors.statusError}15`,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.body,
    color: colors.statusError,
    flex: 1,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.lg,
    padding: spacing.md,
    ...typography.body,
    color: colors.textPrimary,
    backgroundColor: colors.bgCard,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top' as const,
  },
  priorityRow: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center' as const,
    backgroundColor: colors.bgCard,
  },
  priorityButtonText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  submitButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    ...typography.title,
    color: colors.textInverse,
  },
});

export default TaskForm;
