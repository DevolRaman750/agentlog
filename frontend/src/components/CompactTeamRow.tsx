import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Team, Agent } from '../types';
import { useTheme, useThemedStyles } from '../theme';
import type { ThemeColors } from '../theme';

interface CompactTeamRowProps {
  team: Team;
  agents: Agent[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onTasksPress?: (team: Team) => void;
  onMemoryPress?: (team: Team) => void;
  onNavigateToTeam?: (teamId: string, teamName: string) => void;
}

const CompactTeamRow: React.FC<CompactTeamRowProps> = ({
  team,
  agents,
  isExpanded,
  onToggleExpand,
  onTasksPress,
  onMemoryPress,
  onNavigateToTeam,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  const activeCount = agents.filter(a => a.lifecycleStatus === 'ACTIVE').length;
  const pausedCount = agents.filter(a => a.lifecycleStatus === 'PAUSED').length;
  const standbyCount = agents.filter(a => a.lifecycleStatus === 'STANDBY').length;

  return (
    <TouchableOpacity style={styles.container} onPress={onToggleExpand} activeOpacity={0.7}>
      <View style={styles.leftSection}>
        <Ionicons
          name={isExpanded ? 'chevron-down' : 'chevron-forward'}
          size={16}
          color={colors.textSecondary}
        />
        <Text style={styles.teamName} numberOfLines={1}>{team.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{agents.length}</Text>
        </View>
        {/* Status dots */}
        <View style={styles.statusDots}>
          {activeCount > 0 && <View style={[styles.statusDot, { backgroundColor: colors.statusSuccess }]} />}
          {pausedCount > 0 && <View style={[styles.statusDot, { backgroundColor: colors.statusPaused }]} />}
          {standbyCount > 0 && <View style={[styles.statusDot, { backgroundColor: colors.textTertiary }]} />}
        </View>
      </View>
      <View style={styles.rightSection}>
        {onTasksPress && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => { e.stopPropagation(); onTasksPress(team); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="clipboard-outline" size={16} color={colors.accent} />
          </TouchableOpacity>
        )}
        {onMemoryPress && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => { e.stopPropagation(); onMemoryPress(team); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="library-outline" size={16} color={colors.accentSecondary} />
          </TouchableOpacity>
        )}
        {onNavigateToTeam && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => { e.stopPropagation(); onNavigateToTeam(team.id, team.name); }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="open-outline" size={16} color={colors.statusSuccess} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: ThemeColors) => ({
  container: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  leftSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
    gap: 10,
  },
  teamName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    minWidth: 22,
    alignItems: 'center' as const,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: colors.accent,
  },
  statusDots: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  rightSection: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
});

export default CompactTeamRow;
