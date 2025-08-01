import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Modal, Clipboard } from 'react-native';
import {
  ExecutionLog,
  LogLevel,
  LogCategory,
  ExecutionResult,
} from '../types';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AlertAPI } from './CustomAlert';

export interface ExecutionLogsCardProps {
  executionResult: ExecutionResult;
  onClose: () => void;
  onReExecute: (data: any) => void;
  visible: boolean;
}

const ExecutionLogsCard: React.FC<ExecutionLogsCardProps> = ({ 
  executionResult,
  visible,
  onClose,
  onReExecute,
}) => {
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<LogCategory | 'ALL'>('ALL');

  if (!visible) {
    return null;
  }

  const logs = executionResult.logs || [];
  const title = `Execution Logs for ${executionResult.executionRun.name}`;

  const filteredLogs = logs.filter(log => {
    const levelMatch = levelFilter === 'ALL' || log.logLevel === levelFilter;
    const categoryMatch = categoryFilter === 'ALL' || log.logCategory === categoryFilter;
    return levelMatch && categoryMatch;
  });

  const toggleLogExpansion = (logId: string) => {
    setExpandedLog(expandedLog === logId ? null : logId);
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await Clipboard.setString(text);
      AlertAPI.alert('Copied!', `${label} copied to clipboard`);
    } catch (error) {
      AlertAPI.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const copyAllLogs = async () => {
    try {
      const allLogsText = filteredLogs.map(log => {
        const timestamp = formatTimestamp(log.timestamp);
        const details = typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2);
        return `[${timestamp}] ${log.logLevel} - ${log.logCategory}\n${log.message}\n${details ? `Details: ${details}` : ''}\n---`;
      }).join('\n\n');
      
      await Clipboard.setString(allLogsText);
      AlertAPI.alert('Copied!', `All ${filteredLogs.length} logs copied to clipboard`);
    } catch (error) {
      AlertAPI.alert('Error', 'Failed to copy logs to clipboard');
    }
  };

  const getLogLevelColor = (level: LogLevel): string => {
    switch (level) {
      case 'SUCCESS': return '#34C759';
      case 'ERROR': return '#FF3B30';
      case 'WARN': return '#FF9500';
      case 'INFO': return '#007AFF';
      case 'DEBUG': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getLogEmoji = (level: LogLevel, category: LogCategory): string => {
    switch (level) {
      case 'SUCCESS': return '✅';
      case 'ERROR': return '❌';
      case 'WARN': return '⚠️';
      default:
        switch (category) {
          case 'API_CALL': return '📞';
          case 'FUNCTION_CALL': return '🔧';
          case 'SETUP': return '🛠️';
          case 'EXECUTION': return '🚀';
          case 'COMPLETION': return '🎯';
          default: return '📝';
        }
    }
  };

  const formatTimestamp = (timestamp: string | Date): string => {
    try {
      const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
    } catch (error) {
      return 'Invalid time';
    }
  };

  const getCategoryColor = (category: LogCategory): string => {
    switch (category) {
      case 'FUNCTION_CALL': return '#FF6B6B'; // Red for function calls
      case 'API_CALL': return '#4ECDC4';      // Teal for API calls
      case 'SETUP': return '#45B7D1';         // Blue for setup
      case 'EXECUTION': return '#F9A825';     // Amber for execution
      case 'COMPLETION': return '#66BB6A';    // Green for completion
      case 'ERROR': return '#EF5350';         // Red for errors
      default: return '#8E8E93';              // Gray for others
    }
  };

  const renderLogStats = () => {
    const levelStats = logs.reduce((acc, log) => {
      acc[log.logLevel] = (acc[log.logLevel] || 0) + 1;
      return acc;
    }, {} as Record<LogLevel, number>);

    const categoryStats = logs.reduce((acc, log) => {
      acc[log.logCategory] = (acc[log.logCategory] || 0) + 1;
      return acc;
    }, {} as Record<LogCategory, number>);

    return (
      <View style={styles.filtersContainer}>
        {/* Log Level Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Log Levels:</Text>
          <View style={styles.statsContainer}>
            {Object.entries(levelStats).map(([level, count]) => (
              <TouchableOpacity 
                key={level} 
                style={[
                  styles.statPill, 
                  levelFilter === level && styles.activeFilterPill,
                  { borderColor: getLogLevelColor(level as LogLevel) }
                ]}
                onPress={() => setLevelFilter(level as LogLevel)}
              >
                <Text style={[
                  styles.statText, 
                  { color: getLogLevelColor(level as LogLevel) },
                  levelFilter === level && styles.activeStatText
                ]}>
                  {level}: {count}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[styles.statPill, levelFilter === 'ALL' && styles.activeFilterPill]}
              onPress={() => setLevelFilter('ALL')}
            >
              <Text style={[styles.statText, levelFilter === 'ALL' && styles.activeStatText]}>ALL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Category Filters */}
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionTitle}>Categories:</Text>
          <View style={styles.statsContainer}>
            {Object.entries(categoryStats).map(([category, count]) => (
              <TouchableOpacity 
                key={category} 
                style={[
                  styles.statPill, 
                  categoryFilter === category && styles.activeFilterPill,
                  { borderColor: getCategoryColor(category as LogCategory) }
                ]}
                onPress={() => setCategoryFilter(category as LogCategory)}
              >
                <Text style={[
                  styles.statText, 
                  { color: getCategoryColor(category as LogCategory) },
                  categoryFilter === category && styles.activeStatText
                ]}>
                  {category}: {count}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity 
              style={[styles.statPill, categoryFilter === 'ALL' && styles.activeFilterPill]}
              onPress={() => setCategoryFilter('ALL')}
            >
              <Text style={[styles.statText, categoryFilter === 'ALL' && styles.activeStatText]}>ALL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderLogItem = (log: ExecutionLog) => {
    const isExpanded = expandedLog === log.id;
    const color = getLogLevelColor(log.logLevel);
    const emoji = getLogEmoji(log.logLevel, log.logCategory);

    return (
      <TouchableOpacity 
        key={log.id} 
        style={[styles.logItem, { borderLeftColor: color }]} 
        onPress={() => toggleLogExpansion(log.id)}
        activeOpacity={0.7}
      >
        <View style={styles.logHeader}>
          <View style={styles.logIconContainer}>
            <View style={[styles.logIndicator, { backgroundColor: color }]} />
            <Text style={styles.logEmoji}>{emoji}</Text>
          </View>
          
          <View style={styles.logMainContent}>
            <View style={styles.logTitleRow}>
              <Text style={styles.logCategory}>{log.logCategory}</Text>
              <View style={styles.logMetaCompact}>
                <TouchableOpacity 
                  style={styles.copyLogButton}
                  onPress={() => {
                    const logText = `[${formatTimestamp(log.timestamp)}] ${log.logLevel} - ${log.logCategory}\n${log.message}${log.details ? `\nDetails: ${typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}` : ''}`;
                    copyToClipboard(logText, 'Log entry');
                  }}
                >
                  <Ionicons name="copy" size={14} color="#007AFF" />
                </TouchableOpacity>
                <Text style={styles.logTimestamp}>
                  {formatTimestamp(log.timestamp)}
                </Text>
                <Text style={[styles.logLevel, { color }]}>
                  {log.logLevel}
                </Text>
              </View>
            </View>
            <Text style={styles.logMessage} numberOfLines={isExpanded ? undefined : 2}>
              {log.message}
            </Text>
          </View>
          
          <Ionicons 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={16} 
            color="#C7C7CC" 
            style={styles.expandIcon}
          />
        </View>
        
        {isExpanded && log.details && (
          <View style={styles.logDetails}>
            <Text style={styles.detailsTitle}>Details</Text>
            <ScrollView 
              style={styles.detailsScrollContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
            >
              <Text style={styles.detailsContent}>
                {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
              </Text>
            </ScrollView>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={copyAllLogs} style={styles.copyAllButton}>
              <Ionicons name="copy" size={20} color="#007AFF" />
              <Text style={styles.copyAllText}>Copy All</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>
        
        {renderLogStats()}
        
        <FlatList
          data={filteredLogs}
          renderItem={({ item }) => renderLogItem(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={true}
          bounces={true}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={10}
          ListFooterComponent={() => (
            <View style={styles.footerSpacer} />
          )}
        />
        
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.reExecuteButton} 
            onPress={() => onReExecute(executionResult)}
          >
            <Ionicons name="repeat" size={18} color="#FFFFFF" />
            <Text style={styles.reExecuteButtonText}>Re-Execute</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
  },
  headerLeft: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  copyAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  copyAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  copyLogButton: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: '#F0F8FF',
    marginRight: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  statPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    backgroundColor: '#F8F9FA',
  },
  activeFilterPill: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  statText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeStatText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  filterSection: {
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 80, // Space for footer
  },
  logItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    minWidth: 40,
  },
  logIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  logEmoji: {
    fontSize: 16,
  },
  logMainContent: {
    flex: 1,
    minHeight: 40,
  },
  logTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  logCategory: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  logMetaCompact: {
    alignItems: 'flex-end',
  },
  logMessage: {
    fontSize: 14,
    color: '#1D1D1F',
    lineHeight: 20,
    fontWeight: '400',
  },
  logTimestamp: {
    fontSize: 10,
    color: '#8E8E93',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  logLevel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  expandIcon: {
    marginLeft: 8,
    paddingTop: 2,
  },
  logDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  detailsScrollContainer: {
    maxHeight: 120,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    padding: 8,
  },
  detailsContent: {
    fontSize: 11,
    color: '#374151',
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 3,
  },
  footerSpacer: {
    height: 20,
  },
  reExecuteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reExecuteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ExecutionLogsCard; 