import React, { createContext, useContext, useReducer, useEffect, ReactNode, useCallback, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { AppConfig, APIConfiguration, ExecutionRun, Tool, ExecutionResult } from '../types';
import { goGentAPI } from '../api/client';
import { useAuth } from './AuthContext';

// State interface
interface AppState {
  config: AppConfig;
  configurations: APIConfiguration[];
  recentExecutions: ExecutionRun[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
  connectionLatency: number;
  reExecutionData?: {
    executionRunName: string;
    description: string;
    basePrompt: string;
    context?: string;
    configurations: APIConfiguration[];
    enableFunctionCalling?: boolean;
    functionTools?: Tool[];
    comparisonEnabled?: boolean;
    selectedMetrics?: string[];
    functionExecutionMode?: 'mock' | 'real' | 'auto';
  };
  currentExecution?: {
    isExecuting: boolean;
    executionId: string | null;
    pollCount: number;
    maxPolls: number;
    executionResult: ExecutionResult | null;
    startTime: number;
  };
}

// Action types
type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CONFIG'; payload: AppConfig }
  | { type: 'SET_CONFIGURATIONS'; payload: APIConfiguration[] }
  | { type: 'ADD_CONFIGURATION'; payload: APIConfiguration }
  | { type: 'UPDATE_CONFIGURATION'; payload: APIConfiguration }
  | { type: 'DELETE_CONFIGURATION'; payload: string }
  | { type: 'SET_RECENT_EXECUTIONS'; payload: ExecutionRun[] }
  | { type: 'ADD_EXECUTION'; payload: ExecutionRun }
  | { type: 'DELETE_EXECUTION'; payload: string }
  | { type: 'SET_CONNECTION_STATUS'; payload: { connected: boolean; latency: number } }
  | { type: 'SET_RE_EXECUTION_DATA'; payload: { executionRunName: string; description: string; basePrompt: string; context?: string; configurations: APIConfiguration[]; enableFunctionCalling?: boolean; functionTools?: Tool[]; comparisonEnabled?: boolean; selectedMetrics?: string[]; functionExecutionMode?: 'mock' | 'real' | 'auto' } }
  | { type: 'CLEAR_RE_EXECUTION_DATA' }
  | { type: 'START_EXECUTION'; payload: { executionId: string; maxPolls: number } }
  | { type: 'UPDATE_EXECUTION_PROGRESS'; payload: { pollCount: number } }
  | { type: 'COMPLETE_EXECUTION'; payload: { executionResult: ExecutionResult } }
  | { type: 'CANCEL_EXECUTION' }
  | { type: 'CLEAR_EXECUTION_RESULT' }
  | { type: 'RESET_STATE' };

// Detect environment and set appropriate backend URL using Expo's build-time configuration
const getBackendUrl = (): string => {
  // Try to get the backend URL from Expo's build-time configuration first
  const expoConfig = Constants.expoConfig || Constants.manifest2?.extra?.expoConfig;
  
  console.log('🔍 Environment Detection Debug:');
  console.log('  Constants.expoConfig:', Constants.expoConfig);
  console.log('  Constants.manifest2:', Constants.manifest2);
  console.log('  expoConfig?.extra:', expoConfig?.extra);
  
  if (expoConfig?.extra?.backendUrl) {
    console.log('🎯 Using backend URL from Expo config:', expoConfig.extra.backendUrl);
    console.log('🌟 Environment:', expoConfig.extra.environment);
    console.log('🏭 Is Production:', expoConfig.extra.isProduction);
    return expoConfig.extra.backendUrl;
  }
  
  // Fallback to runtime detection (for development when config might not be set)
  console.log('🔍 Environment Detection Debug (fallback):');
  console.log('  typeof window:', typeof window);
  console.log('  typeof process:', typeof process);
  
  // Check if we're running in production (deployed environment)
  if (typeof window !== 'undefined' && window.location) {
    // In web environment, check the current hostname
    const hostname = window.location.hostname;
    console.log('  window.location.hostname:', hostname);
    
    // If we're on the production domain, use the production backend
    if (hostname === 'agentlog.scalebase.io') {
      console.log('  🎯 Detected production environment (agentlog.scalebase.io)');
      return 'https://agentlog.scalebase.io';
    }
    
    // If we're on localhost in browser, use localhost backend
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('  🎯 Detected localhost development environment');
      return 'http://localhost:8080';
    }
    
    // For any other domain, assume production pattern
    console.log('  🎯 Detected generic domain, using HTTPS pattern');
    return `https://${hostname}`;
  }
  
  // For React Native (mobile), check if we have process.env available
  if (typeof process !== 'undefined' && process.env) {
    console.log('  process.env.NODE_ENV:', process.env.NODE_ENV);
    // Check for NODE_ENV or other environment indicators
    if (process.env.NODE_ENV === 'production') {
      console.log('  🎯 Detected NODE_ENV=production');
      return 'https://agentlog.scalebase.io';
    }
  }
  
  // Default to localhost for development
  console.log('  🎯 Using fallback localhost');
  return 'http://localhost:8080';
};

// Initial state
const initialState: AppState = {
  config: {
    backendUrl: getBackendUrl(),
    geminiApiKey: '',
    openWeatherApiKey: '',
    neo4jUrl: '',
    neo4jUsername: '',
    neo4jPassword: '',
    neo4jDatabase: 'neo4j',
    useMockResponses: false, // Backend will automatically use mocks when no API key is provided
  },
  configurations: [],
  recentExecutions: [],
  isLoading: false,
  error: null,
  isConnected: false,
  connectionLatency: 0,
};

// Context
interface AppContextType {
  state: AppState;
  updateConfig: (config: Partial<AppConfig>) => Promise<void>;
  addConfiguration: (config: APIConfiguration) => Promise<void>;
  updateConfiguration: (config: APIConfiguration) => Promise<boolean>;
  deleteConfiguration: (id: string) => Promise<boolean>;
  loadConfigurations: () => Promise<void>;
  loadRecentExecutions: () => Promise<void>;
  testConnection: () => Promise<void>;
  clearError: () => void;
  resetApp: () => Promise<void>;
  clearSession: () => Promise<void>;
  exportSessionData: () => Promise<any>;
  importSessionData: (sessionData: any) => Promise<void>;
  setReExecutionData: (data: { executionRunName: string; description: string; basePrompt: string; context?: string; configurations: APIConfiguration[]; enableFunctionCalling?: boolean; functionTools?: Tool[]; comparisonEnabled?: boolean; selectedMetrics?: string[]; functionExecutionMode?: 'mock' | 'real' | 'auto' }) => void;
  clearReExecutionData: () => void;
  refreshAllData: () => Promise<void>; // New global refresh function
  // Execution management
  startExecution: (executionId: string, maxPolls?: number) => void;
  updateExecutionProgress: (pollCount: number) => void;
  completeExecution: (executionResult: ExecutionResult) => void;
  cancelExecution: () => void;
  clearExecutionResult: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_CONFIG':
      return { ...state, config: action.payload };
    
    case 'SET_CONFIGURATIONS':
      return { ...state, configurations: action.payload };
    
    case 'ADD_CONFIGURATION':
      return { 
        ...state, 
        configurations: [...state.configurations, action.payload] 
      };
    
    case 'UPDATE_CONFIGURATION':
      return {
        ...state,
        configurations: state.configurations.map(config =>
          config.id === action.payload.id ? action.payload : config
        ),
      };
    
    case 'DELETE_CONFIGURATION':
      return {
        ...state,
        configurations: state.configurations.filter(config => config.id !== action.payload),
      };
    
    case 'SET_RECENT_EXECUTIONS':
      return { ...state, recentExecutions: action.payload };
    
    case 'ADD_EXECUTION':
      return {
        ...state,
        recentExecutions: [action.payload, ...state.recentExecutions.slice(0, 9)], // Keep last 10
      };
    
    case 'DELETE_EXECUTION':
      return {
        ...state,
        recentExecutions: state.recentExecutions.filter(exec => exec.id !== action.payload),
      };
    
    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        isConnected: action.payload.connected,
        connectionLatency: action.payload.latency 
      };
    
    case 'SET_RE_EXECUTION_DATA':
      return { ...state, reExecutionData: action.payload };
    
    case 'CLEAR_RE_EXECUTION_DATA':
      return { ...state, reExecutionData: undefined };
    
    case 'START_EXECUTION':
      return {
        ...state,
        currentExecution: {
          isExecuting: true,
          executionId: action.payload.executionId,
          pollCount: 0,
          maxPolls: action.payload.maxPolls,
          executionResult: null,
          startTime: Date.now(),
        },
      };
    
    case 'UPDATE_EXECUTION_PROGRESS':
      return {
        ...state,
        currentExecution: state.currentExecution ? {
          ...state.currentExecution,
          pollCount: action.payload.pollCount,
        } : undefined,
      };
    
    case 'COMPLETE_EXECUTION':
      return {
        ...state,
        currentExecution: state.currentExecution ? {
          ...state.currentExecution,
          isExecuting: false,
          executionResult: action.payload.executionResult,
        } : undefined,
      };
    
    case 'CANCEL_EXECUTION':
      return {
        ...state,
        currentExecution: undefined,
      };
    
    case 'CLEAR_EXECUTION_RESULT':
      return {
        ...state,
        currentExecution: state.currentExecution ? {
          ...state.currentExecution,
          executionResult: null,
        } : undefined,
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

// Default configurations
const defaultConfigurations: APIConfiguration[] = [
  {
    id: 'default-conservative',
    userId: 'system',
    variationName: 'Conservative',
    modelName: 'gemini-1.5-flash',
    systemPrompt: 'You are a precise, analytical assistant. Provide factual, well-structured responses.',
    temperature: 0.2,
    maxTokens: 500,
    topP: 0.8,
    topK: 10,
    isSystemResource: true,
  },
  {
    id: 'default-balanced',
    userId: 'system',
    variationName: 'Balanced',
    modelName: 'gemini-1.5-flash',
    systemPrompt: 'You are a helpful assistant. Provide balanced, informative responses.',
    temperature: 0.5,
    maxTokens: 600,
    topP: 0.9,
    topK: 20,
    isSystemResource: true,
  },
  {
    id: 'default-creative',
    userId: 'system',
    variationName: 'Creative',
    modelName: 'gemini-1.5-flash',
    systemPrompt: 'You are a creative assistant. Think outside the box and provide imaginative responses.',
    temperature: 0.8,
    maxTokens: 700,
    topP: 0.95,
    topK: 30,
    isSystemResource: true,
  },
];

// Provider component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(false);
  
  // Get current user from auth context for proper filtering
  const { user } = useAuth();

  // Test connection function - defined early to avoid hoisting issues
  const testConnection = useCallback(async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const startTime = Date.now();
      const response = await goGentAPI.testConnection();
      const latency = Date.now() - startTime;
      
      dispatch({ 
        type: 'SET_CONNECTION_STATUS', 
        payload: { 
          connected: response.success, 
          latency: latency 
        } 
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Connection test failed');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      dispatch({ 
        type: 'SET_CONNECTION_STATUS', 
        payload: { 
          connected: false, 
          latency: -1 
        } 
      });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []); // No dependencies - testConnection logic is self-contained

  // Load saved configuration on app start
  useEffect(() => {
    loadSavedConfig();
  }, []);

  // Test connection when app starts and when backend URL changes
  useEffect(() => {
    const initializeConnection = async () => {
      // console.log('🔌 Initializing app connection...');
      goGentAPI.updateBaseURL(state.config.backendUrl);
      
      try {
        await testConnection();
        console.log('✅ App connected to backend on startup');
        // Load configurations when connection is established AND user is authenticated
        if (user) {
          loadConfigurations();
        }
      } catch (error) {
        console.warn('⚠️ Initial connection test failed:', error);
      }
    };

    initializeConnection();
  }, [state.config.backendUrl, testConnection, user]);

  // Load configurations when user becomes authenticated - but only once per user
  const [loadedConfigForUserId, setLoadedConfigForUserId] = useState<string | null>(null);
  
  useEffect(() => {
    if (user && state.isConnected && user.id !== loadedConfigForUserId) {
      console.log('👤 User authenticated, loading configurations for:', user.id);
      loadConfigurations();
      setLoadedConfigForUserId(user.id);
    }
  }, [user?.id, state.isConnected, loadedConfigForUserId]);

  // Load saved configuration from AsyncStorage
  const loadSavedConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem('appConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig) as AppConfig;
        // Merge with initial state to ensure all fields exist
        const mergedConfig = { ...initialState.config, ...config };
        dispatch({ type: 'SET_CONFIG', payload: mergedConfig });
      }
    } catch (error) {
      console.error('Failed to load saved config:', error);
    }
  };



  // Update configuration
  const updateConfig = useCallback(async (configUpdate: Partial<AppConfig>) => {
    try {
      const newConfig = { ...state.config, ...configUpdate };
      dispatch({ type: 'SET_CONFIG', payload: newConfig });
      await AsyncStorage.setItem('appConfig', JSON.stringify(newConfig));
    } catch (error) {
      console.error('Failed to update config:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save configuration' });
    }
  }, [state.config]);

  // Add new configuration
  const addConfiguration = useCallback(async (config: APIConfiguration) => {
    try {
      // Ensure the configuration has the correct userId
      const newConfig = { 
        ...config, 
        id: config.id || `config-${Date.now()}`,
        userId: config.userId || user?.id || undefined, // Assign current user ID
        isSystemResource: config.isSystemResource || false // Ensure this is set
      };
      
      console.log('💾 Adding configuration for user:', user?.id, 'Config:', newConfig.variationName);
      
      // Save to backend first (like updateConfiguration does)
      const response = await goGentAPI.saveConfiguration(newConfig);
      if (!response.success) {
        console.error('Backend save failed:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to save configuration to server' });
        return;
      }
      
      // Update local state only after successful backend save
      const savedConfig = response.data || newConfig;
      const updatedConfigs = [...state.configurations, savedConfig];
      dispatch({ type: 'ADD_CONFIGURATION', payload: savedConfig });
      await AsyncStorage.setItem('configurations', JSON.stringify(updatedConfigs));
      
      console.log('✅ Configuration saved to backend and local storage:', savedConfig.variationName);
    } catch (error) {
      console.error('Failed to add configuration:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save configuration' });
    }
  }, [state.configurations, user?.id]);

  // Update existing configuration
  const updateConfiguration = useCallback(async (config: APIConfiguration): Promise<boolean> => {
    try {
      // Prevent updating system configurations
      if (config.isSystemResource) {
        console.warn('🔒 Cannot update system configuration:', config.variationName);
        dispatch({ type: 'SET_ERROR', payload: 'Cannot modify system configurations' });
        return false;
      }
      
      console.log('🔄 Updating configuration:', config.variationName);

      // Try to update on backend first
      const response = await goGentAPI.updateConfiguration(config);
      if (!response.success) {
        console.error('Backend update failed:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to update configuration on server' });
        return false;
      }

      // Update local state
      const updatedConfigs = state.configurations.map(c => 
        c.id === config.id ? { ...config, userId: config.userId || user?.id } : c
      );
      dispatch({ type: 'UPDATE_CONFIGURATION', payload: config });
      await AsyncStorage.setItem('configurations', JSON.stringify(updatedConfigs));
      
      console.log('✅ Configuration updated successfully:', config.variationName);
      return true;
    } catch (error) {
      console.error('Failed to update configuration:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update configuration' });
      return false;
    }
  }, [state.configurations, user?.id]);

  // Delete configuration
  const deleteConfiguration = useCallback(async (id: string): Promise<boolean> => {
    console.log('🔄 AppContext deleteConfiguration called with ID:', id);
    
    try {
      // Prevent deleting system configurations
      const configToDelete = state.configurations.find(c => c.id === id);
      console.log('📋 AppContext found config:', configToDelete);
      
      if (configToDelete?.isSystemResource) {
        console.warn('🔒 Cannot delete system configuration:', configToDelete.variationName);
        dispatch({ type: 'SET_ERROR', payload: 'Cannot delete system configurations' });
        return false;
      }
      
      if (!configToDelete) {
        console.warn('🔍 Configuration not found:', id);
        dispatch({ type: 'SET_ERROR', payload: 'Configuration not found' });
        return false;
      }

      console.log('🗑️ AppContext: Proceeding with deletion:', configToDelete.variationName);

      // Try to delete from backend first
      console.log('📡 AppContext: Making API call to delete configuration');
      const response = await goGentAPI.deleteConfiguration(id);
      console.log('📤 AppContext: API response:', response);
      
      if (!response.success) {
        console.error('❌ Backend delete failed:', response.error);
        dispatch({ type: 'SET_ERROR', payload: response.error || 'Failed to delete configuration from server' });
        return false;
      }

      // Update local state
      console.log('💾 AppContext: Updating local state');
      const updatedConfigs = state.configurations.filter(c => c.id !== id);
      dispatch({ type: 'DELETE_CONFIGURATION', payload: id });
      await AsyncStorage.setItem('configurations', JSON.stringify(updatedConfigs));
      
      console.log('✅ Configuration deleted successfully:', configToDelete.variationName);
      return true;
    } catch (error) {
      console.error('💥 AppContext: Failed to delete configuration:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete configuration' });
      return false;
    }
  }, [state.configurations]);

  // Simple configuration loading from backend
  const loadConfigurations = useCallback(async () => {
    // Don't load if no user is authenticated or already loading
    if (!user) {
      console.log('⏭️ Skipping configuration load - no authenticated user');
      return;
    }

    if (isLoadingConfigs) {
      console.log('⏭️ Skipping configuration load - already loading');
      return;
    }

    setIsLoadingConfigs(true);
    try {
      console.log('📋 Loading configurations from backend');
      const response = await goGentAPI.getConfigurations();
      
      if (response.success && response.data) {
        // Backend already returns both system and user configs - just use them
        dispatch({ type: 'SET_CONFIGURATIONS', payload: response.data });
        console.log('✅ Loaded', response.data.length, 'configurations from backend');
      } else {
        console.warn('⚠️ Failed to load configurations:', response.error);
      }
    } catch (error) {
      console.error('Failed to load configurations:', error);
    } finally {
      setIsLoadingConfigs(false);
    }
  }, [user, isLoadingConfigs]);

  // Load recent executions from backend - DECOUPLED from connection state
  const loadRecentExecutions = useCallback(async () => {
    // CRITICAL: Always attempt to load executions regardless of perceived connection status
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      console.log('📜 Attempting to load recent executions...');
      const response = await goGentAPI.getExecutionRuns(10, 0);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_RECENT_EXECUTIONS', payload: response.data });
        console.log('✅ Recent executions loaded successfully');
      } else {
        console.warn('🟡 Failed to load recent executions:', response.error);
      }
    } catch (error) {
      console.warn('🟡 Recent executions loading error (graceful handling):', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []); // Removed state.isConnected dependency

  // Test connection to backend
  // IMPORTANT: This should ONLY test basic backend connectivity, 
  // NOT function-specific features or API key validation.
  // Function availability is a separate concern from basic connectivity.

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  // Reset app state
  const resetApp = async () => {
    try {
      await AsyncStorage.multiRemove(['appConfig', 'configurations']);
      dispatch({ type: 'RESET_STATE' });
      // Reload defaults
      await loadConfigurations();
    } catch (error) {
      console.error('Failed to reset app:', error);
    }
  };

  // Clear all session data (enhanced)
  const clearSession = async () => {
    console.log('🎯 clearSession() function called - starting execution...');
    try {
      console.log('📋 Setting loading state...');
      dispatch({ type: 'SET_LOADING', payload: true });
      
      console.log('🔍 Getting all AsyncStorage keys...');
      // Get all AsyncStorage keys to ensure we clear everything
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('📊 Found AsyncStorage keys:', allKeys.length);
      
      // Define keys to clear (all session-related data)
      const sessionKeys = allKeys.filter(key => 
        key.startsWith('@gogent') || // Our app prefix
        key.includes('auth_') ||      // Authentication data
        key.includes('appConfig') ||  // App configuration
        key.includes('configurations') || // User configurations
        key.includes('recentExecutions') || // Execution history
        key.includes('temp_password') // Temporary passwords
      );
      
      console.log('🧹 Clearing session keys:', sessionKeys);
      console.log('📊 Keys to clear count:', sessionKeys.length);
      
      // Clear all session-related AsyncStorage data
      console.log('🗑️ Removing AsyncStorage keys...');
      await AsyncStorage.multiRemove(sessionKeys);
      console.log('✅ AsyncStorage keys removed');
      
      // Also clear our secure API key storage
      try {
        console.log('🔐 Clearing secure API key storage...');
        const { secureStorage } = require('../utils/secureStorage');
        await secureStorage.clearAllApiKeys();
        console.log('🔐 Cleared secure API key storage');
      } catch (error) {
        console.warn('⚠️ Failed to clear secure storage:', error);
      }
      
      console.log('🔄 Resetting app state...');
      // Reset state to initial values
      dispatch({ type: 'RESET_STATE' });
      
      console.log('⚙️ Setting default configurations...');
      // Set default configurations
      dispatch({ type: 'SET_CONFIGURATIONS', payload: defaultConfigurations });
      await AsyncStorage.setItem('configurations', JSON.stringify(defaultConfigurations));
      
      console.log('✅ Session data cleared successfully');
    } catch (error) {
      console.error('❌ Failed to clear session data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to clear session data' });
      throw error; // Re-throw to allow caller to handle
    } finally {
      console.log('🏁 Setting loading state to false...');
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Export session data for backup
  const exportSessionData = async () => {
    try {
      const appConfig = await AsyncStorage.getItem('appConfig');
      const configurations = await AsyncStorage.getItem('configurations');
      const recentExecutions = await AsyncStorage.getItem('recentExecutions');
      
      return {
        appConfig: appConfig ? JSON.parse(appConfig) : null,
        configurations: configurations ? JSON.parse(configurations) : null,
        recentExecutions: recentExecutions ? JSON.parse(recentExecutions) : null,
        exportDate: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Failed to export session data:', error);
      throw error;
    }
  };

  // Import session data from backup
  const importSessionData = async (sessionData: any) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      if (sessionData.appConfig) {
        await AsyncStorage.setItem('appConfig', JSON.stringify(sessionData.appConfig));
        dispatch({ type: 'SET_CONFIG', payload: sessionData.appConfig });
      }
      
      if (sessionData.configurations) {
        await AsyncStorage.setItem('configurations', JSON.stringify(sessionData.configurations));
        dispatch({ type: 'SET_CONFIGURATIONS', payload: sessionData.configurations });
      }
      
      if (sessionData.recentExecutions) {
        await AsyncStorage.setItem('recentExecutions', JSON.stringify(sessionData.recentExecutions));
        dispatch({ type: 'SET_RECENT_EXECUTIONS', payload: sessionData.recentExecutions });
      }
      
      console.log('Session data imported successfully');
    } catch (error) {
      console.error('Failed to import session data:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to import session data' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Set re-execution data for cross-screen communication
  const setReExecutionData = useCallback((data: { executionRunName: string; description: string; basePrompt: string; context?: string; configurations: APIConfiguration[]; enableFunctionCalling?: boolean; functionTools?: Tool[]; comparisonEnabled?: boolean; selectedMetrics?: string[]; functionExecutionMode?: 'mock' | 'real' | 'auto' }) => {
    dispatch({ type: 'SET_RE_EXECUTION_DATA', payload: data });
  }, []);

  // Clear re-execution data
  const clearReExecutionData = useCallback(() => {
    dispatch({ type: 'CLEAR_RE_EXECUTION_DATA' });
  }, []);

  // Global refresh function to update all app data
  const refreshAllData = useCallback(async () => {
    console.log('🔄 Starting global app data refresh...');
    try {
      await testConnection();
      await loadConfigurations();
      await loadRecentExecutions();
        console.log('✅ Global app data refresh completed');
    } catch (error) {
      console.warn('⚠️ Global refresh had some errors:', error);
    }
  }, [testConnection, loadConfigurations, loadRecentExecutions]);

  // Execution management functions
  const startExecution = useCallback((executionId: string, maxPolls: number = 300) => {
    console.log('🚀 Starting execution tracking:', executionId);
    dispatch({ 
      type: 'START_EXECUTION', 
      payload: { executionId, maxPolls } 
    });
  }, []);

  const updateExecutionProgress = useCallback((pollCount: number) => {
    dispatch({ 
      type: 'UPDATE_EXECUTION_PROGRESS', 
      payload: { pollCount } 
    });
  }, []);

  const completeExecution = useCallback((executionResult: ExecutionResult) => {
    console.log('✅ Execution completed:', executionResult.id);
    dispatch({ 
      type: 'COMPLETE_EXECUTION', 
      payload: { executionResult } 
    });
  }, []);

  const cancelExecution = useCallback(() => {
    console.log('❌ Execution cancelled by user');
    dispatch({ type: 'CANCEL_EXECUTION' });
  }, []);

  const clearExecutionResult = useCallback(() => {
    dispatch({ type: 'CLEAR_EXECUTION_RESULT' });
  }, []);

  const value: AppContextType = {
    state,
    updateConfig,
    addConfiguration,
    updateConfiguration,
    deleteConfiguration,
    loadConfigurations,
    loadRecentExecutions,
    testConnection,
    clearError,
    resetApp,
    clearSession,
    exportSessionData,
    importSessionData,
    setReExecutionData,
    clearReExecutionData,
    refreshAllData,
    // Execution management
    startExecution,
    updateExecutionProgress,
    completeExecution,
    cancelExecution,
    clearExecutionResult,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext; 