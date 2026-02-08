// GoGent Mobile App Types
// These types mirror the backend Go types for consistency

// Navigation types
export type TabParamList = {
  Execute: undefined;
  Configure: undefined;
  Functions: undefined;
  'Execution Templates': { templateId?: string; editMode?: boolean; createFromExecution?: any };
  'API Keys': undefined;
  History: { executionId?: string; openExecutionDetails?: boolean };
  Database: undefined;
  Documentation: {
    screen?: 'DocumentationHome' | 'DocumentationOverview' | 'DocumentationGettingStarted' | 'DocumentationAgents' | 'DocumentationTeams' | 'DocumentationTemplates' | 'DocumentationExecutions' | 'DocumentationFunctions' | 'DocumentationApiKeys';
    params?: { section?: string };
  };
  Account: undefined;
  Agents: { prefilledAgent?: any } | undefined;
  Marketplace: undefined;
  More: undefined;
  TemplateTokenManager: { templateId: string; templateName: string };
  TeamDetail: { teamId: string; teamName?: string };
};

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
  sequenceNumber?: number;
  durationMs?: number;
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
  functionTools?: Tool[]; // Function tools used in this execution
  status?: string;
  total_time?: number;
  created_at?: string;
  createdAt: Date;
  updatedAt: Date;
  // Agent information
  agentId?: string; // Agent ID if this execution was run by an agent
  // Token usage fields
  totalTokens?: number;
  promptTokens?: number;
  completionTokens?: number;
  estimatedCost?: number;
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

export type RootStackParamList = {
  'API Keys': { groupName?: string };
  // Add other screens here
};

// UI Component types
export interface ConfigurationCardProps {
  configuration: APIConfiguration;
  onView: (config: APIConfiguration) => void;
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
  statusCode?: number; // HTTP status code for error responses
  isAuthError?: boolean; // Flag to indicate if this is an auth-related error (401, 403)
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
  {
    value: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    description: 'Best price-performance ratio with excellent speed and quality',
    maxTokens: 1048576
  },
  {
    value: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    description: 'Advanced reasoning with thinking capabilities for complex tasks',
    maxTokens: 2097152
  },
  {
    value: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash Lite',
    description: 'Fastest model optimized for cost-efficiency',
    maxTokens: 1048576
  },
  {
    value: 'gemini-3-pro-preview',
    label: 'Gemini 3 Pro (Preview)',
    description: 'Latest and most powerful model for multimodal understanding',
    maxTokens: 2097152
  },
  {
    value: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash (Preview)',
    description: 'Balanced model built for speed, scale, and frontier intelligence',
    maxTokens: 1048576
  }
] as const;

export type GeminiModel = typeof GEMINI_MODELS[number]['value'];

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
  functionType: 'api' | 'mcp'; // Function type: API (REST/HTTP) or MCP (Model Context Protocol)
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

// Agent Types
export type LifecycleStatus = 'STANDBY' | 'ACTIVE' | 'PAUSED' | 'KILLED';

export interface Agent {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  templateId: string;
  templateName?: string;
  templateDescription?: string;
  teamId?: string; // Optional foreign key to teams table
  teamName?: string; // For display purposes
  maxTokensPerDay: number;
  heartbeatMinutes: number;
  lifecycleStatus: LifecycleStatus;
  status: LifecycleStatus; // Alias for lifecycleStatus for backward compatibility
  tokensUsedToday: number;
  tokensResetDate: string;
  lastExecutionAt?: string;
  nextScheduledAt?: string;
  totalExecutions: number;
  createdAt: string;
  updatedAt: string;
  // Memory fields
  memory?: AgentMemory;
  memorySizeBytes: number;
  memoryUpdatedAt?: string;
}

export interface AgentFormData {
  firstName: string;
  lastName: string;
  templateId: string;
  teamId?: string; // Optional team assignment
  maxTokensPerDay: number;
  heartbeatMinutes: number;
  lifecycleStatus: LifecycleStatus;
}

export interface AgentFormErrors {
  firstName?: string;
  lastName?: string;
  templateId?: string;
  teamId?: string;
  maxTokensPerDay?: string;
  heartbeatMinutes?: string;
  lifecycleStatus?: string;
}

export interface AgentExecutionSummary {
  agentId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  totalTokensUsed: number;
  lastExecutionAt?: string;
  avgExecutionTime?: number;
}

// Team Types
export interface Team {
  id: string;
  userId: string;
  name: string;
  description?: string;
  maxTokensPerDay: number;
  tokensUsedToday: number;
  tokensResetDate: string;
  agentCount: number;
  activeAgentCount: number;
  totalExecutions: number;
  createdAt: string;
  updatedAt: string;
  // Memory fields
  memory?: TeamMemory;
  memorySizeBytes: number;
  memoryUpdatedAt?: string;
}

export interface TeamFormData {
  name: string;
  description?: string;
  maxTokensPerDay: number;
}

