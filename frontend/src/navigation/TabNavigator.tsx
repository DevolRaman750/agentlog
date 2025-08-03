import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from '../types';
import { ResponsiveNavigation } from '../components/ResponsiveNavigation';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../context/ResponsiveContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getInitialRouteName } from './linking';

// Import screens
import ConfigureScreen from '../screens/ConfigureScreen';
import FunctionScreen from '../screens/FunctionScreen';
import ExecutionTemplatesScreen from '../screens/ExecutionTemplatesScreen';
import ExecuteScreen from '../screens/ExecuteScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import AuthScreen from '../screens/AuthScreen';
import ApiKeysScreen from '../screens/ApiKeysScreen';
import TemplateTokenManagerScreen from '../screens/TemplateTokenManagerScreen';

const Tab = createBottomTabNavigator();

interface NavigationItem {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  component: React.ComponentType<any>;
}

// Mobile Navigation Dropdown Component for very narrow screens
const MobileNavigationDropdown: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { isAuthenticated } = useAuth();

  const navigationItems: NavigationItem[] = [
    { name: 'Execute', title: 'Execute', icon: 'play-circle-outline', iconFocused: 'play-circle', component: ExecuteScreen },
    { name: 'Configure', title: 'Configure', icon: 'settings-outline', iconFocused: 'settings', component: ConfigureScreen },
    { name: 'Functions', title: 'Functions', icon: 'code-slash-outline', iconFocused: 'code-slash', component: FunctionScreen },
    { name: 'Execution Templates', title: 'Execution Templates', icon: 'document-text-outline', iconFocused: 'document-text', component: ExecutionTemplatesScreen },
    { name: 'API Keys', title: 'API Keys', icon: 'key-outline', iconFocused: 'key', component: ApiKeysScreen },
    { name: 'History', title: 'History', icon: 'time-outline', iconFocused: 'time', component: HistoryScreen },
    { name: 'Database', title: 'Database', icon: 'server-outline', iconFocused: 'server', component: DatabaseScreen },
    { name: 'Account', title: 'Account', icon: 'person-circle-outline', iconFocused: 'person-circle', component: AuthScreen },
  ];

  const getVisibleNavigationItems = () => {
    if (!isAuthenticated) {
      return navigationItems.filter(item => item.name === 'Account');
    }
    return navigationItems;
  };

  const visibleItems = getVisibleNavigationItems();
  const currentItem = visibleItems.find(item => item.name === route.name) || visibleItems[0];

  const handleNavigate = (screenName: string) => {
    setShowDropdown(false);
    (navigation as any).navigate(screenName);
  };

  return (
    <>
      {/* Header with current screen and dropdown trigger */}
      <View style={styles.dropdownHeader}>
        <View style={styles.currentScreenInfo}>
          <Ionicons
            name={currentItem.iconFocused}
            size={24}
            color="#007AFF"
            style={styles.currentIcon}
          />
          <Text style={styles.currentScreenTitle}>{currentItem.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setShowDropdown(true)}
        >
          <Ionicons name="menu" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Navigation Modal */}
      <Modal
        visible={showDropdown}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowDropdown(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Navigation</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDropdown(false)}
            >
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {visibleItems.map((item) => {
              const isCurrent = route.name === item.name;
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
};

// Screen wrapper for responsive layout - now uses ResponsiveContext
const ScreenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSidebarLayout, showMobileDropdown } = useResponsive();

  /*
   * IMPORTANT: Always return the SAME outer <View> so React keeps the subtree mounted.
   * Switching between different root element types (View vs Fragment) was remounting
   * the entire screen, clearing local component state (e.g. ExecuteScreen form fields).
   */

  return (
    <View style={isSidebarLayout ? styles.desktopContainer : styles.mobileContainer}>
      {/* Navigation component */}
      {isSidebarLayout ? (
        <ResponsiveNavigation isSidebarLayout={true} />
      ) : showMobileDropdown ? (
        <MobileNavigationDropdown />
      ) : null}

      {/* Content wrapper */}
      <View style={isSidebarLayout ? styles.desktopContent : styles.mobileContent}>
        {children}
      </View>
    </View>
  );
};

// Simplified HOC without dimension listeners
const withResponsiveLayout = (WrappedComponent: React.ComponentType<any>) => {
  return (props: any) => (
    <ScreenWrapper>
      <WrappedComponent {...props} />
    </ScreenWrapper>
  );
};

const TabNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isSidebarLayout, showMobileDropdown } = useResponsive();

  return (
    <Tab.Navigator
      initialRouteName={getInitialRouteName(isAuthenticated, isLoading)}
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'help-circle';

          if (route.name === 'Execute') {
            iconName = focused ? 'play-circle' : 'play-circle-outline';
          } else if (route.name === 'Configure') {
            iconName = focused ? 'settings' : 'settings-outline';
          } else if (route.name === 'Functions') {
            iconName = focused ? 'code-slash' : 'code-slash-outline';
          } else if (route.name === 'API Keys') {
            iconName = focused ? 'key' : 'key-outline';
          } else if (route.name === 'History') {
            iconName = focused ? 'time' : 'time-outline';
          } else if (route.name === 'Database') {
            iconName = focused ? 'server' : 'server-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        // Always hide tab bar - only show sidebar or hamburger menu
        tabBarStyle: { display: 'none' },
      })}
    >
      {/* All screens are always available - individual screens handle authentication */}
      <Tab.Screen name="Execute" component={withResponsiveLayout(ExecuteScreen)} />
      <Tab.Screen name="Configure" component={withResponsiveLayout(ConfigureScreen)} />
      <Tab.Screen name="Functions" component={withResponsiveLayout(FunctionScreen)} />
      <Tab.Screen name="Execution Templates" component={withResponsiveLayout(ExecutionTemplatesScreen)} />
      <Tab.Screen name="API Keys" component={withResponsiveLayout(ApiKeysScreen)} />
      <Tab.Screen name="History" component={withResponsiveLayout(HistoryScreen)} />
      <Tab.Screen name="Database" component={withResponsiveLayout(DatabaseScreen)} />
      <Tab.Screen name="Account" component={withResponsiveLayout(AuthScreen)} />
      <Tab.Screen 
        name="TemplateTokenManager" 
        component={withResponsiveLayout(TemplateTokenManagerScreen)}
        options={{
          tabBarStyle: { display: 'none' },
          presentation: 'modal'
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  desktopContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
  },
  desktopContent: {
    flex: 1,
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  mobileContent: {
    flex: 1,
  },
  // Removed tabBar styles since bottom tabs are no longer used
  
  // Mobile dropdown styles
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    minHeight: 60, // Ensure minimum height for accessibility
  },
  currentScreenInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentIcon: {
    marginRight: 8,
  },
  currentScreenTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  dropdownTrigger: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F0F8FF',
    minWidth: 40, // Ensure minimum touch target
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal styles
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
    minWidth: 40,
    minHeight: 40,
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
    minHeight: 56, // Ensure good touch target
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
});

export default TabNavigator; 