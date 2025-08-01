// Utility functions for handling comparison results and best configuration logic

export interface ComparisonResult {
  bestConfigurationId?: string;
  analysisNotes?: string;
  configurationScores?: Record<string, any>;
}

export interface ConfigurationResult {
  configuration: {
    id: string;
    variationName: string;
    [key: string]: any;
  };
  response: any;
  [key: string]: any;
}

/**
 * Determines if a given configuration is the best based on comparison results
 */
export const isBestConfiguration = (
  configurationId: string,
  comparison?: ComparisonResult
): boolean => {
  if (!comparison || !comparison.bestConfigurationId || !configurationId) {
    return false;
  }
  
  const isMatch = comparison.bestConfigurationId === configurationId;
  
  if (isMatch) {
    console.log(`✅ Best configuration match: ${configurationId}`);
  }
  
  return isMatch;
};

/**
 * Gets the best configuration from a list of results based on comparison data
 */
export const getBestConfigurationFromResults = (
  results: ConfigurationResult[],
  comparison?: ComparisonResult
): ConfigurationResult | null => {
  if (!comparison || !comparison.bestConfigurationId || !results.length) {
    return null;
  }
  
  const bestConfig = results.find(
    result => result.configuration.id === comparison.bestConfigurationId
  );
  
  if (bestConfig) {
    console.log(`🏆 Found best configuration: ${bestConfig.configuration.variationName} (${bestConfig.configuration.id})`);
  } else {
    console.warn(`⚠️ Best configuration ID ${comparison.bestConfigurationId} not found in results`);
    console.log('Available configuration IDs:', results.map(r => r.configuration.id));
  }
  
  return bestConfig || null;
};

/**
 * Formats configuration ID for display (truncated with ellipsis)
 */
export const formatConfigId = (configId?: string, length: number = 8): string => {
  if (!configId) return 'N/A';
  if (configId.length <= length) return configId;
  return `${configId.substring(0, length)}...`;
};

/**
 * Debug function to log all configuration IDs and comparison data
 */
export const debugComparisonData = (
  results: ConfigurationResult[],
  comparison?: ComparisonResult
): void => {
  console.group('🔍 Comparison Debug Data');
  console.log('Results count:', results.length);
  console.log('Configuration IDs:', results.map(r => ({
    name: r.configuration.variationName,
    id: r.configuration.id
  })));
  console.log('Best configuration ID:', comparison?.bestConfigurationId);
  console.log('Comparison available:', !!comparison);
  
  if (comparison?.bestConfigurationId) {
    const match = results.find(r => r.configuration.id === comparison.bestConfigurationId);
    console.log('Best config match found:', !!match);
    if (match) {
      console.log('Best config name:', match.configuration.variationName);
    }
  }
  console.groupEnd();
}; 