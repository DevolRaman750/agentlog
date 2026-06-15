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
import { useTheme, useThemedStyles, spacing, radius, typography } from '../theme';
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
      borderRadius: radius.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden' as const,
    },
    bestConfigContainer: {
      borderColor: colors.statusWarning,
      borderWidth: 2,
    },
    bestConfigBadge: {
      backgroundColor: `${colors.statusWarning}15`,
      borderBottomWidth: 1,
      borderBottomColor: colors.statusWarning,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    bestConfigText: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.statusWarning,
    },
    header: {
      flexDirection: 'row' as const,
      padding: spacing.md,
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
      borderRadius: radius.pill,
      backgroundColor: colors.accent,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: spacing.md,
    },
    indexText: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    titleContainer: {
      flex: 1,
    },
    variationName: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    modelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    modelText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginRight: spacing.sm,
    },
    temperatureDot: {
      width: 6,
      height: 6,
      borderRadius: radius.pill,
      marginRight: spacing.xs,
    },
    temperatureText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    headerRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    statusContainer: {
      width: 24,
      height: 24,
      borderRadius: radius.pill,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    metricsContainer: {
      alignItems: 'flex-end' as const,
    },
    responseTime: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    tokens: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      textAlign: 'right' as const,
    },
    chevronContainer: {
      padding: spacing.xs,
      borderRadius: radius.sm,
    },
    chevronContainerExpanded: {
      backgroundColor: colors.accentSoft,
    },
    expandedContent: {
      padding: spacing.md,
      paddingTop: 0,
      backgroundColor: colors.bgSurface,
    },
    responseContainer: {
      marginBottom: spacing.lg,
    },
    responseLabelContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
      gap: spacing.sm,
    },
    responseLabel: {
      ...typography.bodyStrong,
      color: colors.accent,
      flex: 1,
    },
    responseTextContainer: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderLeftWidth: 4,
      borderLeftColor: colors.accent,
    },
    responseText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    errorContainer: {
      padding: spacing.md,
      paddingTop: 0,
    },
    errorLabel: {
      ...typography.bodyStrong,
      color: colors.statusError,
      marginBottom: spacing.sm,
    },
    errorText: {
      ...typography.body,
      color: colors.statusError,
      backgroundColor: colors.bgCard,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.statusError,
    },
    promptContainer: {
      padding: spacing.md,
      paddingTop: 0,
    },
    promptLabel: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    promptText: {
      ...typography.caption,
      color: colors.textPrimary,
      backgroundColor: colors.bgCard,
      borderRadius: radius.sm,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    detailsContainer: {
      padding: spacing.md,
      paddingTop: 0,
    },
    detailsTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    detailsGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
    },
    detailItem: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.sm,
      padding: spacing.sm,
      minWidth: (width - 48) / 2 - 8,
      flex: 1,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    detailLabel: {
      fontSize: 10,
      lineHeight: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    detailValue: {
      ...typography.caption,
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
      marginTop: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.accentSoft,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    functionCallsTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    functionCall: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.sm,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    functionName: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    functionStatus: {
      fontSize: 10,
      lineHeight: 14,
      color: colors.textSecondary,
    },
    functionTime: {
      fontSize: 10,
      lineHeight: 14,
      color: colors.textSecondary,
    },
    safetyContainer: {
      padding: spacing.md,
      paddingTop: 0,
    },
    safetyTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    safetyGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    safetyItem: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.sm,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
      minWidth: (width - 48) / 2 - 8,
      flex: 1,
    },
    safetyKey: {
      fontSize: 10,
      lineHeight: 14,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    safetyValue: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    timestampContainer: {
      padding: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    timestampText: {
      fontSize: 10,
      lineHeight: 14,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },
    configIdContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: spacing.xs,
      gap: spacing.xs,
    },
    configIdText: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    bestBadgeInline: {
      marginLeft: spacing.xs,
    },
    bestConfigDetailItem: {
      borderColor: colors.statusWarning,
      borderWidth: 1,
      backgroundColor: `${colors.statusWarning}15`,
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
      backgroundColor: colors.statusWarning,
      borderRadius: radius.sm,
      paddingHorizontal: 3,
      paddingVertical: 1,
      gap: 2,
    },
    bestIndicatorText: {
      fontSize: 7,
      lineHeight: 10,
      fontWeight: '700' as const,
      color: colors.textInverse,
    },
    bestConfigValue: {
      color: colors.statusWarning,
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
        return colors.statusWarning;
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
    if (temperature <= 0.7) return colors.statusWarning;
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
          <Ionicons name="trophy" size={16} color={colors.statusWarning} />
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
                  <Ionicons name="trophy" size={10} color={colors.statusWarning} />
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
                      <Ionicons name="trophy" size={10} color={colors.statusWarning} />
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
