import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
import { MarketplaceAgent } from '../types/marketplace';
import ScreenContainer from './ScreenContainer';
import { FunctionDefinition } from '../types/index';
import { goGentAPI } from '../api/client';

interface AgentResumeModalProps {
  visible: boolean;
  agent: MarketplaceAgent | null;
  onClose: () => void;
  onHire?: () => void;
}

const { width } = Dimensions.get('window');

const AgentResumeModal: React.FC<AgentResumeModalProps> = ({
  visible,
  agent,
  onClose,
  onHire,
}) => {
  const { colors } = useTheme();
  const [availableFunctions, setAvailableFunctions] = useState<FunctionDefinition[]>([]);
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(false);

  const styles = useThemedStyles((colors) => ({
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.bgCard,
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
    headerSpacer: {
      width: 32,
    },
    profileSection: {
      backgroundColor: colors.bgCard,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    profileHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.lg,
    },
    avatarContainer: {
      position: 'relative' as const,
      marginRight: spacing.lg,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: radius.pill,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    avatarText: {
      ...typography.display,
      fontWeight: 'bold' as const,
    },
    availabilityDot: {
      position: 'absolute' as const,
      bottom: spacing.xs,
      right: spacing.xs,
      width: 20,
      height: 20,
      borderRadius: radius.lg,
      borderWidth: 3,
      borderColor: colors.bgCard,
    },
    profileInfo: {
      flex: 1,
    },
    agentName: {
      ...typography.display,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    agentRole: {
      ...typography.h2,
      fontWeight: '500' as const,
      color: colors.accent,
      marginBottom: spacing.md,
    },
    profileMeta: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.lg,
    },
    experienceBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
    },
    experienceText: {
      ...typography.label,
      fontWeight: '600' as const,
    },
    availability: {
      ...typography.label,
      color: colors.textSecondary,
    },
    apiRequirementsSection: {
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    apiRequirementsTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    apiRequirementsContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    apiRequirementTag: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      gap: spacing.sm,
    },
    apiRequirementText: {
      ...typography.label,
      color: colors.accent,
    },
    modelConfigSection: {
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      borderRadius: radius.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    modelConfigTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    modelConfigContainer: {
      gap: spacing.sm,
    },
    modelConfigRow: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    modelConfigLabel: {
      ...typography.label,
      color: colors.textSecondary,
    },
    modelConfigValue: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    section: {
      backgroundColor: colors.bgCard,
      padding: spacing.lg,
      marginTop: spacing.sm,
    },
    sectionTitle: {
      ...typography.h1,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    description: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      lineHeight: 24,
    },
    highlight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
      gap: spacing.md,
    },
    highlightText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      flex: 1,
      lineHeight: 22,
    },
    subsection: {
      marginBottom: spacing.xl,
    },
    subsectionTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    capabilitiesGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
    },
    capabilityCard: {
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center' as const,
      minWidth: 120,
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    capabilityTitle: {
      ...typography.label,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    capabilityCount: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    specialtiesContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    specialtyTag: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
    },
    specialtyText: {
      ...typography.label,
      color: colors.accent,
    },
    toolsContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    toolTag: {
      backgroundColor: colors.bgApp,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
    },
    toolText: {
      ...typography.label,
      color: colors.textPrimary,
    },
    statsGrid: {
      flexDirection: 'row' as const,
      gap: spacing.lg,
    },
    statCard: {
      flex: 1,
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center' as const,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    statNumber: {
      ...typography.display,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    statLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    templateCard: {
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    templateHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
      gap: spacing.md,
    },
    templateInfo: {
      flex: 1,
    },
    templateName: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    templateCategory: {
      ...typography.body,
      color: colors.textSecondary,
    },
    templateDescription: {
      ...typography.body,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    actionContainer: {
      flexDirection: 'row' as const,
      gap: spacing.md,
      padding: spacing.lg,
      backgroundColor: colors.bgCard,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: colors.bgApp,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: touchTarget.min,
    },
    secondaryButtonText: {
      ...typography.title,
      color: colors.textPrimary,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: colors.accent,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
      minHeight: touchTarget.min,
    },
    primaryButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
  }));

  // Fetch available functions when modal opens
  useEffect(() => {
    if (visible && agent) {
      loadAvailableFunctions();
    }
  }, [visible, agent]);

  const loadAvailableFunctions = async () => {
    setIsLoadingFunctions(true);
    try {
      const response = await goGentAPI.getFunctions();

      if (response.success && response.data) {
        const functions = response.data;
        // Filter to only active functions
        const activeFunctions = functions.filter(f => f.isActive);
        setAvailableFunctions(activeFunctions);
      } else {
        setAvailableFunctions([]);
      }
    } catch (error) {
      console.error('Error loading functions:', error);
      setAvailableFunctions([]);
    } finally {
      setIsLoadingFunctions(false);
    }
  };

  if (!agent) return null;

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'Expert': return colors.statusError;
      case 'Senior': return colors.statusWarning;
      case 'Mid-Level': return colors.accent;
      case 'Junior': return colors.statusSuccess;
      default: return colors.textSecondary;
    }
  };

  const getFunctionGroupIcon = (group: string) => {
    switch (group.toLowerCase()) {
      case 'github (read-only)':
      case 'github (full access)':
        return 'logo-github';
      case 'slack communication':
        return 'chatbubbles';
      case 'weather api':
        return 'partly-sunny';
      default:
        return 'extension-puzzle';
    }
  };

  // Map marketplace agent function groups to actual database function groups
  const groupMapping: { [key: string]: string } = {
    'github (read-only)': 'github',
    'github (full access)': 'github',
    'slack communication': 'communication',
    'weather api': 'weather'
  };

  // Function to get the count of functions for a specific group based on actual function data
  const getFunctionCountForGroup = (group: string) => {
    if (isLoadingFunctions || availableFunctions.length === 0) {
      // Fallback to the specificFunctions array if we don't have real function data
      return agent.capabilities.specificFunctions.filter(func =>
        func.toLowerCase().includes(group.toLowerCase().replace(' ', ''))
      ).length;
    }

    const actualGroup = groupMapping[group.toLowerCase()] || group.toLowerCase();

    // Use real function data to count functions in this group
    const functionsInGroup = availableFunctions.filter(func =>
      func.functionGroup.toLowerCase() === actualGroup
    );

    return functionsInGroup.length;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScreenContainer enableScrolling={true}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agent Resume</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Agent Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
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

            <View style={styles.profileInfo}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentRole}>{agent.role}</Text>
                          <View style={styles.profileMeta}>
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
              {/* Removed availability status - no fake metrics */}
            </View>
            </View>
          </View>

          {/* API Requirements */}
          <View style={styles.apiRequirementsSection}>
            <Text style={styles.apiRequirementsTitle}>Required API Keys</Text>
            <View style={styles.apiRequirementsContainer}>
              {agent.apiRequirements.displayNames.map((displayName, index) => (
                <View key={index} style={styles.apiRequirementTag}>
                  <Ionicons name="key" size={16} color={colors.accent} />
                  <Text style={styles.apiRequirementText}>{displayName}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Model Configuration */}
          <View style={styles.modelConfigSection}>
            <Text style={styles.modelConfigTitle}>AI Model Configuration</Text>
            <View style={styles.modelConfigContainer}>
              <View style={styles.modelConfigRow}>
                <Text style={styles.modelConfigLabel}>Model:</Text>
                <Text style={styles.modelConfigValue}>{agent.modelConfig.modelName}</Text>
              </View>
              <View style={styles.modelConfigRow}>
                <Text style={styles.modelConfigLabel}>Configuration:</Text>
                <Text style={styles.modelConfigValue}>{agent.modelConfig.configName}</Text>
              </View>
              <View style={styles.modelConfigRow}>
                <Text style={styles.modelConfigLabel}>Temperature:</Text>
                <Text style={styles.modelConfigValue}>{agent.modelConfig.temperature}</Text>
              </View>
              <View style={styles.modelConfigRow}>
                <Text style={styles.modelConfigLabel}>Max Tokens:</Text>
                <Text style={styles.modelConfigValue}>{agent.modelConfig.maxTokens}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{agent.description}</Text>
        </View>

        {/* Key Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Strengths</Text>
          {agent.highlights.map((highlight, index) => (
            <View key={index} style={styles.highlight}>
              <Ionicons name="checkmark-circle" size={20} color={colors.statusSuccess} />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>

        {/* Technical Capabilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Capabilities</Text>

          {/* Integration Groups */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Available Integrations</Text>
            <View style={styles.capabilitiesGrid}>
              {agent.capabilities.functionGroups.map((group, index) => (
                <View key={index} style={styles.capabilityCard}>
                  <Ionicons
                    name={getFunctionGroupIcon(group)}
                    size={24}
                    color={colors.accent}
                  />
                  <Text style={styles.capabilityTitle}>{group}</Text>
                  <Text style={styles.capabilityCount}>
                    {getFunctionCountForGroup(group)} functions
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Specialties */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Specialties</Text>
            <View style={styles.specialtiesContainer}>
              {agent.capabilities.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tools & Technologies */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Tools & Technologies</Text>
            <View style={styles.toolsContainer}>
              {agent.capabilities.tools.map((tool, index) => (
                <View key={index} style={styles.toolTag}>
                  <Text style={styles.toolText}>{tool}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>



        {/* Template Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Execution Template</Text>
          <View style={styles.templateCard}>
            <View style={styles.templateHeader}>
              <Ionicons name="document-text" size={24} color={colors.accent} />
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{agent.templateName}</Text>
                <Text style={styles.templateCategory}>{agent.category}</Text>
              </View>
            </View>
            <Text style={styles.templateDescription}>
              This agent is powered by a specialized execution template designed for {agent.category.toLowerCase()} tasks.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>View More Agents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={onHire}>
            <Ionicons name="person-add" size={20} color={colors.textInverse} />
            <Text style={styles.primaryButtonText}>Hire This Agent</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </Modal>
  );
};

export default AgentResumeModal;
