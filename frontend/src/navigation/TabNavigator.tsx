import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, SafeAreaView } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { TabParamList } from '../types';
import { ResponsiveNavigation } from '../components/ResponsiveNavigation';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../context/ResponsiveContext';
import { useTheme, useThemedStyles } from '../theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getInitialRouteName } from './linking';
import {
  navigationItems,
  getAllNavigationItems,
  getVisibleNavigationItems,
  NavigationItem,
  routeToPathMap
} from './navigationConfig';

// Import screens
import ConfigureScreen from '../screens/ConfigureScreen';
import FunctionScreen from '../screens/FunctionScreen';
import ExecutionTemplatesScreen from '../screens/ExecutionTemplatesScreen';
import ExecuteScreen from '../screens/ExecuteScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import AuthScreen from '../screens/AuthScreen';
import ApiKeysScreen from '../screens/ApiKeysScreen';
import AgentsScreen from '../screens/AgentsScreen';
import TasksScreen from '../screens/TasksScreen';
import AgentMarketplaceScreen from '../screens/AgentMarketplaceScreen';
import TemplateTokenManagerScreen from '../screens/TemplateTokenManagerScreen';
import DocumentationScreen from '../screens/DocumentationScreen';
import DocumentationNavigator from './DocumentationNavigator';
import TeamDetailScreen from '../screens/TeamDetailScreen';

const Tab = createBottomTabNavigator();

