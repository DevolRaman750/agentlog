import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

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
      case 'success': return { bg: '#D1FAE5', border: '#10B981', icon: '#059669', text: '#064E3B' };
      case 'error': return { bg: '#FEE2E2', border: '#EF4444', icon: '#DC2626', text: '#7F1D1D' };
      case 'warning': return { bg: '#FEF3C7', border: '#F59E0B', icon: '#D97706', text: '#78350F' };
      case 'info': return { bg: '#DBEAFE', border: '#3B82F6', icon: '#2563EB', text: '#1E3A8A' };
      default: return { bg: '#F3F4F6', border: '#6B7280', icon: '#374151', text: '#1F2937' };
    }
  };

  const colors = getColors();
  const { width } = Dimensions.get('window');
  const isWeb = Platform.OS === 'web';

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          backgroundColor: colors.bg,
          borderLeftColor: colors.border,
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
          color={colors.icon}
          style={styles.toastIcon}
        />
        
        <View style={styles.toastTextContainer}>
          <Text style={[styles.toastTitle, { color: colors.text }]}>
            {toast.title}
          </Text>
          {toast.message && (
            <Text style={[styles.toastMessage, { color: colors.text }]}>
              {toast.message}
            </Text>
          )}
        </View>

        {toast.action && (
          <TouchableOpacity
            style={[styles.actionButton, { borderColor: colors.border }]}
            onPress={toast.action.onPress}
          >
            <Text style={[styles.actionText, { color: colors.icon }]}>
              {toast.action.label}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={18} color={colors.icon} />
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

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 20 : 60,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  webContainer: {
    position: 'fixed' as any,
    top: 20,
    right: 20,
    left: 'auto',
    alignItems: 'flex-end',
    paddingHorizontal: 0,
  },
  toastContainer: {
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '100%',
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
    fontWeight: '600',
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
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
    borderRadius: 4,
    marginTop: 2,
  },
});

export default ToastItem; 