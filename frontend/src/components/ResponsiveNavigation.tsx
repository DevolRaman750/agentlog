import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';

interface NavigationItem {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
}

const navigationItems: NavigationItem[] = [
  { name: 'Execute', title: 'Execute', icon: 'play-circle-outline', iconFocused: 'play-circle' },
  { name: 'Configure', title: 'Configure', icon: 'settings-outline', iconFocused: 'settings' },
  { name: 'Functions', title: 'Functions', icon: 'code-slash-outline', iconFocused: 'code-slash' },
  { name: 'API Keys', title: 'API Keys', icon: 'key-outline', iconFocused: 'key' },
  { name: 'History', title: 'History', icon: 'time-outline', iconFocused: 'time' },
  { name: 'Database', title: 'Database', icon: 'server-outline', iconFocused: 'server' },
  { name: 'Account', title: 'Account', icon: 'person-circle-outline', iconFocused: 'person-circle' },
];

interface ResponsiveNavigationProps {
  isSidebarLayout: boolean;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({ isSidebarLayout }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { isAuthenticated } = useAuth();

  // Filter navigation items based on authentication status
  const getVisibleNavigationItems = () => {
    if (!isAuthenticated) {
      // Only show Account tab when not authenticated
      return navigationItems.filter(item => item.name === 'Account');
    }
    // Show all tabs when authenticated
    return navigationItems;
  };

  const visibleItems = getVisibleNavigationItems();

  const handleNavigate = (screenName: string) => {
    navigation.navigate(screenName as never);
    setShowMobileMenu(false);
    
    // Update URL for web
    if (typeof window !== 'undefined' && window.history) {
      const pathMap: Record<string, string> = {
        'Execute': '/execute',
        'Configure': '/configure',
        'Functions': '/functions',
        'API Keys': '/api-keys',
        'History': '/history',
        'Database': '/database',
        'Account': '/account',
      };
      
      const path = pathMap[screenName];
      if (path) {
        window.history.pushState({}, '', path);
      }
    }
  };

  const isCurrentRoute = (routeName: string) => {
    return route.name === routeName;
  };

  // Mobile Hamburger Menu
  const renderMobileMenu = () => (
    <>
      {/* Header with Hamburger Button */}
      <View style={styles.mobileHeader}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={() => setShowMobileMenu(true)}
        >
          <Ionicons name="menu" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.mobileTitle}>
          {visibleItems.find(item => isCurrentRoute(item.name))?.title || 'GoGent'}
        </Text>
        <View style={styles.spacer} />
      </View>

      {/* Mobile Menu Modal */}
      <Modal
        visible={showMobileMenu}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMobileMenu(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Navigation</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowMobileMenu(false)}
            >
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {visibleItems.map((item) => {
              const isCurrent = isCurrentRoute(item.name);
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.modalItem, isCurrent && styles.modalItemActive]}
                  onPress={() => handleNavigate(item.name)}
                >
                  <Ionicons
                    name={isCurrent ? item.iconFocused : item.icon}
                    size={24}
                    color={isCurrent ? "#FFFFFF" : "#007AFF"}
                  />
                  <Text style={[styles.modalItemText, isCurrent && styles.modalItemTextActive]}>
                    {item.title}
                  </Text>
                  {isCurrent && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );

  // Sidebar for larger screens
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>GoGent</Text>
        <Text style={styles.sidebarSubtitle}>AI Multi-Variation Platform</Text>
      </View>

      <ScrollView style={styles.sidebarContent}>
        {visibleItems.map((item) => {
          const isCurrent = isCurrentRoute(item.name);
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.sidebarItem, isCurrent && styles.sidebarItemActive]}
              onPress={() => handleNavigate(item.name)}
            >
              <Ionicons
                name={isCurrent ? item.iconFocused : item.icon}
                size={20}
                color={isCurrent ? "#FFFFFF" : "#007AFF"}
              />
              <Text style={[styles.sidebarItemText, isCurrent && styles.sidebarItemTextActive]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <Text style={styles.sidebarFooterText}>GoGent v1.0</Text>
      </View>
    </View>
  );

  return isSidebarLayout ? renderSidebar() : renderMobileMenu();
};

const styles = StyleSheet.create({
  // Mobile Header
  mobileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  hamburgerButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
  },
  mobileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
    textAlign: 'center',
  },
  spacer: {
    width: 40,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  modalContent: {
    flex: 1,
    paddingTop: 20,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modalItemActive: {
    backgroundColor: '#007AFF',
  },
  modalItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 12,
    flex: 1,
  },
  modalItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Sidebar
  sidebar: {
    width: 280,
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E1E5E9',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sidebarHeader: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sidebarContent: {
    flex: 1,
    paddingTop: 16,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginBottom: 4,
    borderRadius: 8,
  },
  sidebarItemActive: {
    backgroundColor: '#007AFF',
  },
  sidebarItemText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  sidebarItemTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sidebarFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E5E9',
    alignItems: 'center',
  },
  sidebarFooterText: {
    fontSize: 11,
    color: '#8E8E93',
  },
}); 