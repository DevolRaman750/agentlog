import React from 'react';
import { SafeAreaView, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ToastProvider } from './src/context/ToastContext';
import { ResponsiveProvider } from './src/context/ResponsiveContext';
import { FormStateProvider } from './src/context/FormStateContext';
import TabNavigator from './src/navigation/TabNavigator';
import { UserStatusBar } from './src/components/UserStatusBar';
import { CustomAlert } from './src/components/CustomAlert';
import { linking } from './src/navigation/linking';

export default function App() {
  // Update page title when navigation state changes
  const onNavigationStateChange = (state: NavigationState | undefined) => {
    if (typeof document !== 'undefined' && state) {
      const routeTitles: Record<string, string> = {
        'Execute': 'Execute - GoGent AI Platform',
        'Configure': 'Configure - GoGent AI Platform',
        'Functions': 'Functions - GoGent AI Platform',
        'Templates': 'Templates - GoGent AI Platform',
        'Execution Templates': 'Execution Templates - GoGent AI Platform',
        'API Keys': 'API Keys - GoGent AI Platform',
        'History': 'History - GoGent AI Platform',
        'Database': 'Database - GoGent AI Platform',
        'Account': 'Account - GoGent AI Platform',
        'More': 'Navigation - GoGent AI Platform',
      };
      
      // Get the current route name from the navigation state
      const getCurrentRouteName = (state: NavigationState): string | undefined => {
        const route = state.routes[state.index];
        if (route.state) {
          return getCurrentRouteName(route.state as NavigationState);
        }
        return route.name;
      };
      
      const currentRouteName = getCurrentRouteName(state);
      const title = routeTitles[currentRouteName || ''] || 'GoGent AI Platform';
      document.title = title;
    }
  };

  return (
    <SafeAreaProvider>
      <ResponsiveProvider>
        <NavigationContainer 
          linking={linking}
          onStateChange={onNavigationStateChange}
          fallback={<View style={styles.container}><Text>Loading...</Text></View>}
        >
          <AuthProvider>
            <AppProvider>
              <FormStateProvider>
                <ToastProvider>
                  <SafeAreaView style={styles.container}>
                    <View style={styles.container}>
                      <UserStatusBar />
                      <View style={styles.content}>
                        <TabNavigator />
                      </View>
                    </View>
                    <CustomAlert />
                  </SafeAreaView>
                </ToastProvider>
              </FormStateProvider>
            </AppProvider>
          </AuthProvider>
        </NavigationContainer>
      </ResponsiveProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
});
