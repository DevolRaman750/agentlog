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
  ExecutionLog,
  Agent,
  AgentFormData,
  AgentExecutionSummary,
  Team,
  TeamFormData,
  TeamWithAgents,
  TeamStats,
  UserApiKey,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
  ApiKeyValidationResult,
  FunctionGroupApiKeyStatus,
  FunctionApiKeyRequirements,
  ApiKeyStatistics,
  AgentMemoryRequest,
  AgentMemoryResponse,
  TeamMemoryRequest,
  TeamMemoryResponse,
} from '../types';

// Team with agents creation types
interface TeamWithAgentsCreateRequest {
  name: string;
  description?: string;
  maxTokensPerDay: number;
  teamConfigId?: string;
  agents: AgentCreateRequestForTeam[];
}

interface AgentCreateRequestForTeam {
  firstName: string;
  lastName: string;
  templateId: string;
  maxTokensPerDay: number;
  heartbeatMinutes: number;
  lifecycleStatus: 'STANDBY' | 'ACTIVE' | 'PAUSED' | 'KILLED';
}

interface TeamWithAgentsCreateResponse {
  team: Team;
  agents: Agent[];
}
import { User } from '../context/AuthContext';
import { BackendExecutionKeys } from './backendExecutionKeys';

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

          // Load app config for mock responses flag
          const appConfig = await AsyncStorage.getItem('appConfig');
          const appConfigData: Partial<AppConfig> = appConfig ? JSON.parse(appConfig) as AppConfig : {};

          // Note: API keys are now managed by the backend and no longer injected via headers
          
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

  // Get execution logs filtered by configuration
  async getExecutionLogsByConfiguration(executionRunId: string, configurationId: string): Promise<ApiResponse<ExecutionLog[]>> {
    try {
      const response: AxiosResponse<ExecutionLog[]> = await this.api.get(`/api/execution-logs/${executionRunId}/${configurationId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch execution logs by configuration',
      };
    }
  }

  // Get all execution logs for a specific execution run (across all configurations)
  async getExecutionLogsByRun(executionRunId: string): Promise<ApiResponse<ExecutionLog[]>> {
    try {
      const response: AxiosResponse<ExecutionLog[]> = await this.api.get(`/api/execution-logs/${executionRunId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch execution logs by run',
      };
    }
  }

  // Get execution flow graph filtered by configuration
  async getExecutionFlowGraphByConfiguration(executionRunId: string, configurationId: string): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse<any> = await this.api.get(`/api/execution-flow-by-config/${executionRunId}/${configurationId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch execution flow graph by configuration',
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
      const status = error.response?.status;
      const isAuthError = status === 401 || status === 403;
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to get current user',
        statusCode: status,
        isAuthError, // Flag to indicate if this is an auth-related error
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

  // Template management methods
  async getTemplates(): Promise<ApiResponse<{ templates: any[] }>> {
    try {
      const response: AxiosResponse = await this.api.get('/api/templates?include_tokens=true');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (getTemplates):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch templates',
      };
    }
  }

  async createTemplate(templateData: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/templates', templateData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (createTemplate):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create template',
      };
    }
  }

  async deleteTemplate(templateId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response: AxiosResponse = await this.api.delete(`/api/templates/${templateId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (deleteTemplate):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete template',
      };
    }
  }

  async updateTemplate(templateId: string, templateData: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.put(`/api/templates/${templateId}`, templateData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (updateTemplate):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update template',
      };
    }
  }

  async createTemplateToken(templateId: string, tokenData: any): Promise<ApiResponse<any>> {
    try {
      const response: AxiosResponse = await this.api.post(`/api/templates/${templateId}/tokens`, tokenData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (createTemplateToken):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create template token',
      };
    }
  }

  async deleteTemplateToken(templateId: string, tokenId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response: AxiosResponse = await this.api.delete(`/api/templates/${templateId}/tokens/${tokenId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (deleteTemplateToken):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete template token',
      };
    }
  }

  async executeTemplate(templateId: string, parameters: Record<string, any>): Promise<ApiResponse<{ executionRun: { id: string; name: string; status: string }; message: string }>> {
    try {
      // First, get the template details to construct the execution request
      const templateResponse = await this.getTemplates();
      if (!templateResponse.success) {
        throw new Error('Failed to fetch templates');
      }
      
      const template = templateResponse.data?.templates?.find(t => t.id === templateId);
      if (!template) {
        throw new Error('Template not found');
      }

      // Get configurations for the execution
      const configResponse = await this.getConfigurations();
      if (!configResponse.success) {
        throw new Error('Failed to fetch configurations');
      }

      // Use the first available configuration (or default)
      const configurations = configResponse.data || [];
      const defaultConfig = configurations.find(c => c.variationName === 'Software Engineer') || configurations[0];
      
      if (!defaultConfig) {
        throw new Error('No configurations available');
      }

      // Construct the execution request
      const executionRequest = {
        executionRunName: `Agent Execution: ${template.name}`,
        description: `Template execution via agent: ${template.name}`,
        basePrompt: template.prompt,
        context: template.context || '',
        enableFunctionCalling: template.enableFunctionCalling || false,
        configurations: [defaultConfig],
        // Add agent context to parameters if provided
        ...parameters
      };

      const response: AxiosResponse = await this.api.post('/api/execute', executionRequest);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (executeTemplate):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to execute template',
      };
    }
  }

  // Agent Management APIs
  async getAgents(): Promise<ApiResponse<Agent[]>> {
    try {
      const response: AxiosResponse = await this.api.get('/api/agents?include_stats=true');
      return {
        success: true,
        data: response.data || [],
      };
    } catch (error: any) {
      console.error('API Error (getAgents):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch agents',
        data: [],
      };
    }
  }

  async getAgent(id: string): Promise<ApiResponse<Agent>> {
    try {
      const response: AxiosResponse = await this.api.get(`/api/agents/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (getAgent):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch agent',
      };
    }
  }

  async createAgent(agentData: AgentFormData): Promise<ApiResponse<Agent>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/agents', agentData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (createAgent):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create agent',
      };
    }
  }

  async updateAgent(id: string, agentData: Partial<AgentFormData>): Promise<ApiResponse<Agent>> {
    try {
      const response: AxiosResponse = await this.api.put(`/api/agents/${id}`, agentData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (updateAgent):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update agent',
      };
    }
  }

  async deleteAgent(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response: AxiosResponse = await this.api.delete(`/api/agents/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (deleteAgent):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete agent',
      };
    }
  }

  async getAgentExecutions(id: string, limit: number = 50, offset: number = 0): Promise<ApiResponse<ExecutionRun[]>> {
    try {
      const response: AxiosResponse = await this.api.get(`/api/agents/${id}/executions`, {
        params: { limit, offset }
      });
      return {
        success: true,
        data: response.data || [],
      };
    } catch (error: any) {
      console.error('API Error (getAgentExecutions):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch agent executions',
        data: [],
      };
    }
  }

  // Team Management APIs
  async getTeams(): Promise<ApiResponse<Team[]>> {
    try {
      const response: AxiosResponse = await this.api.get('/api/teams');
      return {
        success: true,
        data: response.data || [],
      };
    } catch (error: any) {
      console.error('API Error (getTeams):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch teams',
        data: [],
      };
    }
  }

  async getTeam(id: string): Promise<ApiResponse<Team>> {
    try {
      const response: AxiosResponse = await this.api.get(`/api/teams/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (getTeam):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch team',
      };
    }
  }

  async createTeam(teamData: TeamFormData): Promise<ApiResponse<Team>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/teams', teamData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (createTeam):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create team',
      };
    }
  }

  async createTeamWithAgents(teamData: TeamWithAgentsCreateRequest): Promise<ApiResponse<TeamWithAgentsCreateResponse>> {
    try {
      const response: AxiosResponse = await this.api.post('/api/teams?with_agents=true', teamData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (createTeamWithAgents):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create team with agents',
      };
    }
  }

  async updateTeam(id: string, teamData: Partial<TeamFormData>): Promise<ApiResponse<Team>> {
    try {
      const response: AxiosResponse = await this.api.put(`/api/teams/${id}`, teamData);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (updateTeam):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update team',
      };
    }
  }

  async deleteTeam(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const response: AxiosResponse = await this.api.delete(`/api/teams/${id}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (deleteTeam):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete team',
      };
    }
  }

  async getTeamWithAgents(id: string): Promise<ApiResponse<TeamWithAgents>> {
    try {
      const response: AxiosResponse = await this.api.get(`/api/teams/${id}/agents`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (getTeamWithAgents):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch team with agents',
      };
    }
  }

  async assignAgentToTeam(agentId: string, teamId: string): Promise<ApiResponse<Agent>> {
    try {
      const response: AxiosResponse = await this.api.post(`/api/teams/${teamId}/agents/${agentId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (assignAgentToTeam):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to assign agent to team',
      };
    }
  }

  async removeAgentFromTeam(agentId: string): Promise<ApiResponse<Agent>> {
    try {
      const response: AxiosResponse = await this.api.delete(`/api/agents/${agentId}/team`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (removeAgentFromTeam):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to remove agent from team',
      };
    }
  }

  // Team Controls
  async pauseAllTeamAgents(teamId: string): Promise<ApiResponse<{ message: string; affectedCount: number }>> {
    try {
      const response: AxiosResponse = await this.api.post(`/api/teams/${teamId}/pause-all`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (pauseAllTeamAgents):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to pause all team agents',
      };
    }
  }

  async resumeAllTeamAgents(teamId: string): Promise<ApiResponse<{ message: string; affectedCount: number }>> {
    try {
      const response: AxiosResponse = await this.api.post(`/api/teams/${teamId}/resume-all`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (resumeAllTeamAgents):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to resume all team agents',
      };
    }
  }

  async getTeamStats(teamId: string): Promise<ApiResponse<TeamStats>> {
    try {
      const response: AxiosResponse = await this.api.get(`/api/teams/${teamId}/stats`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (getTeamStats):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch team stats',
      };
    }
  }

  // =============================================================================
  // API KEY MANAGEMENT METHODS
  // =============================================================================

  // Create a new API key
  async createApiKey(request: CreateApiKeyRequest): Promise<ApiResponse<UserApiKey>> {
    try {
      console.log('🔐 Creating API key:', request.keyName);
      const response: AxiosResponse = await this.api.post('/api/user/api-keys/', request);
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('API Error (createApiKey):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to create API key',
      };
    }
  }

  // Get all API keys for the current user
  async getApiKeys(): Promise<ApiResponse<UserApiKey[]>> {
    try {
      console.log('🔐 Fetching user API keys');
      const response: AxiosResponse = await this.api.get('/api/user/api-keys/');
      
      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error: any) {
      console.error('API Error (getApiKeys):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch API keys',
      };
    }
  }

  // Get API keys for a specific service
  async getApiKeysByService(serviceName: string): Promise<ApiResponse<UserApiKey[]>> {
    try {
      console.log('🔐 Fetching API keys for service:', serviceName);
      const response: AxiosResponse = await this.api.get(`/api/user/api-keys/?service=${serviceName}`);
      
      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error: any) {
      console.error('API Error (getApiKeysByService):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch API keys for service',
      };
    }
  }

  // Get a specific API key by ID
  async getApiKey(keyId: string): Promise<ApiResponse<UserApiKey>> {
    try {
      console.log('🔐 Fetching API key:', keyId);
      const response: AxiosResponse = await this.api.get(`/api/user/api-keys/${keyId}`);
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('API Error (getApiKey):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch API key',
      };
    }
  }

  // Update an existing API key
  async updateApiKey(keyId: string, request: UpdateApiKeyRequest): Promise<ApiResponse<UserApiKey>> {
    try {
      console.log('🔐 Updating API key:', keyId);
      const response: AxiosResponse = await this.api.put(`/api/user/api-keys/${keyId}`, request);
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('API Error (updateApiKey):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to update API key',
      };
    }
  }

  // Delete an API key
  async deleteApiKey(keyId: string): Promise<ApiResponse<{ message: string }>> {
    try {
      console.log('🔐 Deleting API key:', keyId);
      const response: AxiosResponse = await this.api.delete(`/api/user/api-keys/${keyId}`);
      
      return {
        success: true,
        data: response.data.data || { message: 'API key deleted successfully' },
      };
    } catch (error: any) {
      console.error('API Error (deleteApiKey):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to delete API key',
      };
    }
  }

  // Test an API key
  async testApiKey(keyId: string): Promise<ApiResponse<ApiKeyValidationResult>> {
    try {
      console.log('🔐 Testing API key:', keyId);
      const response: AxiosResponse = await this.api.post(`/api/user/api-keys/${keyId}/test`);
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('API Error (testApiKey):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to test API key',
      };
    }
  }

  // Get function group API key status
  async getFunctionGroupApiKeyStatus(): Promise<ApiResponse<FunctionGroupApiKeyStatus[]>> {
    try {
      console.log('🔐 Fetching function group API key status');
      const response: AxiosResponse = await this.api.get('/api/user/api-keys/function-groups/status');
      
      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error: any) {
      console.error('API Error (getFunctionGroupApiKeyStatus):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch function group API key status',
      };
    }
  }

  // Get API key requirements for a specific function
  async getFunctionApiKeyRequirements(functionId: string): Promise<ApiResponse<FunctionApiKeyRequirements>> {
    try {
      console.log('🔐 Fetching API key requirements for function:', functionId);
      const response: AxiosResponse = await this.api.get(`/api/user/api-keys/functions/${functionId}/requirements`);
      
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('API Error (getFunctionApiKeyRequirements):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch function API key requirements',
      };
    }
  }

  // Get API key usage statistics
  async getApiKeyStatistics(): Promise<ApiResponse<ApiKeyStatistics>> {
    try {
      console.log('🔐 Fetching API key statistics');
      const response: AxiosResponse = await this.api.get('/api/user/api-keys/statistics');
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error('API Error (getApiKeyStatistics):', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to fetch API key statistics',
      };
    }
  }

  // Helper method to check if API keys are configured for a service
  async isServiceConfigured(serviceName: string): Promise<boolean> {
    try {
      const result = await this.getApiKeysByService(serviceName);
      if (result.success && result.data) {
        return result.data.some(key => key.isActive && key.validationStatus === 'valid');
      }
      return false;
    } catch (error) {
      console.error('Error checking service configuration:', error);
      return false;
    }
  }

  // Helper method to get the default API key for a service
  async getDefaultApiKeyForService(serviceName: string): Promise<UserApiKey | null> {
    try {
      const result = await this.getApiKeysByService(serviceName);
      if (result.success && result.data) {
        return result.data.find(key => key.isDefault && key.isActive) || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting default API key:', error);
      return null;
    }
  }

  // Agent Memory Methods
  async getAgentMemory(agentId: string, params?: { context?: string; path?: string }): Promise<AgentMemoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.context) queryParams.append('context', params.context);
      if (params?.path) queryParams.append('path', params.path);
      
      const url = `/api/agents/${agentId}/memory/read${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response: AxiosResponse<AgentMemoryResponse> = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error getting agent memory:', error);
      throw error;
    }
  }

  async writeAgentMemory(agentId: string, request: Omit<AgentMemoryRequest, 'agentId'>): Promise<AgentMemoryResponse> {
    try {
      const response: AxiosResponse<AgentMemoryResponse> = await this.api.post(
        `/api/agents/${agentId}/memory/write`,
        { ...request, agentId }
      );
      return response.data;
    } catch (error) {
      console.error('Error writing agent memory:', error);
      throw error;
    }
  }

  async searchAgentMemory(agentId: string, params: { searchQuery: string; limit?: number }): Promise<AgentMemoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('query', params.searchQuery);
      if (params.limit) queryParams.append('limit', params.limit.toString());
      
      const url = `/api/agents/${agentId}/memory/search?${queryParams.toString()}`;
      const response: AxiosResponse<AgentMemoryResponse> = await this.api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error searching agent memory:', error);
      throw error;
    }
  }

  async clearAgentMemory(agentId: string, request: { action: string; context?: string; path?: string }): Promise<AgentMemoryResponse> {
    try {
      const response: AxiosResponse<AgentMemoryResponse> = await this.api.post(
        `/api/agents/${agentId}/memory/clear`,
        { ...request, agentId }
      );
      return response.data;
    } catch (error) {
      console.error('Error clearing agent memory:', error);
      throw error;
    }
  }

  // Team Memory API endpoints
  async getTeamMemory(teamId: string, agentId: string, params?: { context?: string; path?: string }): Promise<TeamMemoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.context) queryParams.append('context', params.context);
      if (params?.path) queryParams.append('path', params.path);
      queryParams.append('agent_id', agentId);
      
      const response = await this.api.get(`/api/teams/${teamId}/memory/read?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting team memory:', error);
      throw error;
    }
  }

  async writeTeamMemory(teamId: string, request: Omit<TeamMemoryRequest, 'teamId'>): Promise<TeamMemoryResponse> {
    try {
      const response = await this.api.post(`/api/teams/${teamId}/memory/write`, request);
      return response.data;
    } catch (error) {
      console.error('Error writing team memory:', error);
      throw error;
    }
  }

  async searchTeamMemory(teamId: string, agentId: string, params: { searchQuery: string; limit?: number }): Promise<TeamMemoryResponse> {
    try {
      const request = {
        agentId,
        searchQuery: params.searchQuery,
        limit: params.limit || 10
      };
      const response = await this.api.post(`/api/teams/${teamId}/memory/search`, request);
      return response.data;
    } catch (error) {
      console.error('Error searching team memory:', error);
      throw error;
    }
  }

  async clearTeamMemory(teamId: string, agentId: string, request: { action: string; context?: string; path?: string }): Promise<TeamMemoryResponse> {
    try {
      const fullRequest = { ...request, agentId };
      const response = await this.api.post(`/api/teams/${teamId}/memory/clear`, fullRequest);
      return response.data;
    } catch (error) {
      console.error('Error clearing team memory:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const goGentAPI = new GoGentAPI();

// Export types for external use
export type { TeamWithAgentsCreateRequest, AgentCreateRequestForTeam, TeamWithAgentsCreateResponse };

// Export class for custom instances if needed
export default GoGentAPI; 