import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { goGentAPI } from '../api/client';
import { Team, Agent } from '../types';
import { AlertAPI } from './CustomAlert';
import CreateTeamForm from './CreateTeamForm';

interface AssignTeamModalProps {
  visible: boolean;
  agent: Agent;
  onClose: () => void;
  onAssigned: () => void;
}

const AssignTeamModal: React.FC<AssignTeamModalProps> = ({
  visible,
  agent,
  onClose,
  onAssigned,
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  useEffect(() => {
    if (visible) {
      loadTeams();
    }
  }, [visible]);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const response = await goGentAPI.getTeams();
      if (response.success) {
        setTeams(response.data);
      } else {
        AlertAPI.alert('Error', 'Failed to load teams');
      }
    } catch (error) {
      console.error('Error loading teams:', error);
      AlertAPI.alert('Error', 'Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignTeam = async (teamId: string) => {
    setIsAssigning(true);
    try {
      const response = await goGentAPI.assignAgentToTeam(agent.id, teamId);
      if (response.success) {
        AlertAPI.alert('Success', 'Agent assigned to team successfully!');
        onAssigned();
        onClose();
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to assign agent to team');
      }
    } catch (error) {
      console.error('Error assigning agent to team:', error);
      AlertAPI.alert('Error', 'Failed to assign agent to team');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveFromTeam = async () => {
    setIsAssigning(true);
    try {
      const response = await goGentAPI.removeAgentFromTeam(agent.id);
      if (response.success) {
        AlertAPI.alert('Success', 'Agent removed from team successfully!');
        onAssigned();
        onClose();
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to remove agent from team');
      }
    } catch (error) {
      console.error('Error removing agent from team:', error);
      AlertAPI.alert('Error', 'Failed to remove agent from team');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleTeamCreated = () => {
    setShowCreateTeam(false);
    loadTeams(); // Refresh teams list
  };

  const renderTeamCard = ({ item: team }: { item: Team }) => {
    const isCurrentTeam = agent.teamId === team.id;
    
    return (
      <TouchableOpacity
        style={[styles.teamCard, isCurrentTeam && styles.currentTeamCard]}
        onPress={() => !isCurrentTeam && handleAssignTeam(team.id)}
        disabled={isAssigning || isCurrentTeam}
      >
        <View style={styles.teamHeader}>
          <View style={styles.teamIcon}>
            <Ionicons name="people" size={24} color="#007AFF" />
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>{team.name}</Text>
            {team.description && (
              <Text style={styles.teamDescription} numberOfLines={2}>
                {team.description}
              </Text>
            )}
            <View style={styles.teamStats}>
              <View style={styles.statItem}>
                <Ionicons name="people-outline" size={14} color="#6B6B6B" />
                <Text style={styles.statText}>{team.agentCount} agents</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flash-outline" size={14} color="#6B6B6B" />
                <Text style={styles.statText}>
                  {team.tokensUsedToday.toLocaleString()}/{team.maxTokensPerDay.toLocaleString()} tokens
                </Text>
              </View>
            </View>
          </View>
          {isCurrentTeam ? (
            <View style={styles.currentBadge}>
              <Text style={styles.currentBadgeText}>Current</Text>
            </View>
          ) : (
            <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Assign Team</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Agent Info */}
          <View style={styles.agentInfo}>
            <Text style={styles.agentName}>
              {agent.firstName} {agent.lastName}
            </Text>
            <Text style={styles.agentSubtitle}>
              {agent.teamName ? `Currently in: ${agent.teamName}` : 'No team assigned'}
            </Text>
          </View>

          {/* Current Team Section */}
          {agent.teamId && (
            <View style={styles.currentTeamSection}>
              <Text style={styles.sectionTitle}>Current Team</Text>
              <View style={styles.currentTeamContainer}>
                <View style={styles.currentTeamInfo}>
                  <Ionicons name="people" size={20} color="#007AFF" />
                  <Text style={styles.currentTeamName}>{agent.teamName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemoveFromTeam}
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <Text style={styles.removeButtonText}>Remove</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Teams List */}
          <View style={[styles.teamsSection, agent.teamId ? { marginTop: 0 } : { marginTop: 16 }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Available Teams</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => setShowCreateTeam(true)}
              >
                <Ionicons name="add" size={20} color="#007AFF" />
                <Text style={styles.createButtonText}>Create Team</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading teams...</Text>
              </View>
            ) : teams.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color="#C7C7CC" />
                <Text style={styles.emptyTitle}>No teams yet</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first team to organize your agents
                </Text>
                <TouchableOpacity
                  style={styles.emptyCreateButton}
                  onPress={() => setShowCreateTeam(true)}
                >
                  <Text style={styles.emptyCreateButtonText}>Create Team</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={teams}
                renderItem={renderTeamCard}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.teamsList}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Create Team Modal */}
      <CreateTeamForm
        visible={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        onTeamCreated={handleTeamCreated}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 50,
  },
  agentInfo: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  agentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  agentSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 4,
  },
  currentTeamSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  currentTeamContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentTeamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentTeamName: {
    fontSize: 16,
    color: '#1A1A1A',
    marginLeft: 8,
  },
  removeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FF3B30',
    minWidth: 70,
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  teamsSection: {
    flex: 1,
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  createButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B6B6B',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyCreateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  emptyCreateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  teamsList: {
    paddingBottom: 20,
  },
  teamCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  currentTeamCard: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  teamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInfo: {
    flex: 1,
    marginLeft: 12,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  teamDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 2,
    lineHeight: 18,
  },
  teamStats: {
    flexDirection: 'row',
    marginTop: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  statText: {
    fontSize: 12,
    color: '#6B6B6B',
    marginLeft: 4,
  },
  currentBadge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AssignTeamModal; 