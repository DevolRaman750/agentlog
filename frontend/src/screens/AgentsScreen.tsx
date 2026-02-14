import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
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
import CompactTeamRow from '../components/CompactTeamRow';
import CompactAgentRow from '../components/CompactAgentRow';
import AssignTeamModal from '../components/AssignTeamModal';
import CreateTeamForm from '../components/CreateTeamForm';
import { TeamMemoryViewer } from '../components/TeamMemoryViewer';
import { AgentMemoryViewer } from '../components/AgentMemoryViewer';
import SuccessTooltip from '../components/SuccessTooltip';
import { Agent, AgentFormData, LifecycleStatus, ExecutionTemplate, Team, TeamWithAgents } from '../types';
import { useResponsive } from '../context/ResponsiveContext';
import ScreenContainer from '../components/ScreenContainer';
import { generateTemplateAgents, generateDevelopmentSupportTeam, isTemplateAgent } from '../data/templateAgents';
import { useTheme, useThemedStyles } from '../theme';
import type { ThemeColors } from '../theme';


const AgentsScreen: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { setReExecutionData } = useApp();
  const { screenWidth, isSidebarLayout } = useResponsive();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
  const [showAgentMemoryModal, setShowAgentMemoryModal] = useState(false);
  const [prefilledAgentData, setPrefilledAgentData] = useState<any>(null);
  const [showSuccessTooltip, setShowSuccessTooltip] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'compact' | 'cards'>('compact');

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

          // Auto-expand teams with <= 2 agents
          const autoExpand = new Set<string>();
          grouped.forEach(g => {
            if (g.agents.length <= 2) autoExpand.add(g.team.id);
          });
          if (unassigned.length > 0) autoExpand.add('__unassigned__');
          setExpandedTeams(autoExpand);

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
      case 'ACTIVE': return colors.statusSuccess;
      case 'STANDBY': return colors.accentSecondary;
      case 'PAUSED': return colors.statusPaused;
      case 'KILLED': return colors.statusError;
      default: return colors.statusPaused;
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
          console.log('🎯 Using template preferred configuration for agent execution:', {
            agentName: `${agent.firstName} ${agent.lastName}`,
            templateName: template.name,
            configId: preferredConfig.id,
            configName: preferredConfig.variationName
          });
        } else {
          console.warn('⚠️ Template preferred configuration not found, using fallback:', {
            preferredConfigId: template.preferredConfigurationId,
            availableConfigs: configurations.map(c => ({id: c.id, name: c.variationName}))
          });
        }
      } else {
        console.log('ℹ️ Template has no preferred configuration, using first available:', selectedConfig.variationName);
      }

      // Load functions if template has function IDs
      let functionTools = [];
      if (template.functionIDs && template.functionIDs.length > 0) {
        console.log('🔧 Loading functions for agent execution, functionIDs:', template.functionIDs);

        // Get available functions
        const functionsResponse = await goGentAPI.getFunctions();
        if (functionsResponse.success && functionsResponse.data) {
          const availableFunctions = functionsResponse.data;

          // Filter functions that match the template's function IDs
          functionTools = availableFunctions
            .filter(func => template.functionIDs?.includes(func.id))
            .map(func => ({
              name: func.name,
              description: func.description,
              parameters: func.parametersSchema || {}
            }));

          console.log('✅ Loaded', functionTools.length, 'functions for agent execution');
        } else {
          console.warn('⚠️ Failed to load functions for agent execution');
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
        functionTools: functionTools, // Pass loaded function tools
        functionIDs: template.functionIDs || [], // Also pass function IDs for Execute screen to use
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

  const handleTeamCreated = (teamName?: string) => {
    setShowCreateTeamModal(false);

    // Show success tooltip
    const message = teamName ? `Team "${teamName}" successfully created!` : 'Team successfully created!';
    setSuccessMessage(message);
    setShowSuccessTooltip(true);

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
        loadAgents(); // Refresh the list
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

  const handleAgentMemoryPress = (agent: Agent) => {
    setSelectedAgent(agent);
    setShowAgentMemoryModal(true);
  };

  const handleAgentMemoryClose = () => {
    setShowAgentMemoryModal(false);
    setSelectedAgent(null);
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
      onGoLive={() => handleAgentGoLive(agent)}
      onViewMemory={() => handleAgentMemoryPress(agent)}
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

  const handleNavigateToTeam = (teamId: string, teamName: string) => {
    navigation.navigate('TeamDetail', { teamId, teamName });
  };

  const handleNavigateToTeamTasks = (team: Team) => {
    navigation.navigate('Tasks', { teamId: team.id, teamName: team.name });
  };

  const handleNavigateToAgentTasks = (agentId: string, agentName: string) => {
    navigation.navigate('Tasks', { agentId, agentName });
  };

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeams(prev => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  };

  // Build flat list for compact view
  type CompactListItem =
    | { type: 'team'; team: Team; agents: Agent[] }
    | { type: 'agent'; agent: Agent; indented: boolean }
    | { type: 'unassigned-header' };

  const buildCompactList = (): CompactListItem[] => {
    const items: CompactListItem[] = [];
    teamGroups.forEach(group => {
      items.push({ type: 'team', team: group.team, agents: group.agents });
      if (expandedTeams.has(group.team.id)) {
        group.agents.forEach(agent => {
          items.push({ type: 'agent', agent, indented: true });
        });
      }
    });
    if (unassignedAgents.length > 0) {
      items.push({ type: 'unassigned-header' });
      if (expandedTeams.has('__unassigned__')) {
        unassignedAgents.forEach(agent => {
          items.push({ type: 'agent', agent, indented: false });
        });
      }
    }
    return items;
  };

  const renderCompactItem = ({ item }: { item: CompactListItem }) => {
    if (item.type === 'team') {
      return (
        <CompactTeamRow
          team={item.team}
          agents={item.agents}
          isExpanded={expandedTeams.has(item.team.id)}
          onToggleExpand={() => toggleTeamExpand(item.team.id)}
          onTasksPress={handleNavigateToTeamTasks}
          onMemoryPress={handleTeamMemoryPress}
          onNavigateToTeam={handleNavigateToTeam}
        />
      );
    }
    if (item.type === 'unassigned-header') {
      return (
        <TouchableOpacity
          style={styles.compactUnassignedHeader}
          onPress={() => toggleTeamExpand('__unassigned__')}
          activeOpacity={0.7}
        >
          <View style={styles.compactUnassignedLeft}>
            <Ionicons
              name={expandedTeams.has('__unassigned__') ? 'chevron-down' : 'chevron-forward'}
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.compactUnassignedTitle}>Unassigned</Text>
            <View style={styles.compactUnassignedBadge}>
              <Text style={styles.compactUnassignedBadgeText}>{unassignedAgents.length}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.compactCreateTeamBtn}
            onPress={(e) => { e.stopPropagation(); setShowCreateTeamModal(true); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add" size={14} color={colors.statusSuccess} />
            <Text style={styles.compactCreateTeamText}>Team</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      );
    }
    // type === 'agent'
    return (
      <CompactAgentRow
        agent={item.agent}
        indented={item.indented}
        onPress={() => {
          setSelectedAgent(item.agent);
          setShowDetailModal(true);
        }}
        onExecuteNow={() => handleExecuteAgentNow(item.agent)}
        onEdit={() => {
          setSelectedAgent(item.agent);
          setShowEditModal(true);
        }}
        onViewMemory={() => handleAgentMemoryPress(item.agent)}
      />
    );
  };

  const getCompactItemKey = (item: CompactListItem): string => {
    if (item.type === 'team') return `team-${item.team.id}`;
    if (item.type === 'unassigned-header') return 'unassigned-header';
    return `agent-${item.agent.id}`;
  };

  const renderTeamSection = ({ item: teamGroup }: { item: TeamWithAgents }) => (
    <View key={teamGroup.team.id} style={styles.teamSection}>
      <TeamCard
        team={teamGroup.team}
        agents={teamGroup.agents}
        onTeamUpdate={loadAgents}
        onMemoryPress={handleTeamMemoryPress}
        onNavigateToTeam={handleNavigateToTeam}
        onTasksPress={handleNavigateToTeamTasks}
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
              onGoLive={() => handleAgentGoLive(agent)}
              onViewMemory={() => handleAgentMemoryPress(agent)}
              animated={true}
            />
            <TouchableOpacity
              style={styles.assignTeamButton}
              onPress={() => handleAssignTeam(agent)}
            >
              <Ionicons name="people" size={16} color={colors.statusSuccess} />
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
            <Ionicons name="add" size={isCompact ? 14 : 16} color={colors.statusSuccess} />
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
              onGoLive={() => handleAgentGoLive(agent)}
              onViewMemory={() => handleAgentMemoryPress(agent)}
              animated={true}
            />
            <TouchableOpacity
              style={styles.assignTeamButton}
              onPress={() => handleAssignTeam(agent)}
            >
              <Ionicons name="people" size={16} color={colors.statusSuccess} />
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
            onGoLive={() => {
              AlertAPI.alert(
                '🎯 Go Live Feature',
                'This puts your agent into active live mode! Create your own agent to use this feature.',
                [{ text: 'Create Agent', onPress: () => setShowCreateModal(true) }]
              );
            }}
            onViewMemory={() => {
              AlertAPI.alert(
                '🧠 Agent Memory',
                'View and explore your agent\'s memory. Create your own agent to access this feature!',
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
          <Ionicons name="add" size={20} color={colors.textInverse} />
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
        <View style={styles.headerActions}>
          {agents.length > 0 && (
            <TouchableOpacity
              style={styles.viewModeToggle}
              onPress={() => setViewMode(prev => prev === 'compact' ? 'cards' : 'compact')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={viewMode === 'compact' ? 'grid-outline' : 'list-outline'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.headerButton, isCompact && styles.headerButtonCompact]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add" size={isCompact ? 20 : 24} color={colors.statusSuccess} />
          </TouchableOpacity>
        </View>
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
      ) : viewMode === 'compact' ? (
        <FlatList
          data={buildCompactList()}
          renderItem={renderCompactItem}
          keyExtractor={getCompactItemKey}
          contentContainerStyle={styles.compactListContent}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
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
          onSuccess={(agentName?: string) => {
            setShowCreateModal(false);
            setPrefilledAgentData(null);

            // Show success tooltip
            const message = agentName ? `Agent "${agentName}" successfully created!` : 'Agent successfully created!';
            setSuccessMessage(message);
            setShowSuccessTooltip(true);

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
            onViewAllTasks={(agentId, agentName) => {
              setShowDetailModal(false);
              setSelectedAgent(null);
              handleNavigateToAgentTasks(agentId, agentName);
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

      {/* Agent Memory Modal */}
      <Modal visible={showAgentMemoryModal} animationType="slide" presentationStyle="pageSheet">
        {selectedAgent && (
          <AgentMemoryViewer
            agent={selectedAgent}
            onClose={handleAgentMemoryClose}
          />
        )}
      </Modal>

      {/* Success Tooltip */}
      <SuccessTooltip
        visible={showSuccessTooltip}
        message={successMessage}
        onHide={() => setShowSuccessTooltip(false)}
      />
    </ScreenContainer>
  );
};

const createStyles = (colors: ThemeColors) => ({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
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
    backgroundColor: colors.bgApp,
  },
  headerCompact: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: colors.textPrimary,
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
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 20,
    minHeight: '100%' as const,
  },
  emptyScrollContentCompact: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center' as const,
    paddingHorizontal: 20,
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
  createButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: colors.statusSuccess,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 6,
    gap: 8,
  },
  createButtonText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  messageText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center' as const,
  },
  exampleCardContainer: {
    position: 'relative' as const,
    marginVertical: 20,
    width: '100%' as const,
    maxWidth: 400,
  },
  exampleBadge: {
    position: 'absolute' as const,
    top: -8,
    right: 12,
    backgroundColor: colors.accentSecondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: colors.accentSecondary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  exampleBadgeText: {
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700' as const,
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
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.40)',
  },
  assignTeamText: {
    fontSize: 14,
    color: colors.statusSuccess,
    fontWeight: '600' as const,
    marginLeft: 4,
  },
  unassignedSection: {
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    padding: 16,
    margin: 16,
    marginTop: 0,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  unassignedSectionCompact: {
    padding: 12,
    margin: 8,
    marginTop: 0,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  sectionHeaderCompact: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  sectionTitleCompact: {
    fontSize: 16,
  },
  createTeamButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.40)',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  createTeamButtonCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  createTeamButtonText: {
    fontSize: 14,
    color: colors.statusSuccess,
    marginLeft: 4,
    fontWeight: '600' as const,
  },
  createTeamButtonTextCompact: {
    fontSize: 12,
    marginLeft: 2,
  },
  unassignedAgentCard: {
    marginBottom: 12,
  },
  // Compact view styles
  headerActions: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
  },
  viewModeToggle: {
    padding: 8,
  },
  compactListContent: {
    paddingBottom: 100,
  },
  compactUnassignedHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.bgSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    marginTop: 8,
  },
  compactUnassignedLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 10,
  },
  compactUnassignedTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  compactUnassignedBadge: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center' as const,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  compactUnassignedBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  compactCreateTeamBtn: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.40)',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  compactCreateTeamText: {
    fontSize: 12,
    color: colors.statusSuccess,
    fontWeight: '600' as const,
  },
});

export default AgentsScreen;
