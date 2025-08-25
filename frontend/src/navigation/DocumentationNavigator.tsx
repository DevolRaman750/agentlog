import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import DocumentationScreen from '../screens/DocumentationScreen';

export type DocumentationStackParamList = {
  DocumentationHome: { section?: string };
  DocumentationOverview: { section?: string };
  DocumentationGettingStarted: { section?: string };
  DocumentationAgents: { section?: string };
  DocumentationTeams: { section?: string };
  DocumentationTemplates: { section?: string };
  DocumentationExecutions: { section?: string };
  DocumentationFunctions: { section?: string };
  DocumentationApiKeys: { section?: string };
};

const Stack = createStackNavigator<DocumentationStackParamList>();

const DocumentationNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="DocumentationHome" 
        component={DocumentationScreen}
        initialParams={{ section: undefined }}
      />
      <Stack.Screen 
        name="DocumentationOverview" 
        component={DocumentationScreen}
        initialParams={{ section: 'overview' }}
      />
      <Stack.Screen 
        name="DocumentationGettingStarted" 
        component={DocumentationScreen}
        initialParams={{ section: 'getting-started' }}
      />
      <Stack.Screen 
        name="DocumentationAgents" 
        component={DocumentationScreen}
        initialParams={{ section: 'agents' }}
      />
      <Stack.Screen 
        name="DocumentationTeams" 
        component={DocumentationScreen}
        initialParams={{ section: 'teams' }}
      />
      <Stack.Screen 
        name="DocumentationTemplates" 
        component={DocumentationScreen}
        initialParams={{ section: 'templates' }}
      />
      <Stack.Screen 
        name="DocumentationExecutions" 
        component={DocumentationScreen}
        initialParams={{ section: 'executions' }}
      />
      <Stack.Screen 
        name="DocumentationFunctions" 
        component={DocumentationScreen}
        initialParams={{ section: 'functions' }}
      />
      <Stack.Screen 
        name="DocumentationApiKeys" 
        component={DocumentationScreen}
        initialParams={{ section: 'api-keys' }}
      />
    </Stack.Navigator>
  );
};

export default DocumentationNavigator;