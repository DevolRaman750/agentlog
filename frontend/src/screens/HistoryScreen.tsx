import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ExecutionRun, ExecutionResult } from '../types';
import { goGentAPI } from '../api/client';
import ExecutionRunCard from '../components/ExecutionRunCard';
import { generateRerunName } from '../utils/executionNaming';
import { AlertAPI } from '../components/CustomAlert';
import ExecutionLogsCard from '../components/ExecutionLogsCard';
import ExecutionFlowGraph from '../components/ExecutionFlowGraph';
import ExecutionResultsViewer from '../components/ExecutionResultsViewer';
import LoadingScreen from '../components/LoadingScreen';
import { debugComparisonData, formatConfigId } from '../utils/comparisonUtils';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

const HistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const { state, loadRecentExecutions, clearError, setReExecutionData } = useApp();
  const { user, isLoading: authLoading } = useAuth();
  const navigation = useNavigation<any>();
  const route = navigation.getState()?.routes?.[navigation.getState()?.index || 0];
  const [selectedRun, setSelectedRun] = useState<ExecutionResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);
  const [showExecutionFlowGraph, setShowExecutionFlowGraph] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingExecutionId, setPendingExecutionId] = useState<string | null>(null);

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    header: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    title: {
      ...typography.display,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    userContextContainer: {
      alignItems: 'flex-start' as const,
    },
    userContextBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgHover,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      gap: spacing.xs,
    },
    userContextText: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    anonymousBadge: {
      backgroundColor: `${colors.statusWarning}15`,
    },
    anonymousText: {
      color: colors.statusWarning,
    },
    sessionWarning: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginTop: spacing.xs,
      fontStyle: 'italic' as const,
    },
    statusContainer: {
      backgroundColor: colors.bgCard,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    statusRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: radius.sm,
      marginRight: spacing.sm,
    },
    statusText: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    refreshButton: {
      padding: spacing.xs,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xxl,
    },
    loadingText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginTop: spacing.lg,
    },
    listContainer: {
      paddingBottom: 120,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xxl,
    },
    emptyTitle: {
      ...typography.h1,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginTop: spacing.lg,
    },
    emptySubtitle: {
      ...typography.body,
      color: colors.textTertiary,
      textAlign: 'center' as const,
      marginTop: spacing.sm,
    },
    connectButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      marginTop: spacing.xl,
    },
    connectButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
    detailsOverlay: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.bgOverlay,
      justifyContent: 'flex-start' as const,
      alignItems: 'center' as const,
      paddingTop: 60,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    detailsContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      width: '100%' as const,
      flex: 1,
      maxHeight: '90%' as const,
    },
    detailsHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
    },
    detailsTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      flex: 1,
      marginRight: spacing.lg,
    },
    closeButton: {
      padding: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.bgApp,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    detailsContent: {
      flex: 1,
      padding: spacing.md,
    },
    detailsScrollContent: {
      paddingBottom: spacing.lg,
    },
    summaryRow: {
      flexDirection: 'row' as const,
      marginBottom: spacing.lg,
    },
    descriptionContainer: {
      marginBottom: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.bgApp,
      borderRadius: radius.md,
    },
    descriptionLabel: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    descriptionText: {
      ...typography.body,
      color: colors.textPrimary,
    },
    resultsPreview: {
      marginBottom: spacing.lg,
    },
    resultsPreviewTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    resultPreviewItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: spacing.sm,
      backgroundColor: colors.bgApp,
      borderRadius: radius.sm,
      marginBottom: spacing.xs,
    },
    resultPreviewLeft: {
      flex: 1,
    },
    resultConfigDetails: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
    },
    bestConfigPreviewItem: {
      borderColor: colors.statusWarning,
      borderWidth: 2,
      backgroundColor: `${colors.statusWarning}15`,
    },
    configHeaderRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 2,
    },
    bestConfigBadgeSmall: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.statusWarning,
      borderRadius: radius.md,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      gap: 2,
    },
    bestConfigBadgeText: {
      ...typography.micro,
      fontSize: 8,
      fontWeight: '700' as const,
      color: colors.textInverse,
    },
    configIdRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: 2,
      gap: spacing.xs,
    },
    configIdText: {
      ...typography.micro,
      fontSize: 9,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    bestConfigIndicator: {
      ...typography.micro,
      fontSize: 8,
      color: colors.statusWarning,
      fontWeight: '600' as const,
    },
    bestConfigSummary: {
      marginTop: spacing.xs,
    },
    analysisNotes: {
      ...typography.caption,
      color: colors.textPrimary,
      marginTop: spacing.xs,
      lineHeight: 16,
    },
    responseTextContainer: {
      marginTop: spacing.sm,
      padding: spacing.sm,
      backgroundColor: colors.bgCard,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    usageContainer: {
      marginTop: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.none,
    },
    usageText: {
      ...typography.micro,
      fontSize: 10,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    resultStatus: {
      width: 20,
      height: 20,
      borderRadius: radius.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    comparisonPreview: {
      padding: spacing.md,
      backgroundColor: colors.bgHover,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    comparisonTitle: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    comparisonText: {
      ...typography.body,
      color: colors.textPrimary,
    },
    detailsFooter: {
      padding: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.borderSubtle,
    },
    timestampText: {
      ...typography.caption,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    logsSection: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.xs,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    modalCloseButton: {
      paddingVertical: spacing.sm,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    modalCloseText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.accent,
    },
    modalTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      flex: 1,
      textAlign: 'center' as const,
    },
    modalActionButton: {
      paddingVertical: spacing.sm,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    modalActionText: {
      ...typography.title,
      color: colors.accent,
    },
    modalContent: {
      flex: 1,
    },
    summarySection: {
      backgroundColor: colors.bgCard,
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    summaryGrid: {
      flexDirection: 'row' as const,
      justifyContent: 'space-around' as const,
    },
    summaryItem: {
      alignItems: 'center' as const,
    },
    summaryLabel: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    summaryValue: {
      ...typography.h1,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    resultsSection: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    resultCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    bestResultCard: {
      borderColor: colors.statusWarning,
      borderWidth: 2,
      backgroundColor: `${colors.statusWarning}10`,
    },
    resultHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.sm,
    },
    resultConfigName: {
      ...typography.title,
      color: colors.textPrimary,
    },
    bestConfigName: {
      color: colors.statusWarning,
    },
    bestBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.statusWarning,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      gap: spacing.xs,
    },
    bestBadgeText: {
      ...typography.micro,
      fontSize: 10,
      fontWeight: '700' as const,
      color: colors.textInverse,
    },
    resultDetails: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    responseContainer: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.statusSuccess,
    },
    responseLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    responseText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textPrimary,
    },
    errorContainer: {
      backgroundColor: `${colors.statusError}15`,
      borderRadius: radius.md,
      padding: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: colors.statusError,
    },
    errorLabel: {
      ...typography.bodyStrong,
      color: colors.statusError,
      marginBottom: spacing.sm,
    },
    errorText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.statusError,
    },
    showLogsButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgCard,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.xxl,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      gap: spacing.md,
    },
    showLogsText: {
      ...typography.title,
      color: colors.accent,
      fontWeight: '500' as const,
    },
    logCountText: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.xxxl,
    },
    emptyStateTitle: {
      ...typography.h2,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
      textAlign: 'center' as const,
    },
    emptyStateText: {
      ...typography.body,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      lineHeight: 20,
    },
    promptPreview: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.bgApp,
      borderRadius: radius.md,
    },
    promptPreviewTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    promptPreviewContainer: {
      marginBottom: spacing.sm,
    },
    promptPreviewLabel: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    promptPreviewText: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: 20,
    },
    promptSection: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.bgApp,
      borderRadius: radius.md,
    },
    promptContainer: {
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.bgCard,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    promptLabel: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    promptText: {
      ...typography.body,
      color: colors.textPrimary,
      lineHeight: 20,
    },
    noPromptText: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginTop: spacing.sm,
    },
    configSection: {
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      padding: spacing.md,
      backgroundColor: colors.bgApp,
      borderRadius: radius.md,
    },
    configDetails: {
      marginTop: spacing.md,
    },
    configItem: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    configLabel: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.textSecondary,
    },
    configValue: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
    },
    executionListItem: {
      marginBottom: spacing.sm,
    },
    promptPreviewHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.xs,
      gap: spacing.xs,
    },
    promptPreviewInList: {
      backgroundColor: colors.bgSurface,
      marginHorizontal: spacing.lg,
      marginTop: -spacing.sm,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    promptPreviewLabelInList: {
      ...typography.micro,
      fontSize: 10,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      textTransform: 'uppercase' as const,
    },
    promptPreviewTextInList: {
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.textPrimary,
      lineHeight: 18,
      fontStyle: 'italic' as const,
    },
  }));

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading execution history..." />;
  }

  useEffect(() => {
    // Load history on mount - not dependent on connection state
    console.log('📜 HistoryScreen mounted - loading history');
    loadHistory();

    // Check for navigation parameters to auto-open specific execution
    if (route?.params?.executionId && route?.params?.openExecutionDetails) {
      console.log('📋 Navigation params detected - execution ID:', route.params.executionId);
      setPendingExecutionId(route.params.executionId);
      // Clear the params to prevent re-triggering
      navigation.setParams({ executionId: undefined, openExecutionDetails: undefined });
    }
  }, []);

  // Reload history when tab becomes focused - DECOUPLED from connection state
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 HistoryScreen focused - checking if refresh needed');

      // Only refresh if authenticated - connection status is irrelevant for cached data
      if (user && !isLoading) {
        console.log('✅ Refreshing history data for:', user.username);
        loadHistory();
      } else {
        console.log('⏳ Skipping refresh:', {
          hasUser: !!user,
          isLoading
        });
      }
    }, [user?.id]) // Removed state.isConnected dependency
  );

  useEffect(() => {
    if (state.error) {
      AlertAPI.alert('Error', state.error, [
        { text: 'OK', onPress: clearError }
      ]);
    }
  }, [state.error]);

  // Handle pending execution opening after history is loaded
  useEffect(() => {
    if (pendingExecutionId && state.recentExecutions && state.recentExecutions.length > 0 && !isLoading) {
      console.log('🎯 Opening execution from navigation:', pendingExecutionId);
      // Find the execution in the loaded history
      const targetExecution = state.recentExecutions.find(run => run.id === pendingExecutionId);
      if (targetExecution) {
        console.log('✅ Found target execution, opening details');
        handleRunPress(targetExecution);
      } else {
        console.warn('⚠️ Target execution not found in recent history:', pendingExecutionId);
        AlertAPI.alert('Execution Not Found', 'The requested execution could not be found in your recent history.');
      }
      setPendingExecutionId(null); // Clear pending execution
    }
  }, [pendingExecutionId, state.recentExecutions, isLoading]);

  const loadHistory = useCallback(async () => {
    // DECOUPLED: Always attempt to load history regardless of perceived connection status
    // The backend call will handle connectivity issues appropriately
    setIsLoading(true);
    try {
      console.log('📜 Attempting to load execution history...');
      await loadRecentExecutions();
      console.log('✅ History loaded successfully for user:', user?.username || 'anonymous session');
    } catch (error) {
      console.warn('🟡 Failed to load history (graceful handling):', error);
      // Don't show errors immediately - user might have cached data
      // Only show error if it's a persistent issue
      console.log('📋 Using cached history data if available');
    } finally {
      setIsLoading(false);
    }
  }, [loadRecentExecutions, user]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadHistory();
    setIsRefreshing(false);
  }, [loadHistory]);

  const handleRunPress = async (run: ExecutionRun) => {
    if (!state.isConnected) {
      AlertAPI.alert('Error', 'Not connected to backend');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching execution run:', run.id);
      const response = await goGentAPI.getExecutionRun(run.id);

      console.log('API response:', response);

      if (response.success && response.data) {
        console.log('Setting selected run:', response.data);
        // Validate the response structure
        if (!response.data.executionRun) {
          console.error('Invalid response structure - missing executionRun:', response.data);
          AlertAPI.alert('Error', 'Invalid response structure from server');
          return;
        }

        // Debug comparison data
        if (response.data.results && response.data.comparison) {
          // debugComparisonData(response.data.results, response.data.comparison);
          console.log('Comparison data:', response.data.comparison);
        }

        setSelectedRun(response.data);
        setShowDetails(true);
      } else {
        console.error('API error:', response.error);
        AlertAPI.alert('Error', response.error || 'Failed to load execution details');
      }
    } catch (error) {
      console.error('Exception in handleRunPress:', error);
      AlertAPI.alert('Error', 'Failed to load execution details: ' + String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    AlertAPI.alert(
      'Delete Execution',
      'Are you sure you want to delete this execution? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await goGentAPI.deleteExecutionRun(runId);
              if (response.success) {
                await loadHistory();
                AlertAPI.alert('Success', 'Execution deleted successfully');
              } else {
                AlertAPI.alert('Error', response.error || 'Failed to delete execution');
              }
            } catch (error) {
              AlertAPI.alert('Error', 'Failed to delete execution');
            }
          },
        },
      ]
    );
  };

  const handleReExecute = async (run: ExecutionRun) => {
    if (!run.id) {
      AlertAPI.alert('Error', 'Cannot re-execute a run without an ID');
      return;
    }

    try {
      setIsLoading(true);
      const response = await goGentAPI.getExecutionRun(run.id);

      if (response.success && response.data) {
        const { executionRun, results } = response.data;

        // Extract function tools from the execution run data more comprehensively
        const functionTools: any[] = [];
        if (results && results.length > 0) {
          // PRIORITY 1: Look for function tools in the configuration (stored from original execution)
          if (results[0].configuration && results[0].configuration.tools && results[0].configuration.tools.length > 0) {
            results[0].configuration.tools.forEach((tool: any) => {
              if (!functionTools.find(t => t.name === tool.name)) {
                functionTools.push({
                  name: tool.name,
                  description: tool.description || `${tool.name} function`,
                  parameters: tool.parameters || {}
                });
                console.log(`✅ Added function tool from configuration: ${tool.name}`);
              }
            });
          }

          // PRIORITY 2: Look for function calls in the responses as fallback
          results.forEach(result => {
            if (result.functionCalls && result.functionCalls.length > 0) {
              result.functionCalls.forEach(functionCall => {
                const funcName = functionCall.functionName;
                console.log('🔍 Found function call:', functionCall);
                if (funcName && !functionTools.find(t => t.name === funcName)) {
                  functionTools.push({
                    name: funcName,
                    description: `${funcName} function`,
                    parameters: {}
                  });
                  console.log(`✅ Added function tool from function call: ${funcName}`);
                }
              });
            }
          });
        }

        console.log('🧰 Final extracted function tools:', functionTools);

        // Extract the original base prompt and context from the execution run
        // The execution run should contain the original data, not the processed request data
        console.log('🔍 Raw execution data for re-execution:', {
          executionRun: executionRun,
          results: results,
          firstResult: results?.[0],
          firstRequest: results?.[0]?.request
        });

        const basePrompt = results?.[0]?.request?.prompt || executionRun.basePrompt || '';
        const context = results?.[0]?.request?.context || executionRun.contextPrompt || '';

        const reExecutionData = {
          executionRunName: generateRerunName(executionRun.name),
          description: executionRun.description || '',
          basePrompt: basePrompt,
          context: context,
          configurations: results.map(r => r.configuration),
          enableFunctionCalling: executionRun.enableFunctionCalling || functionTools.length > 0,
          functionTools: functionTools,
          // Pass agent information if this was an agent execution
          agentId: executionRun.agentId || undefined
        };

        console.log('🔄 Re-execution data prepared:', {
          executionRunName: reExecutionData.executionRunName,
          description: reExecutionData.description,
          basePrompt: basePrompt ? basePrompt.substring(0, 100) + '...' : 'EMPTY',
          context: context ? context.substring(0, 100) + '...' : 'EMPTY',
          configurationsCount: reExecutionData.configurations.length,
          functionsCount: functionTools.length,
          configurations: reExecutionData.configurations.map(c => ({ id: c.id, name: c.variationName }))
        });

        setReExecutionData(reExecutionData);
        // @ts-ignore
        navigation.navigate('Execute');
      } else {
        AlertAPI.alert('Error', 'Failed to load execution data for re-execution');
      }
    } catch (error) {
      console.error('Re-execute error:', error);
      AlertAPI.alert('Error', 'Failed to load execution data for re-execution');
    } finally {
      setIsLoading(false);
    }
  };

    const handleCreateTemplate = async (run: ExecutionRun) => {
    try {
      console.log('🔄 Starting template creation for run:', run.id, run.name);

      // Get detailed execution data to extract functions and model info
      const response = await goGentAPI.getExecutionRun(run.id);
      console.log('📋 API response:', response);

      // Get available functions to map function names to IDs
      const functionsResponse = await goGentAPI.getFunctions();
      const availableFunctions = functionsResponse.success && functionsResponse.data ? functionsResponse.data : [];
      console.log('📋 Available functions for mapping:', availableFunctions.map(f => ({ id: f.id, name: f.name })));

      // Get available configurations to set a default if none found
      const configurationsResponse = await goGentAPI.getConfigurations();
      const availableConfigurations = configurationsResponse.success && configurationsResponse.data ? configurationsResponse.data : [];
      console.log('📋 Available configurations:', availableConfigurations.map(c => ({ id: c.id, name: c.variationName })));

      let templateData = {
        name: `Template: ${run.name}`,
        description: `Generated from execution: ${run.description || run.name}`,
        prompt: run.basePrompt || '',
        context: run.contextPrompt || '',
        enableFunctionCalling: run.enableFunctionCalling || false,
        tags: ['generated', 'from-execution'],
        configurationId: '', // Will be set from execution configuration or default
        functionIDs: [] as string[], // Changed to functionIDs array for proper mapping
      };

      // Extract model and functions from execution results if available
      if (response.success && response.data) {
        const { executionRun, results } = response.data;
        console.log('✅ Execution data retrieved:', { executionRun: !!executionRun, resultsCount: results?.length });

        // Try to get configuration ID from first result configuration
        if (results && results.length > 0 && results[0].configuration?.id) {
          templateData.configurationId = results[0].configuration.id;
          console.log('🤖 Configuration found:', templateData.configurationId);
        }

        // Extract unique function names from all function calls
        const usedFunctionNames = new Set<string>();
        results?.forEach(result => {
          if (result.functionCalls && result.functionCalls.length > 0) {
            result.functionCalls.forEach(functionCall => {
              const funcName = functionCall.functionName;
              if (funcName) {
                usedFunctionNames.add(funcName);
                console.log('⚙️ Function found in execution:', funcName);
              }
            });
          }
        });

        // Map function names to actual function IDs from available functions
        const mappedFunctionIds: string[] = [];
        usedFunctionNames.forEach(functionName => {
          const matchingFunction = availableFunctions.find(f => f.name === functionName);
          if (matchingFunction) {
            mappedFunctionIds.push(matchingFunction.id);
            console.log(`✅ Mapped function "${functionName}" -> ID: ${matchingFunction.id}`);
          } else {
            console.warn(`⚠️ Could not find function definition for "${functionName}"`);
          }
        });

        templateData.functionIDs = mappedFunctionIds;
      } else {
        console.warn('⚠️ Failed to get execution data:', response.error);
      }

      // Set default configuration if none was found
      if (!templateData.configurationId && availableConfigurations.length > 0) {
        templateData.configurationId = availableConfigurations[0].id || '';
        console.log('🔧 Using default configuration:', templateData.configurationId);
      }

      console.log('📊 Template data prepared:', {
        functionIDsCount: templateData.functionIDs.length,
        functionIDs: templateData.functionIDs,
        configurationId: templateData.configurationId,
        hasPrompt: !!templateData.prompt,
        hasContext: !!templateData.context
      });

      console.log('🚨 About to show AlertAPI dialog...');

      // Navigate to Execution Templates screen with pre-filled data
      AlertAPI.alert(
        'Create Template from Execution',
        `Create a new execution template based on "${run.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Create Template',
            style: 'default',
            onPress: () => {
              console.log('🔄 Creating template from execution with data:', templateData);
              // Navigate to Execution Templates screen
              (navigation as any).navigate('Execution Templates', {
                createFromExecution: templateData
              });
            }
          }
        ]
      );

      console.log('✅ AlertAPI.alert called successfully');

    } catch (error) {
      console.error('❌ Error in handleCreateTemplate:', error);
      AlertAPI.alert(
        'Error',
        'Failed to create template from execution. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color={colors.textTertiary} />
      <Text style={styles.emptyTitle}>No Execution History</Text>
      <Text style={styles.emptySubtitle}>
        {!state.isConnected
          ? 'Connect to backend to view execution history'
          : 'Your multi-variation executions will appear here'
        }
      </Text>
      {!state.isConnected && (
        <TouchableOpacity
          style={styles.connectButton}
          onPress={() => {/* Navigate to Configure tab */}}
        >
          <Text style={styles.connectButtonText}>Configure Connection</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles.loadingText}>Loading execution history...</Text>
    </View>
  );

  const renderConnectionStatus = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusRow}>
        <View style={[
          styles.statusDot,
          { backgroundColor: state.isConnected ? styles.responseContainer.borderLeftColor : styles.errorContainer.borderLeftColor }
        ]} />
        <Text style={styles.statusText}>
          {state.isConnected ? 'Connected' : 'Disconnected'}
        </Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Ionicons
            name="refresh"
            size={16}
            color={styles.comparisonTitle.color}
            style={isRefreshing ? { opacity: 0.5 } : {}}
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>📜 Execution History</Text>
      {user ? (
        <View style={styles.userContextContainer}>
          <View style={styles.userContextBadge}>
            <Ionicons name="person" size={14} color={styles.userContextText.color} />
            <Text style={styles.userContextText}>
              {user.is_temporary ? 'Session User' : user.username}
            </Text>
          </View>
          {user.is_temporary && (
            <Text style={styles.sessionWarning}>
              Session data only • Login to save permanently
            </Text>
          )}
        </View>
      ) : (
        <View style={styles.userContextContainer}>
          <View style={[styles.userContextBadge, styles.anonymousBadge]}>
            <Ionicons name="eye-off" size={14} color={styles.anonymousText.color} />
            <Text style={[styles.userContextText, styles.anonymousText]}>
              Anonymous Session
            </Text>
          </View>
          <Text style={styles.sessionWarning}>
            Session data only • Login to save permanently
          </Text>
        </View>
      )}
    </View>
  );

  const renderExecutionDetails = () => {
    if (!selectedRun || !showDetails) return null;

    // Add safety check for executionRun
    if (!selectedRun.executionRun) {
      console.error('ExecutionRun is undefined:', selectedRun);
      return (
        <View style={styles.detailsOverlay}>
          <View style={styles.detailsContainer}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>Error: Missing execution data</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetails(false)}
              >
                <Ionicons name="close" size={24} color={styles.loadingText.color} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.detailsOverlay}>
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>{selectedRun.executionRun.name}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <Ionicons name="close" size={24} color={styles.loadingText.color} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.detailsContent}
            contentContainerStyle={styles.detailsScrollContent}
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Results</Text>
                <Text style={styles.summaryValue}>
                  {selectedRun.results.length}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Success Rate</Text>
                <Text style={styles.summaryValue}>
                  {selectedRun.results.length > 0
                    ? Math.round((selectedRun.successCount / selectedRun.results.length) * 100)
                    : 0}%
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total Time</Text>
                <Text style={styles.summaryValue}>
                  {selectedRun.totalTime}ms
                </Text>
              </View>
            </View>

            {selectedRun.executionRun.description && (
              <View style={styles.descriptionContainer}>
                <Text style={styles.descriptionLabel}>Description:</Text>
                <Text style={styles.descriptionText}>
                  {selectedRun.executionRun.description}
                </Text>
              </View>
            )}

            <View style={styles.resultsPreview}>
              <Text style={styles.resultsPreviewTitle}>Configuration Results:</Text>
              {selectedRun.results.map((result, index) => {
                // Check if this is the best configuration
                const isBestConfig = selectedRun.comparison?.bestConfigurationId === result.configuration.id;

                return (
                  <View key={index} style={[
                    styles.resultPreviewItem,
                    isBestConfig && styles.bestConfigPreviewItem
                  ]}>
                    <View style={styles.resultPreviewLeft}>
                      <View style={styles.configHeaderRow}>
                        <Text style={[
                          styles.resultConfigName,
                          isBestConfig && styles.bestConfigName
                        ]}>
                          {result.configuration.variationName}
                        </Text>
                        {isBestConfig && (
                          <View style={styles.bestConfigBadgeSmall}>
                            <Ionicons name="trophy" size={12} color={colors.textInverse} />
                            <Text style={styles.bestConfigBadgeText}>BEST</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.resultConfigDetails}>
                        {result.configuration.modelName} • {result.response.responseTimeMs}ms
                      </Text>

                                             {/* Show Configuration ID prominently */}
                       <View style={styles.configIdRow}>
                         <Ionicons name="finger-print" size={10} color={styles.configIdText.color} />
                         <Text style={styles.configIdText}>
                           ID: {formatConfigId(result.configuration.id)}
                         </Text>
                         {isBestConfig && (
                           <Text style={styles.bestConfigIndicator}>• SELECTED AS BEST</Text>
                         )}
                       </View>

                      {/* Add the actual AI response text */}
                      {result.response.responseText && (
                        <View style={styles.responseTextContainer}>
                          <Text style={styles.responseLabel}>Response:</Text>
                          <Text style={styles.responseText}>
                            {result.response.responseText}
                          </Text>
                        </View>
                      )}

                      {/* Show usage metadata if available */}
                      {result.response.usageMetadata && (
                        <View style={styles.usageContainer}>
                          <Text style={styles.usageText}>
                            Tokens: {result.response.usageMetadata.totalTokens || 'N/A'}
                            {result.response.usageMetadata.promptTokens && result.response.usageMetadata.completionTokens &&
                              ` (${result.response.usageMetadata.promptTokens} prompt + ${result.response.usageMetadata.completionTokens} completion)`
                            }
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={[
                      styles.resultStatus,
                      {
                        backgroundColor: result.response.responseStatus === 'success'
                          ? (isBestConfig ? colors.statusWarning : styles.responseContainer.borderLeftColor)
                          : styles.errorContainer.borderLeftColor
                      }
                    ]}>
                      <Ionicons
                        name={
                          isBestConfig ? 'trophy' :
                          (result.response.responseStatus === 'success' ? 'checkmark' : 'close')
                        }
                        size={12}
                        color={colors.textInverse}
                      />
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Original Prompt Preview */}
            {(() => {
              const basePrompt = selectedRun.results?.[0]?.request?.prompt || selectedRun.executionRun.basePrompt || '';
              const context = selectedRun.results?.[0]?.request?.context || selectedRun.executionRun.contextPrompt || '';

              if (basePrompt || context) {
                return (
                  <View style={styles.promptPreview}>
                    <Text style={styles.promptPreviewTitle}>📝 Original Prompt:</Text>
                    {basePrompt && (
                      <View style={styles.promptPreviewContainer}>
                        <Text style={styles.promptPreviewLabel}>Base Prompt:</Text>
                        <Text style={styles.promptPreviewText}>
                          {basePrompt.length > 200 ? `${basePrompt.substring(0, 200)}...` : basePrompt}
                        </Text>
                      </View>
                    )}
                    {context && (
                      <View style={styles.promptPreviewContainer}>
                        <Text style={styles.promptPreviewLabel}>Context:</Text>
                        <Text style={styles.promptPreviewText}>
                          {context.length > 150 ? `${context.substring(0, 150)}...` : context}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              }
              return null;
            })()}

            {selectedRun.comparison && (
              <View style={styles.comparisonPreview}>
                <Text style={styles.comparisonTitle}>🏆 Comparison Analysis</Text>
                                 {selectedRun.comparison.bestConfigurationId && (
                   <View style={styles.bestConfigSummary}>
                     <Text style={styles.comparisonText}>
                       Best Configuration ID: {formatConfigId(selectedRun.comparison.bestConfigurationId)}
                     </Text>
                    {selectedRun.comparison.analysisNotes && (
                      <Text style={styles.analysisNotes}>
                        {selectedRun.comparison.analysisNotes}
                      </Text>
                    )}
                  </View>
                )}
                {!selectedRun.comparison.bestConfigurationId && (
                  <Text style={styles.comparisonText}>No best configuration determined</Text>
                )}
              </View>
            )}

            {/* Execution Logs Section */}
            {selectedRun.logs && selectedRun.logs.length > 0 && (
              <View style={styles.logsSection}>
                <Text style={styles.sectionTitle}>Execution Logs</Text>
                <Text style={styles.logCountText}>
                  {selectedRun.logs.length} log entries available
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.detailsFooter}>
            <Text style={styles.timestampText}>
              Created: {new Date(selectedRun.executionRun.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const getPromptPreview = (executionRun: ExecutionRun): string | null => {
    // Now that the backend includes basePrompt, we can show the actual prompt
    const prompt = executionRun.basePrompt;

    if (!prompt || prompt.trim() === '') {
      return null; // Don't show anything if no real prompt data
    }

    // Return first 40 characters with ellipsis if longer
    if (prompt.length > 40) {
      return prompt.substring(0, 40) + '...';
    }
    return prompt;
  };

  const renderHistoryList = () => (
    <FlatList
      data={state.recentExecutions}
      keyExtractor={(item) => item.id}
             renderItem={({ item }) => {
         const promptPreview = getPromptPreview(item);

         return (
                     <View style={styles.executionListItem}>
                        <ExecutionRunCard
              executionRun={item}
              onPress={handleRunPress}
              onDelete={handleDeleteRun}
              onReExecute={handleReExecute}
              onCreateTemplate={handleCreateTemplate}
            />
             {promptPreview && (
               <View style={styles.promptPreviewInList}>
                 <View style={styles.promptPreviewHeader}>
                   <Ionicons name="chatbubble-ellipses" size={12} color={styles.promptPreviewLabelInList.color} />
                   <Text style={styles.promptPreviewLabelInList}>Prompt:</Text>
                 </View>
                 <Text style={styles.promptPreviewTextInList}>{promptPreview}</Text>
               </View>
             )}
           </View>
         );
       }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor={styles.comparisonTitle.color}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
      ListEmptyComponent={renderEmptyState}
    />
  );

  return (
    <View style={styles.container}>
      {renderHeader()}
      {renderConnectionStatus()}

      {isLoading && state.recentExecutions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={styles.comparisonTitle.color} />
          <Text style={styles.loadingText}>Loading execution history...</Text>
        </View>
      ) : state.recentExecutions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color={styles.loadingText.color} />
          <Text style={styles.emptyStateTitle}>No Execution History</Text>
          <Text style={styles.emptyStateText}>
            {user
              ? "You haven't run any executions yet. Go to the Execute tab to get started!"
              : "No session executions found. Login to see full history or execute something new!"
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={state.recentExecutions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const promptPreview = getPromptPreview(item);

            return (
              <View style={styles.executionListItem}>
                <ExecutionRunCard
                  executionRun={item}
                  onPress={() => handleRunPress(item)}
                  onDelete={() => handleDeleteRun(item.id)}
                  onReExecute={() => handleReExecute(item)}
                  onCreateTemplate={() => handleCreateTemplate(item)}
                />
                {promptPreview && (
                  <View style={styles.promptPreviewInList}>
                    <View style={styles.promptPreviewHeader}>
                      <Ionicons name="chatbubble-ellipses" size={12} color={styles.promptPreviewLabelInList.color} />
                      <Text style={styles.promptPreviewLabelInList}>Prompt:</Text>
                    </View>
                    <Text style={styles.promptPreviewTextInList}>{promptPreview}</Text>
                  </View>
                )}
              </View>
            );
          }}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[styles.comparisonTitle.color]}
              tintColor={styles.comparisonTitle.color}
            />
          }
        />
      )}

      {/* Execution Results Details Modal */}
      {selectedRun && showDetails && (
        <ExecutionResultsViewer
          executionResult={selectedRun}
          visible={showDetails}
          onClose={() => {
            setShowDetails(false);
            setSelectedRun(null);
          }}
          onReExecute={(reExecutionData) => {
            setReExecutionData(reExecutionData);
            setShowDetails(false);
            setSelectedRun(null);
            // @ts-ignore - navigation typing issue
            navigation.navigate('Execute');
          }}
          showReExecuteButton={true}
          embedded={false}
        />
      )}

      {/* Execution Logs Modal */}
      {selectedRun && showExecutionLogs && (
        <ExecutionLogsCard
          executionResult={selectedRun}
          visible={showExecutionLogs}
          onClose={() => setShowExecutionLogs(false)}
          onReExecute={(data: any) => {
            // Extract function tools from the execution data
            const functionTools: any[] = [];
            if (selectedRun.results && selectedRun.results.length > 0) {
              // PRIORITY 1: Look for function tools in the configuration (stored from original execution)
              if (selectedRun.results[0].configuration && selectedRun.results[0].configuration.tools && selectedRun.results[0].configuration.tools.length > 0) {
                selectedRun.results[0].configuration.tools.forEach((tool: any) => {
                  if (!functionTools.find(t => t.name === tool.name)) {
                    functionTools.push({
                      name: tool.name,
                      description: tool.description || `${tool.name} function`,
                      parameters: tool.parameters || {}
                    });
                  }
                });
              }

              // PRIORITY 2: Look for function calls in the responses as fallback
              selectedRun.results.forEach(result => {
                if (result.functionCalls && result.functionCalls.length > 0) {
                  result.functionCalls.forEach(functionCall => {
                    const funcName = functionCall.functionName;
                    if (funcName && !functionTools.find(t => t.name === funcName)) {
                      functionTools.push({
                        name: funcName,
                        description: `${funcName} function`,
                        parameters: {}
                      });
                    }
                  });
                }
              });
            }

            // Extract the original base prompt and context
            const basePrompt = selectedRun.results?.[0]?.request?.prompt || selectedRun.executionRun.basePrompt || '';
            const context = selectedRun.results?.[0]?.request?.context || selectedRun.executionRun.contextPrompt || '';

            const reExecutionData = {
              executionRunName: generateRerunName(selectedRun.executionRun.name),
              description: selectedRun.executionRun.description || '',
              basePrompt: basePrompt,
              context: context,
              configurations: selectedRun.results?.map(r => r.configuration) || [],
              enableFunctionCalling: selectedRun.executionRun.enableFunctionCalling || functionTools.length > 0,
              functionTools: functionTools,
              // Pass agent information if this was an agent execution
              agentId: selectedRun.executionRun.agentId || undefined
            };

            console.log('🔄 Re-execution data from ExecutionLogs:', {
              executionRunName: reExecutionData.executionRunName,
              basePrompt: basePrompt ? basePrompt.substring(0, 100) + '...' : 'EMPTY',
              context: context ? context.substring(0, 100) + '...' : 'EMPTY',
              configurationsCount: reExecutionData.configurations.length,
              functionsCount: functionTools.length
            });

            setReExecutionData(reExecutionData);
            setShowExecutionLogs(false);
            setShowDetails(false);
            setSelectedRun(null);
            // @ts-ignore - navigation typing issue
            navigation.navigate('Execute');
          }}
        />
      )}

      {/* Execution Flow Graph Modal */}
      {selectedRun && showExecutionFlowGraph && (
        <Modal
          visible={showExecutionFlowGraph}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setShowExecutionFlowGraph(false)}
        >
          <ExecutionFlowGraph
            executionRunId={selectedRun.executionRun.id}
            visible={showExecutionFlowGraph}
            onClose={() => setShowExecutionFlowGraph(false)}
          />
        </Modal>
      )}
    </View>
  );
};

export default HistoryScreen;
