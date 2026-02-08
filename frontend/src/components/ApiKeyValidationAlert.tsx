import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, useThemedStyles } from '../theme';

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
      padding: 20,
    },
    alertContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: 16,
      padding: 24,
      maxWidth: 400,
      width: '100%' as const,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 16,
    },
    icon: {
      marginRight: 12,
    },
    title: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.textPrimary,
      flex: 1,
    },
    message: {
      fontSize: 16,
      color: colors.textSecondary,
      lineHeight: 22,
      marginBottom: 20,
    },
    servicesList: {
      marginBottom: 20,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    servicesTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    serviceItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
      gap: 8,
    },
    serviceName: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    buttonContainer: {
      flexDirection: 'row' as const,
      gap: 12,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: colors.bgApp,
      alignItems: 'center' as const,
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row' as const,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      gap: 8,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
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
