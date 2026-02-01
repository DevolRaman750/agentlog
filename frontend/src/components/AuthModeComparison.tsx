import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';

interface ComparisonFeature {
  feature: string;
  pat: {
    value: string;
    description: string;
    icon: 'checkmark-circle' | 'close-circle' | 'warning';
    color: string;
  };
  githubApp: {
    value: string;
    description: string;
    icon: 'checkmark-circle' | 'close-circle' | 'warning';
    color: string;
  };
}

interface AuthModeComparisonProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'personal_access_token' | 'github_app') => void;
}

export const AuthModeComparison: React.FC<AuthModeComparisonProps> = ({
  isVisible,
  onClose,
  onSelectMode,
}) => {
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgCard,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      flex: 1,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    section: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 16,
    },
    decisionCard: {
      gap: 16,
    },
    decisionOption: {
      backgroundColor: colors.bgSurface,
      borderRadius: 12,
      padding: 16,
    },
    decisionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    useCaseItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    useCaseText: {
      fontSize: 14,
      color: colors.textPrimary,
      marginLeft: 8,
      flex: 1,
    },
    selectButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      alignItems: 'center' as const,
      marginTop: 12,
    },
    patButton: {
      backgroundColor: colors.statusSuccess,
    },
    appButton: {
      backgroundColor: colors.accent,
    },
    selectButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    comparisonTable: {
      borderRadius: 12,
      overflow: 'hidden' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    tableHeader: {
      flexDirection: 'row' as const,
      backgroundColor: colors.bgSurface,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    featureHeader: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    methodHeader: {
      flex: 1,
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      textAlign: 'center' as const,
    },
    tableRow: {
      flexDirection: 'row' as const,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      paddingVertical: 16,
      paddingHorizontal: 16,
    },
    featureCell: {
      flex: 1,
      justifyContent: 'center' as const,
    },
    featureName: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.textPrimary,
    },
    valueCell: {
      flex: 1,
      paddingHorizontal: 8,
    },
    valueHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: 4,
    },
    valueText: {
      fontSize: 13,
      fontWeight: '600' as const,
      marginLeft: 4,
    },
    valueDescription: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 14,
    },
    securityCard: {
      gap: 16,
    },
    securityItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
    },
    securityContent: {
      marginLeft: 12,
      flex: 1,
    },
    securityTitle: {
      fontSize: 15,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    securityDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    migrationCard: {
      flexDirection: 'row' as const,
      backgroundColor: colors.bgHover,
      borderRadius: 12,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    migrationContent: {
      marginLeft: 12,
      flex: 1,
    },
    migrationTitle: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    migrationDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
  }));

  const comparisonFeatures: ComparisonFeature[] = [
    {
      feature: 'Setup Difficulty',
      pat: {
        value: 'Very Easy',
        description: '2-3 minutes, just generate a token',
        icon: 'checkmark-circle',
        color: colors.statusSuccess,
      },
      githubApp: {
        value: 'Moderate',
        description: '10-15 minutes, requires app creation',
        icon: 'warning',
        color: colors.statusWarning,
      },
    },
    {
      feature: 'Rate Limits',
      pat: {
        value: '5,000/hour',
        description: 'Shared with your personal usage',
        icon: 'warning',
        color: colors.statusWarning,
      },
      githubApp: {
        value: '5,000/hour per installation',
        description: 'Dedicated limits, better for teams',
        icon: 'checkmark-circle',
        color: colors.statusSuccess,
      },
    },
    {
      feature: 'Security & Permissions',
      pat: {
        value: 'User-level',
        description: 'Uses your personal permissions',
        icon: 'warning',
        color: colors.statusWarning,
      },
      githubApp: {
        value: 'Fine-grained',
        description: 'Specific repository permissions only',
        icon: 'checkmark-circle',
        color: colors.statusSuccess,
      },
    },
    {
      feature: 'Audit Logging',
      pat: {
        value: 'Basic',
        description: 'Shows as your personal activity',
        icon: 'close-circle',
        color: colors.statusError,
      },
      githubApp: {
        value: 'Detailed',
        description: 'Clear app-specific audit trail',
        icon: 'checkmark-circle',
        color: colors.statusSuccess,
      },
    },
    {
      feature: 'Team Collaboration',
      pat: {
        value: 'Limited',
        description: 'Tied to your personal account',
        icon: 'close-circle',
        color: colors.statusError,
      },
      githubApp: {
        value: 'Excellent',
        description: 'Independent of individual users',
        icon: 'checkmark-circle',
        color: colors.statusSuccess,
      },
    },
    {
      feature: 'Token Expiration',
      pat: {
        value: 'Manual renewal',
        description: 'You set expiration, manual renewal',
        icon: 'warning',
        color: colors.statusWarning,
      },
      githubApp: {
        value: 'Auto-refresh',
        description: 'Tokens refresh automatically',
        icon: 'checkmark-circle',
        color: colors.statusSuccess,
      },
    },
    {
      feature: 'Best For',
      pat: {
        value: 'Personal projects',
        description: 'Individual developers, quick setup',
        icon: 'checkmark-circle',
        color: colors.statusSuccess,
      },
      githubApp: {
        value: 'Teams & Production',
        description: 'Organizations, better security',
        icon: 'checkmark-circle',
        color: colors.statusSuccess,
      },
    },
  ];

  const useCases = {
    pat: [
      'You\'re an individual developer',
      'You want to get started quickly',
      'You\'re working on personal projects',
      'You don\'t need advanced audit logging',
      'You\'re comfortable managing token renewals',
    ],
    githubApp: [
      'You\'re working in a team environment',
      'You need detailed audit logs',
      'You want fine-grained permissions',
      'You\'re building production applications',
      'You want automatic token management',
      'You need higher rate limits',
    ],
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Authentication Method</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Decision Guide */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Not sure which to choose?</Text>

            <View style={styles.decisionCard}>
              <View style={styles.decisionOption}>
                <Text style={styles.decisionTitle}>Choose Personal Access Token if:</Text>
                {useCases.pat.map((useCase, index) => (
                  <View key={index} style={styles.useCaseItem}>
                    <Ionicons name="checkmark" size={16} color={colors.statusSuccess} />
                    <Text style={styles.useCaseText}>{useCase}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.selectButton, styles.patButton]}
                  onPress={() => {
                    onSelectMode('personal_access_token');
                    onClose();
                  }}
                >
                  <Text style={styles.selectButtonText}>Choose Personal Access Token</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.decisionOption}>
                <Text style={styles.decisionTitle}>Choose GitHub App if:</Text>
                {useCases.githubApp.map((useCase, index) => (
                  <View key={index} style={styles.useCaseItem}>
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                    <Text style={styles.useCaseText}>{useCase}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.selectButton, styles.appButton]}
                  onPress={() => {
                    onSelectMode('github_app');
                    onClose();
                  }}
                >
                  <Text style={styles.selectButtonText}>Choose GitHub App</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Detailed Comparison Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Detailed Comparison</Text>

            <View style={styles.comparisonTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.featureHeader}>Feature</Text>
                <Text style={styles.methodHeader}>Personal Token</Text>
                <Text style={styles.methodHeader}>GitHub App</Text>
              </View>

              {comparisonFeatures.map((feature, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={styles.featureCell}>
                    <Text style={styles.featureName}>{feature.feature}</Text>
                  </View>

                  <View style={styles.valueCell}>
                    <View style={styles.valueHeader}>
                      <Ionicons
                        name={feature.pat.icon}
                        size={16}
                        color={feature.pat.color}
                      />
                      <Text style={[styles.valueText, { color: feature.pat.color }]}>
                        {feature.pat.value}
                      </Text>
                    </View>
                    <Text style={styles.valueDescription}>{feature.pat.description}</Text>
                  </View>

                  <View style={styles.valueCell}>
                    <View style={styles.valueHeader}>
                      <Ionicons
                        name={feature.githubApp.icon}
                        size={16}
                        color={feature.githubApp.color}
                      />
                      <Text style={[styles.valueText, { color: feature.githubApp.color }]}>
                        {feature.githubApp.value}
                      </Text>
                    </View>
                    <Text style={styles.valueDescription}>{feature.githubApp.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Security Considerations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security Considerations</Text>

            <View style={styles.securityCard}>
              <View style={styles.securityItem}>
                <Ionicons name="shield-checkmark" size={20} color={colors.statusSuccess} />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>Both methods are secure when used properly</Text>
                  <Text style={styles.securityDescription}>
                    GitHub uses industry-standard security practices for both authentication methods.
                  </Text>
                </View>
              </View>

              <View style={styles.securityItem}>
                <Ionicons name="key" size={20} color={colors.accent} />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>Personal tokens are simpler but broader</Text>
                  <Text style={styles.securityDescription}>
                    PATs inherit your personal permissions, which might be more than needed.
                  </Text>
                </View>
              </View>

              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={20} color={colors.statusWarning} />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>GitHub Apps offer principle of least privilege</Text>
                  <Text style={styles.securityDescription}>
                    Apps only get the specific permissions you grant, nothing more.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Migration Note */}
          <View style={styles.section}>
            <View style={styles.migrationCard}>
              <Ionicons name="information-circle" size={24} color={colors.accent} />
              <View style={styles.migrationContent}>
                <Text style={styles.migrationTitle}>You can always change later</Text>
                <Text style={styles.migrationDescription}>
                  Don't worry about making the "wrong" choice. You can switch between authentication
                  methods anytime in your API key settings. Start with what feels comfortable and
                  upgrade when you need more features.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
