import { LinkingOptions } from '@react-navigation/native';
import { TabParamList } from '../types';

export const linking: LinkingOptions<TabParamList> = {
  prefixes: ['http://localhost:8081', 'https://localhost:8081'],
  config: {
    screens: {
      Execute: {
        path: '/execute',
        exact: true,
      },
      Configure: {
        path: '/configure',
        exact: true,
      },
      Functions: {
        path: '/functions',
        exact: true,
      },
      Templates: {
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
      Account: {
        path: '/account',
        exact: true,
      },
      More: {
        path: '/more',
        exact: true,
      },
    },
    initialRouteName: 'Execute',
  },
  // Handle initial URL
  getInitialURL: async () => {
    // Check if running on web
    if (typeof window !== 'undefined' && window.location) {
      return window.location.href;
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

    const routeName = pathToRoute[path];
    if (routeName) {
      // Don't redirect yet - just return the current route
      return routeName;
    }
    
    // Handle root path "/" - default to Execute for now during loading
    if (path === '/' || path === '') {
      return 'Execute';
    }
    
    // For unknown paths, default to Execute during loading
    return 'Execute';
  }

  // Once auth has loaded, make proper routing decisions
  if (typeof window !== 'undefined' && window.location) {
    const path = window.location.pathname;
    
    // Map paths to route names
    const pathToRoute: Record<string, keyof TabParamList> = {
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

    const routeName = pathToRoute[path];
    if (routeName) {
      // Even if user is not authenticated, let them try to access any route
      // Individual screens will handle authentication requirements
      return routeName;
    }
    
    // Handle root path "/" - always default to Execute
    if (path === '/' || path === '') {
      const defaultPath = '/execute';
      window.history.replaceState({}, '', defaultPath);
      return 'Execute';
    }
  }

  // Default initial route is always Execute
  return 'Execute';
}; 