import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceTeam } from '../types/marketplace';
import { useTheme, useThemedStyles, spacing, radius, typography } from '../theme';

interface TeamMarketplaceCardProps {
  team: MarketplaceTeam;
  onPress: () => void;
  style?: ViewStyle;
}

const TeamMarketplaceCard: React.FC<TeamMarketplaceCardProps> = ({
  team,
  onPress,
  style,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    card: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: radius.pill,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: spacing.md,
    },
    avatarText: {
      ...typography.h1,
      fontWeight: 'bold' as const,
    },
    headerInfo: {
      flex: 1,
    },
    name: {
      ...typography.h2,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    category: {
      ...typography.body,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    teamSizeBadge: {
      backgroundColor: colors.accent,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    teamSizeText: {
      ...typography.caption,
      color: colors.textInverse,
      fontWeight: '600' as const,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    membersSection: {
      marginBottom: spacing.lg,
    },
    membersTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    memberRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.xs,
    },
    memberText: {
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
      flex: 1,
    },
    moreMembers: {
      ...typography.caption,
      color: colors.accent,
      fontWeight: '500' as const,
      marginTop: spacing.xs,
    },
    capabilitiesSection: {
      marginBottom: spacing.lg,
    },
    capabilitiesTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    capabilitiesList: {
      gap: spacing.xs,
    },
    capabilityItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    capabilityText: {
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
      flex: 1,
    },
    footer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    costContainer: {
      flex: 1,
    },
    costLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    costValue: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    actionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    actionButtonText: {
      ...typography.body,
      color: colors.accent,
      fontWeight: '500' as const,
    },
  }));

  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: team.avatar.backgroundColor }]}>
          <Text style={[styles.avatarText, { color: team.avatar.textColor }]}>
            {team.avatar.icon}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {team.name}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {team.category}
          </Text>
        </View>
        <View style={styles.teamSizeBadge}>
          <Text style={styles.teamSizeText}>{team.teamSize}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {team.description}
      </Text>

      {/* Team Members Preview */}
      <View style={styles.membersSection}>
        <Text style={styles.membersTitle}>Team Members:</Text>
        {team.agents.slice(0, 3).map((agent, index) => (
          <View key={index} style={styles.memberRow}>
            <Ionicons name="person" size={14} color={colors.textSecondary} />
            <Text style={styles.memberText} numberOfLines={1}>
              {agent.role}
            </Text>
          </View>
        ))}
        {team.agents.length > 3 && (
          <Text style={styles.moreMembers}>
            +{team.agents.length - 3} more agents
          </Text>
        )}
      </View>

      {/* Capabilities */}
      <View style={styles.capabilitiesSection}>
        <Text style={styles.capabilitiesTitle}>Key Capabilities:</Text>
        <View style={styles.capabilitiesList}>
          {team.capabilities.overview.slice(0, 2).map((capability, index) => (
            <View key={index} style={styles.capabilityItem}>
              <Ionicons name="checkmark-circle" size={12} color={colors.statusSuccess} />
              <Text style={styles.capabilityText} numberOfLines={1}>
                {capability}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>Estimated Cost</Text>
          <Text style={styles.costValue}>{team.estimatedCost}</Text>
        </View>
        <View style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Team</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.accent} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TeamMarketplaceCard;
