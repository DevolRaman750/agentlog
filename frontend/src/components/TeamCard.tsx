import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Team, Agent } from '../types';
import { goGentAPI } from '../api/client';
import { AlertAPI } from './CustomAlert';

interface TeamCardProps {
  team: Team;
  agents: Agent[];
  onTeamUpdate: () => void;
  onTeamPress?: (team: Team) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ 
  team, 
  agents, 
  onTeamUpdate,
  onTeamPress 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const activeAgents = agents.filter(agent => agent.lifecycleStatus === 'ACTIVE');
  const pausedAgents = agents.filter(agent => agent.lifecycleStatus === 'PAUSED');
  const standbyAgents = agents.filter(agent => agent.lifecycleStatus === 'STANDBY');

  const handlePauseAll = async () => {
    if (activeAgents.length === 0) {
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
    const pausableAgents = agents.filter(agent => 
      agent.lifecycleStatus === 'PAUSED' || agent.lifecycleStatus === 'STANDBY'
    );
    
    if (pausableAgents.length === 0) {
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
    if (percentage >= 90) return '#FF3B30';
    if (percentage >= 70) return '#FF9500';
    return '#34C759';
  };

  const getTokenUsagePercentage = () => {
    return Math.min((team.tokensUsedToday / team.maxTokensPerDay) * 100, 100);
  };

  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={() => onTeamPress?.(team)}
      activeOpacity={0.7}
    >
      {/* Team Header */}
      <View style={styles.header}>
        <View style={styles.teamInfo}>
          <View style={styles.teamIcon}>
            <Ionicons name="people" size={24} color="#007AFF" />
          </View>
          <View style={styles.teamDetails}>
            <Text style={styles.teamName}>{team.name}</Text>
            {team.description && (
              <Text style={styles.teamDescription} numberOfLines={2}>
                {team.description}
              </Text>
            )}
          </View>
        </View>
        
        {/* Team Controls */}
        <View style={styles.controls}>
          <TouchableOpacity
            style={[styles.controlButton, styles.pauseButton]}
            onPress={handlePauseAll}
            disabled={isLoading || activeAgents.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#FF9500" />
            ) : (
              <Ionicons name="pause" size={16} color="#FF9500" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.controlButton, styles.resumeButton]}
            onPress={handleResumeAll}
            disabled={isLoading || (pausedAgents.length === 0 && standbyAgents.length === 0)}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#34C759" />
            ) : (
              <Ionicons name="play" size={16} color="#34C759" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Agent Stats */}
      <View style={styles.agentStats}>
        <View style={styles.statItem}>
          <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
          <Text style={styles.statText}>{activeAgents.length} Active</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statusDot, { backgroundColor: '#FF9500' }]} />
          <Text style={styles.statText}>{pausedAgents.length} Paused</Text>
        </View>
        <View style={styles.statItem}>
          <View style={[styles.statusDot, { backgroundColor: '#8E8E93' }]} />
          <Text style={styles.statText}>{standbyAgents.length} Standby</Text>
        </View>
      </View>

      {/* Token Usage */}
      <View style={styles.tokenSection}>
        <View style={styles.tokenHeader}>
          <Text style={styles.tokenLabel}>Token Usage Today</Text>
          <Text style={styles.tokenValue}>
            {team.tokensUsedToday.toLocaleString()} / {team.maxTokensPerDay.toLocaleString()}
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
            {getTokenUsagePercentage().toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Team Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Ionicons name="people-outline" size={16} color="#6B6B6B" />
          <Text style={styles.summaryText}>{agents.length} agents</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="flash-outline" size={16} color="#6B6B6B" />
          <Text style={styles.summaryText}>{team.totalExecutions} executions</Text>
        </View>
        <View style={styles.summaryItem}>
          <Ionicons name="calendar-outline" size={16} color="#6B6B6B" />
          <Text style={styles.summaryText}>
            Created {new Date(team.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  teamInfo: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamDetails: {
    marginLeft: 12,
    flex: 1,
  },
  teamName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  teamDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    marginTop: 4,
    lineHeight: 18,
  },
  controls: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  controlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
  },
  pauseButton: {
    borderColor: '#FF9500',
    backgroundColor: '#FFF8F0',
  },
  resumeButton: {
    borderColor: '#34C759',
    backgroundColor: '#F0FFF4',
  },
  agentStats: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
    color: '#1A1A1A',
    fontWeight: '500',
  },
  tokenSection: {
    marginBottom: 16,
  },
  tokenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenLabel: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  tokenValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#F2F2F7',
    borderRadius: 3,
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    minWidth: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '600',
    minWidth: 35,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  summaryText: {
    fontSize: 12,
    color: '#6B6B6B',
    marginLeft: 4,
  },
});

export default TeamCard; 