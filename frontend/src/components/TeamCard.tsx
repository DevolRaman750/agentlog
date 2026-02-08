import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Team, Agent } from '../types';
import { goGentAPI } from '../api/client';
import { AlertAPI } from './CustomAlert';
import EditTeamContextModal from './EditTeamContextModal';
import { useTheme, useThemedStyles } from '../theme';
import type { ThemeColors } from '../theme';

interface TeamCardProps {
  team: Team;
  agents: Agent[];
  onTeamUpdate: () => void;
  onTeamPress?: (team: Team) => void;
  onMemoryPress?: (team: Team) => void;
  onNavigateToTeam?: (teamId: string, teamName: string) => void;
}

const createStyles = (colors: ThemeColors) => ({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderLeftWidth: 4,
    borderLeftColor: colors.statusSuccess,
  },
  header: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 16,
  },
  teamInfo: {
    flexDirection: 'row' as const,
    flex: 1,
    alignItems: 'flex-start' as const,
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  teamDetails: {
    marginLeft: 12,
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  teamDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  controls: {
    flexDirection: 'row' as const,
    marginLeft: 12,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginLeft: 8,
    borderWidth: 1,
  },
  viewTeamButton: {
    borderColor: 'rgba(16, 185, 129, 0.40)',
    backgroundColor: colors.accentSoft,
  },
  memoryButton: {
    borderColor: 'rgba(251, 191, 36, 0.40)',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  contextButton: {
    borderColor: 'rgba(139, 92, 246, 0.40)',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  pauseButton: {
    borderColor: 'rgba(251, 191, 36, 0.40)',
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
  },
  resumeButton: {
    borderColor: 'rgba(16, 185, 129, 0.40)',
    backgroundColor: colors.accentSoft,
  },
  agentStats: {
    flexDirection: 'row' as const,
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginRight: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  tokenSection: {
    marginBottom: 16,
  },
  tokenHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: '500' as const,
  },
  tokenValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  progressBarContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: colors.accentSoft,
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%' as const,
    borderRadius: 3,
    minWidth: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600' as const,
    minWidth: 35,
  },
  summary: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  summaryItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  summaryText: {
    fontSize: 12,
    color: colors.textTertiary,
    marginLeft: 4,
  },
});

const TeamCard: React.FC<TeamCardProps> = ({
  team,
  agents,
  onTeamUpdate,
  onTeamPress,
  onMemoryPress,
  onNavigateToTeam
}) => {
  // Early return if team is not provided
  if (!team) {
    return null;
  }

  // Ensure agents is an array
  const safeAgents = Array.isArray(agents) ? agents : [];

  const [isLoading, setIsLoading] = useState(false);
  const [showEditContextModal, setShowEditContextModal] = useState(false);
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const activeAgents = safeAgents.filter(agent => agent?.lifecycleStatus === 'ACTIVE');
  const pausedAgents = safeAgents.filter(agent => agent?.lifecycleStatus === 'PAUSED');
  const standbyAgents = safeAgents.filter(agent => agent?.lifecycleStatus === 'STANDBY');

  const handlePauseAll = async () => {
    if (!activeAgents || activeAgents.length === 0) {
      AlertAPI.alert('Info', 'No active agents to pause in this team');
      return;
    }

    setIsLoading(true);
    try {
      const response = await goGentAPI.pauseAllTeamAgents(team.id);
      if (response.success) {
        AlertAPI.alert('Success', `Paused ${response.data?.affectedCount || 0} agents`);
        onTeamUpdate();
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to pause team agents');
      }
    } catch (error) {
      console.error('Error pausing team agents:', error);
      AlertAPI.alert('Error', 'Failed to pause team agents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeAll = async () => {
    const pausableAgents = safeAgents.filter(agent =>
      agent?.lifecycleStatus === 'PAUSED' || agent?.lifecycleStatus === 'STANDBY'
    );

    if (!pausableAgents || pausableAgents.length === 0) {
      AlertAPI.alert('Info', 'No paused agents to resume in this team');
      return;
    }

    setIsLoading(true);
    try {
      const response = await goGentAPI.resumeAllTeamAgents(team.id);
      if (response.success) {
        AlertAPI.alert('Success', `Resumed ${response.data?.affectedCount || 0} agents`);
        onTeamUpdate();
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to resume team agents');
      }
    } catch (error) {
      console.error('Error resuming team agents:', error);
      AlertAPI.alert('Error', 'Failed to resume team agents');
    } finally {
      setIsLoading(false);
    }
  };

  const getTokenUsageColor = () => {
    const percentage = (team.tokensUsedToday / team.maxTokensPerDay) * 100;
    if (percentage >= 90) return colors.statusError;
    if (percentage >= 70) return colors.statusWarning;
    return colors.statusSuccess;
  };

  const getTokenUsagePercentage = () => {
    return Math.min((team.tokensUsedToday / team.maxTokensPerDay) * 100, 100);
  };

  const formatCreatedDate = () => {
    try {
      const date = new Date(team.createdAt);
      return isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  const formatTokenUsage = () => {
    try {
      return `${team.tokensUsedToday.toLocaleString()} / ${team.maxTokensPerDay.toLocaleString()}`;
    } catch {
      return `${team.tokensUsedToday} / ${team.maxTokensPerDay}`;
    }
  };

  const formatPercentage = () => {
    try {
      return `${getTokenUsagePercentage().toFixed(1)}%`;
    } catch {
      return `${Math.round(getTokenUsagePercentage())}%`;
    }
  };

  const handleMemoryPress = () => {
    if (onMemoryPress && team) {
      onMemoryPress(team);
    }
  };

  const handleMemoryButtonLongPress = () => {
    try {
      Alert.alert(
        'Team Memory',
        'Team memory allows agents in this team to share information and collaborate on tasks. All agents in the team can read and write to this shared memory using team_memory_* functions during execution.',
        [
          { text: 'Got it!', style: 'default' },
          { text: 'View Memory', onPress: handleMemoryPress }
        ]
      );
    } catch (error) {
      console.error('Error showing team memory alert:', error);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onTeamPress && onTeamPress(team)}
      activeOpacity={0.7}
    >
      {/* Team Header */}
      <View style={styles.header}>
        <View style={styles.teamInfo}>
          <View style={styles.teamIcon}>
            <Ionicons name="people" size={24} color={colors.statusSuccess} />
          </View>
          <View style={styles.teamDetails}>
            <Text style={styles.teamName}>{team.name || 'Unnamed Team'}</Text>
            {team.description ? (
              <Text style={styles.teamDescription} numberOfLines={2}>
                {team.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Team Controls */}
        <View style={styles.controls}>
          {/* View Team Button */}
          {onNavigateToTeam && (
            <TouchableOpacity
              style={[styles.controlButton, styles.viewTeamButton]}
              onPress={() => onNavigateToTeam(team.id, team.name)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="eye" size={16} color={colors.statusSuccess} />
            </TouchableOpacity>
          )}

          {/* Team Memory Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.memoryButton]}
            onPress={handleMemoryPress}
            onLongPress={handleMemoryButtonLongPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="library" size={16} color={colors.accentSecondary} />
          </TouchableOpacity>

          {/* Edit Team Context Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.contextButton]}
            onPress={() => setShowEditContextModal(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="document-text" size={16} color="#8B5CF6" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={handlePauseAll}
            disabled={isLoading || activeAgents.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.accentSecondary} />
            ) : (
              <Ionicons name="pause" size={16} color={colors.accentSecondary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.resumeButton]}
            onPress={handleResumeAll}
            disabled={isLoading || (pausedAgents.length === 0 && standbyAgents.length === 0)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.statusSuccess} />
            ) : (
              <Ionicons name="play" size={16} color={colors.statusSuccess} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Agent Stats */}
      <View style={styles.agentStats}>
        <View style={styles.statItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.statusSuccess }]} />
          <Text style={styles.statText}>{activeAgents.length || 0} Active</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.accentSecondary }]} />
          <Text style={styles.statText}>{pausedAgents.length || 0} Paused</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statusDot, { backgroundColor: colors.textTertiary }]} />
          <Text style={styles.statText}>{standbyAgents.length || 0} Standby</Text>
        </View>
        {team.memory ? (
          <View style={styles.statItem}>
            <View style={[styles.statusDot, { backgroundColor: colors.accentSecondary }]} />
            <Text style={styles.statText}>Memory</Text>
          </View>
        ) : null}
      </View>

      {/* Token Usage */}
      <View style={styles.tokenSection}>
        <View style={styles.tokenHeader}>
          <Text style={styles.tokenLabel}>Token Usage Today</Text>
          <Text style={styles.tokenValue}>
            {formatTokenUsage()}
          </Text>
        </View>
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${getTokenUsagePercentage()}%`,
                  backgroundColor: getTokenUsageColor()
                }
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {formatPercentage()}
          </Text>
        </View>
      </View>

      {/* Team Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Ionicons name="people-outline" size={16} color={colors.textTertiary} />
          <Text style={styles.summaryText}>{safeAgents.length} agents</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="flash-outline" size={16} color={colors.textTertiary} />
          <Text style={styles.summaryText}>{team.totalExecutions || 0} executions</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="calendar-outline" size={16} color={colors.textTertiary} />
          <Text style={styles.summaryText}>
            Created {formatCreatedDate()}
          </Text>
        </View>
      </View>

      {/* Edit Team Context Modal */}
      <EditTeamContextModal
        visible={showEditContextModal}
        team={team}
        onClose={() => setShowEditContextModal(false)}
        onSuccess={() => {
          setShowEditContextModal(false);
          onTeamUpdate(); // Refresh the team data
        }}
      />
    </TouchableOpacity>
  );
};

export default TeamCard;
