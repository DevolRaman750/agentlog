import { restAPI } from '../api';
import { UserApiKey } from '../types';

/**
 * Backend API Key Management Utilities
 * This replaces the session-based API key system with backend-managed keys
 */

export interface BackendApiKeyMap {
  [serviceName: string]: UserApiKey[];
}

export interface ExecutionApiKeys {
  gemini?: string;
  openweather?: string;
  neo4j_url?: string;
  neo4j_username?: string;
  neo4j_password?: string;
  neo4j_database?: string;
  github?: string;
  slack?: string;
  discord?: string;
  openai?: string;
  openrouter?: string;
}

class BackendApiKeyManager {
  private apiKeysCache: BackendApiKeyMap | null = null;
  private cacheTimestamp: number = 0;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Load API keys from backend with caching
   */
  async loadApiKeys(forceRefresh = false): Promise<BackendApiKeyMap> {
    const now = Date.now();
    
    if (!forceRefresh && this.apiKeysCache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      return this.apiKeysCache;
    }

    try {
      const response = await restAPI.getApiKeys();
      if (response.success && response.data) {
        // Group keys by service name
        const keyMap: BackendApiKeyMap = {};
        response.data.forEach(key => {
          if (!keyMap[key.serviceName]) {
            keyMap[key.serviceName] = [];
          }
          keyMap[key.serviceName].push(key);
        });
        
        this.apiKeysCache = keyMap;
        this.cacheTimestamp = now;
        console.log('🔐 Loaded API keys from backend:', Object.keys(keyMap));
        return keyMap;
      }
    } catch (error) {
      console.error('Failed to load API keys from backend:', error);
    }
    
    return {};
  }

  /**
   * Get active API keys for execution (only active, default keys)
   */
  async getExecutionApiKeys(): Promise<ExecutionApiKeys> {
    const keyMap = await this.loadApiKeys();
    const executionKeys: ExecutionApiKeys = {};

    for (const [serviceName, keys] of Object.entries(keyMap)) {
      // Find the default active key for this service
      const activeKey = keys.find(key => key.isActive && key.isDefault) || 
                       keys.find(key => key.isActive);

      if (activeKey) {
        // Map service names to execution key names
        switch (serviceName) {
          case 'gemini':
            executionKeys.gemini = activeKey.id; // We'll use key ID as reference
            break;
          case 'openweather':
            executionKeys.openweather = activeKey.id;
            break;
          case 'neo4j':
            executionKeys.neo4j_url = activeKey.id;
            // Neo4j might need multiple keys, but for now we'll use the connection string approach
            break;
          case 'github':
            executionKeys.github = activeKey.id;
            break;
          case 'slack':
            executionKeys.slack = activeKey.id;
            break;
          case 'discord':
            executionKeys.discord = activeKey.id;
            break;
          case 'openai':
            executionKeys.openai = activeKey.id;
            break;
          case 'openrouter':
            executionKeys.openrouter = activeKey.id;
            break;
        }
      }
    }

    return executionKeys;
  }

  /**
   * Check if required services have configured API keys
   */
  async validateApiKeysForServices(requiredServices: string[]): Promise<{
    isValid: boolean;
    missingServices: string[];
    configuredServices: string[];
  }> {
    const keyMap = await this.loadApiKeys();
    const missingServices: string[] = [];
    const configuredServices: string[] = [];

    for (const serviceName of requiredServices) {
      const serviceKeys = keyMap[serviceName] || [];
      const hasActiveKey = serviceKeys.some(key => key.isActive);
      
      if (hasActiveKey) {
        configuredServices.push(serviceName);
      } else {
        missingServices.push(serviceName);
      }
    }

    return {
      isValid: missingServices.length === 0,
      missingServices,
      configuredServices
    };
  }

  /**
   * Check if Gemini API key is available (required for all executions)
   */
  async hasGeminiKey(): Promise<boolean> {
    const keyMap = await this.loadApiKeys();
    const geminiKeys = keyMap['gemini'] || [];
    return geminiKeys.some(key => key.isActive);
  }

  /**
   * Validate API keys for execution based on selected functions
   */
  async validateForExecution(selectedFunctionIds: string[]): Promise<{
    isValid: boolean;
    missingServices: string[];
    hasGeminiKey: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    
    // Check Gemini key first (required for all executions)
    const hasGeminiKey = await this.hasGeminiKey();
    if (!hasGeminiKey) {
      errors.push('Gemini API key is required for all executions');
    }

    // For now, we'll assume functions don't require specific services
    // In the future, this should check the function requirements
    const missingServices: string[] = [];

    return {
      isValid: errors.length === 0,
      missingServices,
      hasGeminiKey,
      errors
    };
  }

  /**
   * Clear the cache (useful after API key changes)
   */
  clearCache(): void {
    this.apiKeysCache = null;
    this.cacheTimestamp = 0;
  }

  /**
   * Check if a specific service is configured
   */
  async isServiceConfigured(serviceName: string): Promise<boolean> {
    const keyMap = await this.loadApiKeys();
    const serviceKeys = keyMap[serviceName] || [];
    return serviceKeys.some(key => key.isActive);
  }
}

// Create singleton instance
export const backendApiKeys = new BackendApiKeyManager();

// Legacy compatibility - these functions will help migrate from session-based to backend-based
export const getBackendApiKeysForExecution = () => backendApiKeys.getExecutionApiKeys();
export const validateBackendApiKeys = (selectedFunctions: string[]) => 
  backendApiKeys.validateForExecution(selectedFunctions);