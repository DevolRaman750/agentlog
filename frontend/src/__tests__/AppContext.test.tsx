import React from 'react';
import { renderHook, act } from '@testing-library/react-hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider, useApp } from '../context/AppContext';
import { goGentAPI } from '../api/client';
import { APIConfiguration, ExecutionRun, AppConfig } from '../types';

// Mock AsyncStorage
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  multiRemove: jest.fn(),
  getAllKeys: jest.fn(),
  multiGet: jest.fn(),
  multiSet: jest.fn(),
};
(AsyncStorage as any) = mockAsyncStorage;

// Mock goGentAPI
jest.mock('../api/client', () => ({
  goGentAPI: {
    getConfigurations: jest.fn(),
    createConfiguration: jest.fn(),
    updateConfiguration: jest.fn(),
    deleteConfiguration: jest.fn(),
    getExecutions: jest.fn(),
    deleteExecution: jest.fn(),
    testConnection: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

const mockedGoGentAPI = jest.mocked(goGentAPI);

// Mock expo-constants
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {
        backendUrl: 'http://localhost:8080',
        environment: 'test',
        isProduction: false,
      },
    },
  },
}));

// Mock AuthContext to provide a simple authenticated user
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user', username: 'testuser' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('AppContext', () => {
  const mockConfiguration: APIConfiguration = {
    id: 'test-config-id',
    variationName: 'Test Config',
    modelName: 'gemini-pro',
    temperature: 0.7,
    systemPrompt: 'Test system prompt',
    userId: 'test-user',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const mockExecution: ExecutionRun = {
    id: 'test-execution-id',
    name: 'Test Execution',
    enableFunctionCalling: false,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AppProvider>{children}</AppProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
    mockAsyncStorage.setItem.mockResolvedValue(undefined);
    mockAsyncStorage.removeItem.mockResolvedValue(undefined);
  });

  describe('Initial State', () => {
    test('should initialize with correct default state', async () => {
      const { result, waitForNextUpdate } = renderHook(() => useApp(), { wrapper });

      // Wait for initial setup to complete
      await act(async () => {
        try {
          await waitForNextUpdate();
        } catch {
          // May not update if no async operations
        }
      });

      expect(result.current.state.configurations).toEqual([]);
      expect(result.current.state.recentExecutions).toEqual([]);
      expect(result.current.state.isLoading).toBe(false);
      expect(result.current.state.error).toBeNull();
      expect(result.current.state.isConnected).toBe(false);
      expect(result.current.state.connectionLatency).toBe(0);
    });

    test('should load stored configuration on mount', async () => {
      const storedConfig: AppConfig = {
        backendUrl: 'http://localhost:8080',
        geminiApiKey: 'test-key',
        openWeatherApiKey: 'weather-key',
        neo4jUrl: 'bolt://localhost:7687',
        neo4jUsername: 'neo4j',
        neo4jPassword: 'password',
        neo4jDatabase: 'neo4j',
        useMockResponses: false,
      };

      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'appConfig') return Promise.resolve(JSON.stringify(storedConfig));
        return Promise.resolve(null);
      });

      const { result, waitForNextUpdate } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        try {
          await waitForNextUpdate();
        } catch {
          // Expected if no updates
        }
      });

      expect(result.current.state.config.geminiApiKey).toBe('test-key');
    });
  });

  describe('Configuration Management', () => {
    test('should load configurations from API', async () => {
      mockedGoGentAPI.getConfigurations.mockResolvedValue({
        success: true,
        data: [mockConfiguration],
      });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.loadConfigurations();
      });

      expect(result.current.state.configurations).toContain(mockConfiguration);
      expect(result.current.state.error).toBeNull();
    });

    test('should handle configuration loading errors', async () => {
      mockedGoGentAPI.getConfigurations.mockResolvedValue({
        success: false,
        error: 'Failed to load configurations',
      });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.loadConfigurations();
      });

      expect(result.current.state.configurations).toEqual([]);
      expect(result.current.state.error).toBe('Failed to load configurations');
    });

    test('should add new configuration', async () => {
      mockedGoGentAPI.createConfiguration.mockResolvedValue({
        success: true,
        data: mockConfiguration,
      });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.addConfiguration(mockConfiguration);
      });

      expect(result.current.state.configurations).toContain(mockConfiguration);
    });
  });

  describe('Connection Testing', () => {
    test('should test connection successfully', async () => {
      mockedGoGentAPI.testConnection.mockResolvedValue({
        success: true,
        data: { message: 'Connected' },
      });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.testConnection();
      });

      expect(result.current.state.isConnected).toBe(true);
      expect(result.current.state.connectionLatency).toBeGreaterThan(0);
    });

    test('should handle connection failure', async () => {
      mockedGoGentAPI.testConnection.mockResolvedValue({
        success: false,
        error: 'Connection failed',
      });

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.testConnection();
      });

      expect(result.current.state.isConnected).toBe(false);
    });
  });

  describe('Configuration Updates', () => {
    test('should update app config', async () => {
      const newConfig: Partial<AppConfig> = {
        backendUrl: 'http://new-backend:8080',
        geminiApiKey: 'new-api-key',
      };

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.updateConfig(newConfig);
      });

      expect(result.current.state.config.backendUrl).toBe('http://new-backend:8080');
      expect(result.current.state.config.geminiApiKey).toBe('new-api-key');
      expect(mockAsyncStorage.setItem).toHaveBeenCalledWith(
        'appConfig',
        JSON.stringify(expect.objectContaining(newConfig))
      );
    });
  });

  describe('Error Handling', () => {
    test('should clear errors', async () => {
      const { result } = renderHook(() => useApp(), { wrapper });

      // First set an error by making a failing API call
      mockedGoGentAPI.getConfigurations.mockResolvedValue({
        success: false,
        error: 'Test error',
      });

      await act(async () => {
        await result.current.loadConfigurations();
      });

      expect(result.current.state.error).toBe('Test error');

      await act(async () => {
        result.current.clearError();
      });

      expect(result.current.state.error).toBeNull();
    });

    test('should handle API errors gracefully', async () => {
      mockedGoGentAPI.getConfigurations.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useApp(), { wrapper });

      await act(async () => {
        await result.current.loadConfigurations();
      });

      expect(result.current.state.error).toContain('Network error');
    });
  });

  describe('Loading States', () => {
    test('should manage loading state during operations', async () => {
      // Mock a delayed response
      mockedGoGentAPI.getConfigurations.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ success: true, data: [] }), 100))
      );

      const { result } = renderHook(() => useApp(), { wrapper });

      // Start loading operation
      const loadPromise = act(async () => {
        await result.current.loadConfigurations();
      });

      // Should be loading during the operation
      expect(result.current.state.isLoading).toBe(true);

      await loadPromise;

      // Should not be loading after completion
      expect(result.current.state.isLoading).toBe(false);
    });
  });
}); 