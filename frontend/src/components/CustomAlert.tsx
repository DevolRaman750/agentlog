import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  Alert as RNAlert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemedStyles } from '../theme';
import { ThemeColors } from '../theme';

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

  const styles = useThemedStyles((colors: ThemeColors) => ({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    alertContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      minWidth: 280,
      maxWidth: 400,
      shadowColor: colors.shadowColor,
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
      fontWeight: '600' as const,
      color: colors.textPrimary,
      textAlign: 'center' as const,
    },
    alertBody: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    alertMessage: {
      fontSize: 14,
      color: colors.textPrimary,
      textAlign: 'center' as const,
      lineHeight: 20,
    },
    alertFooter: {
      flexDirection: 'row' as const,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      borderRightWidth: 1,
      borderRightColor: colors.borderLight,
    },
    defaultButton: {
      backgroundColor: colors.bgCard,
    },
    cancelButton: {
      backgroundColor: colors.bgSurface,
    },
    destructiveButton: {
      backgroundColor: colors.bgCard,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '500' as const,
    },
    defaultButtonText: {
      color: colors.accent,
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontWeight: '400' as const,
    },
    destructiveButtonText: {
      color: colors.statusError,
      fontWeight: '600' as const,
    },
  }));

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
