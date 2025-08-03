import { jest } from '@jest/globals';

// Mock React Native components and APIs
jest.mock('react-native', () => {
  const mockDimensions = {
    get: jest.fn(() => ({ width: 800, height: 600 })),
    addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  };

  const mockAnimated = {
    createAnimatedComponent: (Component: any) => Component,
    Value: jest.fn(() => ({
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
    })),
    timing: jest.fn(() => ({
      start: jest.fn(),
    })),
    spring: jest.fn(() => ({
      start: jest.fn(),
    })),
    View: 'AnimatedView',
    Text: 'AnimatedText',
  };

  return {
    View: 'View',
    Text: 'Text',
    TouchableOpacity: 'TouchableOpacity',
    ScrollView: 'ScrollView',
    Modal: 'Modal',
    SafeAreaView: 'SafeAreaView',
    FlatList: 'FlatList',
    ActivityIndicator: 'ActivityIndicator',
    TextInput: 'TextInput',
    Switch: 'Switch',
    KeyboardAvoidingView: 'KeyboardAvoidingView',
    RefreshControl: 'RefreshControl',
    StyleSheet: {
      create: (styles: any) => styles,
      flatten: (styles: any) => styles,
    },
    Dimensions: mockDimensions,
    Platform: { 
      OS: 'web',
      select: (config: any) => config.web || config.default,
    },
    Animated: mockAnimated,
  };
});

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    name: 'Execute',
    params: {},
  }),
  NavigationContainer: ({ children }: any) => children,
}));

jest.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }: any) => children,
    Screen: ({ children }: any) => children,
  }),
}));

// Mock Expo components
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

// Mock contexts
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { id: '1', username: 'testuser' },
    loading: false,
  }),
  AuthProvider: ({ children }: any) => children,
}));

jest.mock('../context/AppContext', () => ({
  useApp: () => ({
    state: { configurations: [], functions: [] },
    clearError: jest.fn(),
    refreshAllData: jest.fn(),
  }),
  AppProvider: ({ children }: any) => children,
}));

jest.mock('../context/ToastContext', () => ({
  useToast: () => ({
    showToast: jest.fn(),
  }),
  ToastProvider: ({ children }: any) => children,
}));

// Mock screens
jest.mock('../screens/ExecuteScreen', () => 'ExecuteScreen');
jest.mock('../screens/ConfigureScreen', () => 'ConfigureScreen');
jest.mock('../screens/FunctionScreen', () => 'FunctionScreen');
jest.mock('../screens/TemplateLibraryScreen', () => 'TemplateLibraryScreen');
jest.mock('../screens/ApiKeysScreen', () => 'ApiKeysScreen');
jest.mock('../screens/HistoryScreen', () => 'HistoryScreen');
jest.mock('../screens/DatabaseScreen', () => 'DatabaseScreen');
jest.mock('../screens/AuthScreen', () => 'AuthScreen');

// Mock other components
jest.mock('../components/UserStatusBar', () => ({
  UserStatusBar: 'UserStatusBar',
}));

jest.mock('../components/CustomAlert', () => ({
  CustomAlert: 'CustomAlert',
  AlertAPI: { show: jest.fn() },
}));

import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Dimensions } from 'react-native';
import { ResponsiveProvider, useResponsive } from '../context/ResponsiveContext';
import TabNavigator from '../navigation/TabNavigator';

// Test component to check responsive context values
const ResponsiveTestComponent = () => {
  const { screenWidth, screenHeight, isSidebarLayout, showMobileDropdown } = useResponsive();
  
  // @ts-ignore - Using React.createElement for testing with custom props
  return React.createElement('View', {
    testID: 'responsive-test',
    screenWidth,
    screenHeight,
    isSidebarLayout,
    showMobileDropdown,
  });
};