export interface TeamFormErrors {
  name?: string;
  description?: string;
  maxTokensPerDay?: string;
}

export interface TeamWithAgents {
  team: Team;
  agents: Agent[];
}

export interface TeamStats {
  teamId: string;
  totalAgents: number;
  activeAgents: number;
  pausedAgents: number;
  totalTokensUsed: number;
  totalExecutions: number;
  lastExecutionAt?: string;
}

export interface ExecutionFlowEvent {
  id: string;
  execution_run_id: string;
  event_type: string;
  event_data: any;
  sequence_number: number;
  timestamp: string;
  related_event_id?: string;
  duration_ms?: number;
  createdAt: string;
}

export interface ExecutionTemplate {
  id: string;
  name: string;
  description?: string;
  userId?: string;
  isActive?: boolean;
  isPublic?: boolean; // Whether the template is publicly available
  parameters?: any[];
  authTokens?: any[];
  tags?: string[];
  enableFunctionCalling?: boolean;
  functionIDs?: string[];
  createdAt?: string;
  updatedAt?: string;
}

// =============================================================================
// API KEY MANAGEMENT TYPES
// =============================================================================

// UserApiKey represents a user's API key with full metadata
export interface UserApiKey {
  id: string;
  userId: string;
  keyName: string;
  serviceName: string;
  keyType: 'api_key' | 'access_token' | 'bearer_token' | 'oauth_token' | 'webhook_url' | 'connection_string' | 'github_app_credentials';
  
  // Metadata and configuration
  displayName: string;
  description?: string;
  
  // Access control
  accessLevel: 'read' | 'write' | 'admin' | 'read_write';
  scopes?: string[];
  permissions?: Record<string, any>;
  
  // Lifecycle management
  expiresAt?: string;
  lastValidatedAt?: string;
  validationStatus: 'valid' | 'invalid' | 'expired' | 'untested' | 'rate_limited';
  validationError?: string;
  
  // Usage tracking
  isActive: boolean;
  isDefault: boolean;
  totalUses: number;
  lastUsedAt?: string;
  
  // Service configuration
  serviceConfig?: Record<string, any>;
  environment: 'production' | 'staging' | 'development' | 'test';
  
  // Rate limiting
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  rateLimitBurst?: number;
  
  // Multi-auth support
  authMode?: string;
  authConfig?: Record<string, any>;
  
  // Audit trail
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

// CreateApiKeyRequest represents a request to create a new API key
export interface CreateApiKeyRequest {
  keyName: string;
  serviceName: string;
  keyType: 'api_key' | 'access_token' | 'bearer_token' | 'oauth_token' | 'webhook_url' | 'connection_string' | 'github_app_credentials';
  keyValue: string; // Plain text - will be encrypted on backend
  displayName: string;
  description?: string;
  accessLevel: 'read' | 'write' | 'admin' | 'read_write';
  scopes?: string[];
  permissions?: Record<string, any>;
  expiresAt?: string;
  isDefault: boolean;
  serviceConfig?: Record<string, any>;
  environment: 'production' | 'staging' | 'development' | 'test';
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  rateLimitBurst?: number;
  
  // Multi-auth support
  authMode?: string;
  authConfig?: Record<string, any>;
}

// UpdateApiKeyRequest represents a request to update an existing API key
export interface UpdateApiKeyRequest {
  keyName?: string;
  keyValue?: string; // If provided, will re-encrypt
  displayName?: string;
  description?: string;
  accessLevel?: 'read' | 'write' | 'admin' | 'read_write';
  scopes?: string[];
  permissions?: Record<string, any>;
  expiresAt?: string;
  isActive?: boolean;
  isDefault?: boolean;
  serviceConfig?: Record<string, any>;
  environment?: 'production' | 'staging' | 'development' | 'test';
  rateLimitPerHour?: number;
  rateLimitPerDay?: number;
  rateLimitBurst?: number;
  
