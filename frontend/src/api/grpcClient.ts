import AsyncStorage from '@react-native-async-storage/async-storage';
import { GogentServiceClient } from './generated/GogentServiceClientPb';
import * as gogent_pb from './generated/gogent_pb';
import * as google_protobuf_struct_pb from 'google-protobuf/google/protobuf/struct_pb';
import { secureStorage, SessionApiKeys } from '../utils/secureStorage';
import { headerEncryption } from '../utils/secureStorage';
import {
  ApiResponse,
  MultiExecutionRequest,
  ExecutionResult,
  ExecutionRun,
  APIConfiguration,
  DatabaseStats,
  DatabaseTable,
  AppConfig,
} from '../types';

class GoGentGRPCAPI {
  private client: GogentServiceClient;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8080') {
    this.baseURL = baseURL;
    this.client = new GogentServiceClient(baseURL);
  }

  // Update base URL
  updateBaseURL(newBaseURL: string) {
    this.baseURL = newBaseURL;
    this.client = new GogentServiceClient(newBaseURL);
  }

  // Helper method to get app config
  private async getAppConfig(): Promise<AppConfig | null> {
    try {
      const appConfig = await AsyncStorage.getItem('appConfig');
      return appConfig ? JSON.parse(appConfig) : null;
    } catch (error) {
      console.warn('Failed to load app config:', error);
      return null;
    }
  }

  // Helper method to handle gRPC errors
  private handleError(error: any): ApiResponse<any> {
    console.error('gRPC Error:', error);
    return {
      success: false,
      error: error.message || 'gRPC call failed',
    };
  }

  // Convert internal types to proto messages
  private createExecuteRequest(request: MultiExecutionRequest): gogent_pb.ExecuteRequest {
    const grpcRequest = new gogent_pb.ExecuteRequest();
    grpcRequest.setExecutionRunName(request.executionRunName);
    grpcRequest.setDescription(request.description || '');
    grpcRequest.setBasePrompt(request.basePrompt);
    grpcRequest.setContext(request.context || '');
    grpcRequest.setEnableFunctionCalling(request.enableFunctionCalling || false);

    // Convert configurations
    const protoConfigs: gogent_pb.APIConfiguration[] = [];
    request.configurations.forEach(config => {
      const protoConfig = new gogent_pb.APIConfiguration();
      protoConfig.setId(config.id || '');
      protoConfig.setVariationName(config.variationName);
      protoConfig.setModelName(config.modelName);
      protoConfig.setSystemPrompt(config.systemPrompt || '');
      protoConfig.setTemperature(config.temperature || 0.7);
      protoConfig.setMaxTokens(config.maxTokens || 500);
      protoConfig.setTopP(config.topP || 0.9);
      protoConfig.setTopK(config.topK || 20);
      protoConfigs.push(protoConfig);
    });
    grpcRequest.setConfigurationsList(protoConfigs);

    return grpcRequest;
  }

  // Convert proto messages to internal types
  private convertExecutionResult(protoResult: gogent_pb.ExecutionResult): ExecutionResult {
    const executionRun = protoResult.getExecutionRun();
    const results = protoResult.getResultsList();
    const comparison = protoResult.getComparison();

    return {
      executionRun: {
        id: executionRun?.getId() || '',
        name: executionRun?.getName() || '',
        description: executionRun?.getDescription() || '',
        createdAt: executionRun?.getCreatedAt()?.toDate() || new Date(),
        updatedAt: executionRun?.getUpdatedAt()?.toDate() || new Date(),
      },
      results: results.map(result => ({
        configuration: {
          id: result.getConfiguration()?.getId() || '',
          variationName: result.getConfiguration()?.getVariationName() || '',
          modelName: result.getConfiguration()?.getModelName() || '',
          systemPrompt: result.getConfiguration()?.getSystemPrompt() || '',
          temperature: result.getConfiguration()?.getTemperature() || 0.7,
          maxTokens: result.getConfiguration()?.getMaxTokens() || 500,
          topP: result.getConfiguration()?.getTopP() || 0.9,
          topK: result.getConfiguration()?.getTopK() || 20,
          createdAt: result.getConfiguration()?.getCreatedAt()?.toDate() || new Date(),
        },
        request: {
          id: result.getRequest()?.getId() || '',
          executionRunId: result.getRequest()?.getExecutionRunId() || '',
          configurationId: result.getRequest()?.getConfigurationId() || '',
          requestType: result.getRequest()?.getRequestType() as any || 'generate',
          prompt: result.getRequest()?.getPrompt() || '',
          context: result.getRequest()?.getContext() || '',
          functionName: result.getRequest()?.getFunctionName() || '',
          createdAt: result.getRequest()?.getCreatedAt()?.toDate() || new Date(),
        },
        response: {
          id: result.getResponse()?.getId() || '',
          requestId: result.getResponse()?.getRequestId() || '',
          responseStatus: result.getResponse()?.getResponseStatus() as any || 'success',
          responseText: result.getResponse()?.getResponseText() || '',
          finishReason: result.getResponse()?.getFinishReason() || '',
          errorMessage: result.getResponse()?.getErrorMessage() || '',
          responseTimeMs: result.getResponse()?.getResponseTimeMs() || 0,
          usageMetadata: result.getResponse()?.getUsageMetadata()?.toJavaScript() || {},
          createdAt: result.getResponse()?.getCreatedAt()?.toDate() || new Date(),
        },
        executionTime: result.getExecutionTime() || 0,
      })),
      comparison: comparison ? {
        id: comparison.getId() || '',
        executionRunId: comparison.getExecutionRunId() || '',
        comparisonType: comparison.getComparisonType() || '',
        metricName: comparison.getMetricName() || '',
        configurationScores: comparison.getConfigurationScores()?.toJavaScript() || {},
        bestConfigurationId: comparison.getBestConfigurationId() || '',
        analysisNotes: comparison.getAnalysisNotes() || '',
        createdAt: comparison.getCreatedAt()?.toDate() || new Date(),
      } : undefined,
      totalTime: protoResult.getTotalTime() || 0,
      successCount: protoResult.getSuccessCount() || 0,
      errorCount: protoResult.getErrorCount() || 0,
    };
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; version: string }>> {
    try {
      const request = new gogent_pb.HealthRequest();
      const response = await this.client.health(request);
      
      return {
        success: true,
        data: {
          status: response.getStatus(),
          version: response.getVersion(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Execute multi-variation request (async)
  async executeMultiVariation(request: MultiExecutionRequest): Promise<ApiResponse<{ executionRun: { id: string; name: string; status: string }; message: string }>> {
    try {
      const grpcRequest = this.createExecuteRequest(request);

      // Get current session API keys
      const sessionKeys = await secureStorage.loadApiKeys();

      // Set use mock based on whether we have a Gemini API key
      grpcRequest.setUseMock(!sessionKeys.geminiApiKey);

      // Create metadata with encrypted API keys
      const metadata: { [key: string]: string } = {};

      if (sessionKeys.geminiApiKey) {
        const encryptedKey = headerEncryption.encryptForHeader(sessionKeys.geminiApiKey);
        metadata['x-encrypted-gemini-api-key'] = encryptedKey;
        console.log('🔐 Added encrypted Gemini API key to gRPC metadata');
      }
      
      if (sessionKeys.openWeatherApiKey) {
        const encryptedKey = headerEncryption.encryptForHeader(sessionKeys.openWeatherApiKey);
        metadata['x-encrypted-openweather-api-key'] = encryptedKey;
        grpcRequest.setOpenweatherApiKey(sessionKeys.openWeatherApiKey); // Keep legacy for now
      }
      
      if (sessionKeys.neo4jUrl) {
        const encryptedUrl = headerEncryption.encryptForHeader(sessionKeys.neo4jUrl);
        metadata['x-encrypted-neo4j-url'] = encryptedUrl;
        grpcRequest.setNeo4jUrl(sessionKeys.neo4jUrl); // Keep legacy for now
      }
      
      if (sessionKeys.neo4jUsername) {
        const encryptedUsername = headerEncryption.encryptForHeader(sessionKeys.neo4jUsername);
        metadata['x-encrypted-neo4j-username'] = encryptedUsername;
        grpcRequest.setNeo4jUsername(sessionKeys.neo4jUsername); // Keep legacy for now
      }
      
      if (sessionKeys.neo4jPassword) {
        const encryptedPassword = headerEncryption.encryptForHeader(sessionKeys.neo4jPassword);
        metadata['x-encrypted-neo4j-password'] = encryptedPassword;
        grpcRequest.setNeo4jPassword(sessionKeys.neo4jPassword); // Keep legacy for now
      }
      
      if (sessionKeys.neo4jDatabase) {
        const encryptedDatabase = headerEncryption.encryptForHeader(sessionKeys.neo4jDatabase);
        metadata['x-encrypted-neo4j-database'] = encryptedDatabase;
        grpcRequest.setNeo4jDatabase(sessionKeys.neo4jDatabase); // Keep legacy for now
      }

      const response = await this.client.execute(grpcRequest, metadata);
      const executionRun = response.getExecutionRun();

      return {
        success: true,
        data: {
          executionRun: {
            id: response.getExecutionId(),
            name: executionRun?.getName() || '',
            status: executionRun?.getStatus() || 'pending',
          },
          message: response.getMessage(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Poll execution status
  async getExecutionStatus(executionId: string): Promise<ApiResponse<{ status: string; result?: ExecutionResult; error?: string }>> {
    try {
      const request = new gogent_pb.GetExecutionStatusRequest();
      request.setExecutionId(executionId);

      const response = await this.client.getExecutionStatus(request);
      const result = response.getResult();

      return {
        success: true,
        data: {
          status: response.getStatus(),
          result: result ? this.convertExecutionResult(result) : undefined,
          error: response.getErrorMessage() || undefined,
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Execute single variation for testing
  async executeSingleVariation(
    config: APIConfiguration,
    prompt: string,
    context?: string
  ): Promise<ApiResponse<any>> {
    // For now, use the multi-variation endpoint with a single configuration
    const multiRequest: MultiExecutionRequest = {
      executionRunName: 'single-test-' + Date.now(),
      basePrompt: prompt,
      context: context,
      configurations: [config],
    };

    return this.executeMultiVariation(multiRequest);
  }

  // Get execution runs (history)
  async getExecutionRuns(limit: number = 50, offset: number = 0): Promise<ApiResponse<ExecutionRun[]>> {
    try {
      const request = new gogent_pb.ListExecutionRunsRequest();
      request.setLimit(limit);
      request.setOffset(offset);

      const response = await this.client.listExecutionRuns(request);
      const runs = response.getExecutionRunsList();

      const executionRuns: ExecutionRun[] = runs.map(run => ({
        id: run.getId(),
        name: run.getName(),
        description: run.getDescription(),
        createdAt: run.getCreatedAt()?.toDate() || new Date(),
        updatedAt: run.getUpdatedAt()?.toDate() || new Date(),
      }));

      return {
        success: true,
        data: executionRuns,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get specific execution run with results
  async getExecutionRun(id: string): Promise<ApiResponse<ExecutionResult>> {
    try {
      const request = new gogent_pb.GetExecutionResultRequest();
      request.setExecutionRunId(id);

      const response = await this.client.getExecutionResult(request);
      const result = response.getResult();

      if (!result) {
        return {
          success: false,
          error: 'Execution result not found',
        };
      }

      return {
        success: true,
        data: this.convertExecutionResult(result),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Delete execution run
  async deleteExecutionRun(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const request = new gogent_pb.DeleteExecutionRunRequest();
      request.setExecutionRunId(id);

      const response = await this.client.deleteExecutionRun(request);

      return {
        success: true,
        data: { message: response.getMessage() },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get execution logs for debugging and monitoring
  async getExecutionLogs(limit: number = 100, offset: number = 0): Promise<ApiResponse<DatabaseTable>> {
    // Note: gRPC client uses the REST API endpoint for database operations
    // since database table operations are typically done via REST
    try {
      const response = await fetch(`${this.baseURL}/api/database/tables/execution_logs?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data: data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to fetch execution logs',
      };
    }
  }

  // Get configurations
  async getConfigurations(executionRunId?: string): Promise<ApiResponse<APIConfiguration[]>> {
    try {
      const request = new gogent_pb.ListConfigurationsRequest();
      const response = await this.client.listConfigurations(request);
      const configs = response.getConfigurationsList();

      const configurations: APIConfiguration[] = configs.map(config => ({
        id: config.getId(),
        executionRunId: config.getExecutionRunId(),
        variationName: config.getVariationName(),
        modelName: config.getModelName(),
        systemPrompt: config.getSystemPrompt(),
        temperature: config.getTemperature(),
        maxTokens: config.getMaxTokens(),
        topP: config.getTopP(),
        topK: config.getTopK(),
        createdAt: config.getCreatedAt()?.toDate(),
      }));

      return {
        success: true,
        data: configurations,
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Save configuration
  async saveConfiguration(config: APIConfiguration): Promise<ApiResponse<APIConfiguration>> {
    try {
      const protoConfig = new gogent_pb.APIConfiguration();
      protoConfig.setVariationName(config.variationName);
      protoConfig.setModelName(config.modelName);
      protoConfig.setSystemPrompt(config.systemPrompt || '');
      protoConfig.setTemperature(config.temperature || 0.7);
      protoConfig.setMaxTokens(config.maxTokens || 500);
      protoConfig.setTopP(config.topP || 0.9);
      protoConfig.setTopK(config.topK || 20);

      const request = new gogent_pb.CreateConfigurationRequest();
      request.setConfiguration(protoConfig);

      const response = await this.client.createConfiguration(request);
      const savedConfig = response.getConfiguration();

      if (!savedConfig) {
        return {
          success: false,
          error: 'Failed to save configuration',
        };
      }

      return {
        success: true,
        data: {
          id: savedConfig.getId(),
          executionRunId: savedConfig.getExecutionRunId(),
          variationName: savedConfig.getVariationName(),
          modelName: savedConfig.getModelName(),
          systemPrompt: savedConfig.getSystemPrompt(),
          temperature: savedConfig.getTemperature(),
          maxTokens: savedConfig.getMaxTokens(),
          topP: savedConfig.getTopP(),
          topK: savedConfig.getTopK(),
          createdAt: savedConfig.getCreatedAt()?.toDate(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Update configuration
  async updateConfiguration(config: APIConfiguration): Promise<ApiResponse<APIConfiguration>> {
    try {
      const protoConfig = new gogent_pb.APIConfiguration();
      protoConfig.setId(config.id || '');
      protoConfig.setVariationName(config.variationName);
      protoConfig.setModelName(config.modelName);
      protoConfig.setSystemPrompt(config.systemPrompt || '');
      protoConfig.setTemperature(config.temperature || 0.7);
      protoConfig.setMaxTokens(config.maxTokens || 500);
      protoConfig.setTopP(config.topP || 0.9);
      protoConfig.setTopK(config.topK || 20);

      const request = new gogent_pb.UpdateConfigurationRequest();
      request.setId(config.id || '');
      request.setConfiguration(protoConfig);

      const response = await this.client.updateConfiguration(request);
      const updatedConfig = response.getConfiguration();

      if (!updatedConfig) {
        return {
          success: false,
          error: 'Failed to update configuration',
        };
      }

      return {
        success: true,
        data: {
          id: updatedConfig.getId(),
          executionRunId: updatedConfig.getExecutionRunId(),
          variationName: updatedConfig.getVariationName(),
          modelName: updatedConfig.getModelName(),
          systemPrompt: updatedConfig.getSystemPrompt(),
          temperature: updatedConfig.getTemperature(),
          maxTokens: updatedConfig.getMaxTokens(),
          topP: updatedConfig.getTopP(),
          topK: updatedConfig.getTopK(),
          createdAt: updatedConfig.getCreatedAt()?.toDate(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Delete configuration
  async deleteConfiguration(id: string): Promise<ApiResponse<{ message: string }>> {
    try {
      const request = new gogent_pb.DeleteConfigurationRequest();
      request.setId(id);

      const response = await this.client.deleteConfiguration(request);

      return {
        success: true,
        data: { message: response.getMessage() },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Database-related endpoints
  
  // Get database statistics
  async getDatabaseStats(): Promise<ApiResponse<DatabaseStats>> {
    try {
      const request = new gogent_pb.GetDatabaseStatsRequest();
      const response = await this.client.getDatabaseStats(request);

      return {
        success: true,
        data: {
          totalExecutionRuns: response.getTotalExecutionRuns(),
          totalApiRequests: response.getTotalApiRequests(),
          totalApiResponses: response.getTotalApiResponses(),
          totalFunctionCalls: response.getTotalFunctionCalls(),
          avgResponseTime: response.getAvgResponseTime(),
          successRate: response.getSuccessRate(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get database table data
  async getDatabaseTable(
    tableName: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<ApiResponse<DatabaseTable>> {
    try {
      const request = new gogent_pb.GetTableDataRequest();
      request.setTableName(tableName);
      request.setLimit(limit);
      request.setOffset(offset);

      const response = await this.client.getTableData(request);
      const rows = response.getRowsList();

      return {
        success: true,
        data: {
          tableName: response.getTableName(),
          columns: response.getColumnsList(),
          rows: rows.map(row => row.getValuesList()),
          totalRows: response.getTotalRows(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Get list of available database tables
  async getDatabaseTables(): Promise<ApiResponse<string[]>> {
    try {
      const request = new gogent_pb.ListDatabaseTablesRequest();
      const response = await this.client.listDatabaseTables(request);

      return {
        success: true,
        data: response.getTablesList(),
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Execute custom database query (for advanced users)
  async executeQuery(query: string): Promise<ApiResponse<any[]>> {
    return {
      success: false,
      error: 'Custom queries not supported in gRPC client yet',
    };
  }

  // Test function execution
  async testFunction(functionId: string, functionArgs: any, useMockData: boolean = false): Promise<ApiResponse<any>> {
    try {
      const request = new gogent_pb.TestFunctionRequest();
      request.setFunctionId(functionId);
      request.setUseMockData(useMockData);
      
      // Convert arguments to protobuf Struct
      const argsStruct = google_protobuf_struct_pb.Struct.fromJavaScript(functionArgs);
      request.setArguments(argsStruct);

      const response = await this.client.testFunction(request);

      return {
        success: true,
        data: {
          success: response.getSuccess(),
          usedMockData: response.getUsedMockData(),
          executionTimeMs: response.getExecutionTimeMs(),
          response: response.getResponse()?.toJavaScript(),
          errorMessage: response.getErrorMessage(),
        },
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  // Test API connection
  async testConnection(): Promise<ApiResponse<{ connected: boolean; latency: number }>> {
    const startTime = Date.now();
    try {
      await this.healthCheck();
      const latency = Date.now() - startTime;
      return {
        success: true,
        data: { connected: true, latency },
      };
    } catch (error) {
      return {
        success: false,
        data: { connected: false, latency: -1 },
        error: 'Connection failed',
      };
    }
  }

  // Validate API keys for execution
  async validateApiKeysForExecution(
    enableFunctionCalling: boolean,
    selectedFunctions: string[] = []
  ): Promise<{
    isValid: boolean;
    missingKeys: { keyName: string; description: string; required: boolean }[];
  }> {
    return await secureStorage.validateForExecution(enableFunctionCalling, selectedFunctions);
  }

  // Check if specific function has required API keys
  async validateFunctionRequirements(functionName: string): Promise<{
    isValid: boolean;
    missingKeys: string[];
  }> {
    const sessionKeys = await secureStorage.loadApiKeys();
    const missingKeys = secureStorage.getMissingApiKeys(functionName, sessionKeys);
    return {
      isValid: missingKeys.length === 0,
      missingKeys,
    };
  }

  // Get current session API keys (for display purposes, not including sensitive data)
  async getSessionKeyStatus(): Promise<Record<string, boolean>> {
    const sessionKeys = await secureStorage.loadApiKeys();
    return {
      geminiApiKey: !!sessionKeys.geminiApiKey,
      openWeatherApiKey: !!sessionKeys.openWeatherApiKey,
      neo4jUrl: !!sessionKeys.neo4jUrl,
      neo4jUsername: !!sessionKeys.neo4jUsername,
      neo4jPassword: !!sessionKeys.neo4jPassword,
      neo4jDatabase: !!sessionKeys.neo4jDatabase,
    };
  }

  // Procurement endpoints (not implemented in gRPC yet)
  async evaluateVendorProposals(rfpRequest: any): Promise<ApiResponse<any>> {
    return {
      success: false,
      error: 'Procurement endpoints not implemented in gRPC client yet',
    };
  }

  async generateNegotiationStrategies(vendorProfile: any): Promise<ApiResponse<any>> {
    return {
      success: false,
      error: 'Procurement endpoints not implemented in gRPC client yet',
    };
  }

  async analyzeContractTerms(contractTerms: any): Promise<ApiResponse<any>> {
    return {
      success: false,
      error: 'Procurement endpoints not implemented in gRPC client yet',
    };
  }
}

// Create singleton instance
export const goGentGRPCAPI = new GoGentGRPCAPI();

// Export class for custom instances if needed
export default GoGentGRPCAPI; 