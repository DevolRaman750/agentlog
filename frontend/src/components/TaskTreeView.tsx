import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles, spacing, radius, typography } from '../theme';
import { goGentAPI } from '../api/client';
import { Task, TaskState } from '../types';
import { getTaskStateColor, getTaskStateIcon, getPriorityColor } from './TaskCard';
import type { ThemeColors } from '../theme';

interface TaskTreeViewProps {
  rootTaskId: string;
  onTaskPress?: (task: Task) => void;
  initialExpandDepth?: number;
  compact?: boolean;
}

interface TreeNode {
  task: Task;
  children: TreeNode[];
  expanded: boolean;
}

const buildTree = (tasks: Task[], rootId: string, expandDepth: number): TreeNode[] => {
  const taskMap = new Map<string, Task>();
  tasks.forEach(t => taskMap.set(t.id, t));

  const childrenOf = (parentId: string, depth: number): TreeNode[] => {
    return tasks
      .filter(t => t.parent_task_id === parentId)
      .map(t => ({
        task: t,
        children: childrenOf(t.id, depth + 1),
        expanded: depth < expandDepth,
      }));
  };

  const root = taskMap.get(rootId);
  if (!root) return [];

  return [{
    task: root,
    children: childrenOf(rootId, 0),
    expanded: true,
  }];
};

const TaskTreeNode: React.FC<{
  node: TreeNode;
  depth: number;
  onTaskPress?: (task: Task) => void;
  onToggle: (taskId: string) => void;
  compact?: boolean;
  colors: ThemeColors;
}> = ({ node, depth, onTaskPress, onToggle, compact, colors }) => {
  const styles = useThemedStyles(createStyles);
  const hasChildren = node.children.length > 0;
  const indent = depth * (compact ? 16 : 20);

  return (
    <View>
      <TouchableOpacity
        style={[styles.treeNode, { paddingLeft: indent + 8 }]}
        onPress={() => onTaskPress?.(node.task)}
        activeOpacity={0.7}
      >
        {hasChildren ? (
          <TouchableOpacity
            onPress={() => onToggle(node.task.id)}
            style={styles.chevron}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons
              name={node.expanded ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.chevronPlaceholder} />
        )}

        <Ionicons
          name={getTaskStateIcon(node.task.state)}
          size={16}
          color={getTaskStateColor(node.task.state, colors)}
        />

        <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(node.task.priority, colors) }]} />

        <Text style={[styles.nodeTitle, compact && styles.nodeTitleCompact]} numberOfLines={1}>
          {node.task.title}
        </Text>

        {(node.task.child_count || 0) > 0 && (
          <View style={styles.childBadge}>
            <Text style={styles.childBadgeText}>{node.task.child_count}</Text>
          </View>
        )}
      </TouchableOpacity>

      {node.expanded && node.children.map(child => (
        <TaskTreeNode
          key={child.task.id}
          node={child}
          depth={depth + 1}
          onTaskPress={onTaskPress}
          onToggle={onToggle}
          compact={compact}
          colors={colors}
        />
      ))}
    </View>
  );
};

const TaskTreeView: React.FC<TaskTreeViewProps> = ({
  rootTaskId,
  onTaskPress,
  initialExpandDepth = 2,
  compact = false,
}) => {
  const styles = useThemedStyles(createStyles);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSubtree();
  }, [rootTaskId]);

  const loadSubtree = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await goGentAPI.getTaskSubtree(rootTaskId);
      if (response.success && response.data?.tasks) {
        setTree(buildTree(response.data.tasks, rootTaskId, initialExpandDepth));
      } else {
        setError(response.error || 'Failed to load subtree');
      }
    } catch (err) {
      setError('Failed to load subtree');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleNode = (taskId: string) => {
    const toggle = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map(n => ({
        ...n,
        expanded: n.task.id === taskId ? !n.expanded : n.expanded,
        children: toggle(n.children),
      }));
    setTree(toggle(tree));
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={styles._colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {tree.map(node => (
        <TaskTreeNode
          key={node.task.id}
          node={node}
          depth={0}
          onTaskPress={onTaskPress}
          onToggle={toggleNode}
          compact={compact}
          colors={styles._colors}
        />
      ))}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  _colors: colors,
  container: {
    flex: 1,
  },
  centered: {
    padding: spacing.lg,
    alignItems: 'center' as const,
  },
  errorText: {
    ...typography.body,
    color: colors.statusError,
  },
  treeNode: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: spacing.sm,
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  chevron: {
    width: 20,
    height: 20,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  chevronPlaceholder: {
    width: 20,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
  },
  nodeTitle: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  nodeTitleCompact: {
    ...typography.label,
    fontWeight: '500' as const,
  },
  childBadge: {
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.md,
  },
  childBadgeText: {
    ...typography.micro,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
});

export default TaskTreeView;
