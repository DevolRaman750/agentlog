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
export const getInitialRouteName = (isAuthenticated: boolean): keyof TabParamList => {
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
      // If user is not authenticated but trying to access protected route, redirect to account
      if (!isAuthenticated && routeName !== 'Account') {
        // Update URL to account page
        window.history.replaceState({}, '', '/account');
        return 'Account';
      }
      return routeName;
    }
    
    // Handle root path "/"
    if (path === '/' || path === '') {
      const defaultRoute = isAuthenticated ? 'Execute' : 'Account';
      const defaultPath = isAuthenticated ? '/execute' : '/account';
      window.history.replaceState({}, '', defaultPath);
      return defaultRoute;
    }
  }

  // Default initial routes
  return isAuthenticated ? 'Execute' : 'Account';
}; 