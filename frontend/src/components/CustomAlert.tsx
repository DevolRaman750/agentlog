import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export interface CustomAlertProps {
  title: string;
  message?: string;
  buttons?: AlertButton[];
  visible: boolean;
  onClose: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
  onClose: () => void;
}

// Global alert state management
let globalAlertSetter: ((state: AlertState | null) => void) | null = null;

export const CustomAlert: React.FC = () => {
  const [alertState, setAlertState] = useState<AlertState | null>(null);

  useEffect(() => {
    globalAlertSetter = setAlertState;
    return () => {
      globalAlertSetter = null;
    };
  }, []);

  if (!alertState?.visible) {
    return null;
  }

  const handleButtonPress = (button: AlertButton) => {
    if (button.onPress) {
      button.onPress();
    }
    alertState.onClose();
  };

  const getButtonStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return [styles.button, styles.cancelButton];
      case 'destructive':
        return [styles.button, styles.destructiveButton];
      default:
        return [styles.button, styles.defaultButton];
    }
  };

  const getButtonTextStyle = (style?: string) => {
    switch (style) {
      case 'cancel':
        return [styles.buttonText, styles.cancelButtonText];
      case 'destructive':
        return [styles.buttonText, styles.destructiveButtonText];
      default:
        return [styles.buttonText, styles.defaultButtonText];
    }
  };

  return (
    <Modal
      visible={alertState.visible}
      transparent={true}
      animationType="fade"
      onRequestClose={alertState.onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Text style={styles.alertTitle}>{alertState.title}</Text>
          </View>
          
          {alertState.message && (
            <View style={styles.alertBody}>
              <Text style={styles.alertMessage}>{alertState.message}</Text>
            </View>
          )}
          
          <View style={styles.alertFooter}>
            {alertState.buttons.map((button, index) => (
              <TouchableOpacity
                key={index}
                style={getButtonStyle(button.style)}
                onPress={() => handleButtonPress(button)}
                activeOpacity={0.7}
                hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
              >
                <Text style={getButtonTextStyle(button.style)}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Custom Alert API that mimics React Native Alert
export const AlertAPI = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[]
  ) => {
    // On web, use our custom alert
    if (Platform.OS === 'web') {
      const defaultButtons: AlertButton[] = buttons || [
        { text: 'OK', style: 'default' }
      ];

      if (globalAlertSetter) {
        globalAlertSetter({
          visible: true,
          title,
          message,
          buttons: defaultButtons,
          onClose: () => {
            if (globalAlertSetter) {
              globalAlertSetter(null);
            }
          },
        });
      }
    } else {
      // On mobile, use native Alert
      RNAlert.alert(title, message, buttons as any);
    }
  },
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
    borderRadius: 12,
    minWidth: 280,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  alertHeader: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  alertTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  alertBody: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  alertMessage: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 20,
  },
  alertFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  defaultButton: {
    backgroundColor: '#FFFFFF',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
  },
  destructiveButton: {
    backgroundColor: '#FFFFFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  defaultButtonText: {
    color: '#007AFF',
  },
  cancelButtonText: {
    color: '#8E8E93',
    fontWeight: '400',
  },
  destructiveButtonText: {
    color: '#FF3B30',
    fontWeight: '600',
  },
}); 