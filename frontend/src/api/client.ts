import axios, { AxiosInstance, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ApiResponse,
  MultiExecutionRequest,
  ExecutionResult,
  ExecutionRun,
  APIConfiguration,
  DatabaseStats,
  DatabaseTable,
  AppConfig,
  FunctionDefinition,
} from '../types';
import { User } from '../context/AuthContext';
import { secureStorage } from '../utils/secureStorage';
import { headerEncryption } from '../utils/secureStorage';

class GoGentAPI {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8080') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth/config
    this.api.interceptors.request.use(
      async (config) => {
        try {
          // Add authentication token if available
          const authToken = await AsyncStorage.getItem('auth_token');
          if (authToken && authToken.trim() !== '') {
            config.headers['Authorization'] = `Bearer ${authToken}`;
          } else {
            // console.warn('⚠️ No auth token available for request:', config.url);
          }

          // Load API keys from secure storage
          const apiKeys = await secureStorage.loadApiKeys();
          const appConfig = await AsyncStorage.getItem('appConfig');
          const appConfigData: Partial<AppConfig> = appConfig ? JSON.parse(appConfig) as AppConfig : {};

          // Add encrypted Gemini API key to headers if available
          if (apiKeys.geminiApiKey) {
            const encryptedKey = headerEncryption.encryptForHeader(apiKeys.geminiApiKey);
            config.headers['X-Encrypted-Gemini-Api-Key'] = encryptedKey;
            console.log('🔐 Added encrypted Gemini API key to headers');
          }
          
          // Add encrypted OpenWeather API key to headers if available
          if (apiKeys.openWeatherApiKey) {
            const encryptedKey = headerEncryption.encryptForHeader(apiKeys.openWeatherApiKey);
            config.headers['X-Encrypted-Openweather-Api-Key'] = encryptedKey;
            console.log('🔐 Added encrypted OpenWeather API key to headers');
          }
          
          // Add encrypted Neo4j configuration to headers if available
          if (apiKeys.neo4jUrl) {
            const encryptedUrl = headerEncryption.encryptForHeader(apiKeys.neo4jUrl);
            config.headers['X-Encrypted-Neo4j-Url'] = encryptedUrl;
          }
          if (apiKeys.neo4jUsername) {
            const encryptedUsername = headerEncryption.encryptForHeader(apiKeys.neo4jUsername);
            config.headers['X-Encrypted-Neo4j-Username'] = encryptedUsername;
          }
          if (apiKeys.neo4jPassword) {
            const encryptedPassword = headerEncryption.encryptForHeader(apiKeys.neo4jPassword);
            config.headers['X-Encrypted-Neo4j-Password'] = encryptedPassword;
          }
          if (apiKeys.neo4jDatabase) {
            const encryptedDatabase = headerEncryption.encryptForHeader(apiKeys.neo4jDatabase);
            config.headers['X-Encrypted-Neo4j-Database'] = encryptedDatabase;
          }
          
          // Add encrypted GitHub API key to headers if available
          if (apiKeys.githubApiKey) {
            const encryptedKey = headerEncryption.encryptForHeader(apiKeys.githubApiKey);
            config.headers['X-Encrypted-Github-Api-Key'] = encryptedKey;
            console.log('🔐 Added encrypted GitHub API key to headers');
          }
          
          // Add mock flag if needed
          if (appConfigData?.useMockResponses) {
            config.headers['X-Use-Mock'] = 'true';
          }
        } catch (error) {
          console.warn('Failed to load app config or API keys:', error);
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Simple response interceptor - only log errors, don't handle auth
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Just log the error - let individual components handle their own auth logic
        if (error.response?.status) {
          console.warn(`API ${error.response.status} for ${error.config?.url}:`, error.response?.data?.error || error.message);
        } else {
          console.error('API Network Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  // Update base URL
  updateBaseURL(newBaseURL: string) {
    this.baseURL = newBaseURL;
    this.api.defaults.baseURL = newBaseURL;
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
    try {
      const response: AxiosResponse = await this.api.get('/health');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Health check failed',
      };
    }
  }

  // Execute multi-variation request (async) - Enhanced with execution mode
  async executeMultiVariation(
    request: MultiExecutionRequest, 
    functionExecutionMode: 'mock' | 'real' | 'auto' = 'auto'
  ): Promise<ApiResponse<{ executionRun: { id: string; name: string; status: string }; message: string }>> {
    try {
      // Enhanced request with execution mode
      const enhancedRequest = {
        ...request,
        functionExecutionMode, // Pass execution mode to backend
      };

      const response: AxiosResponse<{ executionRun: { id: string; name: string; status: string }; message: string }> = await this.api.post('/api/execute', enhancedRequest);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Execution failed',
      };
    }
  }

  // Poll execution status
  async getExecutionStatus(executionId: string): Promise<ApiResponse<{ status: string; result?: ExecutionResult; error?: string }>> {
    try {
      const response: AxiosResponse<{ status: string; result?: ExecutionResult; error?: string }> = await this.api.get(`/api/execution-runs/status/${executionId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get execution status',
      };
    }
  }

  // Execute single variation for testing
  async executeSingleVariation(
    config: APIConfiguration,
    prompt: string,
    context?: string
  ): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/execute/single', {
        configuration: config,
        prompt,
        context,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Single execution failed',
      };
    }
  }

  // Get execution runs (history)
  async getExecutionRuns(limit: number = 50, offset: number = 0): Promise<ApiResponse<ExecutionRun[]>> {
    try {
      const response: AxiosResponse<ExecutionRun[]> = await this.api.get('/api/execution-runs', {
        params: { limit, offset },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch execution runs',
      };
    }
  }

  // Get specific execution run with results
  async getExecutionRun(id: string): Promise<ApiResponse<ExecutionResult>> {
    try {
      const response: AxiosResponse<ExecutionResult> = await this.api.get(`/api/execution-runs/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch execution run',
      };
    }
  }

  // Delete execution run
  async deleteExecutionRun(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response: AxiosResponse = await this.api.delete(`/api/execution-runs/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete execution run',
      };
    }
  }

  // Get execution logs for debugging and monitoring
  async getExecutionLogs(limit: number = 100, offset: number = 0): Promise<ApiResponse<DatabaseTable>> {
    try {
      const response: AxiosResponse<DatabaseTable> = await this.api.get('/api/database/tables/execution_logs', {
        params: { limit, offset },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch execution logs',
      };
    }
  }

  // Get function definitions for the current user (includes both user and system functions)
  async getFunctionDefinitions(limit: number = 100, offset: number = 0): Promise<ApiResponse<DatabaseTable>> {
    try {
      const response: AxiosResponse<DatabaseTable> = await this.api.get('/api/database/tables/function_definitions', {
        params: { limit, offset },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch function definitions',
      };
    }
  }

  // Get configurations
  async getConfigurations(executionRunId?: string): Promise<ApiResponse<APIConfiguration[]>> {
    try {
      const params = executionRunId ? { executionRunId } : {};
      const response: AxiosResponse<APIConfiguration[]> = await this.api.get('/api/configurations', {
        params,
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch configurations',
      };
    }
  }

  // Save configuration
  async saveConfiguration(config: APIConfiguration): Promise<ApiResponse<APIConfiguration>> {
    try {
      const response: AxiosResponse<APIConfiguration> = await this.api.post('/api/configurations', config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to save configuration',
      };
    }
  }

  // Update configuration
  async updateConfiguration(config: APIConfiguration): Promise<ApiResponse<APIConfiguration>> {
    try {
      const response: AxiosResponse<APIConfiguration> = await this.api.put(`/api/configurations/${config.id}`, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update configuration',
      };
    }
  }

  // Delete configuration
  async deleteConfiguration(id: string): Promise<ApiResponse<{ message: string }>> {
    console.log('📡 API Client: deleteConfiguration called with ID:', id);
    
    try {
      console.log('🌐 API Client: Making DELETE request to /api/configurations/' + id);
      const response: AxiosResponse = await this.api.delete(`/api/configurations/${id}`);
      console.log('✅ API Client: Delete request successful:', response.data);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('❌ API Client: Delete request failed:', error);
      console.error('❌ API Client: Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete configuration',
      };
    }
  }

  // Database-related endpoints
  
  // Get database statistics
  async getDatabaseStats(): Promise<ApiResponse<DatabaseStats>> {
    try {
      const response: AxiosResponse<DatabaseStats> = await this.api.get('/api/database/stats');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch database stats',
      };
    }
  }

  // Get database table data
  async getDatabaseTable(
    tableName: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ApiResponse<DatabaseTable>> {
    try {
      const response: AxiosResponse<DatabaseTable> = await this.api.get(`/api/database/tables/${tableName}`, {
        params: { limit, offset },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || `Failed to fetch ${tableName} data`,
      };
    }
  }

  // Get list of available database tables
  async getDatabaseTables(): Promise<ApiResponse<string[]>> {
    try {
      const response: AxiosResponse<string[]> = await this.api.get('/api/database/tables');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch database tables',
      };
    }
  }

  // Execute custom database query (for advanced users)
  async executeQuery(query: string): Promise<ApiResponse<any[]>> {
    try {
      const response: AxiosResponse<any[]> = await this.api.post('/api/database/query', { query });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Query execution failed',
      };
    }
  }

  // Get procurement specific endpoints (if needed)
  
  // Evaluate vendor proposals
  async evaluateVendorProposals(rfpRequest: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/procurement/evaluate-vendors', rfpRequest);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Vendor evaluation failed',
      };
    }
  }

  // Generate negotiation strategies
  async generateNegotiationStrategies(vendorProfile: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/procurement/negotiation-strategies', vendorProfile);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Negotiation strategy generation failed',
      };
    }
  }

  // Analyze contract terms
  async analyzeContractTerms(contractTerms: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/procurement/analyze-contract', contractTerms);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Contract analysis failed',
      };
    }
  }

  // Test function execution
  async testFunction(functionId: string, functionArgs: any, useMockData: boolean = false): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.post(`/api/functions/test/${functionId}`, {
        arguments: functionArgs,
        useMockData,
        timeoutMs: 30000, // 30 second timeout
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Function test failed',
      };
    }
  }

  // Test connectivity
  async testConnection(): Promise<ApiResponse<{ message: string }>> {
    try {
      const response: AxiosResponse = await this.api.get('/test');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Connection test failed',
      };
    }
  }

  // Authentication endpoints
  async login(username: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/auth/login', {
        username,
        password,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Login error:', error);
      
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error('Login failed:', {
        status: error.response?.status,
        error: backendError,
        fullResponse: error.response?.data
      });
      
      return { 
        success: false, 
        error: backendError || 'Login failed'
      };
    }
  }

  async register(username: string, email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/auth/register', {
        username,
        email,
        password,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Registration error:', error);
      
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error('Registration failed:', {
        status: error.response?.status,
        error: backendError,
        fullResponse: error.response?.data
      });
      
      return {
        success: false,
        error: backendError || 'Registration failed',
      };
    }
  }

  async createTemporaryUser(sessionId?: string): Promise<ApiResponse<{ token: string; user: User; temporary_password?: string }>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/auth/temp-user', {
        session_id: sessionId,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Create temporary user error:', error);
      
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error('Create temporary user failed:', {
        status: error.response?.status,
        error: backendError,
        fullResponse: error.response?.data
      });
      
      return {
        success: false,
        error: backendError || 'Failed to create temporary user',
      };
    }
  }

  async saveTemporaryAccount(email: string, password: string): Promise<ApiResponse<{ user: User }>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/auth/save-temp', {
        email,
        password,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Save temporary account error:', error);
      
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error('Save temporary account failed:', {
        status: error.response?.status,
        error: backendError,
        fullResponse: error.response?.data
      });
      
      return {
        success: false,
        error: backendError || 'Failed to save temporary account',
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response: AxiosResponse = await this.api.get('/api/auth/current');
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get current user',
      };
    }
  }

  // Function CRUD operations
  async getFunctions(): Promise<ApiResponse<FunctionDefinition[]>> {
    try {
      const response: AxiosResponse = await this.api.get('/api/functions');
      
      // Ensure the response data is an array
      let functionsData = response.data;
      if (functionsData && typeof functionsData === 'object' && functionsData.data) {
        // If the response is wrapped in a data property, extract it
        functionsData = functionsData.data;
      }
      
      // Ensure it's an array
      const functions = Array.isArray(functionsData) ? functionsData : [];
      
      return {
        success: true,
        data: functions,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get functions',
        data: [], // Always provide an empty array on error
      };
    }
  }

  async createFunction(functionData: any): Promise<ApiResponse<FunctionDefinition>> {
    try {
      const response = await this.api.post('/api/functions', functionData);
      // Backend returns wrapped response: {success: true, data: {...}, message: "..."}
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to create function',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create function',
      };
    }
  }

  async updateFunction(id: string, functionData: any): Promise<ApiResponse<FunctionDefinition>> {
    try {
      const response = await this.api.put(`/api/functions/${id}`, functionData);
      // Handle wrapped response like createFunction
      if (response.data.success && response.data.data) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to update function',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update function',
      };
    }
  }

  async deleteFunction(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response = await this.api.delete(`/api/functions/${id}`);
      // Handle wrapped response
      if (response.data.success) {
        return {
          success: true,
          data: { message: response.data.message || 'Function deleted successfully' },
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to delete function',
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete function',
      };
    }
  }

  // Connect temporary account to email
  async connectTemporaryToEmail(email: string, newPassword: string): Promise<ApiResponse<{ token: string; user: User }>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/auth/connect-temp-account', {
        email,
        newPassword,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Connect account error:', error);
      
      // Enhanced error extraction to catch all possible error formats
      // The response interceptor logs the real error, so let's extract it properly
      const backendError = error.response?.data || 
                          error.response?.statusText ||
                          error.message;
      
      console.error('Connect account failed:', {
        status: error.response?.status,
        data: error.response?.data,
        statusText: error.response?.statusText,
        message: error.message,
        fullResponse: error.response,
        extractedError: backendError
      });
      
      // Convert the backend error to a string for processing
      let errorMessage = '';
      if (typeof backendError === 'string') {
        errorMessage = backendError;
      } else if (typeof backendError === 'object' && backendError !== null) {
        // If it's an object, try to extract the message
        errorMessage = backendError.error || backendError.message || JSON.stringify(backendError);
      } else {
        errorMessage = 'Failed to connect account';
      }
      
      console.log('Final extracted error message:', errorMessage);
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  // Change password for existing account
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      console.error('Change password error:', error);
      
      const backendError = error.response?.data?.error || error.response?.data?.message || error.message;
      console.error('Change password failed:', {
        status: error.response?.status,
        error: backendError,
        fullResponse: error.response?.data
      });
      
      return { 
        success: false, 
        error: backendError || 'Failed to change password'
      };
    }
  }

  // Get execution flow graph
  async getExecutionFlowGraph(executionRunId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.get(`/api/execution-flow/${executionRunId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get execution flow graph',
      };
    }
  }
}

// Create singleton instance
export const goGentAPI = new GoGentAPI();

// Export class for custom instances if needed
export default GoGentAPI; 