// Mobile Navigation Dropdown Component for very narrow screens
const MobileNavigationDropdown: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Agents', 'Configure']));
  const navigation = useNavigation();
  const route = useRoute();
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    dropdownHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.navBg,
      borderBottomWidth: 1,
      borderBottomColor: colors.navBorder,
      elevation: 2,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      minHeight: 60,
    },
    currentScreenInfo: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
    },
    currentIcon: {
      marginRight: 8,
    },
    currentScreenTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.navItemText,
    },
    dropdownTrigger: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.bgHover,
      minWidth: 40,
      minHeight: 40,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.navBorder,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.bgSurface,
      minWidth: 40,
      minHeight: 40,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    modalContent: {
      flex: 1,
      paddingTop: 20,
    },
    modalItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginHorizontal: 16,
      marginBottom: 8,
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      elevation: 1,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      minHeight: 56,
    },
    modalItemActive: {
      backgroundColor: colors.navItemActive,
    },
    modalItemText: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginLeft: 12,
      flex: 1,
    },
    modalItemTextActive: {
      color: colors.textInverse,
      fontWeight: '600' as const,
    },
    modalGroupItem: {
      backgroundColor: colors.bgSurface,
    },
    modalSubItem: {
      paddingLeft: 20,
      backgroundColor: colors.bgCard,
      borderLeftWidth: 3,
      borderLeftColor: colors.borderLight,
    },
    modalSubItemText: {
      fontSize: 15,
      fontWeight: '400' as const,
    },
    subItemIndent: {
      width: 16,
      height: 1,
    },
  }));

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

  const visibleItems = getVisibleNavigationItems(isAuthenticated);
  const currentItem = getAllNavigationItems(visibleItems).find(item => item.name === route.name) || visibleItems[0];

  const handleNavigate = (screenName: string) => {
    setShowDropdown(false);
    (navigation as any).navigate(screenName);
  };

  return (
    <>
      <View style={styles.dropdownHeader}>
        <View style={styles.currentScreenInfo}>
          <Ionicons
            name={currentItem.iconFocused}
            size={24}
            color={colors.accent}
            style={styles.currentIcon}
          />
          <Text style={styles.currentScreenTitle}>{currentItem.title}</Text>
        </View>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setShowDropdown(true)}
        >
          <Ionicons name="menu" size={24} color={colors.accent} />
        </TouchableOpacity>
      </View>

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
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {visibleItems.map((item) => {
              const isCurrent = route.name === item.name;
              return (
                <View key={item.name}>
                  <TouchableOpacity
                    style={[
                      styles.modalItem,
                      (isCurrent || (item.children && item.children.some(child => route.name === child.name))) && styles.modalItemActive,
                      item.children && styles.modalGroupItem
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
                      name={(isCurrent || (item.children && item.children.some(child => route.name === child.name))) ? item.iconFocused : item.icon}
                      size={24}
                      color={(isCurrent || (item.children && item.children.some(child => route.name === child.name))) ? colors.textInverse : colors.accent}
                    />
                    <Text style={[
                      styles.modalItemText,
                      (isCurrent || (item.children && item.children.some(child => route.name === child.name))) && styles.modalItemTextActive
                    ]}>
                      {item.title}
                    </Text>
                    {item.children && (
                      <Ionicons
                        name={expandedGroups.has(item.name) ? "chevron-down" : "chevron-forward"}
                        size={20}
                        color={(isCurrent || (item.children && item.children.some(child => route.name === child.name))) ? colors.textInverse : colors.textSecondary}
                      />
                    )}
                    {isCurrent && !item.children && (
                      <Ionicons name="checkmark" size={20} color={colors.textInverse} />
                    )}
                  </TouchableOpacity>

                  {item.children && expandedGroups.has(item.name) && item.children.map((child) => {
                    const isChildCurrent = route.name === child.name;
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
                          color={isChildCurrent ? colors.textInverse : colors.accent}
                        />
                        <Text style={[
                          styles.modalItemText,
                          styles.modalSubItemText,
                          isChildCurrent && styles.modalItemTextActive
                        ]}>
                          {child.title}
                        </Text>
                        {isChildCurrent && (
                          <Ionicons name="checkmark" size={18} color={colors.textInverse} />
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
};

// Screen wrapper for responsive layout - now uses ResponsiveContext
const ScreenWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSidebarLayout, showMobileDropdown } = useResponsive();
  const { colors } = useTheme();

  /*
   * IMPORTANT: Always return the SAME outer <View> so React keeps the subtree mounted.
   * Switching between different root element types (View vs Fragment) was remounting
   * the entire screen, clearing local component state (e.g. ExecuteScreen form fields).
   */

  return (
    <View style={[
      { flex: 1, backgroundColor: colors.bgApp },
      isSidebarLayout && { flexDirection: 'row' as const },
    ]}>
      {isSidebarLayout ? (
        <ResponsiveNavigation isSidebarLayout={true} />
      ) : showMobileDropdown ? (
        <MobileNavigationDropdown />
      ) : null}

      <View style={{ flex: 1 }}>
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
  const { colors } = useTheme();

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
          } else if (route.name === 'Agents') {
            iconName = focused ? 'construct' : 'construct-outline';
          } else if (route.name === 'Tasks') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          } else if (route.name === 'Account') {
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textSecondary,
        headerShown: false,
        tabBarStyle: { display: 'none' },
      })}
    >
      <Tab.Screen name="Execute" component={withResponsiveLayout(ExecuteScreen)} />
      <Tab.Screen name="Configure" component={withResponsiveLayout(ConfigureScreen)} />
      <Tab.Screen name="Functions" component={withResponsiveLayout(FunctionScreen)} />
      <Tab.Screen name="Execution Templates" component={withResponsiveLayout(ExecutionTemplatesScreen)} />
      <Tab.Screen name="API Keys" component={withResponsiveLayout(ApiKeysScreen)} />
      <Tab.Screen name="History" component={withResponsiveLayout(HistoryScreen)} />
      <Tab.Screen name="Database" component={withResponsiveLayout(DatabaseScreen)} />
      <Tab.Screen name="Documentation" component={withResponsiveLayout(DocumentationNavigator)} />
      <Tab.Screen name="Agents" component={withResponsiveLayout(AgentsScreen)} />
      <Tab.Screen name="Tasks" component={withResponsiveLayout(TasksScreen)} />
      <Tab.Screen name="Marketplace" component={withResponsiveLayout(AgentMarketplaceScreen)} />
      <Tab.Screen name="Account" component={withResponsiveLayout(AuthScreen)} />
      <Tab.Screen
        name="TemplateTokenManager"
        component={withResponsiveLayout(TemplateTokenManagerScreen)}
        options={{
          tabBarStyle: { display: 'none' }
        }}
      />
      <Tab.Screen
        name="TeamDetail"
        component={withResponsiveLayout(TeamDetailScreen)}
        options={{
          tabBarStyle: { display: 'none' }
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