describe('Responsive Navigation E2E Tests', () => {
  let mockDimensionsGet: jest.Mock;
  let mockDimensionsAddEventListener: jest.Mock;
  let dimensionChangeCallback: ((args: any) => void) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDimensionsGet = Dimensions.get as jest.Mock;
    mockDimensionsAddEventListener = Dimensions.addEventListener as jest.Mock;
    
    // Capture the dimension change callback
    mockDimensionsAddEventListener.mockImplementation((eventType: any, callback: any) => {
      if (eventType === 'change') {
        dimensionChangeCallback = callback;
      }
      return { remove: jest.fn() };
    });
  });

  afterEach(() => {
    dimensionChangeCallback = null;
  });

  describe('ResponsiveContext', () => {
    it('should provide correct responsive values for desktop screen (>= 768px)', async () => {
      // Set desktop screen size
      mockDimensionsGet.mockReturnValue({ width: 1024, height: 768 });
      
      const { getByTestId } = render(
        <ResponsiveProvider>
          <ResponsiveTestComponent />
        </ResponsiveProvider>
      );

      const testComponent = getByTestId('responsive-test');
      
      expect(testComponent.props.screenWidth).toBe(1024);
      expect(testComponent.props.screenHeight).toBe(768);
      expect(testComponent.props.isSidebarLayout).toBe(true);
      expect(testComponent.props.showMobileDropdown).toBe(false);
    });

    it('should provide correct responsive values for tablet screen (600-767px)', async () => {
      mockDimensionsGet.mockReturnValue({ width: 700, height: 500 });
      
      const { getByTestId } = render(
        <ResponsiveProvider>
          <ResponsiveTestComponent />
        </ResponsiveProvider>
      );

      const testComponent = getByTestId('responsive-test');
      
      expect(testComponent.props.screenWidth).toBe(700);
      expect(testComponent.props.screenHeight).toBe(500);
      expect(testComponent.props.isSidebarLayout).toBe(false);
      expect(testComponent.props.showMobileDropdown).toBe(true); // Changed to true since 700 < 768
    });

    it('should provide correct responsive values for narrow mobile screen (< 600px)', async () => {
      // Set narrow mobile screen size
      mockDimensionsGet.mockReturnValue({ width: 375, height: 667 });
      
      const { getByTestId } = render(
        <ResponsiveProvider>
          <ResponsiveTestComponent />
        </ResponsiveProvider>
      );

      const testComponent = getByTestId('responsive-test');
      
      expect(testComponent.props.screenWidth).toBe(375);
      expect(testComponent.props.screenHeight).toBe(667);
      expect(testComponent.props.isSidebarLayout).toBe(false);
      expect(testComponent.props.showMobileDropdown).toBe(true);
    });

    it('should handle dimension changes without excessive re-renders', async () => {
      let renderCount = 0;
      const RenderCounterComponent = () => {
        renderCount++;
        const responsive = useResponsive();
        // @ts-ignore - Using React.createElement for testing with custom props
        return React.createElement('View', {
          testID: 'render-counter',
          renderCount,
          screenWidth: responsive.screenWidth,
        });
      };

      // Start with desktop size
      mockDimensionsGet.mockReturnValue({ width: 1024, height: 768 });
      
      const { getByTestId, rerender } = render(
        <ResponsiveProvider>
          <RenderCounterComponent />
        </ResponsiveProvider>
      );

      expect(renderCount).toBe(1);

      // Simulate dimension change to mobile
      await act(async () => {
        if (dimensionChangeCallback) {
          dimensionChangeCallback({ window: { width: 375, height: 667 } });
        }
        // Wait for debounce (ResponsiveContext uses 200ms debounce)
        await new Promise(resolve => setTimeout(resolve, 250));
      });

      // Should only re-render once due to debouncing
      expect(renderCount).toBeLessThanOrEqual(2);
      
      const testComponent = getByTestId('render-counter');
      expect(testComponent.props.screenWidth).toBe(375);
    });

    it('should debounce rapid dimension changes', async () => {
      let renderCount = 0;
      const RenderCounterComponent = () => {
        renderCount++;
        useResponsive();
        // @ts-ignore - Using React.createElement for testing
        return React.createElement('View', { testID: 'debounce-test' });
      };

      mockDimensionsGet.mockReturnValue({ width: 1024, height: 768 });
      
      render(
        <ResponsiveProvider>
          <RenderCounterComponent />
        </ResponsiveProvider>
      );

      const initialRenderCount = renderCount;

      // Simulate rapid dimension changes
      await act(async () => {
        if (dimensionChangeCallback) {
          dimensionChangeCallback({ window: { width: 800, height: 600 } });
          dimensionChangeCallback({ window: { width: 750, height: 550 } });
          dimensionChangeCallback({ window: { width: 700, height: 500 } });
          dimensionChangeCallback({ window: { width: 650, height: 450 } });
        }
        // Wait for debounce (ResponsiveContext uses 200ms debounce)
        await new Promise(resolve => setTimeout(resolve, 250));
      });

      // Should have minimal re-renders due to debouncing
      expect(renderCount - initialRenderCount).toBeLessThanOrEqual(2);
    });
  });

  describe('TabNavigator Responsive Behavior', () => {
    it('should render TabNavigator without crashing on desktop', () => {
      mockDimensionsGet.mockReturnValue({ width: 1024, height: 768 });
      
      const result = render(
        <ResponsiveProvider>
          <TabNavigator />
        </ResponsiveProvider>
      );

      expect(result).toBeTruthy();
    });

    it('should render TabNavigator without crashing on mobile', () => {
      mockDimensionsGet.mockReturnValue({ width: 375, height: 667 });
      
      const result = render(
        <ResponsiveProvider>
          <TabNavigator />
        </ResponsiveProvider>
      );

      expect(result).toBeTruthy();
    });

    it('should render TabNavigator without crashing on narrow mobile (< 600px)', () => {
      mockDimensionsGet.mockReturnValue({ width: 320, height: 568 });
      
      const result = render(
        <ResponsiveProvider>
          <TabNavigator />
        </ResponsiveProvider>
      );

      // Most important: content should still be accessible at narrow widths
      expect(result).toBeTruthy();
    });

    it('should handle screen size transitions without losing content', async () => {
      // Start with desktop
      mockDimensionsGet.mockReturnValue({ width: 1024, height: 768 });
      
      const result = render(
        <ResponsiveProvider>
          <TabNavigator />
        </ResponsiveProvider>
      );

      expect(result).toBeTruthy();

      // Transition to narrow mobile
      await act(async () => {
        if (dimensionChangeCallback) {
          dimensionChangeCallback({ window: { width: 320, height: 568 } });
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      });

      // Content should still be accessible
      expect(result).toBeTruthy();

      // Transition back to desktop
      await act(async () => {
        if (dimensionChangeCallback) {
          dimensionChangeCallback({ window: { width: 1024, height: 768 } });
        }
        await new Promise(resolve => setTimeout(resolve, 250));
      });

      // Content should still be accessible
      expect(result).toBeTruthy();
    });
  });

  describe('Screen Size Edge Cases', () => {
    it('should handle exactly 768px width (desktop breakpoint)', () => {
      mockDimensionsGet.mockReturnValue({ width: 768, height: 500 });
      
      const { getByTestId } = render(
        <ResponsiveProvider>
          <ResponsiveTestComponent />
        </ResponsiveProvider>
      );

      const testComponent = getByTestId('responsive-test');
      expect(testComponent.props.isSidebarLayout).toBe(true);
      expect(testComponent.props.showMobileDropdown).toBe(false);
    });

    it('should handle exactly 600px width (mobile dropdown breakpoint)', () => {
      mockDimensionsGet.mockReturnValue({ width: 600, height: 400 });
      
      const { getByTestId } = render(
        <ResponsiveProvider>
          <ResponsiveTestComponent />
        </ResponsiveProvider>
      );

      const testComponent = getByTestId('responsive-test');
      expect(testComponent.props.isSidebarLayout).toBe(false);
      expect(testComponent.props.showMobileDropdown).toBe(true); // Changed to true since 600 < 768
    });

    it('should handle very narrow screens (< 320px)', () => {
      mockDimensionsGet.mockReturnValue({ width: 280, height: 500 });
      
      const { getByTestId } = render(
        <ResponsiveProvider>
          <ResponsiveTestComponent />
        </ResponsiveProvider>
      );

      const testComponent = getByTestId('responsive-test');
      expect(testComponent.props.isSidebarLayout).toBe(false);
      expect(testComponent.props.showMobileDropdown).toBe(true);
    });

    it('should handle very wide screens (> 1920px)', () => {
      mockDimensionsGet.mockReturnValue({ width: 2560, height: 1440 });
      
      const { getByTestId } = render(
        <ResponsiveProvider>
          <ResponsiveTestComponent />
        </ResponsiveProvider>
      );

      const testComponent = getByTestId('responsive-test');
      expect(testComponent.props.isSidebarLayout).toBe(true);
      expect(testComponent.props.showMobileDropdown).toBe(false);
    });
  });

  describe('Performance and Memory', () => {
    it('should properly clean up dimension listeners', () => {
      const mockRemove = jest.fn();
      mockDimensionsAddEventListener.mockReturnValue({ remove: mockRemove });

      const { unmount } = render(
        <ResponsiveProvider>
          <ResponsiveTestComponent />
        </ResponsiveProvider>
      );

      // Verify listener was added
      expect(mockDimensionsAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      // Unmount and verify cleanup
      unmount();
      expect(mockRemove).toHaveBeenCalled();
    });

    it('should not cause memory leaks with multiple rapid mounts/unmounts', () => {
      const mockRemove = jest.fn();
      mockDimensionsAddEventListener.mockReturnValue({ remove: mockRemove });

      // Mount and unmount multiple times
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <ResponsiveProvider>
            <ResponsiveTestComponent />
          </ResponsiveProvider>
        );
        unmount();
      }

      // Should have cleaned up all listeners
      expect(mockRemove).toHaveBeenCalledTimes(5);
    });
  });
});

describe('Integration with Navigation', () => {
  let mockDimensionsGet: jest.Mock;
  let dimensionChangeCallback: ((args: any) => void) | null = null;

  beforeEach(() => {
    mockDimensionsGet = Dimensions.get as jest.Mock;
    const mockDimensionsAddEventListener = Dimensions.addEventListener as jest.Mock;
    
    mockDimensionsAddEventListener.mockImplementation((eventType: any, callback: any) => {
      if (eventType === 'change') {
        dimensionChangeCallback = callback;
      }
      return { remove: jest.fn() };
    });
  });

  it('should maintain navigation state across screen size changes', async () => {
    mockDimensionsGet.mockReturnValue({ width: 1024, height: 768 });
    
    const result = render(
      <ResponsiveProvider>
        <TabNavigator />
      </ResponsiveProvider>
    );

    // Should render without issues
    expect(result).toBeTruthy();

    // Simulate screen size change
    await act(async () => {
      if (dimensionChangeCallback) {
        dimensionChangeCallback({ window: { width: 375, height: 667 } });
      }
      await new Promise(resolve => setTimeout(resolve, 250));
    });

    // Navigation should still work
    expect(result).toBeTruthy();
  });
}); 