import { ComponentType } from 'react';
import { Ionicons } from '@expo/vector-icons';

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
import AgentMarketplaceScreen from '../screens/AgentMarketplaceScreen';
import DocumentationScreen from '../screens/DocumentationScreen';

export interface NavigationItem {
  name: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
  component?: ComponentType<any>;
  children?: NavigationItem[];
  isSubItem?: boolean;
  urlPath?: string;
}

/**
 * Unified navigation configuration used across all navigation components
 * This ensures consistency between mobile dropdown, sidebar, and tab navigation
 */
export const navigationItems: NavigationItem[] = [
  { 
    name: 'Agents', 
    title: 'Agents', 
    icon: 'construct-outline', 
    iconFocused: 'construct',
    component: AgentsScreen,
    urlPath: '/agents',
    children: [
      { 
        name: 'Agents', 
        title: 'Your Agents', 
        icon: 'construct-outline', 
        iconFocused: 'construct', 
        component: AgentsScreen, 
        isSubItem: true,
        urlPath: '/agents'
      },
      { 
        name: 'Marketplace', 
        title: 'Marketplace', 
        icon: 'storefront-outline', 
        iconFocused: 'storefront', 
        component: AgentMarketplaceScreen, 
        isSubItem: true,
        urlPath: '/marketplace'
      }
    ]
  },
  { 
    name: 'Configure', 
    title: 'Configure', 
    icon: 'settings-outline', 
    iconFocused: 'settings',
    component: ConfigureScreen,
    urlPath: '/model',
    children: [
      { 
        name: 'Configure', 
        title: 'Model', 
        icon: 'settings-outline', 
        iconFocused: 'settings', 
        component: ConfigureScreen, 
        isSubItem: true,
        urlPath: '/model'
      },
      { 
        name: 'Execute', 
        title: 'Experiment', 
        icon: 'flask-outline', 
        iconFocused: 'flask', 
        component: ExecuteScreen, 
        isSubItem: true,
        urlPath: '/experiment'
      },
      { 
        name: 'Execution Templates', 
        title: 'Templates', 
        icon: 'document-text-outline', 
        iconFocused: 'document-text', 
        component: ExecutionTemplatesScreen, 
        isSubItem: true,
        urlPath: '/templates'
      },
      { 
        name: 'Functions', 
        title: 'Functions', 
        icon: 'code-slash-outline', 
        iconFocused: 'code-slash', 
        component: FunctionScreen, 
        isSubItem: true,
        urlPath: '/functions'
      },
      { 
        name: 'API Keys', 
        title: 'API Keys', 
        icon: 'key-outline', 
        iconFocused: 'key', 
        component: ApiKeysScreen, 
        isSubItem: true,
        urlPath: '/api-keys'
      }
    ]
  },
  { 
    name: 'History', 
    title: 'Execution History', 
    icon: 'time-outline', 
    iconFocused: 'time', 
    component: HistoryScreen,
    urlPath: '/history'
  },
  { 
    name: 'Database', 
    title: 'Data', 
    icon: 'server-outline', 
    iconFocused: 'server', 
    component: DatabaseScreen,
    urlPath: '/database'
  },
  { 
    name: 'Documentation', 
    title: 'Documentation', 
    icon: 'book-outline', 
    iconFocused: 'book', 
    component: DocumentationScreen,
    urlPath: '/documentation'
  },
  { 
    name: 'Account', 
    title: 'Account', 
    icon: 'person-circle-outline', 
    iconFocused: 'person-circle', 
    component: AuthScreen,
    urlPath: '/account'
  },
];

/**
 * Get all navigation items including children as a flat array
 */
export const getAllNavigationItems = (items: NavigationItem[] = navigationItems): NavigationItem[] => {
  const result: NavigationItem[] = [];
  items.forEach(item => {
    result.push(item);
    if (item.children) {
      result.push(...item.children);
    }
  });
  return result;
};

/**
 * Get visible navigation items based on authentication status
 */
export const getVisibleNavigationItems = (isAuthenticated: boolean): NavigationItem[] => {
  if (!isAuthenticated) {
    return navigationItems.filter(item => item.name === 'Account');
  }
  return navigationItems;
};

/**
 * URL path mapping for web navigation
 */
export const pathToRouteMap: Record<string, string> = {
  '/experiment': 'Execute',
  '/model': 'Configure', 
  '/functions': 'Functions',
  '/templates': 'Execution Templates',
  '/api-keys': 'API Keys',
  '/history': 'History',
  '/database': 'Database',
  '/agents': 'Agents',
  '/marketplace': 'Marketplace',
  '/account': 'Account',
};

/**
 * Route to URL path mapping for web navigation
 */
export const routeToPathMap: Record<string, string> = {
  'Execute': '/experiment',
  'Configure': '/model',
  'Functions': '/functions',
  'Execution Templates': '/templates',
  'API Keys': '/api-keys',
  'History': '/history',
  'Database': '/database',
  'Agents': '/agents',
  'Marketplace': '/marketplace',
  'Account': '/account',
  'TeamDetail': '/team',
};