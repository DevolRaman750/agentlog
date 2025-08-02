import React, { useState, useEffect, createContext, useContext, useMemo, useCallback } from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import ConfigureScreen from '../screens/ConfigureScreen';
import FunctionScreen from '../screens/FunctionScreen';
import ExecuteScreen from '../screens/ExecuteScreen';
import HistoryScreen from '../screens/HistoryScreen';
import DatabaseScreen from '../screens/DatabaseScreen';
import AuthScreen from '../screens/AuthScreen';
import ApiKeysScreen from '../screens/ApiKeysScreen';
import { ResponsiveNavigation } from '../components/ResponsiveNavigation';
import { useAuth } from '../context/AuthContext';
import { useResponsive } from '../context/ResponsiveContext'; // Use existing responsive context

const Stack = createStackNavigator();

// Create context for responsive layout - simplified to just pass through the existing context
const ResponsiveLayoutContext = createContext<{
  isSidebarLayout: boolean;
}>({
  isSidebarLayout: false,
});

export const useResponsiveLayout = () => useContext(ResponsiveLayoutContext);

// Responsive layout wrapper component - MEMOIZED to prevent unnecessary re-renders
const ResponsiveLayoutWrapper: React.FC<{ children: React.ReactNode }> = React.memo(({ children }) => {
  const { isSidebarLayout } = useResponsiveLayout();

  if (isSidebarLayout) {
    // Desktop/Tablet layout with sidebar
    return (
      <View style={styles.desktopContainer}>
        <ResponsiveNavigation isSidebarLayout={true} />
        <View style={styles.desktopContent}>
          {children}
        </View>
      </View>
    );
  }

  // Mobile layout with hamburger menu
  return (
    <View style={styles.mobileContainer}>
      <ResponsiveNavigation isSidebarLayout={false} />
      <View style={styles.mobileContent}>
        {children}
      </View>
    </View>
  );
});

// STABLE screen wrapper components - created once and reused
// This prevents React from treating them as new components on dimension changes
const createStableScreenWithNavigation = (Component: React.ComponentType<any>) => {
  const WrappedComponent = React.memo((props: any) => (
    <ResponsiveLayoutWrapper>
      <Component {...props} />
    </ResponsiveLayoutWrapper>
  ));
  WrappedComponent.displayName = `ResponsiveWrapped${Component.displayName || Component.name}`;
  return WrappedComponent;
};

// Create stable screen components once - MOVED OUTSIDE COMPONENT TO PREVENT RECREATION
const StableExecuteScreen = createStableScreenWithNavigation(ExecuteScreen);
const StableConfigureScreen = createStableScreenWithNavigation(ConfigureScreen);
const StableFunctionScreen = createStableScreenWithNavigation(FunctionScreen);
const StableApiKeysScreen = createStableScreenWithNavigation(ApiKeysScreen);
const StableHistoryScreen = createStableScreenWithNavigation(HistoryScreen);
const StableDatabaseScreen = createStableScreenWithNavigation(DatabaseScreen);
const StableAuthScreen = createStableScreenWithNavigation(AuthScreen);

const ResponsiveTabNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { isSidebarLayout, isTabletLayout, isMobileLayout, isNarrowMobile, screenWidth, screenHeight } = useResponsive();

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    isSidebarLayout,
  }), [isSidebarLayout]);

  // Memoize screen configurations to prevent recreation
  const screenConfig = useMemo(() => ({
    headerShown: false,
    cardStyle: { backgroundColor: '#F2F2F7' },
  }), []);

  // While auth is loading, determine initial route based on current URL
  const getInitialRoute = () => {
    if (isLoading && typeof window !== 'undefined' && window.location) {
      const path = window.location.pathname;
      const pathToRoute: Record<string, string> = {
        '/execute': 'Execute',
        '/configure': 'Configure',
        '/functions': 'Functions',
        '/templates': 'Templates',
        '/api-keys': 'API Keys',
        '/history': 'History',
        '/database': 'Database',
        '/account': 'Account',
        '/more': 'More',
      };
      return pathToRoute[path] || 'Execute';
    }
    return 'Execute'; // Always default to Execute
  };

  return (
    <ResponsiveLayoutContext.Provider value={contextValue}>
      <Stack.Navigator
        screenOptions={screenConfig}
        initialRouteName={getInitialRoute()}
      >
        {/* All screens are always available - individual screens handle authentication */}
        <Stack.Screen 
          name="Execute" 
          component={StableExecuteScreen} 
        />
        <Stack.Screen 
          name="Configure" 
          component={StableConfigureScreen} 
        />
        <Stack.Screen 
          name="Functions" 
          component={StableFunctionScreen} 
        />
        <Stack.Screen 
          name="API Keys" 
          component={StableApiKeysScreen} 
        />
        <Stack.Screen 
          name="History" 
          component={StableHistoryScreen} 
        />
        <Stack.Screen 
          name="Database" 
          component={StableDatabaseScreen} 
        />
        <Stack.Screen 
          name="Account" 
          component={StableAuthScreen} 
        />
      </Stack.Navigator>
    </ResponsiveLayoutContext.Provider>
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
});

export default ResponsiveTabNavigator; 