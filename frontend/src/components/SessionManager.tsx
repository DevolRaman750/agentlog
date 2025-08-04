import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { AlertAPI } from './CustomAlert';

interface SessionManagerProps {
  visible: boolean;
  onClose: () => void;
}

interface SessionInfo {
  totalKeys: number;
  authKeys: number;
  configKeys: number;
  apiKeyCount: number;
  lastActivity: string | null;
  userType: 'authenticated' | 'temporary' | 'none';
}

export const SessionManager: React.FC<SessionManagerProps> = ({
  visible,
  onClose,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { clearSession, exportSessionData, importSessionData } = useApp();
  const navigation = useNavigation();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showExportData, setShowExportData] = useState<string | null>(null);

  // Load session information
  const loadSessionInfo = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      
      // DEBUG: Log all keys to see what's being counted
      console.log('🔍 DEBUG: All AsyncStorage keys:', allKeys);
      console.log('📊 DEBUG: Total key count:', allKeys.length);
      
      // Filter out system/framework keys that aren't user-relevant
      const systemKeys = allKeys.filter(key => 
        key.includes('Expo') || 
        key.includes('RCT') || 
        key.includes('ReactNative') ||
        key.includes('expo-') ||
        key.includes('@react-native') ||
        key.includes('AsyncStorage') ||
        key.includes('ExponentDeviceId') ||
        key.includes('ExponentPushToken') ||
        key.includes('test_') || 
        key.includes('debug_') || 
        key.includes('dev_')
      );
      
      // Get only user-relevant keys (excluding system keys)
      const userRelevantKeys = allKeys.filter(key => !systemKeys.includes(key));
      
      // Categorize user-relevant keys
      const authKeys = userRelevantKeys.filter(key => key.includes('auth_') || key.includes('temp_password'));
      const configKeys = userRelevantKeys.filter(key => key.includes('configurations') || key.includes('appConfig') || key.includes('recentExecutions'));
      const apiKeyStorageKeys = userRelevantKeys.filter(key => key.includes('@gogent_encrypted_api_keys') || key.includes('@gogent_session_api_keys'));
      
      // Remaining user keys (non-categorized but still user-relevant)
      const otherUserKeys = userRelevantKeys.filter(key => 
        !authKeys.includes(key) && 
        !configKeys.includes(key) && 
        !apiKeyStorageKeys.includes(key)
      );
      
      // DEBUG: Show categorization with user-filtered results
      console.log('🔐 DEBUG: Auth keys:', authKeys);
      console.log('⚙️ DEBUG: Config keys:', configKeys);
      console.log('🔑 DEBUG: API Key storage keys:', apiKeyStorageKeys);
      console.log('📱 DEBUG: System/Framework keys (filtered out):', systemKeys.length, systemKeys);
      console.log('❓ DEBUG: Other user keys:', otherUserKeys);
      console.log('✅ DEBUG: User-relevant keys total:', userRelevantKeys.length, 'vs All keys:', allKeys.length);
      
      // Check API key count
      let apiKeyCount = 0;
      try {
        const { secureStorage } = require('../utils/secureStorage');
        const apiKeys = await secureStorage.loadApiKeys();
        apiKeyCount = Object.values(apiKeys).filter(key => key && typeof key === 'string' && key.trim()).length;
      } catch (error) {
        console.warn('Could not load API key count:', error);
      }

      // Get last activity (rough estimate from created timestamps)
      let lastActivity = null;
      try {
        const recentExecutions = await AsyncStorage.getItem('recentExecutions');
        if (recentExecutions) {
          const executions = JSON.parse(recentExecutions);
          if (executions.length > 0) {
            lastActivity = executions[0].createdAt;
          }
        }
      } catch (error) {
        // Ignore error
      }

      const userType = user?.is_temporary ? 'temporary' : (isAuthenticated ? 'authenticated' : 'none');

      setSessionInfo({
        totalKeys: userRelevantKeys.length, // Show only user-relevant keys, not system keys
        authKeys: authKeys.length,
        configKeys: configKeys.length,
        apiKeyCount,
        lastActivity,
        userType,
      });
    } catch (error) {
      console.error('Failed to load session info:', error);
    }
  };

  useEffect(() => {
    if (visible) {
      loadSessionInfo();
    }
  }, [visible, user, isAuthenticated]);

  const cleanupStaleKeys = async () => {
    try {
      setIsLoading(true);
      const allKeys = await AsyncStorage.getAllKeys();
      
      // Find potentially stale keys (development/testing artifacts)
      const potentiallyStaleKeys = allKeys.filter(key => {
        // Remove old temp passwords that might be orphaned
        if (key.includes('temp_password') && key !== 'temp_password') return true;
        
        // Remove keys that look like duplicates or test data
        if (key.includes('test_') || key.includes('debug_') || key.includes('dev_')) return true;
        
        // Remove expo/react-native development keys that might accumulate
        if (key.includes('Expo') || key.includes('RCT') || key.includes('ReactNative')) return true;
        
        // Remove Metro bundler keys that can accumulate during development
        if (key.includes('metro') || key.includes('bundler') || key.includes('cache')) return true;
        
        // Remove any keys that look like UUIDs but aren't our current auth
        if (/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(key)) return true;
        
        // Remove any keys with timestamps that are old (older than 24 hours)
        if (key.includes('_timestamp_') || key.includes('_ts_')) {
          try {
            const timestampMatch = key.match(/(\d{13})/);
            if (timestampMatch) {
              const timestamp = parseInt(timestampMatch[1]);
              const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
              return timestamp < dayAgo;
            }
          } catch (e) {
            // If we can't parse it, it's probably stale
            return true;
          }
        }
        
        return false;
      });
      
      console.log('🧹 Cleaning up stale keys:', potentiallyStaleKeys);
      
      if (potentiallyStaleKeys.length > 0) {
        await AsyncStorage.multiRemove(potentiallyStaleKeys);
        AlertAPI.alert(
          '✅ Cleanup Complete',
          `Removed ${potentiallyStaleKeys.length} stale storage keys.\n\nKeys removed:\n${potentiallyStaleKeys.slice(0, 5).join('\n')}${potentiallyStaleKeys.length > 5 ? '\n...' : ''}`,
          [{ text: 'OK', onPress: () => loadSessionInfo() }]
        );
      } else {
        AlertAPI.alert('✅ All Clean', 'No stale keys found to remove.');
      }
    } catch (error) {
      console.error('Failed to cleanup stale keys:', error);
      AlertAPI.alert('Error', 'Failed to cleanup stale keys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = () => {
    console.log('🎯 Clear Session button pressed');
    AlertAPI.alert(
      '🧹 Clear All Session Data',
      'This will permanently remove:\n\n• All API keys and configurations\n• Execution history\n• Authentication data\n• App settings\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            console.log('🧹 User confirmed session clear - starting process...');
            setIsLoading(true);
            try {
              console.log('🧹 Starting session clear from SessionManager...');
              
              // Clear session data
              console.log('📞 Calling clearSession()...');
              await clearSession();
              console.log('✅ Session data cleared successfully');
              
              // Logout user if authenticated
              if (isAuthenticated) {
                console.log('📞 Calling logout()...');
                await logout();
                console.log('✅ User logged out');
              }
              
              AlertAPI.alert(
                '✅ Session Cleared',
                'All session data has been cleared successfully. The app will now refresh.',
                [{ text: 'OK', onPress: onClose }]
              );
              
              // Refresh session info
              console.log('🔄 Refreshing session info...');
              await loadSessionInfo();
              console.log('✅ Session info refreshed');
            } catch (error) {
              console.error('❌ Failed to clear session data:', error);
              AlertAPI.alert(
                'Error', 
                `Failed to clear session data completely: ${error instanceof Error ? error.message : 'Unknown error'}. Some data may remain.`
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleExportData = async () => {
    setIsLoading(true);
    try {
      const data = await exportSessionData();
      const exportString = JSON.stringify(data, null, 2);
      setShowExportData(exportString);
    } catch (error) {
      AlertAPI.alert('Error', 'Failed to export session data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    AlertAPI.alert(
      '🚪 Logout',
      'This will log you out but keep your session data (configurations, API keys, etc.). You can log back in to access your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            setIsLoading(true);
            try {
              await logout();
              onClose();
            } catch (error) {
              AlertAPI.alert('Error', 'Failed to logout');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const getUserStatusInfo = () => {
    if (!user) {
      return {
        icon: 'person-outline',
        color: '#8E8E93',
        title: 'No User Session',
        subtitle: 'Using app without authentication',
      };
    }

    if (user.is_temporary) {
      return {
        icon: 'time-outline' as any,
        color: '#FF9500',
        title: 'Temporary User',
        subtitle: `${user.username} (unsaved session)`,
      };
    }

    return {
      icon: 'person',
      color: '#34C759',
      title: 'Authenticated User',
      subtitle: `${user.username} (${user.email || 'no email'})`,
    };
  };

  const userStatus = getUserStatusInfo();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Session Manager</Text>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* User Status */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>User Status</Text>
            <View style={styles.userStatusContainer}>
              <Ionicons name={userStatus.icon} size={24} color={userStatus.color} />
              <View style={styles.userStatusText}>
                <Text style={styles.userStatusTitle}>{userStatus.title}</Text>
                <Text style={styles.userStatusSubtitle}>{userStatus.subtitle}</Text>
              </View>
            </View>
          </View>

          {/* Session Information */}
          {sessionInfo && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Session Data</Text>
              <View style={styles.sessionGrid}>
                <View style={styles.sessionItem}>
                  <Text style={styles.sessionValue}>{sessionInfo.totalKeys}</Text>
                  <Text style={styles.sessionLabel}>Total Storage Keys</Text>
                </View>
                <View style={styles.sessionItem}>
                  <Text style={styles.sessionValue}>{sessionInfo.apiKeyCount}</Text>
                  <Text style={styles.sessionLabel}>API Keys</Text>
                </View>
                <View style={styles.sessionItem}>
                  <Text style={styles.sessionValue}>{sessionInfo.configKeys}</Text>
                  <Text style={styles.sessionLabel}>Configurations</Text>
                </View>
                <View style={styles.sessionItem}>
                  <Text style={styles.sessionValue}>{sessionInfo.authKeys}</Text>
                  <Text style={styles.sessionLabel}>Auth Data</Text>
                </View>
              </View>
              
              {sessionInfo.lastActivity && (
                <View style={styles.lastActivity}>
                  <Text style={styles.lastActivityText}>
                    Last activity: {new Date(sessionInfo.lastActivity).toLocaleString()}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            {/* Authentication Actions */}
            {!isAuthenticated && (
              <TouchableOpacity
                style={[styles.actionButton, styles.loginButton]}
                onPress={() => {
                  onClose();
                  navigation.navigate('Auth' as never);
                }}
                disabled={isLoading}
              >
                <Ionicons name="log-in-outline" size={20} color="#007AFF" />
                <Text style={styles.loginButtonText}>Login or Create Account</Text>
              </TouchableOpacity>
            )}
            
            {isAuthenticated && (
              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={handleLogout}
                disabled={isLoading}
              >
                <Ionicons name="log-out-outline" size={20} color="#FF9500" />
                <Text style={styles.logoutButtonText}>Logout (Keep Data)</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.exportButton]}
              onPress={handleExportData}
              disabled={isLoading}
            >
              <Ionicons name="download-outline" size={20} color="#007AFF" />
              <Text style={styles.exportButtonText}>Export Session Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.clearButton]}
              onPress={() => {
                console.log('🎯 Clear button touched - Platform:', Platform.OS);
                handleClearSession();
              }}
              disabled={isLoading}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
              <Text style={styles.clearButtonText}>Clear All Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.cleanupButton]}
              onPress={cleanupStaleKeys}
              disabled={isLoading}
            >
              <Ionicons name="brush-outline" size={20} color="#FF3B30" />
              <Text style={styles.cleanupButtonText}>Cleanup Stale Keys</Text>
            </TouchableOpacity>
          </View>

          {/* Loading indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}
        </ScrollView>
      </View>

      {/* Export Data Modal */}
      {showExportData && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowExportData(null)}
        >
          <View style={styles.exportModalOverlay}>
            <View style={styles.exportModalContent}>
              <View style={styles.exportModalHeader}>
                <Text style={styles.exportModalTitle}>📄 Exported Session Data</Text>
                <TouchableOpacity
                  onPress={() => setShowExportData(null)}
                  style={styles.exportModalClose}
                >
                  <Ionicons name="close" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.exportDataContainer}>
                <Text style={styles.exportDataText}>{showExportData}</Text>
              </ScrollView>
              <Text style={styles.exportModalNote}>
                💡 Copy this data to backup your session. You can import it later if needed.
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 10,
    borderRadius: 22,
    backgroundColor: '#F5F5F5',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  userStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userStatusText: {
    flex: 1,
  },
  userStatusTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  userStatusSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  sessionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sessionItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
  },
  sessionValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007AFF',
  },
  sessionLabel: {
    fontSize: 11,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  lastActivity: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
  },
  lastActivityText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    gap: 12,
  },
  loginButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  loginButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  logoutButton: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  logoutButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF9500',
  },
  exportButton: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  exportButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
  cleanupButton: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  cleanupButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  exportModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exportModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
  },
  exportModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  exportModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  exportModalClose: {
    padding: 4,
  },
  exportDataContainer: {
    maxHeight: 300,
    padding: 16,
  },
  exportDataText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#1A1A1A',
    lineHeight: 16,
  },
  exportModalNote: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
  },
}); 