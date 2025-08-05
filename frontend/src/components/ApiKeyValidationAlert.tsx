import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

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
              color="#FF9500" 
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
                  <Ionicons name="close-circle" size={16} color="#FF3B30" />
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
              <Ionicons name="key" size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>{getActionText()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  message: {
    fontSize: 16,
    color: '#3C3C43',
    lineHeight: 22,
    marginBottom: 20,
  },
  servicesList: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  servicesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 12,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  serviceName: {
    fontSize: 14,
    color: '#3C3C43',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ApiKeyValidationAlert;