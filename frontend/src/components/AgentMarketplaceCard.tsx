import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, spacing, radius, typography } from '../theme';
import { MarketplaceAgent } from '../types/marketplace';

interface AgentMarketplaceCardProps {
  agent: MarketplaceAgent;
  onPress: () => void;
  style?: ViewStyle;
}

const AgentMarketplaceCard: React.FC<AgentMarketplaceCardProps> = ({
  agent,
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
    cardHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.lg,
    },
    avatarContainer: {
      position: 'relative' as const,
      marginRight: spacing.lg,
    },
    avatar: {
      width: 56,
      height: 56,
      borderRadius: radius.pill,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    avatarText: {
      ...typography.h2,
      fontWeight: 'bold' as const,
    },
    availabilityDot: {
      position: 'absolute' as const,
      bottom: 2,
      right: 2,
      width: 16,
      height: 16,
      borderRadius: radius.pill,
      borderWidth: 2,
      borderColor: colors.bgCard,
    },
    headerInfo: {
      flex: 1,
    },
    nameRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.xs,
    },
    agentName: {
      ...typography.h2,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      flex: 1,
    },
    agentRole: {
      ...typography.title,
      color: colors.accent,
      fontWeight: '500' as const,
      marginBottom: spacing.sm,
    },
    experienceContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    experienceBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    experienceText: {
      ...typography.caption,
      fontWeight: '600' as const,
    },
    modelText: {
      ...typography.caption,
      color: colors.accent,
      fontWeight: '500' as const,
    },
    apiKeyTag: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.sm,
    },
    apiKeyText: {
      ...typography.micro,
      color: colors.accent,
      fontWeight: '500' as const,
    },
    description: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    highlightsContainer: {
      marginBottom: spacing.lg,
    },
    highlight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    highlightText: {
      ...typography.body,
      color: colors.textPrimary,
      fontWeight: '500' as const,
      flex: 1,
    },
    skillsContainer: {
      marginBottom: spacing.lg,
    },
    skillsLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    skillsRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    skillTag: {
      backgroundColor: colors.bgApp,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
    },
    skillTagText: {
      ...typography.caption,
      color: colors.textPrimary,
      fontWeight: '500' as const,
    },
    moreSkillsTag: {
      backgroundColor: colors.borderLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
    },
    moreSkillsText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    statsContainer: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.bgApp,
      marginBottom: spacing.lg,
    },
    statItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    statText: {
      ...typography.caption,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    ctaContainer: {
      alignItems: 'center' as const,
    },
    viewDetailsButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    viewDetailsText: {
      ...typography.title,
      color: colors.accent,
      fontWeight: '600' as const,
    },
  }));

  {/* Removed getAvailabilityColor function - no longer needed */}

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'Junior': return colors.accent;
      case 'Mid-Level': return colors.statusSuccess;
      case 'Senior': return colors.statusWarning;
      case 'Expert': return colors.accent;
      default: return colors.accent;
    }
  };



  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header with Avatar and Basic Info */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarContainer}>
          <View style={[
            styles.avatar,
            { backgroundColor: agent.avatar.backgroundColor }
          ]}>
            <Text style={[
              styles.avatarText,
              { color: agent.avatar.textColor }
            ]}>
              {agent.avatar.initials}
            </Text>
          </View>
          {/* Removed availability dot - no fake metrics */}
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.agentName} numberOfLines={1}>
              {agent.name}
            </Text>
          </View>
          <Text style={styles.agentRole} numberOfLines={1}>
            {agent.role}
          </Text>
          <View style={styles.experienceContainer}>
            <View style={[
              styles.experienceBadge,
              { backgroundColor: `${getExperienceColor(agent.experienceLevel)}15` }
            ]}>
              <Text style={[
                styles.experienceText,
                { color: getExperienceColor(agent.experienceLevel) }
              ]}>
                {agent.experienceLevel}
              </Text>
            </View>
            <Text style={styles.modelText}>
              {agent.modelConfig.modelName.replace('-latest', '')}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {agent.description}
      </Text>

      {/* Key Highlights */}
      <View style={styles.highlightsContainer}>
        {agent.highlights.slice(0, 2).map((highlight, index) => (
          <View key={index} style={styles.highlight}>
            <Ionicons name="checkmark-circle" size={16} color={colors.statusSuccess} />
            <Text style={styles.highlightText} numberOfLines={1}>
              {highlight}
            </Text>
          </View>
        ))}
      </View>

      {/* API Requirements */}
      <View style={styles.skillsContainer}>
        <Text style={styles.skillsLabel}>Required API Keys:</Text>
        <View style={styles.skillsRow}>
          {agent.apiRequirements.displayNames.slice(0, 2).map((apiKey, index) => (
            <View key={index} style={styles.apiKeyTag}>
              <Text style={styles.apiKeyText}>{apiKey}</Text>
            </View>
          ))}
          {agent.apiRequirements.displayNames.length > 2 && (
            <View style={styles.moreSkillsTag}>
              <Text style={styles.moreSkillsText}>
                +{agent.apiRequirements.displayNames.length - 2} more
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Function Groups */}
      <View style={styles.skillsContainer}>
        <Text style={styles.skillsLabel}>Capabilities:</Text>
        <View style={styles.skillsRow}>
          {agent.capabilities.functionGroups.slice(0, 2).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillTagText}>{skill}</Text>
            </View>
          ))}
          {agent.capabilities.functionGroups.length > 2 && (
            <View style={styles.moreSkillsTag}>
              <Text style={styles.moreSkillsText}>
                +{agent.capabilities.functionGroups.length - 2} more
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Removed fake performance metrics */}

      {/* Call to Action */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.viewDetailsButton} onPress={onPress}>
          <Text style={styles.viewDetailsText}>View Resume</Text>
          <Ionicons name="arrow-forward" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default AgentMarketplaceCard;
