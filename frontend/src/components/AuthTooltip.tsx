import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

interface AuthTooltipProps {
  title: string;
  description: string;
  steps?: string[];
  links?: Array<{
    text: string;
    url: string;
    description?: string;
  }>;
  warnings?: string[];
  benefits?: string[];
  children: React.ReactNode;
}

export const AuthTooltip: React.FC<AuthTooltipProps> = ({
  title,
  description,
  steps,
  links,
  warnings,
  benefits,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
    },
    fieldContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
    },
    helpButton: {
      marginLeft: spacing.sm,
      padding: spacing.xs,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.bgCard,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      flex: 1,
    },
    closeButton: {
      padding: spacing.xs,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    section: {
      marginVertical: spacing.md,
    },
    sectionTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    description: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    listItem: {
      flexDirection: 'row' as const,
      marginBottom: spacing.sm,
      alignItems: 'flex-start' as const,
    },
    bulletPoint: {
      ...typography.body,
      fontSize: 15,
      color: colors.accent,
      marginRight: spacing.sm,
      marginTop: 1,
    },
    listText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
      flex: 1,
    },
    stepItem: {
      flexDirection: 'row' as const,
      marginBottom: spacing.md,
      alignItems: 'flex-start' as const,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: radius.lg,
      backgroundColor: colors.accent,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.md,
      marginTop: spacing.none,
    },
    stepNumberText: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    stepText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
      flex: 1,
    },
    warningItem: {
      flexDirection: 'row' as const,
      marginBottom: spacing.md,
      alignItems: 'flex-start' as const,
      backgroundColor: `${colors.statusWarning}15`,
      padding: spacing.md,
      borderRadius: radius.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.statusWarning,
    },
    warningText: {
      ...typography.body,
      color: colors.statusWarning,
      marginLeft: spacing.sm,
      flex: 1,
    },
    linkItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.bgApp,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
      minHeight: touchTarget.min,
    },
    linkContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
    },
    linkTextContainer: {
      marginLeft: spacing.md,
      flex: 1,
    },
    linkText: {
      ...typography.body,
      fontSize: 15,
      fontWeight: '500' as const,
      color: colors.accent,
    },
    linkDescription: {
      ...typography.label,
      color: colors.textSecondary,
      marginTop: spacing.none,
    },
  }));

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.fieldContainer}>
        {children}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setIsVisible(true)}
          accessibilityLabel={`Help for ${title}`}
        >
          <Ionicons name="help-circle" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What is this?</Text>
              <Text style={styles.description}>{description}</Text>
            </View>

            {/* Benefits */}
            {benefits && benefits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Benefits</Text>
                {benefits.map((benefit, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bulletPoint}>{'\u2022'}</Text>
                    <Text style={styles.listText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Step-by-step guide */}
            {steps && steps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>How to set this up</Text>
                {steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Important Notes</Text>
                {warnings.map((warning, index) => (
                  <View key={index} style={styles.warningItem}>
                    <Ionicons name="warning" size={16} color={colors.statusWarning} />
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Documentation links */}
            {links && links.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Official Documentation</Text>
                {links.map((link, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.linkItem}
                    onPress={() => openLink(link.url)}
                  >
                    <View style={styles.linkContent}>
                      <Ionicons name="open-outline" size={16} color={colors.accent} />
                      <View style={styles.linkTextContainer}>
                        <Text style={styles.linkText}>{link.text}</Text>
                        {link.description && (
                          <Text style={styles.linkDescription}>{link.description}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};
