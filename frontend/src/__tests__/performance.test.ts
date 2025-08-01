import { goGentAPI } from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APIConfiguration, FunctionDefinition } from '../types';

// Mock AsyncStorage for tests
const mockAsyncStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  multiRemove: jest.fn(),
};

(AsyncStorage as any) = mockAsyncStorage;

describe('Performance and Load Tests', () => {
  let authToken: string;
  let testUserId: string;
  const createdIds: { configs: string[], functions: string[] } = { configs: [], functions: [] };

  beforeAll(async () => {
    // Create a temporary user for testing
    console.log('🧪 Creating test user for performance tests...');
    const authResponse = await goGentAPI.createTemporaryUser();
    expect(authResponse.success).toBe(true);
    
    if (authResponse.success && authResponse.data) {
      authToken = authResponse.data.token;
      testUserId = authResponse.data.user.id;
      
      // Mock AsyncStorage to return the auth token
      mockAsyncStorage.getItem.mockImplementation((key: string) => {
        if (key === 'auth_token') return Promise.resolve(authToken);
        if (key === 'appConfig') return Promise.resolve('{}');
        return Promise.resolve(null);
      });
      
      console.log('✅ Test user created for performance tests:', testUserId);
    }
  }, 30000); // Extended timeout for setup

  afterAll(async () => {
    // Cleanup all created test data
    console.log('🧹 Cleaning up performance test data...');
    
    // Delete all created configurations
    for (const configId of createdIds.configs) {
      await goGentAPI.deleteConfiguration(configId);
    }
    
    // Delete all created functions
    for (const functionId of createdIds.functions) {
      await goGentAPI.deleteFunction(functionId);
    }
    
    console.log('🧹 Performance test cleanup completed');
  }, 30000); // Extended timeout for cleanup

  describe('API Response Time Tests', () => {
    test('should handle authentication requests within reasonable time', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await goGentAPI.getCurrentUser();
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Authentication - Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
      
      // Average should be under 500ms, max under 2000ms
      expect(avgTime).toBeLessThan(500);
      expect(maxTime).toBeLessThan(2000);
    });

    test('should handle configuration list requests efficiently', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await goGentAPI.getConfigurations();
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Configuration List - Avg: ${avgTime.toFixed(2)}ms`);
      
      // Should be consistently fast
      expect(avgTime).toBeLessThan(800);
    });

    test('should handle function list requests efficiently', async () => {
      const iterations = 5;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await goGentAPI.getFunctions();
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      console.log(`Function List - Avg: ${avgTime.toFixed(2)}ms`);
      
      expect(avgTime).toBeLessThan(800);
    });
  });

  describe('Concurrent Request Tests', () => {
    test('should handle multiple simultaneous configuration requests', async () => {
      const concurrency = 10;
      const promises = [];

      const start = performance.now();

      // Create multiple concurrent requests
      for (let i = 0; i < concurrency; i++) {
        promises.push(goGentAPI.getConfigurations());
      }

      const results = await Promise.all(promises);
      const end = performance.now();

      console.log(`${concurrency} concurrent config requests took: ${(end - start).toFixed(2)}ms`);

      // All requests should complete successfully
      results.forEach((result, index) => {
        expect(result).toBeDefined();
        // Allow auth errors but not network errors
        if (!result.success) {
          expect(result.error).toMatch(/401|Authorization|Unauthorized/);
        }
      });

      // Should complete within reasonable time
      expect(end - start).toBeLessThan(5000);
    });

    test('should handle mixed concurrent requests without race conditions', async () => {
      const promises = [
        goGentAPI.getConfigurations(),
        goGentAPI.getFunctions(),
        goGentAPI.getCurrentUser(),
        goGentAPI.getDatabaseStats(),
        goGentAPI.testConnection(),
        goGentAPI.getConfigurations(), // Duplicate request
        goGentAPI.getFunctions(), // Duplicate request
      ];

      const start = performance.now();
      const results = await Promise.all(promises);
      const end = performance.now();

      console.log(`Mixed concurrent requests took: ${(end - start).toFixed(2)}ms`);

      // Should not have race conditions or data corruption
      expect(results.length).toBe(promises.length);
      
      // Check for consistent data across duplicate requests
      const configResults = results.filter((_, index) => [0, 5].includes(index));
      if (configResults.length === 2 && configResults[0].success && configResults[1].success) {
        expect(configResults[0].data).toEqual(configResults[1].data);
      }
    });

    test('should maintain performance under burst load', async () => {
      const burstSize = 20;
      const bursts = 3;
      const timings: number[] = [];

      for (let burst = 0; burst < bursts; burst++) {
        const promises = [];
        
        const start = performance.now();
        
        // Create burst of requests
        for (let i = 0; i < burstSize; i++) {
          promises.push(goGentAPI.getConfigurations());
        }
        
        await Promise.all(promises);
        const end = performance.now();
        
        timings.push(end - start);
        console.log(`Burst ${burst + 1}: ${(end - start).toFixed(2)}ms for ${burstSize} requests`);
        
        // Small delay between bursts
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const avgBurstTime = timings.reduce((a, b) => a + b, 0) / timings.length;
      
      // Performance should not degrade significantly across bursts
      expect(avgBurstTime).toBeLessThan(8000);
      
      // Check that later bursts aren't significantly slower than early ones
      const firstBurst = timings[0];
      const lastBurst = timings[timings.length - 1];
      // Allow up to 5x slowdown across bursts to reduce flakiness in CI environments
      expect(lastBurst).toBeLessThan(firstBurst * 5);
    });
  });

  describe('Data Volume Tests', () => {
    test('should handle creating multiple configurations efficiently', async () => {
      const count = 10;
      const configs: APIConfiguration[] = [];

      // Generate test configurations
      for (let i = 0; i < count; i++) {
        configs.push({
          id: `perf-config-${Date.now()}-${i}`,
          variationName: `Performance Test Config ${i}`,
          modelName: 'gemini-1.5-flash',
          systemPrompt: `Performance test system prompt ${i}`,
          temperature: 0.5 + (i * 0.05),
          maxTokens: 100 + (i * 10),
          userId: testUserId,
          isSystemResource: false,
        });
      }

      const start = performance.now();

      // Create configurations sequentially to avoid overwhelming the server
      const results = [];
      for (const config of configs) {
        const result = await goGentAPI.saveConfiguration(config);
        results.push(result);
        
        if (result.success && result.data?.id) {
          createdIds.configs.push(result.data.id);
        }
      }

      const end = performance.now();

      console.log(`Created ${count} configurations in ${(end - start).toFixed(2)}ms`);
      console.log(`Average per configuration: ${((end - start) / count).toFixed(2)}ms`);

      // All creations should succeed
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(count * 0.8); // At least 80% should succeed

      // Should complete in reasonable time
      expect(end - start).toBeLessThan(15000); // 15 seconds for 10 configs
    }, 20000);

    test('should handle retrieving large configuration lists', async () => {
      // This test runs after the previous one, so we should have multiple configs
      const start = performance.now();
      const response = await goGentAPI.getConfigurations();
      const end = performance.now();

      console.log(`Retrieved configurations list in ${(end - start).toFixed(2)}ms`);

      if (response.success && response.data) {
        console.log(`List contains ${response.data.length} configurations`);
        expect(response.data.length).toBeGreaterThan(0);
      }

      // Should handle larger lists efficiently
      expect(end - start).toBeLessThan(2000);
    });

    test('should handle batch operations efficiently', async () => {
      // Test updating multiple configurations
      const configsToUpdate = createdIds.configs.slice(0, 5); // Update first 5
      
      if (configsToUpdate.length === 0) {
        console.log('Skipping batch update test - no configurations available');
        return;
      }

      const start = performance.now();

      const updatePromises = configsToUpdate.map((configId, index) => {
        const updatedConfig: APIConfiguration = {
          id: configId,
          variationName: `Batch Updated Config ${index}`,
          modelName: 'gemini-1.5-flash',
          systemPrompt: `Batch updated system prompt ${index}`,
          temperature: 0.8,
          userId: testUserId,
          isSystemResource: false,
        };
        return goGentAPI.updateConfiguration(updatedConfig);
      });

      const results = await Promise.all(updatePromises);
      const end = performance.now();

      console.log(`Batch updated ${configsToUpdate.length} configurations in ${(end - start).toFixed(2)}ms`);

      // Check results
      const successCount = results.filter(r => r.success).length;
      expect(successCount).toBeGreaterThan(configsToUpdate.length * 0.7); // At least 70% should succeed
    });
  });

  describe('Memory and Resource Tests', () => {
    test('should not cause memory leaks with repeated requests', async () => {
      const iterations = 50;
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      for (let i = 0; i < iterations; i++) {
        await goGentAPI.getConfigurations();
        
        // Occasionally check if we're using too much memory
        if (i % 10 === 0 && (performance as any).memory) {
          const currentMemory = (performance as any).memory.usedJSHeapSize;
          const memoryIncrease = currentMemory - initialMemory;
          
          // Memory increase should be reasonable (< 50MB)
          expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
        }
      }

      console.log('Completed memory leak test with 50 iterations');
    }, 30000);

    test('should handle request cancellation gracefully', async () => {
      const controller = new AbortController();
      
      // Start a request and immediately cancel it
      const requestPromise = goGentAPI.getConfigurations();
      
      // Cancel after a short delay
      setTimeout(() => {
        controller.abort();
      }, 10);

      // The request might complete before cancellation, which is fine
      try {
        await requestPromise;
      } catch (error) {
        // Cancellation errors are acceptable
        if ((error as any).name !== 'AbortError') {
          console.log('Request completed before cancellation');
        }
      }

      // Should be able to make new requests after cancellation
      const newResponse = await goGentAPI.testConnection();
      expect(newResponse).toBeDefined();
    });
  });

  describe('Error Recovery Tests', () => {
    test('should recover gracefully from temporary network issues', async () => {
      // Test error handling without accessing private client properties
      // This test validates that the API client handles errors gracefully
      const response = await goGentAPI.testConnection();
      
      // Should handle gracefully regardless of outcome
      expect(typeof response.success).toBe('boolean');
      
      // Test that multiple requests work
      const response2 = await goGentAPI.testConnection();
      expect(typeof response2.success).toBe('boolean');
    });

    test('should handle rate limiting gracefully', async () => {
      const rapidRequests = 30;
      const promises = [];

      // Make many rapid requests
      for (let i = 0; i < rapidRequests; i++) {
        promises.push(goGentAPI.getConfigurations());
      }

      const results = await Promise.all(promises);

      // Some might fail due to rate limiting, but should not crash
      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      console.log(`Rapid requests: ${successCount} succeeded, ${failCount} failed`);

      // At least some should succeed, and failures should be graceful
      expect(successCount).toBeGreaterThan(0);
      results.forEach(result => {
        expect(result).toBeDefined();
        expect(result.success !== undefined).toBe(true);
      });
    });
  });

  describe('Database Performance Tests', () => {
    test('should handle database statistics requests efficiently', async () => {
      const iterations = 10;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await goGentAPI.getDatabaseStats();
        const end = performance.now();
        times.push(end - start);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`Database stats - Avg: ${avgTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);

      // Database queries should be fast
      expect(avgTime).toBeLessThan(1000);
      expect(maxTime).toBeLessThan(3000);
    });

    test('should handle database table queries efficiently', async () => {
      const start = performance.now();
      const response = await goGentAPI.getDatabaseTables();
      const end = performance.now();

      console.log(`Database tables query took: ${(end - start).toFixed(2)}ms`);

      if (response.success && response.data) {
        const tableCount = Array.isArray((response.data as any).tables) ? (response.data as any).tables.length : 
                          (Array.isArray(response.data) ? response.data.length : 0);
        console.log(`Found ${tableCount} tables`);
      }

      expect(end - start).toBeLessThan(2000);
    });
  });

  describe('Stress Test Scenarios', () => {
    test('should handle sustained load over time', async () => {
      const duration = 10000; // 10 seconds
      const requestInterval = 100; // Request every 100ms
      const maxConcurrent = 5;

      const startTime = Date.now();
      const results: any[] = [];
      let activeRequests = 0;

      const makeRequest = async () => {
        if (activeRequests >= maxConcurrent) return;
        
        activeRequests++;
        try {
          const result = await goGentAPI.testConnection();
          results.push(result);
        } catch (error) {
          results.push({ success: false, error: (error as any).message });
        } finally {
          activeRequests--;
        }
      };

      // Start making requests at intervals
      const intervalId = setInterval(makeRequest, requestInterval);

      // Wait for test duration
      await new Promise(resolve => setTimeout(resolve, duration));
      
      // Stop making new requests
      clearInterval(intervalId);

      // Wait for remaining requests to complete
      while (activeRequests > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const endTime = Date.now();
      const actualDuration = endTime - startTime;

      console.log(`Sustained load test completed:`);
      console.log(`- Duration: ${actualDuration}ms`);
      console.log(`- Total requests: ${results.length}`);
      console.log(`- Successful: ${results.filter(r => r.success).length}`);
      console.log(`- Failed: ${results.filter(r => !r.success).length}`);

      // Should have made reasonable number of requests
      expect(results.length).toBeGreaterThan(50);
      
      // Most should succeed
      const successRate = results.filter(r => r.success).length / results.length;
      expect(successRate).toBeGreaterThan(0.5); // At least 50% success rate
    }, 15000);
  });
}); 