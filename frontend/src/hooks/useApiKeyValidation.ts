import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { secureStorage, getRequiredApiKeys, SessionApiKeys } from '../utils/secureStorage';
import { api } from '../api';

interface MissingApiKey {
  keyName: string;
  description: string;
  required: boolean;
}

interface UseApiKeyValidationReturn {
  // State
  isValidating: boolean;
  showApiKeyPrompt: boolean;
  missingKeys: MissingApiKey[];
  
  // Actions
  validateForExecution: (enableFunctionCalling: boolean, selectedFunctions?: string[]) => Promise<boolean>;
  validateForFunction: (functionName: string) => Promise<boolean>;
  showPromptForMissingKeys: (missingKeys: MissingApiKey[]) => void;
  hideApiKeyPrompt: () => void;
  onApiKeyPromptComplete: (success: boolean) => void;
  
  // Utilities
  getSessionKeyStatus: () => Promise<Record<string, boolean>>;
  clearAllKeys: () => Promise<void>;
}

export const useApiKeyValidation = (): UseApiKeyValidationReturn => {
  const [isValidating, setIsValidating] = useState(false);
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [missingKeys, setMissingKeys] = useState<MissingApiKey[]>([]);
  const [validationResolve, setValidationResolve] = useState<((value: boolean) => void) | null>(null);

  // Validate API keys for execution
  const validateForExecution = useCallback(async (
    enableFunctionCalling: boolean,
    selectedFunctions: string[] = []
  ): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      // TODO: Implement when API methods are available
      // const validation = await api.validateApiKeysForExecution(enableFunctionCalling, selectedFunctions);
      
      // For now, always return true until backend API is implemented
      console.log('API key validation not yet implemented, allowing execution');
      return true;
      
      /* 
      if (!validation.isValid) {
        return new Promise((resolve) => {
          setValidationResolve(() => resolve);
          setMissingKeys(validation.missingKeys);
          setShowApiKeyPrompt(true);
        });
      }
      
      return true;
      */
    } catch (error) {
      console.error('Failed to validate API keys:', error);
      Alert.alert(
        'Validation Error',
        'Failed to validate API keys. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Validate API keys for a specific function
  const validateForFunction = useCallback(async (functionName: string): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      // TODO: Implement when API methods are available
      // const validation = await api.validateFunctionRequirements(functionName);
      
      // For now, always return true until backend API is implemented
      console.log(`Function validation not yet implemented for ${functionName}, allowing execution`);
      return true;
      
      /*
      if (!validation.isValid) {
        // Convert missing key names to proper MissingApiKey objects
        const functionMissingKeys: MissingApiKey[] = validation.missingKeys.map((keyName: string) => {
          const { secureStorage: storage } = require('../utils/secureStorage');
          const validation = storage.getApiKeyValidation?.(keyName);
          return {
            keyName,
            description: validation?.description || `${keyName} is required for ${functionName}`,
            required: false, // Function-specific keys are typically not globally required
          };
        });

        return new Promise((resolve) => {
          setValidationResolve(() => resolve);
          setMissingKeys(functionMissingKeys);
          setShowApiKeyPrompt(true);
        });
      }
      
      return true;
      */
    } catch (error) {
      console.error('Failed to validate function requirements:', error);
      Alert.alert(
        'Function Validation Error',
        `Failed to validate requirements for ${functionName}. Please try again.`,
        [{ text: 'OK' }]
      );
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  // Show prompt for specific missing keys
  const showPromptForMissingKeys = useCallback((keys: MissingApiKey[]) => {
    setMissingKeys(keys);
    setShowApiKeyPrompt(true);
  }, []);

  // Hide API key prompt
  const hideApiKeyPrompt = useCallback(() => {
    setShowApiKeyPrompt(false);
    setMissingKeys([]);
    
    // Resolve pending validation with false (cancelled)
    if (validationResolve) {
      validationResolve(false);
      setValidationResolve(null);
    }
  }, [validationResolve]);

  // Handle API key prompt completion
  const onApiKeyPromptComplete = useCallback((success: boolean) => {
    setShowApiKeyPrompt(false);
    setMissingKeys([]);
    
    // Resolve pending validation
    if (validationResolve) {
      validationResolve(success);
      setValidationResolve(null);
    }
  }, [validationResolve]);

  // Get session key status
  const getSessionKeyStatus = useCallback(async (): Promise<Record<string, boolean>> => {
    try {
      // TODO: Implement when API methods are available
      // return await api.getSessionKeyStatus();
      
      // For now, return empty object until backend API is implemented
      console.log('Session key status not yet implemented');
      return {};
    } catch (error) {
      console.error('Failed to get session key status:', error);
      return {};
    }
  }, []);

  // Clear all API keys
  const clearAllKeys = useCallback(async (): Promise<void> => {
    try {
      await secureStorage.clearAllApiKeys();
    } catch (error) {
      console.error('Failed to clear API keys:', error);
      throw error;
    }
  }, []);

  return {
    // State
    isValidating,
    showApiKeyPrompt,
    missingKeys,
    
    // Actions
    validateForExecution,
    validateForFunction,
    showPromptForMissingKeys,
    hideApiKeyPrompt,
    onApiKeyPromptComplete,
    
    // Utilities
    getSessionKeyStatus,
    clearAllKeys,
  };
};

// Hook for checking if a function can be used (has required API keys)
export const useFunctionAvailability = () => {
  const [functionAvailability, setFunctionAvailability] = useState<Record<string, boolean>>({});

  const checkFunctionAvailability = useCallback(async (functionNames: string[]) => {
    const availability: Record<string, boolean> = {};
    
    for (const functionName of functionNames) {
      try {
        // TODO: Implement when API methods are available
        // const validation = await api.validateFunctionRequirements(functionName);
        // availability[functionName] = validation.isValid;
        
        // For now, assume all functions are available
        availability[functionName] = true;
      } catch (error) {
        console.error(`Failed to check availability for ${functionName}:`, error);
        availability[functionName] = false;
      }
    }
    
    setFunctionAvailability(prev => ({ ...prev, ...availability }));
    return availability;
  }, []);

  const isFunctionAvailable = useCallback((functionName: string): boolean => {
    return functionAvailability[functionName] ?? false;
  }, [functionAvailability]);

  return {
    functionAvailability,
    checkFunctionAvailability,
    isFunctionAvailable,
  };
}; 