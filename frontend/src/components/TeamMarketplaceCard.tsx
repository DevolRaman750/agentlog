import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceTeam } from '../types/marketplace';
import { useTheme, useThemedStyles } from '../theme';

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
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: 12,
    },
    avatarText: {
      fontSize: 20,
      fontWeight: 'bold' as const,
    },
    headerInfo: {
      flex: 1,
    },
    name: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    category: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    teamSizeBadge: {
      backgroundColor: colors.accent,
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    teamSizeText: {
      fontSize: 12,
      color: colors.textInverse,
      fontWeight: '600' as const,
    },
    description: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    membersSection: {
      marginBottom: 16,
    },
    membersTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    memberRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 4,
    },
    memberText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: 6,
      flex: 1,
    },
    moreMembers: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '500' as const,
      marginTop: 4,
    },
    capabilitiesSection: {
      marginBottom: 16,
    },
    capabilitiesTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    capabilitiesList: {
      gap: 4,
    },
    capabilityItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    capabilityText: {
      fontSize: 13,
      color: colors.textSecondary,
      marginLeft: 6,
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
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    costValue: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    actionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    actionButtonText: {
      fontSize: 14,
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
