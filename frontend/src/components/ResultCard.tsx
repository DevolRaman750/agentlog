import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ResultCardProps } from '../types';
import { formatConfigId } from '../utils/comparisonUtils';
import { useTheme, useThemedStyles } from '../theme';
import { ThemeColors } from '../theme';

const { width } = Dimensions.get('window');

interface ExtendedResultCardProps extends ResultCardProps {
  initialExpanded?: boolean; // Allow controlling initial state
  isBestConfiguration?: boolean; // Highlight if this is the best config
}

const ResultCard: React.FC<ExtendedResultCardProps> = ({
  result,
  index,
  totalResults,
  initialExpanded = true, // Default to expanded for better UX
  isBestConfiguration = false, // Default to not highlighted
}) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const { colors } = useTheme();

  const styles = useThemedStyles((colors: ThemeColors) => ({
    container: {
      backgroundColor: colors.bgCard,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden' as const,
    },
    bestConfigContainer: {
      borderColor: '#FFD700',
      borderWidth: 2,
      shadowColor: '#FFD700',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    bestConfigBadge: {
      backgroundColor: '#FFF8DC',
      borderBottomWidth: 1,
      borderBottomColor: '#FFD700',
      paddingHorizontal: 12,
      paddingVertical: 8,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    bestConfigText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: '#B8860B',
    },
    header: {
      flexDirection: 'row' as const,
      padding: 12,
      alignItems: 'center' as const,
      backgroundColor: colors.bgCard,
    },
    headerExpanded: {
      backgroundColor: colors.bgSurface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    indexContainer: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: 12,
    },
    indexText: {
      color: colors.textInverse,
      fontSize: 12,
      fontWeight: '600' as const,
    },
    titleContainer: {
      flex: 1,
    },
    variationName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    modelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    modelText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginRight: 6,
    },
    temperatureDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginRight: 4,
    },
    temperatureText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    headerRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    statusContainer: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    metricsContainer: {
      alignItems: 'flex-end' as const,
    },
    responseTime: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    tokens: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'right' as const,
    },
    chevronContainer: {
      padding: 4,
      borderRadius: 4,
    },
    chevronContainerExpanded: {
      backgroundColor: '#E3F2FD',
    },
    expandedContent: {
      padding: 16,
      paddingTop: 0,
      backgroundColor: colors.bgSurface,
    },
    responseContainer: {
      marginBottom: 16,
    },
    responseLabelContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
      gap: 6,
    },
    responseLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.accent,
      flex: 1,
    },
    responseTextContainer: {
      backgroundColor: colors.bgSurface,
      borderRadius: 8,
      padding: 16,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    responseText: {
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    errorContainer: {
      padding: 12,
      paddingTop: 0,
    },
    errorLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.statusError,
      marginBottom: 8,
    },
    errorText: {
      fontSize: 14,
      color: colors.statusError,
      backgroundColor: colors.bgCard,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.statusError,
    },
    promptContainer: {
      padding: 12,
      paddingTop: 0,
    },
    promptLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    promptText: {
      fontSize: 12,
      color: colors.textPrimary,
      backgroundColor: colors.bgCard,
      borderRadius: 6,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    detailsContainer: {
      padding: 12,
      paddingTop: 0,
    },
    detailsTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    detailsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 12,
    },
    detailItem: {
      backgroundColor: colors.bgCard,
      borderRadius: 6,
      padding: 8,
      minWidth: (width - 48) / 2 - 8,
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    detailLabel: {
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    detailValue: {
      fontSize: 12,
      color: colors.textPrimary,
      fontWeight: '500' as const,
      textAlign: 'right' as const,
      flex: 1,
    },
    configIdValueContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      flex: 1,
      justifyContent: 'flex-end' as const,
      gap: 6,
    },
    functionCallsContainer: {
      marginTop: 16,
      padding: 12,
      backgroundColor: '#F0F8FF',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    functionCallsTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    functionCall: {
      backgroundColor: colors.bgCard,
      borderRadius: 6,
      padding: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    functionName: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    functionStatus: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    functionTime: {
      fontSize: 10,
      color: colors.textSecondary,
    },
    safetyContainer: {
      padding: 12,
      paddingTop: 0,
    },
    safetyTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    safetyGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 8,
    },
    safetyItem: {
      backgroundColor: colors.bgCard,
      borderRadius: 6,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minWidth: (width - 48) / 2 - 8,
      flex: 1,
    },
    safetyKey: {
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    safetyValue: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    timestampContainer: {
      padding: 12,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    timestampText: {
      fontSize: 10,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },
    configIdContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: 4,
      gap: 4,
    },
    configIdText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    bestBadgeInline: {
      marginLeft: 4,
    },
    bestConfigDetailItem: {
      borderColor: '#FFD700',
      borderWidth: 1,
      backgroundColor: '#FFF8DC',
    },
    configIdLabelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 2,
    },
    bestIndicatorSmall: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: '#FFD700',
      borderRadius: 6,
      paddingHorizontal: 3,
      paddingVertical: 1,
      gap: 2,
    },
    bestIndicatorText: {
      fontSize: 7,
      fontWeight: '700' as const,
      color: colors.textInverse,
    },
    bestConfigValue: {
      color: '#B8860B',
      fontWeight: '600' as const,
    },
  }));

  // Debug logging for configuration matching
  React.useEffect(() => {
    if (isBestConfiguration) {
      console.log(`🏆 Best Configuration Displayed: ${result.configuration.variationName} (ID: ${result.configuration.id})`);
    }
  }, [isBestConfiguration, result.configuration.variationName, result.configuration.id]);

  const getStatusColor = () => {
    switch (result.response.responseStatus) {
      case 'success':
        return colors.statusSuccess;
      case 'error':
        return colors.statusError;
      case 'timeout':
        return '#FF9500';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = () => {
    switch (result.response.responseStatus) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'timeout':
        return 'time';
      default:
        return 'help-circle';
    }
  };

  const formatTokenUsage = () => {
    if (!result.response.usageMetadata) return 'N/A';

    const { promptTokens, completionTokens, totalTokens } = result.response.usageMetadata;
    return `${totalTokens || 0} (${promptTokens || 0}+${completionTokens || 0})`;
  };

  const getTemperatureColor = (temperature?: number) => {
    if (!temperature) return colors.textSecondary;
    if (temperature <= 0.3) return colors.statusSuccess;
    if (temperature <= 0.7) return '#FF9500';
    return colors.statusError;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <View style={[
      styles.container,
      isBestConfiguration && styles.bestConfigContainer
    ]}>
      {/* Best Configuration Badge */}
      {isBestConfiguration && (
        <View style={styles.bestConfigBadge}>
          <Ionicons name="trophy" size={16} color="#FFD700" />
          <Text style={styles.bestConfigText}>Best Configuration</Text>
        </View>
      )}

      {/* Header */}
      <TouchableOpacity
        style={[
          styles.header,
          isExpanded && styles.headerExpanded
        ]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.indexContainer}>
            <Text style={styles.indexText}>{index + 1}</Text>
          </View>

          <View style={styles.titleContainer}>
            <Text style={styles.variationName}>
              {result.configuration.variationName}
            </Text>
            <View style={styles.modelRow}>
              <Text style={styles.modelText}>{result.configuration.modelName}</Text>
              <View style={[
                styles.temperatureDot,
                { backgroundColor: getTemperatureColor(result.configuration.temperature) }
              ]} />
              <Text style={styles.temperatureText}>
                {result.configuration.temperature?.toFixed(1) || '0.5'}
              </Text>
            </View>
            {/* Configuration ID (truncated for header) */}
            <View style={styles.configIdContainer}>
              <Ionicons name="finger-print" size={12} color={colors.textSecondary} />
              <Text style={styles.configIdText}>
                {formatConfigId(result.configuration.id) || 'No ID'}
              </Text>
              {isBestConfiguration && (
                <View style={styles.bestBadgeInline}>
                  <Ionicons name="trophy" size={10} color="#FFD700" />
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.statusContainer, { backgroundColor: getStatusColor() }]}>
            <Ionicons name={getStatusIcon()} size={16} color={colors.textInverse} />
          </View>

          <View style={styles.metricsContainer}>
            <Text style={styles.responseTime}>
              {result.response.responseTimeMs}ms
            </Text>
            <Text style={styles.tokens}>
              {formatTokenUsage()}
            </Text>
          </View>

          <View style={[
            styles.chevronContainer,
            isExpanded && styles.chevronContainerExpanded
          ]}>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={isExpanded ? colors.accent : colors.textSecondary}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {/* Response Text */}
          {result.response.responseText && (
            <View style={styles.responseContainer}>
              <View style={styles.responseLabelContainer}>
                <Ionicons name="chatbubble" size={16} color={colors.accent} />
                <Text style={styles.responseLabel}>AI Response:</Text>
                {result.response.responseStatus === 'success' && (
                  <Ionicons name="checkmark-circle" size={16} color={colors.statusSuccess} />
                )}
              </View>
              <View style={styles.responseTextContainer}>
                <Text style={styles.responseText}>
                  {result.response.responseText}
                </Text>
              </View>
            </View>
          )}

          {/* Error Message */}
          {result.response.errorMessage && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorLabel}>Error:</Text>
              <Text style={styles.errorText}>
                {result.response.errorMessage}
              </Text>
            </View>
          )}

          {/* System Prompt */}
          {result.configuration.systemPrompt && (
            <View style={styles.promptContainer}>
              <Text style={styles.promptLabel}>System Prompt:</Text>
              <Text style={styles.promptText}>
                {result.configuration.systemPrompt}
              </Text>
            </View>
          )}

          {/* Detailed Metrics */}
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsTitle}>Execution Details</Text>

            <View style={styles.detailsGrid}>
              {/* Configuration ID - First for easy reference */}
              <View style={[
                styles.detailItem,
                isBestConfiguration && styles.bestConfigDetailItem
              ]}>
                <View style={styles.configIdLabelRow}>
                  <Text style={styles.detailLabel}>Configuration ID</Text>
                  {isBestConfiguration && (
                    <View style={styles.bestIndicatorSmall}>
                      <Ionicons name="trophy" size={10} color="#FFD700" />
                      <Text style={styles.bestIndicatorText}>BEST</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.configIdValueContainer}
                  onPress={() => {
                    // Optional: Copy to clipboard functionality could be added here
                    console.log('Configuration ID:', result.configuration.id);
                  }}
                >
                  <Text style={[
                    styles.detailValue,
                    isBestConfiguration && styles.bestConfigValue
                  ]} numberOfLines={1}>
                    {result.configuration.id || 'No ID available'}
                  </Text>
                  <Ionicons name="copy-outline" size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, { color: getStatusColor() }]}>
                  {result.response.responseStatus}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Response Time</Text>
                <Text style={styles.detailValue}>
                  {result.response.responseTimeMs}ms
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Total Tokens</Text>
                <Text style={styles.detailValue}>
                  {result.response.usageMetadata?.totalTokens || 0}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Finish Reason</Text>
                <Text style={styles.detailValue}>
                  {result.response.finishReason || 'N/A'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Temperature</Text>
                <Text style={styles.detailValue}>
                  {result.configuration.temperature?.toFixed(2) || '0.50'}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Max Tokens</Text>
                <Text style={styles.detailValue}>
                  {result.configuration.maxTokens || 500}
                </Text>
              </View>
            </View>
          </View>

          {/* Function Calls */}
          {result.functionCalls && result.functionCalls.length > 0 && (
            <View style={styles.functionCallsContainer}>
              <Text style={styles.functionCallsTitle}>Function Calls</Text>
              {result.functionCalls.map((call, index) => (
                <View key={index} style={styles.functionCall}>
                  <Text style={styles.functionName}>{call.functionName}</Text>
                  <Text style={styles.functionStatus}>
                    Status: {call.executionStatus}
                  </Text>
                  {call.executionTimeMs && (
                    <Text style={styles.functionTime}>
                      Time: {call.executionTimeMs}ms
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Safety Ratings */}
          {result.response.safetyRatings && Object.keys(result.response.safetyRatings).length > 0 && (
            <View style={styles.safetyContainer}>
              <Text style={styles.safetyTitle}>Safety Ratings</Text>
              <View style={styles.safetyGrid}>
                {Object.entries(result.response.safetyRatings).map(([key, value]) => (
                  <View key={key} style={styles.safetyItem}>
                    <Text style={styles.safetyKey}>{key}</Text>
                    <Text style={styles.safetyValue}>{String(value)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Timestamps */}
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              Created: {new Date(result.response.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default ResultCard;
