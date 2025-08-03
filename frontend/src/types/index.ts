// GoGent Mobile App Types
// These types mirror the backend Go types for consistency

export interface GeminiClientConfig {
  apiKey: string;
  maxRetries?: number;
  timeoutSecs?: number;
  projectId?: string;
  region?: string;
}

export interface APIConfiguration {
  id?: string;
  userId?: string; // User who owns this configuration
  executionRunId?: string;
  variationName: string;
  modelName: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  safetySettings?: Record<string, any>;
  generationConfig?: Record<string, any>;
  tools?: Tool[];
  toolConfig?: Record<string, any>;
  createdAt?: Date;
  isSystemResource?: boolean; // Mark as system-provided resource
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}

export interface MultiExecutionRequest {
  executionRunName: string;
  description?: string;
  basePrompt: string;
  context?: string;
  enableFunctionCalling?: boolean;
  configurations: APIConfiguration[];
  functionTools?: Tool[];
  comparisonConfig?: ComparisonConfig;
}

export interface ComparisonConfig {
  enabled: boolean;
  metrics: string[];
  customRules?: string[];
}

export interface ExecutionResult {
  executionRun: ExecutionRun;
  results: VariationResult[];
  comparison?: ComparisonResult;
  totalTime: number; // milliseconds
  successCount: number;
  errorCount: number;
  logs?: ExecutionLog[];
}

// Log types for execution tracking
export type LogLevel = 'INFO' | 'DEBUG' | 'WARN' | 'ERROR' | 'SUCCESS';
export type LogCategory = 'SETUP' | 'EXECUTION' | 'FUNCTION_CALL' | 'API_CALL' | 'COMPLETION' | 'ERROR';