  // Multi-auth support
  authMode?: string;
  authConfig?: Record<string, any>;
}

// ApiKeyValidationResult represents the result of validating an API key
export interface ApiKeyValidationResult {
  isValid: boolean;
  errorMessage?: string;
  httpStatusCode?: number;
  responseTimeMs: number;
  serviceResponse?: Record<string, any>;
  testedAt: string;
}

// FunctionGroupApiKeyStatus represents the status of API keys for a function group
export interface FunctionGroupApiKeyStatus {
  functionGroup: string;
  groupDisplayName: string;
  requiredServices: string[];
  configuredServices: string[];
  missingServices: string[];
  allKeysConfigured: boolean;
  functionCount: number;
  serviceDetails: Record<string, ServiceApiKeyStatus>;
}

// ServiceApiKeyStatus represents the status of API keys for a specific service
export interface ServiceApiKeyStatus {
  serviceName: string;
  hasValidKey: boolean;
  keyCount: number;
  defaultKeyId?: string;
  lastValidated?: string;
  validationStatus: 'valid' | 'invalid' | 'expired' | 'untested' | 'rate_limited';
  accessLevel?: 'read' | 'write' | 'admin' | 'read_write';
  environment?: 'production' | 'staging' | 'development' | 'test';
}

// FunctionApiKeyRequirements represents API key requirements for a specific function
export interface FunctionApiKeyRequirements {
  functionId: string;
  functionName: string;
  displayName: string;
  functionGroup: string;
  requiredServices: string[];
  configuredServices: string[];
  missingServices: string[];
  allKeysConfigured: boolean;
  serviceRequirements: Record<string, ServiceRequirement>;
}

// ServiceRequirement represents the requirements for a specific service
export interface ServiceRequirement {
  serviceName: string;
  required: boolean;
  minimumAccessLevel: 'read' | 'write' | 'admin' | 'read_write';
  requiredScopes?: string[];
  isConfigured: boolean;
  configuredKeyId?: string;
  configuredAccessLevel?: 'read' | 'write' | 'admin' | 'read_write';
}

// ApiKeyStatistics represents usage statistics for API keys
export interface ApiKeyStatistics {
  userId: string;
  totalKeys: number;
  activeKeys: number;
  validKeys: number;
  expiredKeys: number;
  untestedKeys: number;
  
  // Usage in last period
  last24HourUsage: number;
  last7DayUsage: number;
  last30DayUsage: number;
  
  // Success rates
  successRate24Hours: number;
  successRate7Days: number;
  
  // Per service breakdown
  serviceBreakdown: Record<string, ServiceStatistics>;
}

// ServiceStatistics represents statistics for a specific service
export interface ServiceStatistics {
  serviceName: string;
  keyCount: number;
  totalUsage: number;
  successfulUsage: number;
  failedUsage: number;
  successRate: number;
  averageResponseTime: number;
  lastUsed?: string;
}

// Agent Memory Types
export interface AgentMemory {
  version: string;
  contexts: AgentMemoryContexts;
  relationships?: MemoryRelationship[];
  metadata: MemoryMetadata;
}

export interface AgentMemoryContexts {
  workflow?: Record<string, any>;    // Current workflow/task state
  session?: Record<string, any>;     // Temporary session data
  persistent?: Record<string, any>;  // Long-term learned patterns
}

export interface MemoryRelationship {
  from: string;        // Source path (e.g., "workflow.current_step")
  to: string;          // Target path
  type: string;        // Relationship type (e.g., "caused_by", "influenced")
  strength?: number;   // Relationship strength (0.0-1.0)
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface MemoryMetadata {
  createdAt: string;
  updatedAt: string;
  sizeBytes: number;
  accessCount: number;
  version: string;
}

export interface AgentMemoryRequest {
  agentId: string;
  context?: string;        // workflow, session, persistent, all
  path?: string;           // JSON path for specific access
  data?: Record<string, any>;  // Data to write
  searchQuery?: string;    // Search query
  mergeStrategy?: string;  // merge, replace, append
  limit?: number;          // Result limit
}

export interface AgentMemoryResponse {
  success: boolean;
  data?: Record<string, any>;
  results?: MemorySearchResult[];
  metadata: MemoryMetadata;
  error?: string;
}

export interface MemorySearchResult {
  path: string;
  context: string;
  data: Record<string, any>;
  relevance?: number;
  updatedAt: string;
}

// Memory Viewer Types
export interface MemoryNode {
  id: string;
  label: string;
  type: 'context' | 'data' | 'relationship';
  context?: string;
  data?: any;
  children?: MemoryNode[];
  expanded?: boolean;
  relevance?: number;
}

export interface MemoryGraph {
  nodes: MemoryNode[];
  relationships: MemoryRelationship[];
  selectedNode?: string;
  searchTerm?: string;
  filterContext?: string;
} 

export interface TeamMemory {
  version: string;
  contexts: TeamMemoryContexts;
  relationships?: MemoryRelationship[];
  metadata: MemoryMetadata;
}

export interface TeamMemoryContexts {
  workflow?: Record<string, any>;    // Current workflow/task state
  session?: Record<string, any>;     // Temporary session data
  persistent?: Record<string, any>;  // Long-term learned patterns
}

export interface TeamMemoryRequest {
  teamId: string;
  agentId: string; // Agent making the request (for validation)
  context?: string;        // workflow, session, persistent, all
  path?: string;           // JSON path for specific access
  data?: Record<string, any>;  // Data to write
  searchQuery?: string;    // Search query
  mergeStrategy?: string;  // merge, replace, append
  limit?: number;          // Result limit
}

export interface TeamMemoryResponse {
  success: boolean;
  data?: Record<string, any>;
  results?: MemorySearchResult[];
  metadata: MemoryMetadata;
  error?: string;
} 