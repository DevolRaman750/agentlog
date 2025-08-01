import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { DatabaseStats, DatabaseTable, DatabaseRow } from '../types';
import { goGentAPI } from '../api/client';
import { AlertAPI } from '../components/CustomAlert';
import LoadingScreen from '../components/LoadingScreen';
import { containerStyles } from '../styles/containers';

const { width } = Dimensions.get('window');

const DatabaseScreen: React.FC = () => {
  const { state, clearError } = useApp();
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tableData, setTableData] = useState<DatabaseTable | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'table'>('overview');
  const [selectedRowData, setSelectedRowData] = useState<{ row: any; columns: string[] } | null>(null);
  const [showRowModal, setShowRowModal] = useState(false);

  // Show loading screen while auth is loading
  if (authLoading) {
    return <LoadingScreen message="Loading database information..." />;
  }

  useEffect(() => {
    if (state.isConnected) {
      loadDatabaseInfo();
    }
  }, []);

  // Reload database info when tab becomes focused - DECOUPLED from connection state
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 DatabaseScreen focused - checking if refresh needed');
      
      // Only refresh if authenticated and not already loading - connection status is irrelevant
      if (user && !isLoading && !isRefreshing) {
        console.log('✅ Refreshing database data for:', user.username);
        loadDatabaseInfo();
      } else {
        console.log('⏳ Skipping refresh:', { 
          hasUser: !!user, 
          isLoading,
          isRefreshing 
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

  const loadDatabaseInfo = useCallback(async () => {
    // DECOUPLED: Always attempt to load database info regardless of perceived connection status
    setIsLoading(true);
    try {
      console.log('🗄️ Attempting to load database information...');
      
      // Load database statistics - these will be filtered by user on the backend
      const statsResponse = await goGentAPI.getDatabaseStats();
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
        console.log('✅ Database stats loaded successfully');
      }

      // Load table names - only show tables user has access to
      const tablesResponse = await goGentAPI.getDatabaseTables();
      if (tablesResponse.success && tablesResponse.data) {
        // Filter tables to only show user-relevant ones
        const userAccessibleTables = tablesResponse.data.filter((tableName: string) => {
          // Show system tables and user data tables
          const systemTables = ['function_definitions', 'api_configurations', 'comparison_results'];
          const userTables = ['execution_runs', 'execution_logs', 'api_requests', 'api_responses', 'function_calls'];
          return systemTables.includes(tableName) || userTables.includes(tableName);
        });
        setTables(userAccessibleTables);
      }
    } catch (error) {
      console.error('Failed to load database info:', error);
      AlertAPI.alert(
        'Database Error', 
        user ? 'Failed to load your data. Please try again.' : 'Please login to view database information.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, [state.isConnected, user]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDatabaseInfo();
    if (selectedTable && viewMode === 'table') {
      await loadTableData(selectedTable);
    }
    setIsRefreshing(false);
  }, [loadDatabaseInfo, selectedTable, viewMode]);

  const loadTableData = async (tableName: string) => {
    // DECOUPLED: Always attempt to load table data regardless of perceived connection status
    setIsLoading(true);
    try {
      console.log('🗄️ Attempting to load table data for:', tableName);
      const response = await goGentAPI.getDatabaseTable(tableName, 100, 0);
      if (response.success && response.data) {
        // Add user context information to the data
        let filteredData = response.data;
        
        // For user data tables, show message about user filtering
        const userTables = ['execution_runs', 'execution_logs', 'api_requests', 'api_responses', 'function_calls'];
        if (userTables.includes(tableName)) {
          // Backend should already filter this data by user
          console.log(`Loading ${tableName} - data filtered for user:`, user?.username || 'anonymous');
        }
        
        setTableData(filteredData);
        setSelectedTable(tableName);
        setViewMode('table');
      } else {
        AlertAPI.alert('Error', response.error || 'Failed to load table data');
      }
    } catch (error) {
      console.error('Failed to load table data:', error);
      AlertAPI.alert('Error', 'Failed to load table data');
    } finally {
      setIsLoading(false);
    }
  };

  const renderConnectionStatus = () => (
    <View style={styles.statusContainer}>
      <View style={styles.statusRow}>
        <View style={[
          styles.statusDot, 
          { backgroundColor: state.isConnected ? '#34C759' : '#FF3B30' }
        ]} />
        <Text style={styles.statusText}>
          {state.isConnected ? 'Connected to MySQL' : 'Disconnected'}
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

  const renderStatsCard = (title: string, value: string | number, icon: string, color: string) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <Ionicons name={icon as any} size={24} color={color} />
        <View style={styles.statsText}>
          <Text style={styles.statsValue}>{value}</Text>
          <Text style={styles.statsLabel}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const renderOverviewStats = () => {
    if (!stats) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Database Statistics</Text>
        
        <View style={styles.statsGrid}>
          {renderStatsCard(
            'Execution Runs',
            stats.totalExecutionRuns.toLocaleString(),
            'play-circle',
            '#007AFF'
          )}
          
          {renderStatsCard(
            'API Requests',
            stats.totalApiRequests.toLocaleString(),
            'arrow-up-circle',
            '#34C759'
          )}
          
          {renderStatsCard(
            'API Responses',
            stats.totalApiResponses.toLocaleString(),
            'arrow-down-circle',
            '#FF9500'
          )}
          
          {renderStatsCard(
            'Function Calls',
            stats.totalFunctionCalls.toLocaleString(),
            'code-working',
            '#AF52DE'
          )}
          
          {renderStatsCard(
            'Avg Response Time',
            `${stats.avgResponseTime.toFixed(0)}ms`,
            'time',
            '#FF3B30'
          )}
          
          {renderStatsCard(
            'Success Rate',
            `${(stats.successRate * 100).toFixed(1)}%`,
            'checkmark-circle',
            '#34C759'
          )}
        </View>
      </View>
    );
  };

  const renderTablesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Database Tables</Text>
      
      {tables.map((tableName) => (
        <TouchableOpacity
          key={tableName}
          style={styles.tableItem}
          onPress={() => loadTableData(tableName)}
        >
          <View style={styles.tableItemContent}>
            <Ionicons name="grid" size={20} color="#007AFF" />
            <Text style={styles.tableItemText}>{tableName}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
        </TouchableOpacity>
      ))}

      {tables.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No tables found</Text>
        </View>
      )}
    </View>
  );

  const renderTableHeader = () => {
    if (!tableData) return null;

    return (
      <View style={styles.tableHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => setViewMode('overview')}
        >
          <Ionicons name="arrow-back" size={20} color="#007AFF" />
          <Text style={styles.backButtonText}>Overview</Text>
        </TouchableOpacity>
        
        <View style={styles.tableInfo}>
          <Text style={styles.tableName}>{tableData.tableName}</Text>
          <View style={styles.tableInfo}>
            <Text style={styles.rowCount}>
              {(tableData.rows?.length || 0)} of {tableData.totalRows || 0} rows
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh}>
              <Ionicons name="refresh" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const getColumnWidth = (columnName: string) => {
    // Define fixed widths for different column types
    const columnWidths: { [key: string]: number } = {
      'id': 250,
      'name': 180,
      'description': 250,
      'created_at': 160,
      'updated_at': 160,
      'execution_run_id': 250,
      'comparison_type': 140,
      'metric_name': 140,
      'best_configuration_id': 250,
      'status': 100,
      'error_message': 200,
      'response_text': 200,
      'prompt': 200,
      'context': 150,
    };
    
    return { width: columnWidths[columnName.toLowerCase()] || 150 };
  };

  const renderTableDataCell = (value: any, rowData: any, columnName: string) => {
    if (value === null || value === undefined) {
      return <Text style={styles.nullValue}>NULL</Text>;
    }
    
    if (typeof value === 'boolean') {
      return <Text style={styles.booleanValue}>{value ? 'true' : 'false'}</Text>;
    }
    
    if (typeof value === 'number') {
      return <Text style={styles.numberValue}>{value.toLocaleString()}</Text>;
    }
    
    const stringValue = String(value);
    const maxLength = 25; // Fixed truncation length
    const isLongContent = stringValue.length > maxLength;
    
    return (
      <TouchableOpacity 
        onPress={() => {
          if (tableData) {
            setSelectedRowData({ row: rowData, columns: tableData.columns });
            setShowRowModal(true);
          }
        }}
        style={styles.cellTouchable}
        activeOpacity={0.7}
      >
        <Text style={styles.cellValue} numberOfLines={1} ellipsizeMode="tail">
          {isLongContent ? stringValue.substring(0, maxLength) + '...' : stringValue}
        </Text>
        {isLongContent && (
          <Ionicons name="chevron-forward" size={12} color="#C7C7CC" style={styles.expandIcon} />
        )}
      </TouchableOpacity>
    );
  };

  const renderTableData = () => {
    if (!tableData) return null;

    return (
      <View style={styles.tableContainer}>
        {renderTableHeader()}
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.tableScrollView}
        >
          <View style={styles.table}>
            {/* Table Headers */}
            <View style={styles.tableHeader}>
              {(tableData.columns || []).map((column, index) => (
                <View key={index} style={[
                  styles.tableHeaderCell,
                  getColumnWidth(column)
                ]}>
                  <Text style={styles.tableHeaderText}>{column}</Text>
                </View>
              ))}
            </View>

            {/* Table Rows */}
            {(tableData.rows || []).map((row, rowIndex) => (
              <View key={rowIndex} style={[
                styles.tableRow,
                rowIndex % 2 === 0 ? styles.evenRow : styles.oddRow
              ]}>
                {(tableData.columns || []).map((column, colIndex) => (
                  <View key={colIndex} style={[
                    styles.tableCell,
                    getColumnWidth(column)
                  ]}>
                    {renderTableDataCell(row[colIndex], row, column)}
                  </View>
                ))}
              </View>
            ))}

            {(!tableData.rows || tableData.rows.length === 0) && (
              <View style={styles.emptyTableState}>
                <Text style={styles.emptyStateText}>No data in this table</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    );
  };

  const renderRowModal = () => {
    if (!selectedRowData) return null;

    return (
      <Modal
        visible={showRowModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowRowModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Row Details</Text>
            <TouchableOpacity 
              onPress={() => setShowRowModal(false)}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {selectedRowData.columns.map((column, index) => {
              const value = selectedRowData.row[index];
              return (
                <View key={index} style={styles.modalRow}>
                  <Text style={styles.modalColumnName}>{column.toUpperCase()}</Text>
                  <View style={styles.modalValueContainer}>
                    {value === null || value === undefined ? (
                      <Text style={styles.modalNullValue}>NULL</Text>
                    ) : typeof value === 'boolean' ? (
                      <Text style={styles.modalBooleanValue}>{value ? 'true' : 'false'}</Text>
                    ) : typeof value === 'number' ? (
                      <Text style={styles.modalNumberValue}>{value.toLocaleString()}</Text>
                    ) : (
                      <Text style={styles.modalValue} selectable>
                        {String(value)}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="server-outline" size={64} color="#C7C7CC" />
      <Text style={styles.emptyTitle}>Database Not Available</Text>
      <Text style={styles.emptySubtitle}>
        {!state.isConnected 
          ? 'Connect to the backend to view database information'
          : 'Unable to load database information'
        }
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading database information...</Text>
    </View>
  );

  if (!state.isConnected) {
    return (
      <View style={styles.container}>
        {renderConnectionStatus()}
        {renderEmptyState()}
      </View>
    );
  }

  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.container}>
        {renderConnectionStatus()}
        {renderLoadingState()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderConnectionStatus()}
      
      {viewMode === 'overview' ? (
        <ScrollView 
          style={styles.scrollContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#007AFF"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {renderOverviewStats()}
          {renderTablesSection()}
        </ScrollView>
      ) : (
        renderTableData()
      )}
      {renderRowModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContainer: {
    flex: 1,
  },
  statusContainer: {
    ...containerStyles.statusContainer,
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
  section: {
    ...containerStyles.primaryContainer,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  statsGrid: {
    gap: 12,
  },
  statsCard: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    marginLeft: 12,
    flex: 1,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  statsLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  tableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  tableItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 8,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
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
  tableContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 4,
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tableName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  rowCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  tableScrollView: {
    flex: 1,
  },
  table: {
    minWidth: width - 32,
    flexDirection: 'column',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#F9F9F9',
  },
  tableHeaderCell: {
    width: 150, // Default width, will be overridden by getColumnWidth
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
    justifyContent: 'center',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  tableCell: {
    width: 150, // Default width, will be overridden by getColumnWidth
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cellTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    minHeight: 24,
  },
  cellValue: {
    fontSize: 12,
    color: '#000000',
    textAlign: 'center',
    flex: 1,
  },
  expandIcon: {
    marginLeft: 4,
  },
  nullValue: {
    fontSize: 12,
    color: '#C7C7CC',
    fontStyle: 'italic',
  },
  booleanValue: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  numberValue: {
    fontSize: 12,
    color: '#000000',
    fontFamily: 'monospace',
  },
  emptyTableState: {
    padding: 32,
    alignItems: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalColumnName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    textTransform: 'uppercase',
  },
  modalValueContainer: {
    flex: 1,
    marginLeft: 10,
  },
  modalValue: {
    fontSize: 14,
    color: '#000000',
  },
  modalNullValue: {
    fontSize: 14,
    color: '#C7C7CC',
    fontStyle: 'italic',
  },
  modalBooleanValue: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  modalNumberValue: {
    fontSize: 14,
    color: '#000000',
    fontFamily: 'monospace',
  },
});

export default DatabaseScreen; 