import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
import { AlertAPI } from '../components/CustomAlert';
import ExecutionLogsCard from '../components/ExecutionLogsCard';
import ExecutionFlowGraph from '../components/ExecutionFlowGraph';
import ExecutionResultsViewer from '../components/ExecutionResultsViewer';
import LoadingScreen from '../components/LoadingScreen';
import { debugComparisonData, formatConfigId } from '../utils/comparisonUtils';

const HistoryScreen: React.FC = () => {
  const { state, loadRecentExecutions, clearError, setReExecutionData } = useApp();
  const { user, isLoading: authLoading } = useAuth();
  const navigation = useNavigation();
  const [selectedRun, setSelectedRun] = useState<ExecutionResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);
  const [showExecutionFlowGraph, setShowExecutionFlowGraph] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading execution history..." />;
  }

  useEffect(() => {
    // Load history on mount - not dependent on connection state
    console.log('📜 HistoryScreen mounted - loading history');
    loadHistory();
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
          // Look for function calls in the responses to determine what functions were used
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
                  console.log(`✅ Added function tool: ${funcName}`);
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
          executionRunName: `${executionRun.name} (Re-run)`,
          description: executionRun.description || '',
          basePrompt: basePrompt,
          context: context,
          configurations: results.map(r => r.configuration),
          enableFunctionCalling: executionRun.enableFunctionCalling || functionTools.length > 0,
          functionTools: functionTools,
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

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={64} color="#C7C7CC" />
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
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading execution history...</Text>
    </View>
  );

  const renderConnectionStatus = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusRow}>
        <View style={[
          styles.statusDot, 
          { backgroundColor: state.isConnected ? '#34C759' : '#FF3B30' }
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
            color="#007AFF" 
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
            <Ionicons name="person" size={14} color="#007AFF" />
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
            <Ionicons name="eye-off" size={14} color="#FF9500" />
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
                <Ionicons name="close" size={24} color="#8E8E93" />
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
              <Ionicons name="close" size={24} color="#8E8E93" />
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
                            <Ionicons name="trophy" size={12} color="#FFD700" />
                            <Text style={styles.bestConfigBadgeText}>BEST</Text>
                          </View>
                        )}
                      </View>
                      
                      <Text style={styles.resultConfigDetails}>
                        {result.configuration.modelName} • {result.response.responseTimeMs}ms
                      </Text>
                      
                                             {/* Show Configuration ID prominently */}
                       <View style={styles.configIdRow}>
                         <Ionicons name="finger-print" size={10} color="#8E8E93" />
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
                          ? (isBestConfig ? '#FFD700' : '#34C759')
                          : '#FF3B30' 
                      }
                    ]}>
                      <Ionicons 
                        name={
                          isBestConfig ? 'trophy' : 
                          (result.response.responseStatus === 'success' ? 'checkmark' : 'close')
                        } 
                        size={12} 
                        color="#FFFFFF" 
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

  const renderHistoryList = () => (
    <FlatList
      data={state.recentExecutions}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <ExecutionRunCard
          key={item.id}
          executionRun={item}
          onPress={handleRunPress}
          onDelete={handleDeleteRun}
          onReExecute={handleReExecute}
        />
      )}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#007AFF"
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
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading execution history...</Text>
        </View>
      ) : state.recentExecutions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="time-outline" size={64} color="#8E8E93" />
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
          renderItem={({ item }) => (
            <ExecutionRunCard
              executionRun={item}
              onPress={() => handleRunPress(item)}
              onDelete={() => handleDeleteRun(item.id)}
              onReExecute={() => handleReExecute(item)}
            />
          )}
          contentContainerStyle={[styles.listContainer, { paddingBottom: 100 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
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
              executionRunName: `${selectedRun.executionRun.name} (Re-run)`,
              description: selectedRun.executionRun.description || '',
              basePrompt: basePrompt,
              context: context,
              configurations: selectedRun.results?.map(r => r.configuration) || [],
              enableFunctionCalling: selectedRun.executionRun.enableFunctionCalling || functionTools.length > 0,
              functionTools: functionTools
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  userContextContainer: {
    alignItems: 'flex-start',
  },
  userContextBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  userContextText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  anonymousBadge: {
    backgroundColor: '#FFF3E0',
  },
  anonymousText: {
    color: '#FF9500',
  },
  sessionWarning: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
    fontStyle: 'italic',
  },
  statusContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
  listContainer: {
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#C7C7CC',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginTop: 24,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  detailsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    flex: 1,
    maxHeight: '90%',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },
  detailsContent: {
    flex: 1,
    padding: 16,
  },
  detailsScrollContent: {
    paddingBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },

  descriptionContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#000000',
  },
  resultsPreview: {
    marginBottom: 16,
  },
  resultsPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  resultPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    marginBottom: 4,
  },
  resultPreviewLeft: {
    flex: 1,
  },

  resultConfigDetails: {
    fontSize: 10,
    color: '#8E8E93',
  },
  bestConfigPreviewItem: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: '#FFF8DC',
  },
  configHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  bestConfigBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  bestConfigBadgeText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  configIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  configIdText: {
    fontSize: 9,
    color: '#8E8E93',
    fontFamily: 'monospace',
  },
  bestConfigIndicator: {
    fontSize: 8,
    color: '#B8860B',
    fontWeight: '600',
  },
  bestConfigSummary: {
    marginTop: 4,
  },
  analysisNotes: {
    fontSize: 12,
    color: '#000000',
    marginTop: 6,
    lineHeight: 16,
  },
  responseTextContainer: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  usageContainer: {
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8F9FA',
    borderRadius: 4,
  },
  usageText: {
    fontSize: 10,
    color: '#6C757D',
    fontFamily: 'monospace',
  },
  resultStatus: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonPreview: {
    padding: 12,
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  comparisonTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 4,
  },
  comparisonText: {
    fontSize: 14,
    color: '#000000',
  },
  detailsFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  timestampText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  logsSection: {
    marginTop: 12,
    paddingHorizontal: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalCloseButton: {
    paddingVertical: 8,
  },
  modalCloseText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  modalActionButton: {
    paddingVertical: 8,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalContent: {
    flex: 1,
  },
  summarySection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  resultsSection: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  bestResultCard: {
    borderColor: '#FFD700',
    borderWidth: 2,
    backgroundColor: '#FFFEF7',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  resultConfigName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  bestConfigName: {
    color: '#B8860B',
  },
  bestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  bestBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B8860B',
  },
  resultDetails: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  responseContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#34C759',
  },
  responseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  responseText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#000000',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#FF3B30',
  },
  errorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#D32F2F',
  },
  showLogsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 32,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 12,
  },
  showLogsText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
  logCountText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  promptPreview: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  promptPreviewTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  promptPreviewContainer: {
    marginBottom: 8,
  },
  promptPreviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  promptPreviewText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  promptSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  promptContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  promptLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  promptText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  noPromptText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  configSection: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  configDetails: {
    marginTop: 12,
  },
  configItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  configLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  configValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
});

export default HistoryScreen; 