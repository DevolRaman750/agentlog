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
import { Agent, AgentFormData, LifecycleStatus, ExecutionTemplate } from '../types';


const AgentsScreen: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const { setReExecutionData } = useApp();
  const navigation = useNavigation<any>();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading agents..." />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.messageText}>Please login to view your agents.</Text>
      </View>
    );
  }

  useFocusEffect(
    useCallback(() => {
      console.log('🔍 AgentsScreen useFocusEffect triggered');
      console.log('🔍 User:', !!user, user?.id);
      console.log('🔍 authLoading:', authLoading);
      
      if (user && !authLoading) {
        console.log('✅ Conditions met, calling loadAgents()');
        loadAgents();
      } else {
        console.log('❌ Conditions not met for loadAgents()');
        console.log('  - user:', !!user);
        console.log('  - !authLoading:', !authLoading);
      }
    }, [user?.id, authLoading])
  );

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      console.log('🤖 Loading agents...');
      console.log('🔍 User authenticated:', !!user);
      console.log('🔍 User ID:', user?.id);
      
      const response = await goGentAPI.getAgents();
      console.log('📡 API Response:', response);
      
      if (response.success && response.data) {
        setAgents(response.data);
        console.log('✅ Loaded agents:', response.data.length);
      } else {
        console.error('❌ Failed to load agents:', response.error);
        AlertAPI.alert('Error', response.error || 'Failed to load agents');
      }
    } catch (error) {
      console.error('💥 Error loading agents:', error);
      AlertAPI.alert('Error', 'Failed to load agents: ' + (error as Error).message);
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
      const newStatus = agent.status === 'PAUSED' ? 'ACTIVE' : 'PAUSED';
      
      const response = await goGentAPI.updateAgent(agent.id, {
        ...agent,
        status: newStatus
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
        basePrompt: template.prompt || '',
        context: template.context || '',
        configurations: [defaultConfig],
        enableFunctionCalling: template.enableFunctionCalling || false,
        functionTools: [], // Will be loaded by Execute screen
        isAgentExecution: true,
        agentId: agent.id,
        templateId: agent.templateId
      };

      console.log('🤖 Navigating to Execute screen with agent data:', {
        agentName: `${agent.firstName} ${agent.lastName}`,
        templateId: agent.templateId,
        templateName: template.name
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
    firstName: 'Alex',
    lastName: 'CodeBot',
    templateId: 'system-template-software-engineer',
    templateName: 'Software Engineer',
    maxTokensPerDay: 50000,
    heartbeatMinutes: 30,
    status: 'STANDBY' as LifecycleStatus,
    tokensUsedToday: 12450,
    totalExecutions: 24,
    lastExecutionAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
  });

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

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>My Agents</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={agents}
        renderItem={renderAgentCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContainer,
          agents.length === 0 && styles.emptyListContainer,
        ]}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Create Agent Modal */}
      <Modal visible={showCreateModal} animationType="slide" presentationStyle="pageSheet">
        <CreateAgentForm
          onSuccess={() => {
            setShowCreateModal(false);
            loadAgents(); // Refresh the agents list
          }}
          onCancel={() => setShowCreateModal(false)}
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
    </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  headerButton: {
    padding: 8,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },

  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
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
});

export default AgentsScreen; 