import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// Session API keys interface matching backend
export interface SessionApiKeys {
  geminiApiKey?: string;
  openWeatherApiKey?: string;
  neo4jUrl?: string;
  neo4jUsername?: string;
  neo4jPassword?: string;
  neo4jDatabase?: string;
  githubApiKey?: string;
}

// API key validation rules
export interface ApiKeyValidation {
  description: string;
  pattern?: string;
  testEndpoint?: string;
  errorMessage: string;
  required?: boolean;
}

// Validation rules for each API key
export const API_KEY_VALIDATIONS: Record<string, ApiKeyValidation> = {
  geminiApiKey: {
    description: 'Google Gemini API key for AI processing',
    pattern: '^AIza[0-9A-Za-z\\-_]{35}$',
    errorMessage: 'Please enter a valid Gemini API key (starts with AIza)',
    required: true,
  },
  openWeatherApiKey: {
    description: 'OpenWeather API key for weather data',
    pattern: '^[a-zA-Z0-9]{32}$',
    testEndpoint: 'https://api.openweathermap.org/data/2.5/weather?q=London&appid={key}',
    errorMessage: 'Please enter a valid OpenWeather API key (32 characters)',
  },
  neo4jUrl: {
    description: 'Neo4j database URL',
    pattern: '^(neo4j|bolt)://.*',
    errorMessage: 'Please enter a valid Neo4j URL (neo4j:// or bolt://)',
  },
  neo4jUsername: {
    description: 'Neo4j username',
    errorMessage: 'Please enter your Neo4j username',
  },
  neo4jPassword: {
    description: 'Neo4j password',
    errorMessage: 'Please enter your Neo4j password',
  },
  neo4jDatabase: {
    description: 'Neo4j database name',
    errorMessage: 'Please enter the Neo4j database name',
  },
  githubApiKey: {
    description: 'GitHub Personal Access Token for repository access',
    pattern: '^(ghp_|ghs_|gho_|ghu_|github_pat_)[a-zA-Z0-9_]{36,255}$',
    testEndpoint: 'https://api.github.com/user',
    errorMessage: 'Please enter a valid GitHub Personal Access Token (starts with ghp_, ghs_, gho_, ghu_, or github_pat_)',
  },
};

// Function-to-API-key mapping
export const FUNCTION_API_KEY_REQUIREMENTS: Record<string, string[]> = {
  get_weather: ['openWeatherApiKey'],
  weather_forecast: ['openWeatherApiKey'],
  neo4j_query: ['neo4jUrl', 'neo4jUsername', 'neo4jPassword', 'neo4jDatabase'],
  graph_query: ['neo4jUrl', 'neo4jUsername', 'neo4jPassword', 'neo4jDatabase'],
  github_repo_info: ['githubApiKey'],
  // Add more function mappings as needed
};

class SecureApiKeyStorage {
  private readonly STORAGE_KEY = '@gogent_session_api_keys';
  private readonly ENCRYPTION_KEY = 'gogent_session_encryption_key_v1';
  
  // Generate device-specific encryption key
  private getEncryptionKey(): string {
    // Use a stable key that doesn't change per session
    // In production, you'd want to use a more secure device-specific identifier
    return this.ENCRYPTION_KEY + '_stable_v1';
  }

