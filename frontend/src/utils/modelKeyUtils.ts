import { APIConfiguration, UserApiKey } from '../types';

export interface ModelKeyRequirement {
  keyName: 'gemini' | 'openrouter' | 'openai';
  displayName: string;
  isConfigured: boolean;
  description: string;
}

/**
 * Determines which model API key is required based on the model name
 */
export function getRequiredModelKey(modelName: string): ModelKeyRequirement['keyName'] | null {
  if (!modelName) return null;
  
  // Gemini models
  if (modelName.startsWith('gemini-')) {
    return 'gemini';
  }
  
  // Kimi models (via OpenRouter)
  if (modelName.includes('kimi') || modelName.includes('moonshotai')) {
    return 'openrouter';
  }
  
  // OpenAI models
  if (modelName.startsWith('gpt-') || modelName.includes('dall-e')) {
    return 'openai';
  }
  
  return null;
}

/**
 * Check which model API keys are missing for a given configuration
 */
export function getModelKeyRequirements(
  configuration: APIConfiguration,
  userApiKeys: UserApiKey[]
): ModelKeyRequirement[] {
  const requiredKeyName = getRequiredModelKey(configuration.modelName);
  
  if (!requiredKeyName) {
    return []; // No model key required
  }
  
  const keyDisplayNames = {
    gemini: 'Google Gemini',
    openrouter: 'OpenRouter',
    openai: 'OpenAI'
  };
  
  const keyDescriptions = {
    gemini: 'Required for Gemini models (1.5 Flash, 1.5 Pro, etc.)',
    openrouter: 'Required for Kimi K2 and other OpenRouter models',
    openai: 'Required for GPT and DALL-E models'
  };
  
  const isConfigured = userApiKeys.some(key => 
    key.serviceName === requiredKeyName && 
    key.isActive && 
    key.validationStatus !== 'invalid'
  );
  
  console.log('🔑 Model key validation:', {
    modelName: configuration.modelName,
    requiredKeyName,
    userApiKeys: userApiKeys.map(k => ({
      serviceName: k.serviceName,
      isActive: k.isActive,
      validationStatus: k.validationStatus,
      displayName: k.displayName
    })),
    isConfigured,
    matchingKey: userApiKeys.find(k => k.serviceName === requiredKeyName)
  });
  
  return [{
    keyName: requiredKeyName,
    displayName: keyDisplayNames[requiredKeyName],
    isConfigured,
    description: keyDescriptions[requiredKeyName]
  }];
}

/**
 * Check if all required model keys are configured for a configuration
 */
export function areModelKeysConfigured(
  configuration: APIConfiguration,
  userApiKeys: UserApiKey[]
): boolean {
  const requirements = getModelKeyRequirements(configuration, userApiKeys);
  return requirements.length === 0 || requirements.every(req => req.isConfigured);
}