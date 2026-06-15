import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

interface ApiKeyValidationAlertProps {
  visible: boolean;
  onClose: () => void;
  missingServices: string[];
  hasGeminiKey: boolean;
  title?: string;
  message?: string;
}

const ApiKeyValidationAlert: React.FC<ApiKeyValidationAlertProps> = ({
  visible,
  onClose,
  missingServices,
  hasGeminiKey,
  title = "Missing API Keys",
  message
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
    },
    alertContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.xl,
      padding: spacing.lg,
      maxWidth: 400,
      width: '100%' as const,
      maxHeight: '90%' as const,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
    },
    icon: {
      marginRight: spacing.md,
    },
    title: {
      ...typography.h1,
      color: colors.textPrimary,
      flex: 1,
    },
    message: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    servicesList: {
      marginBottom: spacing.lg,
      paddingTop: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    servicesTitle: {
      ...typography.label,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    serviceItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    serviceName: {
      ...typography.body,
      color: colors.textSecondary,
    },
    buttonContainer: {
      flexDirection: 'row' as const,
      gap: spacing.md,
    },
    cancelButton: {
      flex: 1,
      minHeight: touchTarget.min,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.bgApp,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    cancelButtonText: {
      ...typography.title,
      color: colors.textSecondary,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row' as const,
      minHeight: touchTarget.min,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: spacing.sm,
    },
    actionButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
  }));

  const getServiceDisplayName = (serviceName: string): string => {
    const serviceMap: Record<string, string> = {
      'gemini': 'Google Gemini',
      'openweather': 'OpenWeather',
      'neo4j': 'Neo4j',
      'github': 'GitHub',
      'slack': 'Slack',
      'discord': 'Discord',
      'openai': 'OpenAI',
      'openrouter': 'OpenRouter'
    };
    return serviceMap[serviceName] || serviceName;
  };

  const handleGoToApiKeys = () => {
    onClose();
    navigation.navigate('API Keys' as never);
  };

  const getAlertMessage = () => {
    if (message) return message;

    if (!hasGeminiKey) {
      return "A Gemini API key is required for all executions. Please add one to continue.";
    }

    if (missingServices.length > 0) {
      const serviceNames = missingServices.map(getServiceDisplayName).join(', ');
      return `The selected functions require API keys for: ${serviceNames}. Please configure these keys before execution.`;
    }

    return "Please configure the required API keys before proceeding.";
  };

  const getActionText = () => {
    if (!hasGeminiKey) return "Add Gemini Key";
    return "Configure API Keys";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={styles.header}>
            <Ionicons
              name="key-outline"
              size={24}
              color={colors.statusWarning}
              style={styles.icon}
            />
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.message}>{getAlertMessage()}</Text>

          {missingServices.length > 0 && (
            <View style={styles.servicesList}>
              <Text style={styles.servicesTitle}>Missing services:</Text>
              {missingServices.map((service, index) => (
                <View key={service} style={styles.serviceItem}>
                  <Ionicons name="close-circle" size={16} color={colors.statusError} />
                  <Text style={styles.serviceName}>{getServiceDisplayName(service)}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleGoToApiKeys}
            >
              <Ionicons name="key" size={16} color={colors.textInverse} />
              <Text style={styles.actionButtonText}>{getActionText()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ApiKeyValidationAlert;