export interface ExecutionLog {
  id: string;
  executionRunId: string;
  configurationId?: string;
  requestId?: string;
  logLevel: LogLevel;
  logCategory: LogCategory;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

export interface VariationResult {
  configuration: APIConfiguration;
  request: APIRequest;
  response: APIResponse;
  functionCalls?: FunctionCall[];
  executionTime: number; // milliseconds
}

export interface ExecutionRun {
  id: string;
  name: string;
  description?: string;
  basePrompt?: string; // Add missing property for backward compatibility
  contextPrompt?: string; // Add missing property for backward compatibility  
  enableFunctionCalling?: boolean; // Add missing property for backward compatibility
  createdAt: Date;
  updatedAt: Date;
}

export interface APIRequest {
  id: string;
  executionRunId: string;
  configurationId: string;
  requestType: 'generate' | 'chat' | 'function_call';
  prompt: string;
  context?: string;
  functionName?: string;
  functionParameters?: Record<string, any>;
  requestHeaders?: Record<string, any>;
  requestBody?: Record<string, any>;
  createdAt: Date;
}

export interface APIResponse {
  id: string;
  requestId: string;
  responseStatus: 'success' | 'error' | 'timeout';
  responseText?: string;
  functionCallResponse?: Record<string, any>;
  usageMetadata?: UsageMetadata;
  safetyRatings?: Record<string, any>;
  finishReason?: string;
  errorMessage?: string;
  responseTimeMs: number;
  responseHeaders?: Record<string, any>;
  responseBody?: Record<string, any>;
  createdAt: Date;
}

export interface UsageMetadata {
  // Backend sends snake_case, but we also support camelCase for compatibility
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  // Actual backend field names (snake_case)
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  // Legacy field from older API versions
  candidatesTokenCount?: number;
}

export interface FunctionCall {
  id: string;
  requestId: string;
  functionName: string;
  functionArgs: Record<string, any>;
  functionResponse?: Record<string, any>;
  executionStatus: 'pending' | 'success' | 'error';
  executionTimeMs?: number;
  errorDetails?: string;
  createdAt: Date;
}

export interface ComparisonResult {
  id: string;
  executionRunId: string;
  comparisonType: string;
  metricName: string;
  configurationScores: Record<string, any>;
  bestConfigurationId?: string;
  analysisNotes?: string;
  createdAt: Date;
}

// App-specific types
export interface AppConfig {
  backendUrl: string;
  geminiApiKey?: string;
  openWeatherApiKey?: string;
  // Neo4j configuration
  neo4jUrl?: string;
  neo4jUsername?: string;
  neo4jPassword?: string;
  neo4jDatabase?: string;
  useMockResponses: boolean;
}

export interface ScreenProps {
  navigation: any;
  route: any;
}

export interface TabParamList {
  Execute: undefined;
  Configure: undefined;
  Functions: undefined;
  'Execution Templates': undefined;
  'API Keys': undefined;
  History: undefined;
  Database: undefined;
  Account: undefined;
  More: undefined;
  TemplateTokenManager: {
    templateId: string;
    templateName: string;
  };
}

// UI Component types
export interface ConfigurationCardProps {
  configuration: APIConfiguration;
  onEdit: (config: APIConfiguration) => void;
  onDelete: (configId: string) => void;
  onDuplicate: (config: APIConfiguration) => void;
}

export interface ResultCardProps {
  result: VariationResult;
  index: number;
  totalResults: number;
}

export interface ExecutionRunCardProps {
  executionRun: ExecutionRun;
  onPress: (run: ExecutionRun) => void;
  onDelete: (id: string) => void;
  onReExecute: (run: ExecutionRun) => void;
  onCreateTemplate: (run: ExecutionRun) => void;
}

// Database view types
export interface DatabaseStats {
  totalExecutionRuns: number;
  totalApiRequests: number;
  totalApiResponses: number;
  totalFunctionCalls: number;
  avgResponseTime: number;
  successRate: number;
}

export interface DatabaseRow extends Array<any> {
  // Row data is returned as an array of values in column order
}

export interface DatabaseTable {
  tableName: string;
  columns: string[];
  rows: DatabaseRow[];
  totalRows: number;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Form types
export interface ConfigurationForm {
  variationName: string;
  modelName: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  topK: number;
}

export interface ExecutionForm {
  executionRunName: string;
  description: string;
  basePrompt: string;
  context: string;
  selectedConfigurations: string[];
  comparisonEnabled: boolean;
  comparisonMetrics: string[];
}

// Constants
export const GEMINI_MODELS = [
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-pro',
  'gemini-pro-vision'
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number];

export const COMPARISON_METRICS = [
  'response_time',
  'token_efficiency',
  'creativity_score',
  'coherence_score',
  'factual_accuracy',
  'safety_score',
  'cost_effectiveness'
] as const;

export type ComparisonMetric = typeof COMPARISON_METRICS[number];

export const REQUEST_TYPES = [
  'generate',
  'chat',
  'function_call'
] as const;

export type RequestType = typeof REQUEST_TYPES[number];

export const RESPONSE_STATUSES = [
  'success',
  'error',
  'timeout'
] as const;

export type ResponseStatus = typeof RESPONSE_STATUSES[number];

export interface FunctionDefinition {
  id: string;
  userId?: string; // User who owns this function
  name: string;
  displayName: string;
  description: string;
  functionGroup: string; // Group functions by category (e.g., "graph", "weather", "github")
  parametersSchema: Record<string, any>;
  mockResponse?: Record<string, any>;
  endpointUrl?: string;
  httpMethod: string;
  headers?: Record<string, any>;
  authConfig?: Record<string, any>;
  isActive: boolean;
  requiredApiKeys?: string[]; // API keys required for this function
  apiKeyValidation?: Record<string, any>; // Validation rules for each API key
  // New dynamic query template fields
  queryTemplate?: string; // Cypher query template with {{parameter}} placeholders
  resultTransformer?: string; // How to transform the raw results (e.g., 'sales_summary', 'normalize_attributes')
  fallbackData?: Record<string, any>; // Fallback data when external services are unavailable
  createdAt: Date;
  updatedAt?: Date;
  isSystemResource?: boolean; // Mark as system-provided resource
}

// Resource ownership utilities
export interface ResourceOwnership {
  canEdit: boolean;
  canDelete: boolean;
  canDuplicate: boolean;
  ownershipType: 'user' | 'system' | 'unknown';
  ownerInfo?: {
    userId?: string;
    isCurrentUser?: boolean;
  };
}

// Helper function to determine resource ownership
export const getResourceOwnership = (
  resource: { userId?: string; isSystemResource?: boolean },
  currentUserId?: string
): ResourceOwnership => {
  // System resources are read-only
  if (resource.isSystemResource) {
    return {
      canEdit: false,
      canDelete: false,
      canDuplicate: true, // Users can duplicate system resources
      ownershipType: 'system',
    };
  }

  // User-owned resources
  if (resource.userId) {
    const isCurrentUser = currentUserId === resource.userId;
    return {
      canEdit: isCurrentUser,
      canDelete: isCurrentUser,
      canDuplicate: true,
      ownershipType: 'user',
      ownerInfo: {
        userId: resource.userId,
        isCurrentUser,
      },
    };
  }

  // Unknown ownership (legacy data)
  return {
    canEdit: true, // Allow editing for backward compatibility
    canDelete: true,
    canDuplicate: true,
    ownershipType: 'unknown',
  };
}; 