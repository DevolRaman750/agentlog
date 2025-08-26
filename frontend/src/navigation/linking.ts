import { LinkingOptions, PathConfig } from '@react-navigation/native';
import { TabParamList } from '../types';

export const linking: LinkingOptions<TabParamList> = {
  prefixes: [
    'http://localhost:8081', 
    'https://localhost:8081', 
    'http://localhost:19006', 
    'https://localhost:19006',
    'https://agentlog.scalebase.io',
    'http://agentlog.scalebase.io'
  ],
  config: {
    screens: {
      Execute: {
        path: '/experiment',
        exact: true,
      },
      Configure: {
        path: '/model',
        exact: true,
      },
      Functions: {
        path: '/functions',
        exact: true,
      },
      'Execution Templates': {
        path: '/templates',
        exact: true,
      },
      'API Keys': {
        path: '/api-keys',
        exact: true,
      },
      History: {
        path: '/history',
        exact: true,
      },
      Database: {
        path: '/database',
        exact: true,
      },
      Documentation: '/documentation' as any,
      Account: {
        path: '/account',
        exact: true,
      },
      Agents: {
        path: '/agents',
        exact: true,
      },
      Marketplace: {
        path: '/marketplace',
        exact: true,
      },
      TeamDetail: {
        path: '/team/:teamId',
        parse: {
          teamId: (teamId: string) => teamId,
        },
      },
    },
    initialRouteName: 'Account', // Default fallback, will be overridden by getInitialRouteName
  },
  // Handle initial URL
  getInitialURL: async () => {
    // Check if running on web
    if (typeof window !== 'undefined' && window.location) {
      const url = window.location.href;
      console.log('🔗 Initial URL:', url);
      return url;
    }
    return null;
  },
  // Subscribe to URL changes
  subscribe: (listener) => {
    if (typeof window !== 'undefined' && window.addEventListener) {
      const onPopState = () => {
        const url = window.location.href;
        listener(url);
      };

      window.addEventListener('popstate', onPopState);

      return () => {
        window.removeEventListener('popstate', onPopState);
      };
    }
    
    // Return no-op unsubscribe for non-web platforms
    return () => {};
  },
};

// Default routes for authenticated vs unauthenticated users
export const getInitialRouteName = (isAuthenticated: boolean, isLoading: boolean): keyof TabParamList => {
  // While authentication is still loading, don't make routing decisions yet
  // Return the route based on current URL to maintain user's position
  if (isLoading && typeof window !== 'undefined' && window.location) {
    const path = window.location.pathname;
    
    // Map paths to route names
    const pathToRoute: Record<string, keyof TabParamList> = {
      '/experiment': 'Execute',
      '/model': 'Configure',
      '/execute': 'Execute', // Legacy support
      '/configure': 'Configure', // Legacy support
      '/functions': 'Functions',
      '/templates': 'Execution Templates',
      '/execution-templates': 'Execution Templates', // Legacy support
      '/api-keys': 'API Keys',
      '/history': 'History',
      '/database': 'Database',
      '/documentation': 'Documentation',
      '/documentation/overview': 'Documentation',
      '/documentation/getting-started': 'Documentation',
      '/documentation/agents': 'Documentation',
      '/documentation/teams': 'Documentation',
      '/documentation/templates': 'Documentation',
      '/documentation/executions': 'Documentation',
      '/documentation/functions': 'Documentation',
      '/documentation/api-keys': 'Documentation',
      '/account': 'Account',
      '/agents': 'Agents',
      '/marketplace': 'Marketplace',
    };

    // Handle team routes with dynamic IDs
    if (path.startsWith('/team/')) {
      return 'TeamDetail' as keyof TabParamList;
    }

    const routeName = pathToRoute[path];
    if (routeName) {
      // Don't redirect yet - just return the current route
      return routeName;
    }
    
    // Handle root path "/" - default to Account during loading (we don't know auth status yet)
    if (path === '/' || path === '') {
      return 'Account';
    }
    
    // For unknown paths, default to Account during loading
    return 'Account';
  }

  // Once auth has loaded, make proper routing decisions
  if (typeof window !== 'undefined' && window.location) {
    const path = window.location.pathname;
    
    // Map paths to route names
    const pathToRoute: Record<string, keyof TabParamList> = {
      '/experiment': 'Execute',
      '/model': 'Configure',
      '/execute': 'Execute', // Legacy support
      '/configure': 'Configure', // Legacy support
      '/functions': 'Functions',
      '/templates': 'Execution Templates',
      '/execution-templates': 'Execution Templates', // Legacy support
      '/api-keys': 'API Keys',
      '/history': 'History',
      '/database': 'Database',
      '/documentation': 'Documentation',
      '/documentation/overview': 'Documentation',
      '/documentation/getting-started': 'Documentation',
      '/documentation/agents': 'Documentation',
      '/documentation/teams': 'Documentation',
      '/documentation/templates': 'Documentation',
      '/documentation/executions': 'Documentation',
      '/documentation/functions': 'Documentation',
      '/documentation/api-keys': 'Documentation',
      '/account': 'Account',
      '/agents': 'Agents',
      '/marketplace': 'Marketplace',
    };

    // Handle team routes with dynamic IDs
    if (path.startsWith('/team/')) {
      return 'TeamDetail' as keyof TabParamList;
    }

    const routeName = pathToRoute[path];
    if (routeName) {
      // Even if user is not authenticated, let them try to access any route
      // Individual screens will handle authentication requirements
      return routeName;
    }
    
    // Handle root path "/" - redirect based on authentication status
    if (path === '/' || path === '') {
      if (isAuthenticated) {
        const defaultPath = '/experiment';
        window.history.replaceState({}, '', defaultPath);
        return 'Execute';
      } else {
        const defaultPath = '/account';
        window.history.replaceState({}, '', defaultPath);
        return 'Account';
      }
    }
  }

  // Default initial route based on authentication status
  return isAuthenticated ? 'Execute' : 'Account';
}; 