import AsyncStorage from '@react-native-async-storage/async-storage';
import { goGentAPI } from '../api/client';

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

// Mock secure storage
jest.mock('../utils/secureStorage', () => ({
  secureStorage: {
    loadApiKeys: jest.fn(() => Promise.resolve({
      geminiApiKey: 'test-gemini-key',
      openWeatherApiKey: 'test-weather-key',
    })),
  },
  headerEncryption: {
    encryptValue: jest.fn((value) => `encrypted_${value}`),
  },
}));

describe('API Client Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAsyncStorage.getItem.mockResolvedValue(null);
  });

  describe('Client Initialization', () => {
    test('should initialize without throwing errors', () => {
      expect(() => {
        const client = goGentAPI;
        expect(client).toBeDefined();
      }).not.toThrow();
    });

    test('should handle missing AsyncStorage gracefully', () => {
      mockAsyncStorage.getItem.mockRejectedValue(new Error('AsyncStorage error'));
      
      expect(() => {
        const client = goGentAPI;
        expect(client).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('Authentication Token Handling', () => {
    test('should handle empty auth token', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve('');
        if (key === 'appConfig') return Promise.resolve('{}');
        return Promise.resolve(null);
      });

      const result = await goGentAPI.testConnection();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle null auth token', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve(null);
        if (key === 'appConfig') return Promise.resolve('{}');
        return Promise.resolve(null);
      });

      const result = await goGentAPI.testConnection();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle whitespace-only auth token', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve('   ');
        if (key === 'appConfig') return Promise.resolve('{}');
        return Promise.resolve(null);
      });

      const result = await goGentAPI.testConnection();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Configuration Handling', () => {
    test('should handle corrupted app config', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve('valid-token');
        if (key === 'appConfig') return Promise.resolve('invalid-json');
        return Promise.resolve(null);
      });

      const result = await goGentAPI.testConnection();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle missing app config', async () => {
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve('valid-token');
        if (key === 'appConfig') return Promise.resolve(null);
        return Promise.resolve(null);
      });

      const result = await goGentAPI.testConnection();
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('API Response Handling', () => {
    test('should handle API call results gracefully', async () => {
      const result = await goGentAPI.getConfigurations();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(typeof result.error).toBe('string');
      } else {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });

    test('should handle user creation', async () => {
      const result = await goGentAPI.createTemporaryUser();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success && result.data) {
        expect(typeof result.data.token).toBe('string');
        expect(typeof result.data.user).toBe('object');
      }
    });

    test('should handle function operations', async () => {
      const result = await goGentAPI.getFunctions();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(Array.isArray(result.data)).toBe(true);
      }
    });
  });

  describe('CRUD Operations', () => {
    test('should handle configuration creation', async () => {
      const testConfig = {
        variationName: 'Test Config',
        modelName: 'gemini-pro',
        temperature: 0.7,
        systemPrompt: 'Test prompt',
      };

      const result = await goGentAPI.createConfiguration(testConfig);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle configuration updates', async () => {
      const testConfig = {
        id: 'test-id',
        variationName: 'Updated Config',
        modelName: 'gemini-pro',
        temperature: 0.8,
        systemPrompt: 'Updated prompt',
      };

      const result = await goGentAPI.updateConfiguration(testConfig);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle configuration deletion', async () => {
      const result = await goGentAPI.deleteConfiguration('test-id');
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Execution Operations', () => {
    test('should handle multi-configuration execution', async () => {
      const executionRequest = {
        executionRunName: 'Test Execution',
        basePrompt: 'Test prompt',
        configurations: [],
      };

      const result = await goGentAPI.executeMultiConfiguration(executionRequest);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Database Operations', () => {
    test('should handle database stats requests', async () => {
      const result = await goGentAPI.getDatabaseStats();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle database table queries', async () => {
      const result = await goGentAPI.getDatabaseTables();
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Error Response Structure', () => {
    test('should provide consistent error structure', async () => {
      // Test with invalid input to trigger error
      const result = await goGentAPI.createConfiguration({} as any);
      
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      
      if (!result.success) {
        expect(result.error).toBeDefined();
        expect(typeof result.error).toBe('string');
      }
    });
  });

  describe('Resilience', () => {
    test('should handle multiple concurrent requests', async () => {
      const promises = Array(3).fill(0).map(() => goGentAPI.testConnection());
      const results = await Promise.all(promises);

      results.forEach(result => {
        expect(result).toBeDefined();
        expect(typeof result.success).toBe('boolean');
      });
    });

    test('should maintain client stability', async () => {
      // Make several different types of requests
      const requests = [
        goGentAPI.testConnection(),
        goGentAPI.getConfigurations(),
        goGentAPI.getFunctions(),
        goGentAPI.getDatabaseStats(),
      ];

      const results = await Promise.allSettled(requests);

      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        if (result.status === 'fulfilled') {
          expect(result.value).toBeDefined();
          expect(typeof result.value.success).toBe('boolean');
        }
      });
    });
  });
}); 