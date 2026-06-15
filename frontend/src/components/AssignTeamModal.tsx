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
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    closeButton: {
      padding: spacing.sm,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    closeButtonText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.accent,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    headerSpacer: {
      width: 50,
    },
    agentInfo: {
      backgroundColor: colors.bgCard,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    agentName: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    agentSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: spacing.xs,
    },
    currentTeamSection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.md,
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
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      marginLeft: spacing.sm,
    },
    removeButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.statusError,
      minWidth: 70,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    removeButtonText: {
      ...typography.label,
      color: colors.statusError,
    },
    teamsSection: {
      flex: 1,
      margin: spacing.lg,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    createButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.accent,
      minHeight: touchTarget.min,
    },
    createButtonText: {
      ...typography.label,
      color: colors.accent,
      marginLeft: spacing.xs,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.xxl,
    },
    loadingText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginTop: spacing.md,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.xxl,
    },
    emptyTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginTop: spacing.lg,
    },
    emptySubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: spacing.sm,
      lineHeight: 20,
    },
    emptyCreateButton: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      marginTop: spacing.lg,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    emptyCreateButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
    teamsList: {
      paddingBottom: spacing.xl,
    },
    teamCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
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
      borderRadius: radius.pill,
      backgroundColor: colors.bgHover,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    teamInfo: {
      flex: 1,
      marginLeft: spacing.md,
    },
    teamName: {
      ...typography.title,
      color: colors.textPrimary,
    },
    teamDescription: {
      ...typography.body,
      color: colors.textSecondary,
      marginTop: 2,
      lineHeight: 18,
    },
    teamStats: {
      flexDirection: 'row' as const,
      marginTop: spacing.sm,
    },
    statItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginRight: spacing.lg,
    },
    statText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginLeft: spacing.xs,
    },
    currentBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    currentBadgeText: {
      ...typography.micro,
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
                <Ionicons name="people-outline" size={14} color={colors.textSecondary} />
                <Text style={styles.statText}>{team.agentCount} agents</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="flash-outline" size={14} color={colors.textSecondary} />
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
          <View style={[styles.teamsSection, agent.teamId ? { marginTop: spacing.none } : { marginTop: spacing.lg }]}>
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
