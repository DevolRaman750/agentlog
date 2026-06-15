import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { SessionManager } from './SessionManager';
import { AlertAPI } from './CustomAlert';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

export const UserStatusBar: React.FC = () => {
  const { user, isAuthenticated, logout, createTemporaryUser } = useAuth();
  const { clearSession } = useApp();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [showSessionManager, setShowSessionManager] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const isNarrowScreen = screenWidth < 500;

  const styles = useThemedStyles((colors) => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      paddingTop: Platform.OS === 'ios' ? 32 : spacing.sm,
      minHeight: Platform.OS === 'ios' ? 60 : 48,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    leftSection: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
      gap: spacing.sm,
      minWidth: 0,
      paddingRight: spacing.sm,
    },
    textContainer: {
      flex: 1,
      minWidth: 0,
    },
    title: {
      ...typography.label,
      fontWeight: '700' as const,
      letterSpacing: 0.3,
    },
    subtitle: {
      ...typography.micro,
      marginTop: 1,
    },
    warningBadge: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.none,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.25)',
      flexShrink: 0,
      marginRight: spacing.xs,
    },
    warningBadgeCompact: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 1,
      borderRadius: radius.sm,
    },
    warningText: {
      fontSize: 8,
      fontWeight: '700' as const,
      color: colors.textInverse,
      letterSpacing: 0.3,
    },
    warningTextCompact: {
      fontSize: 7,
      letterSpacing: 0.2,
    },
    rightSection: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
      flexShrink: 0,
    },
    actionButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
      gap: spacing.xs,
      minWidth: 60,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    logoutButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.25)',
    },
    logoutButtonText: {
      ...typography.micro,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    sessionButton: {
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
    sessionButtonText: {
      ...typography.micro,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
  }));

  const handleLogout = () => {
    AlertAPI.alert(
      'Logout',
      'You will be logged out but your configurations and data will be preserved. You can log back in anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            try {
              console.log('Logging out user...');
              await logout();
              console.log('User logged out successfully');

              AlertAPI.alert(
                'Logged Out',
                'You have been logged out successfully. Your data has been preserved.',
                [{ text: 'OK' }]
              );
            } catch (error) {
              console.error('Logout failed:', error);
              AlertAPI.alert(
                'Error',
                `Failed to logout: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          },
        },
      ]
    );
  };

  const getUserStatusInfo = () => {
    if (!user) {
      return {
        icon: 'person-outline' as any,
        color: colors.textSecondary,
        backgroundColor: colors.bgApp,
        title: 'No User',
        subtitle: 'Not authenticated',
        isTemp: false,
        showWarning: true,
      };
    }

    if (user.is_temporary) {
      return {
        icon: 'warning' as any,
        color: colors.textInverse,
        backgroundColor: colors.accentSecondary,
        title: isNarrowScreen ? 'TEMP SESSION' : 'TEMPORARY SESSION',
        subtitle: `User: ${user.username}`,
        isTemp: true,
        showWarning: true,
      };
    }

    return {
      icon: 'checkmark-circle' as any,
      color: colors.textInverse,
      backgroundColor: colors.statusSuccess,
      title: 'Authenticated',
      subtitle: `${user.username} (${user.email || 'no email'})`,
      isTemp: false,
      showWarning: false,
    };
  };

  const statusInfo = getUserStatusInfo();

  return (
    <>
      <View style={[styles.container, { backgroundColor: statusInfo.backgroundColor }]}>
        <View style={styles.leftSection}>
          <Ionicons name={statusInfo.icon} size={18} color={statusInfo.color} />
          <View style={[styles.textContainer, { minWidth: 0 }]}>
            <Text
              style={[styles.title, { color: statusInfo.color }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {statusInfo.title}
            </Text>
            <Text
              style={[styles.subtitle, { color: statusInfo.color, opacity: 0.9 }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {statusInfo.subtitle}
            </Text>
          </View>
          {statusInfo.showWarning && statusInfo.isTemp && (
            <View style={[styles.warningBadge, isNarrowScreen && styles.warningBadgeCompact]}>
              <Text style={[styles.warningText, isNarrowScreen && styles.warningTextCompact]}>
                {isNarrowScreen ? 'NOT SAVED' : 'DATA NOT SAVED'}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.rightSection, { marginLeft: statusInfo.showWarning && statusInfo.isTemp ? 12 : 0 }]}>
          {statusInfo.isTemp ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.sessionButton]}
              onPress={() => {
                console.log('Session button touched - Platform:', Platform.OS);
                setShowSessionManager(true);
              }}
            >
              <Ionicons name="settings" size={14} color={colors.accentSecondary} />
              <Text style={styles.sessionButtonText}>Session</Text>
            </TouchableOpacity>
          ) : isAuthenticated ? (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
              >
                <Ionicons name="log-out" size={14} color={colors.statusSuccess} />
                <Text style={styles.logoutButtonText}>Logout</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.sessionButton]}
                onPress={() => setShowSessionManager(true)}
              >
                <Ionicons name="person-circle" size={14} color={colors.statusSuccess} />
                <Text style={styles.sessionButtonText}>Account</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.sessionButton]}
              onPress={() => navigation.navigate('Auth' as never)}
            >
              <Ionicons name="person-add" size={14} color={colors.textSecondary} />
              <Text style={styles.sessionButtonText}>Login</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <SessionManager
        visible={showSessionManager}
        onClose={() => setShowSessionManager(false)}
      />
    </>
  );
};
