import React, { useState, useEffect, useCallback } from 'react';
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
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useThemedStyles } from '../theme';
import { goGentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AlertAPI } from '../components/CustomAlert';
import LoadingScreen from '../components/LoadingScreen';
import AgentDetailView from '../components/AgentDetailView';
import EditAgentForm from '../components/EditAgentForm';
import AgentBusinessCard from '../components/AgentBusinessCard';
import TeamCard from '../components/TeamCard';
import { TeamMemoryViewer } from '../components/TeamMemoryViewer';
import { AgentMemoryViewer } from '../components/AgentMemoryViewer';
import { Agent, Team, LifecycleStatus, Task } from '../types';
import { useResponsive } from '../context/ResponsiveContext';
import ScreenContainer from '../components/ScreenContainer';
import TaskCard from '../components/TaskCard';
import TaskDetailView from '../components/TaskDetailView';
import TaskForm from '../components/TaskForm';

interface RouteParams {
  teamId: string;
  teamName?: string;
}

const TeamDetailScreen: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { setReExecutionData } = useApp();
  const { screenWidth, isSidebarLayout } = useResponsive();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;
  
  const [team, setTeam] = useState<Team | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTeamMemoryModal, setShowTeamMemoryModal] = useState(false);
  const [showAgentMemoryModal, setShowAgentMemoryModal] = useState(false);
  const [teamTasks, setTeamTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [showTaskDetailModal, setShowTaskDetailModal] = useState(false);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);

  const styles = useTeamDetailStyles();

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading team..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.centeredContainer}>
          <Text style={styles.messageText}>Please login to view teams.</Text>
        </View>
      </ScreenContainer>
    );
  }

  useFocusEffect(
    useCallback(() => {
      if (user && !authLoading && params?.teamId) {
        loadTeamData();
      }
    }, [user?.id, authLoading, params?.teamId])
  );

  const loadTeamData = async () => {
    try {
      setIsLoading(true);
      console.log('🏗️ Loading team data for teamId:', params.teamId);
      
      // Load team details and agents concurrently
      const [teamResponse, agentsResponse] = await Promise.all([
        goGentAPI.getTeam(params.teamId),
        goGentAPI.getAgents()
      ]);
      
      if (teamResponse.success && teamResponse.data) {
        setTeam(teamResponse.data);
        console.log('✅ Loaded team:', teamResponse.data.name);
      } else {
        console.error('❌ Failed to load team:', teamResponse.error);
        AlertAPI.alert('Error', teamResponse.error || 'Failed to load team');
        navigation.goBack();
        return;
      }

      if (agentsResponse.success && agentsResponse.data) {
        // Filter agents that belong to this team
        const teamAgents = agentsResponse.data.filter(agent => agent.teamId === params.teamId);
        setAgents(teamAgents);
        console.log('✅ Loaded team agents:', teamAgents.length);
      } else {
        console.error('❌ Failed to load agents:', agentsResponse.error);
        setAgents([]);
      }

      // Load team tasks
      loadTeamTasks();
    } catch (error) {
      console.error('💥 Error loading team data:', error);
      AlertAPI.alert('Error', 'Failed to load team data: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTeamTasks = async () => {
    try {
      setIsLoadingTasks(true);
      const response = await goGentAPI.getTasks({ team_id: params.teamId, limit: 20 });
      if (response.success && response.data?.tasks) {
        setTeamTasks(response.data.tasks);
      } else {
        setTeamTasks([]);
      }
    } catch (err) {
      console.error('Error loading team tasks:', err);
      setTeamTasks([]);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadTeamData();
    setIsRefreshing(false);
  };

  const handleNavigateToTemplate = (templateId: string) => {
    navigation.navigate('Execution Templates', { 
      templateId,
      editMode: true 
    });
  };

  const handleNavigateToExecution = (executionId: string) => {
    navigation.navigate('History', {
      executionId,
      openExecutionDetails: true
    });
  };

  const handleDeleteAgent = async (agent: Agent) => {
    AlertAPI.alert(
      'Delete Agent',
      `Are you sure you want to delete "${agent.firstName} ${agent.lastName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await goGentAPI.deleteAgent(agent.id);
              if (response.success) {
                AlertAPI.alert('Success', 'Agent deleted successfully');
                loadTeamData(); // Refresh the list
              } else {
                AlertAPI.alert('Error', response.error || 'Failed to delete agent');
              }
            } catch (error) {
              console.error('Error deleting agent:', error);
              AlertAPI.alert('Error', 'Failed to delete agent');
            }
          },
        },
      ]
    );
  };

  const handleToggleAgentStatus = async (agent: Agent) => {
    try {
      setIsLoading(true);
      const newStatus = agent.lifecycleStatus === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
      
      const response = await goGentAPI.updateAgent(agent.id, {
        ...agent,
        lifecycleStatus: newStatus
      });
      
      if (response.success) {
        AlertAPI.alert('Success', `Agent ${newStatus.toLowerCase()} successfully`);
        loadTeamData(); // Refresh the list
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to update agent status');
      }
    } catch (error) {
      console.error('Error updating agent status:', error);
      AlertAPI.alert('Error', 'Failed to update agent status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteAgentNow = async (agent: Agent) => {
    try {
      setIsLoading(true);
      
      // Get the template details to prepare execution data
      const templateResponse = await goGentAPI.getTemplates();
      if (!templateResponse.success || !templateResponse.data?.templates) {
        AlertAPI.alert('Error', 'Failed to load template data');
        return;
      }
      
      const template = templateResponse.data.templates.find(t => t.id === agent.templateId);
      if (!template) {
        AlertAPI.alert('Error', 'Template not found');
        return;
      }

      // Get configurations for the execution  
      const configResponse = await goGentAPI.getConfigurations();
      if (!configResponse.success) {
        AlertAPI.alert('Error', 'Failed to load configurations');
        return;
      }

      // Get configurations and find template's preferred configuration
      const configurations = configResponse.data || [];
      
      if (configurations.length === 0) {
        AlertAPI.alert('Error', 'No configurations available');
        return;
      }

      // Use template's preferred configuration if available, otherwise fallback to first available
      let selectedConfig = configurations[0]; // Default fallback
      
      if (template.preferredConfigurationId) {
        const preferredConfig = configurations.find(c => c.id === template.preferredConfigurationId);
        if (preferredConfig) {
          selectedConfig = preferredConfig;
        }
      }

      // Prepare execution data for the Execute screen
      const agentExecutionData = {
        executionRunName: `Execute Agent: ${agent.firstName} ${agent.lastName}`,
        description: `Agent execution for ${agent.firstName} ${agent.lastName} using template: ${template.name || 'Unknown Template'}`,
        basePrompt: template.templatePrompt || template.prompt || '',
        context: template.contextTemplate || template.context || '',
        configurations: [selectedConfig],
        enableFunctionCalling: template.enableFunctionCalling || false,
        functionTools: [], // Will be loaded by Execute screen
        isTemplateExecution: true, // Mark as template execution for read-only prompt
        isAgentExecution: true,
        agentId: agent.id,
        templateId: agent.templateId,
        templateParameters: template.parameters || [] // Include template parameters
      };

      // Set the execution data and navigate to Execute screen
      setReExecutionData(agentExecutionData);
      navigation.navigate('Execute');
      
    } catch (error) {
      console.error('Error preparing agent execution:', error);
      AlertAPI.alert('Error', 'Failed to prepare agent execution');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentGoLive = async (agent: Agent) => {
    try {
      setIsLoading(true);
      const newStatus = agent.lifecycleStatus === 'ACTIVE' ? 'STANDBY' : 'ACTIVE';
      
      const response = await goGentAPI.updateAgent(agent.id, {
        ...agent,
        lifecycleStatus: newStatus
      });
      
      if (response.success) {
        const actionText = newStatus === 'ACTIVE' ? 'live' : 'standby';
        AlertAPI.alert('Success', `Agent is now ${actionText}`);
        loadTeamData(); // Refresh the list
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to update agent status');
      }
    } catch (error) {
      console.error('Error updating agent live status:', error);
      AlertAPI.alert('Error', 'Failed to update agent status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamMemoryPress = () => {
    if (team) {
      setShowTeamMemoryModal(true);
    }
  };

  const handleTeamMemoryClose = () => {
    setShowTeamMemoryModal(false);
  };

  const handleAgentMemoryPress = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentMemoryModal(true);
  };

  const handleAgentMemoryClose = () => {
    setShowAgentMemoryModal(false);
    setSelectedAgent(null);
  };

  const renderAgentCard = ({ item: agent }: { item: Agent }) => (
    <View style={styles.agentCard}>
      <AgentBusinessCard
        agent={agent}
        onPress={() => {
          setSelectedAgent(agent);
          setShowDetailModal(true);
        }}
        onEdit={() => {
          setSelectedAgent(agent);
          setShowEditModal(true);
        }}
        onDelete={() => handleDeleteAgent(agent)}
        onNavigateToTemplate={handleNavigateToTemplate}
        onToggleStatus={() => handleToggleAgentStatus(agent)}
        onExecuteNow={() => handleExecuteAgentNow(agent)}
        onGoLive={() => handleAgentGoLive(agent)}
        onViewMemory={() => handleAgentMemoryPress(agent)}
        animated={true}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="people-outline" size={64} color={styles.emptyMessage.color} />
      <Text style={styles.emptyTitle}>No Agents in Team</Text>
      <Text style={styles.emptyMessage}>
        This team doesn't have any agents yet. Create agents from the main Agents screen and assign them to this team.
      </Text>
      <TouchableOpacity
        style={styles.goToAgentsButton}
        onPress={() => navigation.navigate('Agents')}
      >
        <Ionicons name="add" size={20} color={styles.goToAgentsButtonText.color} />
        <Text style={styles.goToAgentsButtonText}>Go to Agents</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return <LoadingScreen message="Loading team..." />;
  }

  if (!team) {
    return (
      <ScreenContainer>
        <View style={styles.centeredContainer}>
          <Text style={styles.messageText}>Team not found.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const isCompact = screenWidth < 480;

  return (
    <ScreenContainer>
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={styles.backButtonText.color} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={[styles.title, isCompact && styles.titleCompact]}>
              {team.name}
            </Text>
            <Text style={styles.subtitle}>
              {agents.length} agent{agents.length !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.teamMemoryButton}
          onPress={handleTeamMemoryPress}
        >
          <Ionicons name="library" size={20} color={styles.backButtonText.color} />
        </TouchableOpacity>
      </View>

      {/* Team Information Card */}
      <View style={styles.teamInfoSection}>
        <TeamCard
          team={team}
          agents={agents}
          onTeamUpdate={loadTeamData}
          onMemoryPress={handleTeamMemoryPress}
        />
      </View>

      {/* Team Tasks Section */}
      <View style={styles.teamTasksSection}>
        <View style={styles.teamTasksHeader}>
          <Text style={styles.teamTasksTitle}>Team Tasks</Text>
          <TouchableOpacity
            style={styles.teamTasksCreateButton}
            onPress={() => setShowCreateTaskModal(true)}
          >
            <Ionicons name="add" size={18} color={styles.backButtonText.color} />
            <Text style={styles.backButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
        {isLoadingTasks ? (
          <View style={styles.taskLoadingContainer}>
            <Text style={styles.messageText}>Loading tasks...</Text>
          </View>
        ) : teamTasks.length === 0 ? (
          <View style={styles.taskEmptyContainer}>
            <Ionicons name="clipboard-outline" size={32} color={styles.messageText.color} />
            <Text style={styles.messageText}>No team tasks yet</Text>
          </View>
        ) : (
          teamTasks.slice(0, 5).map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={(t) => {
                setSelectedTaskForDetail(t);
                setShowTaskDetailModal(true);
              }}
            />
          ))
        )}
      </View>

      {/* Agents List */}
      {agents.length === 0 ? (
        <ScrollView 
          style={styles.emptyScrollContainer}
          contentContainerStyle={styles.emptyScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          data={agents}
          renderItem={renderAgentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Agent Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" presentationStyle="pageSheet">
        {selectedAgent && (
          <AgentDetailView
            agent={selectedAgent}
            onEdit={() => {
              setShowDetailModal(false);
              setShowEditModal(true);
            }}
            onClose={() => {
              setShowDetailModal(false);
              setSelectedAgent(null);
            }}
            onDelete={() => {
              setShowDetailModal(false);
              handleDeleteAgent(selectedAgent);
            }}
            onRefresh={() => {
              loadTeamData(); // Refresh agents list if needed
            }}
            onNavigateToTemplate={(templateId) => {
              setShowDetailModal(false);
              setSelectedAgent(null);
              handleNavigateToTemplate(templateId);
            }}
            onNavigateToExecution={(executionId) => {
              setShowDetailModal(false);
              setSelectedAgent(null);
              handleNavigateToExecution(executionId);
            }}
          />
        )}
      </Modal>

      {/* Edit Agent Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        {selectedAgent && (
          <EditAgentForm
            agent={selectedAgent}
            onSuccess={() => {
              setShowEditModal(false);
              setSelectedAgent(null);
              loadTeamData(); // Refresh the agents list
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedAgent(null);
            }}
          />
        )}
      </Modal>

      {/* Team Memory Modal */}
      <Modal visible={showTeamMemoryModal} animationType="slide" presentationStyle="pageSheet">
        {team && (
          <TeamMemoryViewer
            team={team}
            onClose={handleTeamMemoryClose}
          />
        )}
      </Modal>

      {/* Agent Memory Modal */}
      <Modal visible={showAgentMemoryModal} animationType="slide" presentationStyle="pageSheet">
        {selectedAgent && (
          <AgentMemoryViewer
            agent={selectedAgent}
            onClose={handleAgentMemoryClose}
          />
        )}
      </Modal>

      {/* Task Detail Modal */}
      <Modal visible={showTaskDetailModal} animationType="slide" presentationStyle="pageSheet">
        {selectedTaskForDetail && (
          <TaskDetailView
            task={selectedTaskForDetail}
            onClose={() => { setShowTaskDetailModal(false); setSelectedTaskForDetail(null); }}
            onEdit={() => {}}
            onDelete={async () => {
              const response = await goGentAPI.deleteTask(selectedTaskForDetail.id);
              if (response.success) {
                setShowTaskDetailModal(false);
                setSelectedTaskForDetail(null);
                loadTeamTasks();
              }
            }}
            onRefresh={loadTeamTasks}
          />
        )}
      </Modal>

      {/* Create Task Modal */}
      <Modal visible={showCreateTaskModal} animationType="slide" presentationStyle="pageSheet">
        <TaskForm
          teamId={params.teamId}
          onSuccess={(task) => {
            setShowCreateTaskModal(false);
            loadTeamTasks();
          }}
          onCancel={() => setShowCreateTaskModal(false)}
        />
      </Modal>
    </ScreenContainer>
  );
};

const useTeamDetailStyles = () => useThemedStyles((colors) => ({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.bgApp,
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
  headerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
  },
  titleCompact: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  teamMemoryButton: {
    padding: 8,
    backgroundColor: colors.bgHover,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  teamInfoSection: {
    padding: 16,
    backgroundColor: colors.bgApp,
  },
  teamTasksSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: colors.bgApp,
  },
  teamTasksHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  teamTasksTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  teamTasksCreateButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.bgSurface,
    gap: 4,
  },
  taskLoadingContainer: {
    padding: 20,
    alignItems: 'center' as const,
  },
  taskEmptyContainer: {
    alignItems: 'center' as const,
    paddingVertical: 24,
    gap: 8,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  agentCard: {
    marginBottom: 16,
  },
  emptyScrollContainer: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.textTertiary,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
    maxWidth: 350,
  },
  goToAgentsButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  goToAgentsButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  messageText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.accent,
    marginTop: 16,
  },
}));

export default TeamDetailScreen;