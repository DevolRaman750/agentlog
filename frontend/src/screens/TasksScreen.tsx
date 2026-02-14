import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { useThemedStyles } from '../theme';
import { goGentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AlertAPI } from '../components/CustomAlert';
import LoadingScreen from '../components/LoadingScreen';
import TaskCard, { getTaskStateColor, getPriorityColor } from '../components/TaskCard';
import TaskDetailView from '../components/TaskDetailView';
import TaskForm from '../components/TaskForm';
import { Task, TaskState, TaskListParams, Team, Agent, TabParamList } from '../types';
import { useResponsive } from '../context/ResponsiveContext';
import ScreenContainer from '../components/ScreenContainer';
import type { ThemeColors } from '../theme';

const ALL_STATES: TaskState[] = ['defining', 'compiling', 'compiled', 'in_progress', 'completed', 'failed'];
const ALL_PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const TasksScreen: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { screenWidth, isSidebarLayout } = useResponsive();
  const styles = useThemedStyles(createStyles);
  const route = useRoute<RouteProp<TabParamList, 'Tasks'>>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [filterStates, setFilterStates] = useState<TaskState[]>([]);
  const [filterPriority, setFilterPriority] = useState<string[]>([]);
  const [filterTeamId, setFilterTeamId] = useState<string | undefined>(undefined);
  const [filterAgentId, setFilterAgentId] = useState<string | undefined>(undefined);
  const [teams, setTeams] = useState<Team[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showTeamPicker, setShowTeamPicker] = useState(false);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  if (authLoading) {
    return <LoadingScreen message="Loading tasks..." />;
  }

  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.centeredContainer}>
          <Text style={styles.messageText}>Please login to view tasks.</Text>
        </View>
      </ScreenContainer>
    );
  }

  // Load teams and agents for filter dropdowns
  useEffect(() => {
    if (user) {
      loadFilterOptions();
    }
  }, [user?.id]);

  // Pre-populate filters from route params
  useEffect(() => {
    const params = route.params;
    if (params?.teamId) setFilterTeamId(params.teamId);
    if (params?.agentId) setFilterAgentId(params.agentId);
  }, [route.params?.teamId, route.params?.agentId]);

  useFocusEffect(
    useCallback(() => {
      if (user && !authLoading) {
        loadTasks();
      }
    }, [user?.id, authLoading, filterStates, filterPriority, filterTeamId, filterAgentId])
  );

  const loadFilterOptions = async () => {
    try {
      const [teamsRes, agentsRes] = await Promise.all([
        goGentAPI.getTeams(),
        goGentAPI.getAgents(),
      ]);
      if (teamsRes.success && teamsRes.data) setTeams(teamsRes.data);
      if (agentsRes.success && agentsRes.data) setAgents(agentsRes.data);
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  };

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const params: TaskListParams = { limit: 50 };
      if (filterStates.length > 0) params.states = filterStates;
      if (filterPriority.length > 0) params.priority = filterPriority;
      if (filterTeamId) params.team_id = filterTeamId;
      if (filterAgentId) params.agent_id = filterAgentId;

      const response = await goGentAPI.getTasks(params);
      if (response.success && response.data?.tasks) {
        setTasks(response.data.tasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTasks();
    setIsRefreshing(false);
  };

  const toggleStateFilter = (state: TaskState) => {
    setFilterStates(prev =>
      prev.includes(state) ? prev.filter(s => s !== state) : [...prev, state]
    );
  };

  const togglePriorityFilter = (priority: string) => {
    setFilterPriority(prev =>
      prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority]
    );
  };

  const clearFilters = () => {
    setFilterStates([]);
    setFilterPriority([]);
    setFilterTeamId(undefined);
    setFilterAgentId(undefined);
  };

  const hasFilters = filterStates.length > 0 || filterPriority.length > 0 || !!filterTeamId || !!filterAgentId;

  // Filter agents by selected team
  const filteredAgents = filterTeamId
    ? agents.filter(a => a.teamId === filterTeamId)
    : agents;

  const selectedTeamName = route.params?.teamName || teams.find(t => t.id === filterTeamId)?.name;
  const selectedAgentName = route.params?.agentName || agents.find(a => a.id === filterAgentId)?.firstName;

  const handleTaskPress = (task: Task) => {
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleTaskCreated = (task: Task) => {
    setShowCreateModal(false);
    loadTasks();
  };

  const handleTaskEdited = (task: Task) => {
    setShowEditModal(false);
    setSelectedTask(task);
    loadTasks();
  };

  const handleDeleteTask = async () => {
    if (!selectedTask) return;
    const response = await goGentAPI.deleteTask(selectedTask.id);
    if (response.success) {
      setShowDetailModal(false);
      setSelectedTask(null);
      loadTasks();
    } else {
      AlertAPI.alert('Error', response.error || 'Failed to delete task');
    }
  };

  const handleNavigateToTask = async (task: Task) => {
    // Refresh the task data before displaying
    const response = await goGentAPI.getTask(task.id);
    if (response.success && response.data?.task) {
      setSelectedTask(response.data.task);
    } else {
      setSelectedTask(task);
    }
    setShowDetailModal(true);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="clipboard-outline" size={64} color={styles._colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Tasks Yet</Text>
      <Text style={styles.emptySubtitle}>
        {hasFilters ? 'No tasks match the current filters.' : 'Create your first structured task to get started.'}
      </Text>
      {!hasFilters && (
        <TouchableOpacity style={styles.ctaButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={20} color={styles._colors.textInverse} />
          <Text style={styles.ctaButtonText}>Create Task</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tasks</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
          <Ionicons name="add" size={20} color={styles._colors.textInverse} />
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      {/* Team/Agent Filter Row */}
      <View style={styles.scopeFilterBar}>
        <TouchableOpacity
          style={[styles.scopeFilterButton, filterTeamId && styles.scopeFilterButtonActive]}
          onPress={() => setShowTeamPicker(!showTeamPicker)}
        >
          <Ionicons name="people-outline" size={14} color={filterTeamId ? styles._colors.accent : styles._colors.textSecondary} />
          <Text style={[styles.scopeFilterText, filterTeamId && styles.scopeFilterTextActive]} numberOfLines={1}>
            {filterTeamId ? (selectedTeamName || 'Team') : 'All Teams'}
          </Text>
          <Ionicons name="chevron-down" size={12} color={filterTeamId ? styles._colors.accent : styles._colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.scopeFilterButton, filterAgentId && styles.scopeFilterButtonActive]}
          onPress={() => setShowAgentPicker(!showAgentPicker)}
        >
          <Ionicons name="person-outline" size={14} color={filterAgentId ? styles._colors.accent : styles._colors.textSecondary} />
          <Text style={[styles.scopeFilterText, filterAgentId && styles.scopeFilterTextActive]} numberOfLines={1}>
            {filterAgentId ? (selectedAgentName || 'Agent') : 'All Agents'}
          </Text>
          <Ionicons name="chevron-down" size={12} color={filterAgentId ? styles._colors.accent : styles._colors.textSecondary} />
        </TouchableOpacity>

        {(filterTeamId || filterAgentId) && (
          <TouchableOpacity style={styles.clearScopeButton} onPress={() => { setFilterTeamId(undefined); setFilterAgentId(undefined); }}>
            <Ionicons name="close-circle" size={16} color={styles._colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Team Picker Dropdown */}
      {showTeamPicker && (
        <View style={styles.pickerDropdown}>
          <TouchableOpacity
            style={[styles.pickerOption, !filterTeamId && styles.pickerOptionActive]}
            onPress={() => { setFilterTeamId(undefined); setFilterAgentId(undefined); setShowTeamPicker(false); }}
          >
            <Text style={[styles.pickerOptionText, !filterTeamId && styles.pickerOptionTextActive]}>All Teams</Text>
          </TouchableOpacity>
          {teams.map(team => (
            <TouchableOpacity
              key={team.id}
              style={[styles.pickerOption, filterTeamId === team.id && styles.pickerOptionActive]}
              onPress={() => { setFilterTeamId(team.id); setFilterAgentId(undefined); setShowTeamPicker(false); }}
            >
              <Text style={[styles.pickerOptionText, filterTeamId === team.id && styles.pickerOptionTextActive]}>
                {team.name}
              </Text>
              <Text style={styles.pickerOptionSubtext}>{team.agentCount} agents</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Agent Picker Dropdown */}
      {showAgentPicker && (
        <View style={styles.pickerDropdown}>
          <TouchableOpacity
            style={[styles.pickerOption, !filterAgentId && styles.pickerOptionActive]}
            onPress={() => { setFilterAgentId(undefined); setShowAgentPicker(false); }}
          >
            <Text style={[styles.pickerOptionText, !filterAgentId && styles.pickerOptionTextActive]}>All Agents</Text>
          </TouchableOpacity>
          {filteredAgents.map(agent => (
            <TouchableOpacity
              key={agent.id}
              style={[styles.pickerOption, filterAgentId === agent.id && styles.pickerOptionActive]}
              onPress={() => { setFilterAgentId(agent.id); setShowAgentPicker(false); }}
            >
              <Text style={[styles.pickerOptionText, filterAgentId === agent.id && styles.pickerOptionTextActive]}>
                {agent.firstName} {agent.lastName}
              </Text>
              {agent.teamName && <Text style={styles.pickerOptionSubtext}>{agent.teamName}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          {ALL_STATES.map(state => (
            <TouchableOpacity
              key={state}
              style={[
                styles.filterChip,
                filterStates.includes(state) && {
                  backgroundColor: getTaskStateColor(state, styles._colors) + '20',
                  borderColor: getTaskStateColor(state, styles._colors),
                },
              ]}
              onPress={() => toggleStateFilter(state)}
            >
              <Text style={[
                styles.filterChipText,
                filterStates.includes(state) && { color: getTaskStateColor(state, styles._colors) },
              ]}>
                {state.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
          <View style={styles.filterDivider} />
          {ALL_PRIORITIES.map(priority => (
            <TouchableOpacity
              key={priority}
              style={[
                styles.filterChip,
                filterPriority.includes(priority) && {
                  backgroundColor: getPriorityColor(priority, styles._colors) + '20',
                  borderColor: getPriorityColor(priority, styles._colors),
                },
              ]}
              onPress={() => togglePriorityFilter(priority)}
            >
              <Text style={[
                styles.filterChipText,
                filterPriority.includes(priority) && { color: getPriorityColor(priority, styles._colors) },
              ]}>
                {priority}
              </Text>
            </TouchableOpacity>
          ))}
          {hasFilters && (
            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
              <Ionicons name="close-circle" size={16} color={styles._colors.textSecondary} />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Task List */}
      {isLoading && tasks.length === 0 ? (
        <LoadingScreen message="Loading tasks..." />
      ) : tasks.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={tasks}
          renderItem={({ item }) => (
            <TaskCard task={item} onPress={handleTaskPress} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Task Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <TaskForm
          onSuccess={handleTaskCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Task Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
        {selectedTask && (
          <TaskDetailView
            task={selectedTask}
            onClose={() => { setShowDetailModal(false); setSelectedTask(null); }}
            onEdit={() => { setShowDetailModal(false); setShowEditModal(true); }}
            onDelete={handleDeleteTask}
            onRefresh={() => { loadTasks(); }}
            onNavigateToTask={handleNavigateToTask}
          />
        )}
      </Modal>

      {/* Edit Task Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        {selectedTask && (
          <TaskForm
            existingTask={selectedTask}
            onSuccess={handleTaskEdited}
            onCancel={() => { setShowEditModal(false); setShowDetailModal(true); }}
          />
        )}
      </Modal>
    </ScreenContainer>
  );
};

const createStyles = (colors: ThemeColors) => ({
  _colors: colors,
  centeredContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.bgApp,
  },
  messageText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgCard,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
  },
  createButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  createButtonText: {
    color: colors.textInverse,
    fontSize: 14,
    fontWeight: '600' as const,
  },
  scopeFilterBar: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgCard,
  },
  scopeFilterButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
    gap: 6,
    maxWidth: 200,
  },
  scopeFilterButtonActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '10',
  },
  scopeFilterText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  scopeFilterTextActive: {
    color: colors.accent,
    fontWeight: '500' as const,
  },
  clearScopeButton: {
    padding: 4,
  },
  pickerDropdown: {
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    paddingVertical: 4,
    maxHeight: 240,
  },
  pickerOption: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pickerOptionActive: {
    backgroundColor: colors.accent + '10',
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  pickerOptionTextActive: {
    color: colors.accent,
    fontWeight: '600' as const,
  },
  pickerOptionSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterBar: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgCard,
  },
  filterRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.bgSurface,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: colors.textSecondary,
    textTransform: 'capitalize' as const,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.borderSubtle,
    marginHorizontal: 4,
  },
  clearButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  clearButtonText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  ctaButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

export default TasksScreen;
