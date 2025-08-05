import { backendApiKeys, ExecutionApiKeys } from '../utils/backendApiKeys';
import { headerEncryption } from '../utils/headerEncryption';

/**
 * Backend API Key Integration for Execution
 * This module provides backend API keys for execution requests
 */

export interface ExecutionHeaders {
  [key: string]: string;
}

export class BackendExecutionKeys {
  /**
   * Get API key headers for execution requests using backend-managed keys
   * This replaces the session-based API key system
   */
  static async getExecutionHeaders(): Promise<ExecutionHeaders> {
    try {
      const apiKeyMap = await backendApiKeys.loadApiKeys();
      const headers: ExecutionHeaders = {};

      // Process each service and add to headers
      for (const [serviceName, keys] of Object.entries(apiKeyMap)) {
        // Find the active default key for this service
        const activeKey = keys.find(key => key.isActive && key.isDefault) || 
                         keys.find(key => key.isActive);

        if (activeKey) {
          // Map service names to header names (following the existing pattern)
          switch (serviceName) {
            case 'gemini':
              // For now, we can't get the actual key value from backend for security
              // The backend will need to handle key resolution by key ID
              headers['X-Api-Key-Id-Gemini'] = activeKey.id;
              break;
            case 'openweather':
              headers['X-Api-Key-Id-Openweather'] = activeKey.id;
              break;
            case 'neo4j':
              headers['X-Api-Key-Id-Neo4j'] = activeKey.id;
              break;
            case 'github':
              headers['X-Api-Key-Id-Github'] = activeKey.id;
              break;
            case 'slack':
              headers['X-Api-Key-Id-Slack'] = activeKey.id;
              break;
            case 'discord':
              headers['X-Api-Key-Id-Discord'] = activeKey.id;
              break;
            case 'openai':
              headers['X-Api-Key-Id-Openai'] = activeKey.id;
              break;
            case 'openrouter':
              headers['X-Api-Key-Id-Openrouter'] = activeKey.id;
              break;
          }
        }
      }

      console.log('🔐 Generated execution headers with backend API key IDs:', Object.keys(headers));
      return headers;
    } catch (error) {
      console.error('Failed to get backend execution headers:', error);
      return {};
    }
  }

  /**
   * Check if backend has Gemini key (required for execution)
   */
  static async hasRequiredGeminiKey(): Promise<boolean> {
    return await backendApiKeys.hasGeminiKey();
  }

  /**
   * Validate that all required services have configured keys
   */
  static async validateRequiredServices(requiredServices: string[]): Promise<{
    isValid: boolean;
    missingServices: string[];
  }> {
    const validation = await backendApiKeys.validateApiKeysForServices(requiredServices);
    return {
      isValid: validation.isValid,
      missingServices: validation.missingServices
    };
  }
}

// Legacy compatibility function to help migrate from session keys
export const getBackendExecutionHeaders = () => BackendExecutionKeys.getExecutionHeaders();