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
  children?: NavigationItem[];
  isSubItem?: boolean;
}

const navigationItems: NavigationItem[] = [
  { 
    name: 'Agents', 
    title: 'Agents', 
    icon: 'construct-outline', 
    iconFocused: 'construct',
    children: [
      { name: 'Agents', title: 'Your Agents', icon: 'construct-outline', iconFocused: 'construct', isSubItem: true },
      { name: 'Marketplace', title: 'Marketplace', icon: 'storefront-outline', iconFocused: 'storefront', isSubItem: true }
    ]
  },
  { 
    name: 'Configure', 
    title: 'Configure', 
    icon: 'settings-outline', 
    iconFocused: 'settings',
    children: [
      { name: 'Configure', title: 'Model', icon: 'settings-outline', iconFocused: 'settings', isSubItem: true },
      { name: 'Execute', title: 'Experiment', icon: 'flask-outline', iconFocused: 'flask', isSubItem: true },
      { name: 'Execution Templates', title: 'Templates', icon: 'document-text-outline', iconFocused: 'document-text', isSubItem: true },
      { name: 'Functions', title: 'Functions', icon: 'code-slash-outline', iconFocused: 'code-slash', isSubItem: true },
      { name: 'API Keys', title: 'API Keys', icon: 'key-outline', iconFocused: 'key', isSubItem: true }
    ]
  },
  { name: 'History', title: 'Execution History', icon: 'time-outline', iconFocused: 'time' },
  { name: 'Database', title: 'Data', icon: 'server-outline', iconFocused: 'server' },
  { name: 'Account', title: 'Account', icon: 'person-circle-outline', iconFocused: 'person-circle' },
];

interface ResponsiveNavigationProps {
  isSidebarLayout: boolean;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({ isSidebarLayout }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Agents', 'Configure'])); // Default expanded
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
        'Execute': '/experiment',
        'Configure': '/model',
        'Functions': '/functions',
        'Execution Templates': '/templates',
        'API Keys': '/api-keys',
        'History': '/history',
        'Database': '/database',
        'Agents': '/agents',
        'Account': '/account',
      };
      
