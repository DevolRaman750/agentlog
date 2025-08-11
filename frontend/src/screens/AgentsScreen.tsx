import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { goGentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AlertAPI } from '../components/CustomAlert';
import LoadingScreen from '../components/LoadingScreen';
import CreateAgentForm from '../components/CreateAgentForm';
import AgentDetailView from '../components/AgentDetailView';
import EditAgentForm from '../components/EditAgentForm';
import AgentBusinessCard from '../components/AgentBusinessCard';
import TeamCard from '../components/TeamCard';
import AssignTeamModal from '../components/AssignTeamModal';
import CreateTeamForm from '../components/CreateTeamForm';
import { TeamMemoryViewer } from '../components/TeamMemoryViewer';
import { Agent, AgentFormData, LifecycleStatus, ExecutionTemplate, Team, TeamWithAgents } from '../types';
import { useResponsive } from '../context/ResponsiveContext';
import ScreenContainer from '../components/ScreenContainer';


const AgentsScreen: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { setReExecutionData } = useApp();
  const { screenWidth, isSidebarLayout } = useResponsive();
  const navigation = useNavigation<any>();
  const route = navigation.getState()?.routes?.[navigation.getState()?.index || 0];
  const [agents, setAgents] = useState<Agent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamGroups, setTeamGroups] = useState<TeamWithAgents[]>([]);
  const [unassignedAgents, setUnassignedAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showAssignTeamModal, setShowAssignTeamModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTeamMemoryModal, setShowTeamMemoryModal] = useState(false);
  const [prefilledAgentData, setPrefilledAgentData] = useState<any>(null);

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading agents..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <ScreenContainer>
        <View style={styles.centeredContainer}>
          <Text style={styles.messageText}>Please login to view your agents.</Text>
        </View>
      </ScreenContainer>
    );
  }

  useFocusEffect(
    useCallback(() => {
      console.log('🔍 AgentsScreen useFocusEffect triggered');
      console.log('🔍 User:', !!user, user?.id);
      console.log('🔍 authLoading:', authLoading);
      
      // Check for prefilled agent data from marketplace
      if (route?.params?.prefilledAgent) {
        setPrefilledAgentData(route.params.prefilledAgent);
        setShowCreateModal(true);
        // Clear the params to prevent re-triggering
        navigation.setParams({ prefilledAgent: undefined });
      }
      
      if (user && !authLoading) {
        console.log('✅ Conditions met, calling loadAgents()');
        loadAgents();
      } else {
        console.log('❌ Conditions not met for loadAgents()');
        console.log('  - user:', !!user);
        console.log('  - !authLoading:', !authLoading);
      }
    }, [user?.id, authLoading, route?.params])
  );

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      console.log('🤖 Loading agents and teams...');
      console.log('🔍 User authenticated:', !!user);
      console.log('🔍 User ID:', user?.id);
      
      // Load both agents and teams concurrently
      const [agentsResponse, teamsResponse] = await Promise.all([
        goGentAPI.getAgents(),
        goGentAPI.getTeams()
      ]);
      
      console.log('📡 Agents Response:', agentsResponse);
      console.log('📡 Teams Response:', teamsResponse);
      
      if (agentsResponse.success && agentsResponse.data) {
        const agentsData = agentsResponse.data;
        setAgents(agentsData);
        console.log('✅ Loaded agents:', agentsData.length);

        if (teamsResponse.success && teamsResponse.data) {
          const teamsData = teamsResponse.data;
          setTeams(teamsData);
          console.log('✅ Loaded teams:', teamsData.length);

          // Group agents by teams
          const grouped: TeamWithAgents[] = [];
          const unassigned: Agent[] = [];

          // First, add agents with teams
          teamsData.forEach(team => {
            const teamAgents = agentsData.filter(agent => agent.teamId === team.id);
            if (teamAgents.length > 0) {
              grouped.push({ team, agents: teamAgents });
            }
          });

          // Then, collect unassigned agents
          agentsData.forEach(agent => {
            if (!agent.teamId) {
              unassigned.push(agent);
            }
          });

          setTeamGroups(grouped);
          setUnassignedAgents(unassigned);
          console.log('✅ Grouped data:', { teams: grouped.length, unassigned: unassigned.length });
        } else {
          // If teams failed to load, treat all agents as unassigned
          setTeams([]);
          setTeamGroups([]);
          setUnassignedAgents(agentsData);
          console.log('⚠️ Teams failed to load, showing all agents as unassigned');
        }
      } else {
        console.error('❌ Failed to load agents:', agentsResponse.error);
        AlertAPI.alert('Error', agentsResponse.error || 'Failed to load agents');
      }
    } catch (error) {
      console.error('💥 Error loading data:', error);
      AlertAPI.alert('Error', 'Failed to load agents and teams: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAgents();
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

  const handleNavigateToTemplate = (templateId: string) => {
    // Navigate to template edit/detail page
    navigation.navigate('Execution Templates', { 
      templateId,
      editMode: true 
    });
  };

  const handleNavigateToExecution = (executionId: string) => {
    // Navigate to history screen with the specific execution
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
                loadAgents(); // Refresh the list
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

  const formatTokenUsage = (used: number, max: number): string => {
    const percentage = max > 0 ? Math.round((used / max) * 100) : 0;
    return `${used.toLocaleString()} / ${max.toLocaleString()} (${percentage}%)`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Never';
    }
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
        loadAgents(); // Refresh the list
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

      // Use default configuration or first available
      const configurations = configResponse.data || [];
      const defaultConfig = configurations.find(c => c.variationName === 'Software Engineer') || configurations[0];
      
      if (!defaultConfig) {
        AlertAPI.alert('Error', 'No configurations available');
        return;
      }

      // Prepare execution data for the Execute screen
      const agentExecutionData = {
        executionRunName: `Execute Agent: ${agent.firstName} ${agent.lastName}`,
        description: `Agent execution for ${agent.firstName} ${agent.lastName} using template: ${template.name || 'Unknown Template'}`,
        basePrompt: template.templatePrompt || template.prompt || '',
        context: template.contextTemplate || template.context || '',
        configurations: [defaultConfig],
        enableFunctionCalling: template.enableFunctionCalling || false,
        functionTools: [], // Will be loaded by Execute screen
        isTemplateExecution: true, // Mark as template execution for read-only prompt
        isAgentExecution: true,
        agentId: agent.id,
        templateId: agent.templateId,
        templateParameters: template.parameters || [] // Include template parameters
      };

      console.log('🤖 Navigating to Execute screen with agent data:', {
        agentName: `${agent.firstName} ${agent.lastName}`,
        templateId: agent.templateId,
        templateName: template.name,
        parametersCount: template.parameters?.length || 0,
        templatePrompt: template.templatePrompt ? template.templatePrompt.substring(0, 100) + '...' : 'EMPTY',
        fallbackPrompt: template.prompt ? template.prompt.substring(0, 100) + '...' : 'EMPTY',
        finalBasePrompt: agentExecutionData.basePrompt ? agentExecutionData.basePrompt.substring(0, 100) + '...' : 'EMPTY',
        isTemplateExecution: true
      });

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

  // Team handlers
  const handleAssignTeam = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAssignTeamModal(true);
  };

  const handleTeamCreated = () => {
    setShowCreateTeamModal(false);
    loadAgents(); // Refresh to get updated teams and agents
  };

  const handleTeamAssigned = () => {
    setShowAssignTeamModal(false);
    setSelectedAgent(null);
    loadAgents(); // Refresh to get updated grouping
  };

  const handleTeamMemoryPress = (team: Team) => {
    setSelectedTeam(team);
    setShowTeamMemoryModal(true);
  };

  const handleTeamMemoryClose = () => {
    setShowTeamMemoryModal(false);
    setSelectedTeam(null);
  };

  const renderAgentCard = ({ item: agent }: { item: Agent }) => (
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
      animated={true}
    />
  );

  // Create example agent for empty state
  const createExampleAgent = (): Agent => ({
    id: 'example-agent',
    userId: 'example-user',
    firstName: 'Alex',
    lastName: 'CodeBot',
    templateId: 'system-template-software-engineer',
    templateName: 'Software Engineer',
    maxTokensPerDay: 50000,
    heartbeatMinutes: 30,
    lifecycleStatus: 'STANDBY' as LifecycleStatus,
    tokensUsedToday: 12450,
    tokensResetDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    totalExecutions: 24,
    lastExecutionAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    memorySizeBytes: 0,
    status: 'STANDBY'
  });

  const renderTeamSection = ({ item: teamGroup }: { item: TeamWithAgents }) => (
    <View key={teamGroup.team.id} style={styles.teamSection}>
      <TeamCard
        team={teamGroup.team}
        agents={teamGroup.agents}
        onTeamUpdate={loadAgents}
        onMemoryPress={handleTeamMemoryPress}
      />
      <View style={styles.teamAgentsContainer}>
        {teamGroup.agents.map(agent => (
          <View key={agent.id} style={styles.teamAgentCard}>
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
              animated={true}
            />
            <TouchableOpacity
              style={styles.assignTeamButton}
              onPress={() => handleAssignTeam(agent)}
            >
              <Ionicons name="people" size={16} color="#007AFF" />
              <Text style={styles.assignTeamText}>Change Team</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );

  const renderUnassignedSection = () => {
    if (unassignedAgents.length === 0) return null;

    return (
      <View style={[styles.unassignedSection, isCompact && styles.unassignedSectionCompact]}>
        <View style={[styles.sectionHeader, isCompact && styles.sectionHeaderCompact]}>
          <Text style={[styles.sectionTitle, isCompact && styles.sectionTitleCompact]}>Unassigned Agents</Text>
          <TouchableOpacity
            style={[styles.createTeamButton, isCompact && styles.createTeamButtonCompact]}
            onPress={() => setShowCreateTeamModal(true)}
          >
            <Ionicons name="add" size={isCompact ? 14 : 16} color="#007AFF" />
            <Text style={[styles.createTeamButtonText, isCompact && styles.createTeamButtonTextCompact]}>Create Team</Text>
          </TouchableOpacity>
        </View>
        {unassignedAgents.map(agent => (
          <View key={agent.id} style={styles.unassignedAgentCard}>
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
              animated={true}
            />
            <TouchableOpacity
              style={styles.assignTeamButton}
              onPress={() => handleAssignTeam(agent)}
            >
              <Ionicons name="people" size={16} color="#007AFF" />
              <Text style={styles.assignTeamText}>Assign Team</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const renderEmptyState = () => {
    const exampleAgent = createExampleAgent();
    
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>✨ Start Your Agent Journey</Text>
        <Text style={styles.emptyMessage}>
          Here's what your first agent could look like:
        </Text>
        
        <View style={styles.exampleCardContainer}>
          <AgentBusinessCard
            agent={exampleAgent}
            onPress={() => {
              AlertAPI.alert(
                '💡 Example Agent', 
                'This is just an example! Click "Create Agent" below to make your own.',
                [{ text: 'Got it!' }]
              );
            }}
            onEdit={() => setShowCreateModal(true)}
            onDelete={() => {
              AlertAPI.alert(
                '😄 Nice try!', 
                'This is just an example. You can\'t delete it, but you can create your own agent!',
                [{ text: 'Create Agent', onPress: () => setShowCreateModal(true) }]
              );
            }}
            onNavigateToTemplate={handleNavigateToTemplate}
            onToggleStatus={() => {
              AlertAPI.alert(
                '⚡ Example Only', 
                'This is a demo agent. Create your own to control real automation!',
                [{ text: 'Create Agent', onPress: () => setShowCreateModal(true) }]
              );
            }}
            onExecuteNow={() => {
              AlertAPI.alert(
                '🚀 Ready to Launch?', 
                'This example shows what execution would look like. Create your agent to start automating!',
                [{ text: 'Create Agent', onPress: () => setShowCreateModal(true) }]
              );
            }}
            animated={true}
          />
          
          <View style={styles.exampleBadge}>
            <Text style={styles.exampleBadgeText}>💫 EXAMPLE</Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createButtonText}>Create Your Agent</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return <LoadingScreen message="Loading agents..." />;
  }

  const isMobile = !isSidebarLayout;
  const isCompact = screenWidth < 480;

  return (
    <ScreenContainer>
      <View style={[styles.header, isCompact && styles.headerCompact]}>
        <Text style={[styles.title, isCompact && styles.titleCompact]}>My Agents</Text>
        <TouchableOpacity
          style={[styles.headerButton, isCompact && styles.headerButtonCompact]}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={isCompact ? 20 : 24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Show empty state if no agents */}
      {agents.length === 0 ? (
        <ScrollView 
          style={styles.emptyScrollContainer}
          contentContainerStyle={[styles.emptyScrollContent, isCompact && styles.emptyScrollContentCompact]}
          showsVerticalScrollIndicator={false}
        >
          {renderEmptyState()}
        </ScrollView>
      ) : (
        <FlatList
          data={[
            ...teamGroups,
            { type: 'unassigned' } // Marker for unassigned section
          ]}
          renderItem={({ item }) => {
            if ('type' in item && item.type === 'unassigned') {
              return renderUnassignedSection();
            }
            return renderTeamSection({ item: item as TeamWithAgents });
          }}
          keyExtractor={(item) => {
            if ('type' in item) return 'unassigned';
            return (item as TeamWithAgents).team.id;
          }}
          contentContainerStyle={[styles.listContainer, isMobile && styles.listContainerMobile, isCompact && styles.listContainerCompact]}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Create Agent Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <CreateAgentForm
          onSuccess={() => {
            setShowCreateModal(false);
            setPrefilledAgentData(null);
            loadAgents(); // Refresh the agents list
          }}
          onCancel={() => {
            setShowCreateModal(false);
            setPrefilledAgentData(null);
          }}
          prefilledData={prefilledAgentData}
        />
      </Modal>

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
              loadAgents(); // Refresh agents list if needed
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
              loadAgents(); // Refresh the agents list
            }}
            onCancel={() => {
              setShowEditModal(false);
              setSelectedAgent(null);
            }}
          />
        )}
      </Modal>

      {/* Create Team Modal */}
      <CreateTeamForm
        visible={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onTeamCreated={handleTeamCreated}
      />

      {/* Assign Team Modal */}
      {selectedAgent && (
        <AssignTeamModal
          visible={showAssignTeamModal}
          agent={selectedAgent}
          onClose={() => {
            setShowAssignTeamModal(false);
            setSelectedAgent(null);
          }}
          onAssigned={handleTeamAssigned}
        />
      )}

      {/* Team Memory Modal */}
      <Modal visible={showTeamMemoryModal} animationType="slide" presentationStyle="pageSheet">
        {selectedTeam && (
          <TeamMemoryViewer
            team={selectedTeam}
            onClose={handleTeamMemoryClose}
          />
        )}
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  headerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  titleCompact: {
    fontSize: 24,
  },
  headerButton: {
    padding: 8,
  },
  headerButtonCompact: {
    padding: 6,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Extra space for tab bar on mobile
  },
  listContainerMobile: {
    paddingHorizontal: 12,
    paddingBottom: 120, // Extra space for mobile tab bar
  },
  listContainerCompact: {
    paddingHorizontal: 8,
    paddingBottom: 120,
  },
  emptyScrollContainer: {
    flex: 1,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    minHeight: '100%',
  },
  emptyScrollContentCompact: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
    paddingHorizontal: 10,
    maxWidth: 350,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  messageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  exampleCardContainer: {
    position: 'relative',
    marginVertical: 20,
    width: '100%',
    maxWidth: 400,
  },
  exampleBadge: {
    position: 'absolute',
    top: -8,
    right: 12,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  exampleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Team styles
  teamSection: {
    marginBottom: 20,
  },
  teamAgentsContainer: {
    marginTop: 8,
  },
  teamAgentCard: {
    marginBottom: 12,
  },
  assignTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  assignTeamText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  unassignedSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  unassignedSectionCompact: {
    padding: 12,
    margin: 8,
    marginTop: 0,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderCompact: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  sectionTitleCompact: {
    fontSize: 16,
  },
  createTeamButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  createTeamButtonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  createTeamButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  createTeamButtonTextCompact: {
    fontSize: 12,
    marginLeft: 2,
  },
  unassignedAgentCard: {
    marginBottom: 12,
  },
});

export default AgentsScreen; 