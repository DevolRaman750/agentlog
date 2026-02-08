import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastItemProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onDismiss }) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const styles = useThemedStyles((colors) => ({
    toastContainer: {
      borderRadius: 12,
      borderLeftWidth: 4,
      marginBottom: 8,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      width: '100%' as const,
    },
    toastContent: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      padding: 16,
    },
    toastIcon: {
      marginRight: 12,
      marginTop: 2,
    },
    toastTextContainer: {
      flex: 1,
      marginRight: 8,
    },
    toastTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      marginBottom: 2,
    },
    toastMessage: {
      fontSize: 14,
      lineHeight: 20,
      opacity: 0.8,
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 6,
      borderWidth: 1,
      marginRight: 8,
      marginTop: 2,
    },
    actionText: {
      fontSize: 14,
      fontWeight: '500' as const,
    },
    dismissButton: {
      padding: 4,
      borderRadius: 4,
      marginTop: 2,
    },
  }));

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, toast.duration || 4000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start(() => {
      onDismiss(toast.id);
    });
  };

  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (toast.type) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'warning': return 'warning';
      case 'info': return 'information-circle';
      default: return 'information-circle';
    }
  };

  const getColors = () => {
    switch (toast.type) {
      case 'success': return { bg: colors.accentSoft, border: colors.statusSuccess, icon: colors.statusSuccess, text: colors.accent };
      case 'error': return { bg: '#FEE2E2', border: colors.statusError, icon: colors.statusError, text: colors.statusError };
      case 'warning': return { bg: '#FEF3C7', border: '#F59E0B', icon: '#D97706', text: '#78350F' };
      case 'info': return { bg: '#DBEAFE', border: colors.statusInfo, icon: colors.statusInfo, text: '#1E3A8A' };
      default: return { bg: colors.bgSurface, border: colors.textSecondary, icon: colors.textPrimary, text: colors.textPrimary };
    }
  };

  const toastColors = getColors();
  const { width } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: toastColors.bg,
          borderLeftColor: toastColors.border,
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          maxWidth: isWeb ? 400 : width - 32,
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Ionicons
          name={getIconName()}
          size={24}
          color={toastColors.icon}
          style={styles.toastIcon}
        />

        <View style={styles.toastTextContainer}>
          <Text style={[styles.toastTitle, { color: toastColors.text }]}>
            {toast.title}
          </Text>
          {toast.message && (
            <Text style={[styles.toastMessage, { color: toastColors.text }]}>
              {toast.message}
            </Text>
          )}
        </View>

        {toast.action && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: toastColors.border }]}
            onPress={toast.action.onPress}
          >
            <Text style={[styles.actionText, { color: toastColors.icon }]}>
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={toastColors.icon} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const isWeb = Platform.OS === 'web';

  const styles = useThemedStyles(() => ({
    container: {
      position: 'absolute' as const,
      top: Platform.OS === 'web' ? 20 : 60,
      left: 0,
      right: 0,
      zIndex: 9999,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
    },
    webContainer: {
      position: 'fixed' as any,
      top: 20,
      right: 20,
      left: 'auto' as any,
      alignItems: 'flex-end' as const,
      paddingHorizontal: 0,
    },
  }));

  return (
    <View style={[styles.container, isWeb && styles.webContainer]} pointerEvents="box-none">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
};

export default ToastItem;
