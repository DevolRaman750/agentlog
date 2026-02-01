import React from 'react';
import { SafeAreaView, View, StyleSheet, Text } from 'react-native';
import { NavigationContainer, NavigationState, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { AppProvider } from './src/context/AppContext';
import { ToastProvider } from './src/context/ToastContext';
import { ResponsiveProvider } from './src/context/ResponsiveContext';
import { FormStateProvider } from './src/context/FormStateContext';
import { ThemeProvider, useTheme } from './src/theme';
import TabNavigator from './src/navigation/TabNavigator';
import { UserStatusBar } from './src/components/UserStatusBar';
import { CustomAlert } from './src/components/CustomAlert';
import { linking } from './src/navigation/linking';
import { BetaBanner } from './src/components/BetaBanner';

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
      'Agents': 'Agents - GoGent AI Platform',
      'Marketplace': 'Marketplace - GoGent AI Platform',
      'TeamDetail': 'Team - GoGent AI Platform',
      'More': 'Navigation - GoGent AI Platform',
    };

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

const ThemedApp = () => {
  const { colors } = useTheme();

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.accent,
      background: colors.bgApp,
      card: colors.bgCard,
      text: colors.textPrimary,
      border: colors.borderLight,
      notification: colors.statusError,
    },
  };

  return (
    <NavigationContainer
      linking={linking}
      onStateChange={onNavigationStateChange}
      theme={navigationTheme}
      fallback={<View style={{ flex: 1, backgroundColor: colors.bgApp }}><Text>Loading...</Text></View>}
    >
      <AuthProvider>
        <AppProvider>
          <FormStateProvider>
            <ToastProvider>
              <SafeAreaView style={{ flex: 1, backgroundColor: colors.bgApp }}>
                <View style={{ flex: 1 }}>
                  <UserStatusBar />
                  <BetaBanner />
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
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ResponsiveProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </ResponsiveProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
});
