import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';
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
  const { colors } = useTheme();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    closeButton: {
      padding: 8,
    },
    closeButtonText: {
      fontSize: 16,
      color: colors.accent,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 50,
    },
    agentInfo: {
      backgroundColor: colors.bgCard,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    agentName: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    agentSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
    },
    currentTeamSection: {
      backgroundColor: colors.bgCard,
      margin: 16,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    currentTeamContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    currentTeamInfo: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
    },
    currentTeamName: {
      fontSize: 16,
      color: colors.textPrimary,
      marginLeft: 8,
    },
    removeButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.statusError,
      minWidth: 70,
      alignItems: 'center' as const,
    },
    removeButtonText: {
      fontSize: 14,
      color: colors.statusError,
      fontWeight: '500' as const,
    },
    teamsSection: {
      flex: 1,
      margin: 16,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    createButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    createButtonText: {
      fontSize: 14,
      color: colors.accent,
      marginLeft: 4,
      fontWeight: '500' as const,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 32,
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 12,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 32,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginTop: 16,
    },
    emptySubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: 8,
      lineHeight: 20,
    },
    emptyCreateButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 8,
      marginTop: 16,
    },
    emptyCreateButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    teamsList: {
      paddingBottom: 20,
    },
    teamCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    currentTeamCard: {
      borderColor: colors.accent,
      backgroundColor: colors.bgHover,
    },
    teamHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    teamIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgHover,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    teamInfo: {
      flex: 1,
      marginLeft: 12,
    },
    teamName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    teamDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
    teamStats: {
      flexDirection: 'row' as const,
      marginTop: 8,
    },
    statItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginRight: 16,
    },
    statText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginLeft: 4,
    },
    currentBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    currentBadgeText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
  }));

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
        setTeams(response.data || []);
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
            <Ionicons name="people" size={24} color={colors.accent} />
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
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
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
                  <Ionicons name="people" size={20} color={colors.accent} />
                  <Text style={styles.currentTeamName}>{agent.teamName}</Text>
                </View>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={handleRemoveFromTeam}
                  disabled={isAssigning}
                >
                  {isAssigning ? (
                    <ActivityIndicator size="small" color={colors.statusError} />
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
                <Ionicons name="add" size={20} color={colors.accent} />
                <Text style={styles.createButtonText}>Create Team</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Loading teams...</Text>
              </View>
            ) : teams.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={colors.textTertiary} />
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

export default AssignTeamModal;
