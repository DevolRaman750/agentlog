export interface ExecutionTemplate {
  id: string;
  userId?: string; // User who owns this template
  name: string;
  description?: string;
  prompt?: string;
  templatePrompt?: string; // API field name
  context?: string;
  contextTemplate?: string; // API field name
  enableFunctionCalling: boolean;
  isActive: boolean;
  tags: string[] | Record<string, any>; // Can be array or object depending on source
  createdAt: string;
  updatedAt?: string;
  parameters?: TemplateParameter[];
  authTokens?: AuthToken[];
  modelName?: string;
  functionIds?: string[];
  preferredConfigurationId?: string; // ID of the preferred API configuration
}

export interface TemplateParameter {
  id: string;
  name: string;
  parameterName?: string; // API field name
  description: string;
  parameterType: string;
  isRequired: boolean;
  defaultValue?: string;
  validationRules?: any;
}

export interface AuthToken {
  id: string;
  tokenName: string;
  description: string;
  tokenValue: string;
  isActive: boolean;
  allowedOrigins?: Record<string, boolean>;
  customRateLimitPerHour?: number;
  expiresAt?: string;
  createdAt: string;
  totalUses?: number; // Added for enhanced token details
}

export interface TemplateFormData {
  name: string;
  description: string;
  prompt: string;
  context: string;
  enableFunctionCalling: boolean;
  tags: string; // Backend expects string format
  modelName: string;
}

export interface CreateTemplateFromExecutionData {
  name: string;
  description: string;
  prompt: string;
  context: string;
  enableFunctionCalling: boolean;
  tags: string[];
  modelName: string;
  functionIds?: string[];
  functions?: any[];
} 