  // Encrypt API keys before storage
  private encrypt(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.getEncryptionKey()).toString();
    } catch (error) {
      console.warn('Failed to encrypt API keys:', error);
      return data; // Fallback to unencrypted (not ideal)
    }
  }

  // Decrypt API keys from storage
  private decrypt(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.getEncryptionKey());
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      // If decryption results in empty string, the key was wrong or data is corrupted
      if (!decrypted || decrypted.trim() === '') {
        console.warn('Decryption resulted in empty data - likely corrupted or wrong key');
        return '';
      }
      
      return decrypted;
    } catch (error) {
      console.warn('Failed to decrypt API keys:', error);
      return ''; // Return empty string instead of original data
    }
  }

  // Save API keys securely
  async saveApiKeys(apiKeys: SessionApiKeys): Promise<void> {
    try {
      const jsonString = JSON.stringify(apiKeys);
      const encryptedData = this.encrypt(jsonString);
      await AsyncStorage.setItem(this.STORAGE_KEY, encryptedData);
      console.log('✅ API keys saved securely');
    } catch (error) {
      console.error('❌ Failed to save API keys:', error);
      throw new Error('Failed to save API keys securely');
    }
  }

  // Load API keys securely
  async loadApiKeys(): Promise<SessionApiKeys> {
    try {
      const encryptedData = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!encryptedData) {
        console.log('📭 No API keys found in storage');
        return {};
      }

      const decryptedData = this.decrypt(encryptedData);
      
      // Check if decryption failed or returned empty data
      if (!decryptedData || decryptedData.trim() === '') {
        console.warn('🔄 Decryption failed - clearing corrupted storage and starting fresh');
        await AsyncStorage.removeItem(this.STORAGE_KEY);
        return {};
      }

      // Validate that decrypted data is valid JSON
      try {
        const parsed = JSON.parse(decryptedData) as SessionApiKeys;
        console.log('✅ API keys loaded successfully');
        return parsed;
      } catch (jsonError) {
        console.error('❌ Corrupted JSON data in storage - clearing and starting fresh:', jsonError);
        await AsyncStorage.removeItem(this.STORAGE_KEY);
        return {};
      }
    } catch (error) {
      console.error('❌ Failed to load API keys:', error);
      // Clear potentially corrupted storage
      try {
        await AsyncStorage.removeItem(this.STORAGE_KEY);
        console.log('🔄 Cleared potentially corrupted storage');
      } catch (clearError) {
        console.error('Failed to clear storage:', clearError);
      }
      return {};
    }
  }

  // Update a specific API key
  async updateApiKey(keyName: keyof SessionApiKeys, value: string): Promise<void> {
    try {
      const currentKeys = await this.loadApiKeys();
      currentKeys[keyName] = value;
      await this.saveApiKeys(currentKeys);
      console.log(`✅ Updated ${keyName} securely`);
    } catch (error) {
      console.error(`❌ Failed to update ${keyName}:`, error);
      throw error;
    }
  }

  // Remove a specific API key
  async removeApiKey(keyName: keyof SessionApiKeys): Promise<void> {
    try {
      const currentKeys = await this.loadApiKeys();
      delete currentKeys[keyName];
      await this.saveApiKeys(currentKeys);
      console.log(`✅ Removed ${keyName} securely`);
    } catch (error) {
      console.error(`❌ Failed to remove ${keyName}:`, error);
      throw error;
    }
  }

  // Clear all API keys (logout/reset)
  async clearAllApiKeys(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ All API keys cleared');
    } catch (error) {
      console.error('❌ Failed to clear API keys:', error);
      throw error;
    }
  }

  // Validate API key format
  validateApiKey(keyName: string, value: string): { isValid: boolean; error?: string } {
    const validation = API_KEY_VALIDATIONS[keyName];
    if (!validation) {
      return { isValid: true }; // No validation rules defined
    }

    // Check if required and empty
    if (validation.required && (!value || value.trim() === '')) {
      return { isValid: false, error: validation.errorMessage };
    }

    // Check pattern if provided
    if (validation.pattern && value) {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) {
        return { isValid: false, error: validation.errorMessage };
      }
    }

    return { isValid: true };
  }

  // Check which API keys are missing for a function
  getMissingApiKeys(functionName: string, currentKeys: SessionApiKeys): string[] {
    const requiredKeys = FUNCTION_API_KEY_REQUIREMENTS[functionName] || [];
    const missingKeys: string[] = [];

    for (const keyName of requiredKeys) {
      const keyValue = currentKeys[keyName as keyof SessionApiKeys];
      if (!keyValue || keyValue.trim() === '') {
        missingKeys.push(keyName);
      }
    }

    return missingKeys;
  }

  // Validate that all required API keys are present for execution
  async validateForExecution(enableFunctionCalling: boolean, selectedFunctions: string[] = []): Promise<{
    isValid: boolean;
    missingKeys: { keyName: string; description: string; required: boolean }[];
  }> {
    const currentKeys = await this.loadApiKeys();
    const missingKeys: { keyName: string; description: string; required: boolean }[] = [];

    // Always check Gemini API key
    if (!currentKeys.geminiApiKey || currentKeys.geminiApiKey.trim() === '') {
      missingKeys.push({
        keyName: 'geminiApiKey',
        description: API_KEY_VALIDATIONS.geminiApiKey.description,
        required: true,
      });
    }

    // Check function-specific API keys if function calling is enabled
    if (enableFunctionCalling) {
      for (const functionName of selectedFunctions) {
        const functionMissingKeys = this.getMissingApiKeys(functionName, currentKeys);
        for (const keyName of functionMissingKeys) {
          const validation = API_KEY_VALIDATIONS[keyName];
          if (validation && !missingKeys.find(mk => mk.keyName === keyName)) {
            missingKeys.push({
              keyName,
              description: validation.description,
              required: false,
            });
          }
        }
      }
    }

    return {
      isValid: missingKeys.length === 0,
      missingKeys,
    };
  }
}

// Export singleton instance
export const secureStorage = new SecureApiKeyStorage();

// Header encryption utility for secure API key transmission
class HeaderEncryption {
  private readonly SHARED_SECRET_KEY: string;

  constructor() {
    // FORCE THE EXACT SAME KEY AS BACKEND - NO ENVIRONMENT VARIABLES
    this.SHARED_SECRET_KEY = "gogent_secure_encryption_key_2025_development_minimum_32_characters";
    
    // Optional: uncomment for troubleshooting
    // console.debug('HeaderEncryption initialized');
  }

  // Encrypt data for transmission in headers
  encryptForHeader(data: string): string {
    try {
      return CryptoJS.AES.encrypt(data, this.SHARED_SECRET_KEY).toString();
    } catch (error) {
      console.warn('Failed to encrypt data for header:', error);
      throw new Error('Failed to encrypt API key for transmission');
    }
  }

  // Decrypt data received from headers (for testing purposes)
  decryptFromHeader(encryptedData: string): string {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, this.SHARED_SECRET_KEY);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decrypted || decrypted.trim() === '') {
        throw new Error('Decryption failed - invalid key or corrupted data');
      }
      
      return decrypted;
    } catch (error) {
      console.warn('Failed to decrypt data from header:', error);
      throw new Error('Failed to decrypt API key from transmission');
    }
  }
}

// Export singleton instance
export const headerEncryption = new HeaderEncryption();

// Helper function to get API key validation rules
export const getApiKeyValidation = (keyName: string): ApiKeyValidation | undefined => {
  return API_KEY_VALIDATIONS[keyName];
};

// Helper function to get required API keys for a function
export const getRequiredApiKeys = (functionName: string): string[] => {
  return FUNCTION_API_KEY_REQUIREMENTS[functionName] || [];
}; 