      const path = pathMap[screenName];
      if (path) {
        window.history.pushState({}, '', path);
      }
    }
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  const isCurrentRoute = (routeName: string) => {
    return route.name === routeName;
  };

  // Helper to get all navigation items including children for current route detection
  const getAllNavigationItems = (items: NavigationItem[]): NavigationItem[] => {
    const result: NavigationItem[] = [];
    items.forEach(item => {
      result.push(item);
      if (item.children) {
        result.push(...item.children);
      }
    });
    return result;
  };

  // Mobile Hamburger Menu
  const renderMobileMenu = () => (
    <>
      {/* Header with Hamburger Button */}
      <View style={styles.mobileHeader}>
        <TouchableOpacity
          style={styles.hamburgerButton}
          onPress={() => setShowMobileMenu(true)}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="menu" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.mobileTitle}>
          {getAllNavigationItems(visibleItems).find(item => isCurrentRoute(item.name))?.title || 'GoGent'}
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
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {visibleItems.map((item) => {
              return (
                <View key={item.name}>
                  {/* Parent/Group Item */}
                  <TouchableOpacity
                    style={[
                      styles.modalItem, 
                      isCurrentRoute(item.name) && styles.modalItemActive,
                      item.children && styles.modalGroupItem,
                      item.children && item.children.some(child => isCurrentRoute(child.name)) && styles.modalGroupItemActiveChild
                    ]}
                    onPress={() => {
                      if (item.children) {
                        toggleGroup(item.name);
                      } else {
                        handleNavigate(item.name);
                      }
                    }}
                  >
                    <Ionicons
                      name={isCurrentRoute(item.name) ? item.iconFocused : item.icon}
                      size={24}
                      color={isCurrentRoute(item.name) ? "#FFFFFF" : (item.children && item.children.some(child => isCurrentRoute(child.name))) ? "#007AFF" : "#007AFF"}
                    />
                    <Text style={[
                      styles.modalItemText, 
                      isCurrentRoute(item.name) && styles.modalItemTextActive,
                      item.children && item.children.some(child => isCurrentRoute(child.name)) && styles.modalGroupTextActiveChild
                    ]}>
                      {item.title}
                    </Text>
                    {item.children && (
                      <Ionicons 
                        name={expandedGroups.has(item.name) ? "chevron-down" : "chevron-forward"} 
                        size={20} 
                        color={isCurrentRoute(item.name) ? "#FFFFFF" : (item.children && item.children.some(child => isCurrentRoute(child.name))) ? "#007AFF" : "#8E8E93"} 
                      />
                    )}
                    {isCurrentRoute(item.name) && !item.children && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                  
                  {/* Child Items */}
                  {item.children && expandedGroups.has(item.name) && item.children.map((child) => {
                    const isChildCurrent = isCurrentRoute(child.name);
                    return (
                      <TouchableOpacity
                        key={child.name}
                        style={[
                          styles.modalItem, 
                          styles.modalSubItem,
                          isChildCurrent && styles.modalItemActive
                        ]}
                        onPress={() => handleNavigate(child.name)}
                      >
                        <View style={styles.subItemIndent} />
                        <Ionicons
                          name={isChildCurrent ? child.iconFocused : child.icon}
                          size={20}
                          color={isChildCurrent ? "#FFFFFF" : "#007AFF"}
                        />
                        <Text style={[
                          styles.modalItemText, 
                          styles.modalSubItemText,
                          isChildCurrent && styles.modalItemTextActive
                        ]}>
                          {child.title}
                        </Text>
                        {isChildCurrent && (
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
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
          return (
            <View key={item.name}>
              {/* Parent/Group Item */}
              <TouchableOpacity
                style={[
                  styles.sidebarItem, 
                  isCurrentRoute(item.name) && styles.sidebarItemActive,
                  item.children && styles.sidebarGroupItem,
                  item.children && item.children.some(child => isCurrentRoute(child.name)) && styles.sidebarGroupItemActiveChild
                ]}
                onPress={() => {
                  if (item.children) {
                    toggleGroup(item.name);
                  } else {
                    handleNavigate(item.name);
                  }
                }}
              >
                <Ionicons
                  name={isCurrentRoute(item.name) ? item.iconFocused : item.icon}
                  size={20}
                  color={isCurrentRoute(item.name) ? "#FFFFFF" : (item.children && item.children.some(child => isCurrentRoute(child.name))) ? "#007AFF" : "#007AFF"}
                />
                <Text style={[
                  styles.sidebarItemText, 
                  isCurrentRoute(item.name) && styles.sidebarItemTextActive,
                  item.children && item.children.some(child => isCurrentRoute(child.name)) && styles.sidebarGroupTextActiveChild
                ]}>
                  {item.title}
                </Text>
                {item.children && (
                  <Ionicons 
                    name={expandedGroups.has(item.name) ? "chevron-down" : "chevron-forward"} 
                    size={16} 
                    color={isCurrentRoute(item.name) ? "#FFFFFF" : (item.children && item.children.some(child => isCurrentRoute(child.name))) ? "#007AFF" : "#8E8E93"} 
                  />
                )}
              </TouchableOpacity>
              
              {/* Child Items */}
              {item.children && expandedGroups.has(item.name) && item.children.map((child) => {
                const isChildCurrent = isCurrentRoute(child.name);
                return (
                  <TouchableOpacity
                    key={child.name}
                    style={[
                      styles.sidebarItem, 
                      styles.sidebarSubItem,
                      isChildCurrent && styles.sidebarItemActive
                    ]}
                    onPress={() => handleNavigate(child.name)}
                  >
                    <View style={styles.subItemIndent} />
                    <Ionicons
                      name={isChildCurrent ? child.iconFocused : child.icon}
                      size={18}
                      color={isChildCurrent ? "#FFFFFF" : "#007AFF"}
                    />
                    <Text style={[
                      styles.sidebarItemText, 
                      styles.sidebarSubItemText,
                      isChildCurrent && styles.sidebarItemTextActive
                    ]}>
                      {child.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
  modalGroupItem: {
    backgroundColor: '#F8F9FA',
  },
  modalGroupItemActiveChild: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  modalGroupTextActiveChild: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalSubItem: {
    paddingLeft: 20,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 3,
    borderLeftColor: '#E1E5E9',
  },
  modalSubItemText: {
    fontSize: 15,
    fontWeight: '400',
  },
  subItemIndent: {
    width: 16,
    height: 1,
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
  sidebarGroupItem: {
    backgroundColor: '#F8F9FA',
  },
  sidebarGroupItemActiveChild: {
    backgroundColor: '#F0F8FF',
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  sidebarGroupTextActiveChild: {
    color: '#007AFF',
    fontWeight: '600',
  },
  sidebarSubItem: {
    paddingLeft: 32,
    marginLeft: 20,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 2,
    borderLeftColor: '#E1E5E9',
  },
  sidebarSubItemText: {
    fontSize: 14,
    fontWeight: '400',
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