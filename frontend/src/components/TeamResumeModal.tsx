import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceTeam } from '../types/marketplace';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

interface TeamResumeModalProps {
  visible: boolean;
  team: MarketplaceTeam | null;
  onClose: () => void;
  onHire?: (sharedTeamContext?: string) => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TeamResumeModal: React.FC<TeamResumeModalProps> = ({
  visible,
  team,
  onClose,
  onHire,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgSurface,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    closeButton: {
      padding: spacing.xs,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    placeholder: {
      width: 32,
    },
    content: {
      flex: 1,
    },
    teamHeader: {
      flexDirection: 'row' as const,
      padding: spacing.lg,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    teamAvatar: {
      width: 80,
      height: 80,
      borderRadius: radius.pill,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: spacing.lg,
    },
    teamAvatarText: {
      fontSize: 32,
      fontWeight: 'bold' as const,
    },
    teamInfo: {
      flex: 1,
    },
    teamName: {
      ...typography.display,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    teamCategory: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    teamMetrics: {
      flexDirection: 'row' as const,
      gap: spacing.lg,
    },
    metric: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    metricText: {
      ...typography.label,
      color: colors.textSecondary,
    },
    section: {
      backgroundColor: colors.bgCard,
      marginTop: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    description: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    agentCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    agentHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.sm,
    },
    agentInfo: {
      flex: 1,
    },
    agentName: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    agentRole: {
      ...typography.label,
      color: colors.accent,
    },
    agentConfig: {
      alignItems: 'flex-end' as const,
    },
    configText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    agentDescription: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    agentCapabilities: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    capabilityTag: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    capabilityTagText: {
      ...typography.caption,
      fontWeight: '500' as const,
      color: colors.accent,
    },
    moreCapabilities: {
      ...typography.caption,
      fontWeight: '500' as const,
      color: colors.accent,
      alignSelf: 'center' as const,
    },
    capabilityItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    capabilityText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginLeft: spacing.md,
      flex: 1,
    },
    tagContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    coverageTag: {
      backgroundColor: `${colors.statusSuccess}15`,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    coverageTagText: {
      ...typography.label,
      color: colors.statusSuccess,
    },
    integrationTag: {
      backgroundColor: `${colors.statusWarning}15`,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    integrationTagText: {
      ...typography.label,
      color: colors.statusWarning,
    },
    apiKeyItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    apiKeyText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginLeft: spacing.md,
    },
    highlightItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.sm,
    },
    highlightText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginLeft: spacing.md,
      flex: 1,
    },
    testimonialCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    testimonialText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      fontStyle: 'italic' as const,
      lineHeight: 24,
      marginBottom: spacing.md,
    },
    testimonialAuthor: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    authorName: {
      ...typography.label,
      color: colors.textSecondary,
    },
    rating: {
      flexDirection: 'row' as const,
      gap: 2,
    },
    contextDescription: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    contextInput: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      minHeight: 100,
      maxHeight: 150,
    },
    characterCount: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'right' as const,
      marginTop: spacing.xs,
    },
    bottomPadding: {
      height: 100,
    },
    actionContainer: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    hireButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
      minHeight: touchTarget.min,
    },
    hireButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
  }));

  const [sharedTeamContext, setSharedTeamContext] = useState('');

  if (!team) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Team Header */}
          <View style={styles.teamHeader}>
            <View style={[styles.teamAvatar, { backgroundColor: team.avatar.backgroundColor }]}>
              <Text style={[styles.teamAvatarText, { color: team.avatar.textColor }]}>
                {team.avatar.icon}
              </Text>
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamCategory}>{team.category}</Text>
              <View style={styles.teamMetrics}>
                <View style={styles.metric}>
                  <Ionicons name="people" size={16} color={colors.accent} />
                  <Text style={styles.metricText}>{team.teamSize} Agents</Text>
                </View>
                <View style={styles.metric}>
                  <Ionicons name="card" size={16} color={colors.statusSuccess} />
                  <Text style={styles.metricText}>{team.estimatedCost}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Team</Text>
            <Text style={styles.description}>{team.description}</Text>
          </View>

          {/* Team Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Members ({team.agents.length})</Text>
            {team.agents.map((agent, index) => (
              <View key={index} style={styles.agentCard}>
                <View style={styles.agentHeader}>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentRole}>{agent.role}</Text>
                  </View>
                  <View style={styles.agentConfig}>
                    <Text style={styles.configText}>
                      {agent.defaultConfig.maxTokensPerDay.toLocaleString()} tokens/day
                    </Text>
                    <Text style={styles.configText}>
                      {agent.defaultConfig.heartbeatMinutes}min intervals
                    </Text>
                  </View>
                </View>
                <Text style={styles.agentDescription}>{agent.description}</Text>
                <View style={styles.agentCapabilities}>
                  {agent.capabilities.slice(0, 3).map((capability, capIndex) => (
                    <View key={capIndex} style={styles.capabilityTag}>
                      <Text style={styles.capabilityTagText}>{capability}</Text>
                    </View>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Text style={styles.moreCapabilities}>
                      +{agent.capabilities.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Capabilities Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Capabilities</Text>
            {team.capabilities.overview.map((capability, index) => (
              <View key={index} style={styles.capabilityItem}>
                <Ionicons name="checkmark-circle" size={20} color={colors.statusSuccess} />
                <Text style={styles.capabilityText}>{capability}</Text>
              </View>
            ))}
          </View>

          {/* Coverage Areas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coverage Areas</Text>
            <View style={styles.tagContainer}>
              {team.capabilities.coverage.map((area, index) => (
                <View key={index} style={styles.coverageTag}>
                  <Text style={styles.coverageTagText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Integrations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Integrations</Text>
            <View style={styles.tagContainer}>
              {team.capabilities.integrations.map((integration, index) => (
                <View key={index} style={styles.integrationTag}>
                  <Text style={styles.integrationTagText}>{integration}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* API Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required API Keys</Text>
            {team.apiRequirements.displayNames.map((keyName, index) => (
              <View key={index} style={styles.apiKeyItem}>
                <Ionicons name="key" size={16} color={colors.statusWarning} />
                <Text style={styles.apiKeyText}>{keyName}</Text>
              </View>
            ))}
          </View>

          {/* Highlights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Highlights</Text>
            {team.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <Ionicons name="star" size={16} color={colors.statusWarning} />
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>

          {/* Testimonial */}
          {team.testimonial && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Testimonial</Text>
              <View style={styles.testimonialCard}>
                <Text style={styles.testimonialText}>"{team.testimonial.text}"</Text>
                <View style={styles.testimonialAuthor}>
                  <Text style={styles.authorName}>{team.testimonial.author}</Text>
                  <View style={styles.rating}>
                    {[...Array(team.testimonial.rating)].map((_, i) => (
                      <Ionicons key={i} name="star" size={14} color={colors.statusWarning} />
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Shared Team Context */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Shared Team Context (Optional)</Text>
            <Text style={styles.contextDescription}>
              Provide additional context, instructions, or knowledge that all agents in this team should share. This will be appended to each agent's individual context.
            </Text>
            <TextInput
              style={styles.contextInput}
              placeholder="e.g., Project guidelines, company policies, specific requirements, shared knowledge..."
              placeholderTextColor={colors.textSecondary}
              value={sharedTeamContext}
              onChangeText={setSharedTeamContext}
              multiline
              numberOfLines={4}
              maxLength={2000}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {sharedTeamContext.length}/2000 characters
            </Text>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.hireButton}
            onPress={() => onHire?.(sharedTeamContext.trim() || undefined)}
          >
            <Ionicons name="add-circle" size={20} color={colors.textInverse} />
            <Text style={styles.hireButtonText}>Deploy This Team</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default TeamResumeModal;
