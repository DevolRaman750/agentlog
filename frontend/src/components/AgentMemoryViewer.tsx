import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
import { Agent, AgentMemory, MemoryNode, MemoryGraph, AgentMemoryResponse, MemorySearchResult } from '../types';
import { goGentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface AgentMemoryViewerProps {
  agent: Agent;
  onClose: () => void;
}

export const AgentMemoryViewer: React.FC<AgentMemoryViewerProps> = ({ agent, onClose }) => {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const [memoryData, setMemoryData] = useState<AgentMemory | null>(agent.memory || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterContext, setFilterContext] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgCard,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    title: {
      ...typography.h2,
      marginLeft: spacing.sm,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.sm,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    controls: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    searchContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    searchInput: {
      flex: 1,
      padding: spacing.md,
      ...typography.title,
    },
    filterContainer: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    filterButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSurface,
    },
    filterButtonActive: {
      backgroundColor: colors.statusSuccess,
    },
    filterButtonText: {
      color: colors.textSecondary,
      ...typography.body,
    },
    filterButtonTextActive: {
      color: colors.textInverse,
    },
    errorContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
      backgroundColor: `${colors.statusError}15`,
      marginHorizontal: spacing.lg,
      marginTop: spacing.sm,
      borderRadius: radius.md,
    },
    errorText: {
      color: colors.statusError,
      marginLeft: spacing.sm,
      flex: 1,
    },
    memoryContainer: {
      flex: 1,
    },
    loadingContainer: {
      padding: spacing.xxl,
      alignItems: 'center' as const,
    },
    loadingText: {
      color: colors.textSecondary,
      ...typography.title,
    },
    memoryInfo: {
      padding: spacing.lg,
      backgroundColor: colors.bgSurface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    memoryInfoText: {
      color: colors.textSecondary,
      ...typography.body,
      marginBottom: spacing.xs,
    },
    memoryTree: {
      padding: spacing.lg,
    },
    nodeContainer: {
      marginBottom: spacing.xs,
    },
    nodeHeader: {
      padding: spacing.sm,
      borderRadius: radius.sm,
    },
    selectedNode: {
      backgroundColor: colors.accentSoft,
    },
    contextNode: {
      backgroundColor: `${colors.statusSuccess}15`,
    },
    nodeContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    chevron: {
      marginRight: spacing.xs,
    },
    nodeIcon: {
      marginRight: spacing.sm,
    },
    nodeLabel: {
      flex: 1,
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
    },
    contextLabel: {
      fontWeight: 'bold' as const,
    },
    clearButton: {
      padding: spacing.xs,
    },
    nodeData: {
      marginTop: spacing.sm,
      padding: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.sm,
      marginLeft: spacing.xl,
    },
    dataLabel: {
      ...typography.caption,
      fontWeight: 'bold' as const,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    dataValue: {
      ...typography.body,
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    childrenContainer: {
      marginTop: spacing.xs,
    },
    searchResults: {
      padding: spacing.lg,
    },
    searchResultsTitle: {
      ...typography.title,
      fontWeight: 'bold' as const,
      marginBottom: spacing.md,
      color: colors.textPrimary,
    },
    searchResult: {
      padding: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.statusSuccess,
    },
    searchResultHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: spacing.xs,
    },
    searchResultPath: {
      ...typography.body,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      flex: 1,
    },
    searchResultContext: {
      ...typography.caption,
      color: colors.textSecondary,
      backgroundColor: colors.borderLight,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.lg,
    },
    searchResultData: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    searchResultRelevance: {
      ...typography.caption,
      color: colors.statusSuccess,
      fontWeight: 'bold' as const,
    },
    noResults: {
      padding: spacing.lg,
      textAlign: 'center' as const,
      color: colors.textSecondary,
      fontStyle: 'italic' as const,
    },
    relationshipsContainer: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    relationshipsTitle: {
      ...typography.title,
      fontWeight: 'bold' as const,
      marginBottom: spacing.md,
      color: colors.textPrimary,
    },
    relationship: {
      padding: spacing.md,
      backgroundColor: `${colors.statusWarning}15`,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
      borderLeftWidth: 3,
      borderLeftColor: colors.statusWarning,
    },
    relationshipText: {
      ...typography.body,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    relationshipStrength: {
      ...typography.caption,
      color: colors.statusWarning,
      fontWeight: 'bold' as const,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xxl,
      minHeight: 400,
    },
    emptyStateTitle: {
      ...typography.h1,
      color: colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      textAlign: 'center' as const,
    },
    emptyStateText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginBottom: spacing.md,
      lineHeight: 24,
    },
    emptyStateSubtext: {
      ...typography.body,
      color: colors.textTertiary,
      textAlign: 'center' as const,
      fontStyle: 'italic' as const,
      lineHeight: 20,
    },
    emptyMessage: {
      padding: spacing.xxl,
      textAlign: 'center' as const,
      color: colors.textSecondary,
      ...typography.title,
      fontWeight: '400' as const,
      fontStyle: 'italic' as const,
    },
  }));

  // Load memory data
  const loadMemory = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const response = await goGentAPI.getAgentMemory(agent.id, {
        context: filterContext === 'all' ? undefined : filterContext
      });

      if (response.success) {
        if (response.data) {
          setMemoryData(response.data as AgentMemory);
        } else {
          // No memory data exists yet - this is normal for new agents
          setMemoryData(null);
        }
      } else {
        setError(response.error || 'Failed to load memory');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load memory');
    } finally {
      setLoading(false);
    }
  };

  // Search memory
  const searchMemory = async (query: string) => {
    if (!isAuthenticated || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await goGentAPI.searchAgentMemory(agent.id, {
        searchQuery: query,
        limit: 20
      });

      if (response.success) {
        setSearchResults(response.results || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  // Convert memory to tree structure
  const memoryGraph = useMemo((): MemoryGraph => {
    if (!memoryData) {
      return { nodes: [], relationships: [] };
    }

    const nodes: MemoryNode[] = [];

    // Add context nodes
    Object.entries(memoryData.contexts || {}).forEach(([contextName, contextData]) => {
      if (!contextData || Object.keys(contextData).length === 0) return;

      const contextNode: MemoryNode = {
        id: `context-${contextName}`,
        label: contextName.charAt(0).toUpperCase() + contextName.slice(1),
        type: 'context',
        context: contextName,
        children: [],
        expanded: expandedNodes.has(`context-${contextName}`)
      };

      // Add data nodes for this context
      Object.entries(contextData).forEach(([key, value]) => {
        const dataNode: MemoryNode = {
          id: `${contextName}-${key}`,
          label: key,
          type: 'data',
          context: contextName,
          data: value,
          expanded: expandedNodes.has(`${contextName}-${key}`)
        };

        // Add nested children if value is an object
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          dataNode.children = Object.entries(value).map(([subKey, subValue]) => ({
            id: `${contextName}-${key}-${subKey}`,
            label: subKey,
            type: 'data' as const,
            context: contextName,
            data: subValue
          }));
        }

        contextNode.children!.push(dataNode);
      });

      nodes.push(contextNode);
    });

    return {
      nodes,
      relationships: memoryData.relationships || [],
      selectedNode: selectedNode || undefined,
      searchTerm,
      filterContext
    };
  }, [memoryData, expandedNodes, selectedNode, searchTerm, filterContext]);

  useEffect(() => {
    loadMemory();
  }, [filterContext]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchMemory(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (expandedNodes.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const clearMemoryContext = async (context: string) => {
    if (!isAuthenticated) return;

    if (Platform.OS === 'web') {
      if (!confirm(`Are you sure you want to clear the ${context} context? This action cannot be undone.`)) {
        return;
      }
    } else {
      Alert.alert(
        'Clear Memory Context',
        `Are you sure you want to clear the ${context} context? This action cannot be undone.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Clear', style: 'destructive', onPress: () => performClear(context) }
        ]
      );
      return;
    }

    performClear(context);
  };

  const performClear = async (context: string) => {
    try {
      setLoading(true);
      const response = await goGentAPI.clearAgentMemory(agent.id, {
        action: 'clear_context',
        context: context
      });

      if (response.success) {
        await loadMemory(); // Reload memory after clearing
      } else {
        setError(response.error || 'Failed to clear memory');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear memory');
    } finally {
      setLoading(false);
    }
  };

  const renderMemoryNode = (node: MemoryNode, depth: number = 0) => {
    const isExpanded = node.expanded;
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode === node.id;

    return (
      <View key={node.id} style={[styles.nodeContainer, { marginLeft: depth * 20 }]}>
        <TouchableOpacity
          style={[
            styles.nodeHeader,
            isSelected && styles.selectedNode,
            node.type === 'context' && styles.contextNode
          ]}
          onPress={() => {
            setSelectedNode(isSelected ? null : node.id);
            if (hasChildren) {
              toggleNode(node.id);
            }
          }}
        >
          <View style={styles.nodeContent}>
            {hasChildren && (
              <MaterialCommunityIcons
                name={isExpanded ? 'chevron-down' : 'chevron-right'}
                size={16}
                color={colors.textSecondary}
                style={styles.chevron}
              />
            )}
            <MaterialCommunityIcons
              name={
                node.type === 'context'
                  ? 'folder'
                  : node.type === 'relationship'
                    ? 'link-variant'
                    : 'file-document'
              }
              size={16}
              color={
                node.type === 'context'
                  ? colors.statusSuccess
                  : node.type === 'relationship'
                    ? colors.statusWarning
                    : colors.accent
              }
              style={styles.nodeIcon}
            />
            <Text style={[
              styles.nodeLabel,
              node.type === 'context' && styles.contextLabel
            ]}>
              {node.label}
            </Text>
            {node.type === 'context' && (
              <TouchableOpacity
                style={styles.clearButton}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                onPress={() => clearMemoryContext(node.context!)}
              >
                <MaterialCommunityIcons name="delete" size={14} color={colors.statusError} />
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>

        {isSelected && node.data && (
          <View style={styles.nodeData}>
            <Text style={styles.dataLabel}>Data:</Text>
            <Text style={styles.dataValue}>
              {typeof node.data === 'string' ? node.data : JSON.stringify(node.data, null, 2)}
            </Text>
          </View>
        )}

        {isExpanded && hasChildren && (
          <View style={styles.childrenContainer}>
            {node.children!.map(child => renderMemoryNode(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) {
      return searchTerm ? (
        <Text style={styles.noResults}>No search results found</Text>
      ) : null;
    }

    return (
      <View style={styles.searchResults}>
        <Text style={styles.searchResultsTitle}>Search Results:</Text>
        {searchResults.map((result, index) => (
          <TouchableOpacity
            key={index}
            style={styles.searchResult}
            onPress={() => setSelectedNode(result.path)}
          >
            <View style={styles.searchResultHeader}>
              <Text style={styles.searchResultPath}>{result.path}</Text>
              <Text style={styles.searchResultContext}>{result.context}</Text>
            </View>
            <Text style={styles.searchResultData} numberOfLines={2}>
              {JSON.stringify(result.data)}
            </Text>
            {result.relevance && (
              <Text style={styles.searchResultRelevance}>
                Relevance: {(result.relevance * 100).toFixed(0)}%
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="brain" size={24} color={colors.statusSuccess} />
          <Text style={styles.title}>
            {agent.firstName} {agent.lastName} - Memory
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search memory..."
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>

        <View style={styles.filterContainer}>
          {['all', 'workflow', 'session', 'persistent'].map(context => (
            <TouchableOpacity
              key={context}
              style={[
                styles.filterButton,
                filterContext === context && styles.filterButtonActive
              ]}
              onPress={() => setFilterContext(context)}
            >
              <Text style={[
                styles.filterButtonText,
                filterContext === context && styles.filterButtonTextActive
              ]}>
                {context.charAt(0).toUpperCase() + context.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.statusError} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <ScrollView style={styles.memoryContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading memory...</Text>
          </View>
        ) : memoryData ? (
          <>
            <View style={styles.memoryInfo}>
              <Text style={styles.memoryInfoText}>
                Size: {memoryData.metadata?.sizeBytes ? (memoryData.metadata.sizeBytes / 1024).toFixed(1) : '0'} KB
              </Text>
              <Text style={styles.memoryInfoText}>
                Last Updated: {memoryData.metadata?.updatedAt ? new Date(memoryData.metadata.updatedAt).toLocaleString() : 'Never'}
              </Text>
              <Text style={styles.memoryInfoText}>
                Access Count: {memoryData.metadata?.accessCount || 0}
              </Text>
            </View>

            {searchTerm ? renderSearchResults() : (
              <View style={styles.memoryTree}>
                {memoryGraph.nodes.length > 0 ? (
                  memoryGraph.nodes.map(node => renderMemoryNode(node))
                ) : (
                  <Text style={styles.emptyMessage}>No memory data available</Text>
                )}
              </View>
            )}

            {memoryData.relationships && memoryData.relationships.length > 0 && (
              <View style={styles.relationshipsContainer}>
                <Text style={styles.relationshipsTitle}>Relationships:</Text>
                {memoryData.relationships.map((rel, index) => (
                  <View key={index} style={styles.relationship}>
                    <Text style={styles.relationshipText}>
                      {rel.from} → {rel.to} ({rel.type})
                    </Text>
                    {rel.strength && (
                      <Text style={styles.relationshipStrength}>
                        Strength: {(rel.strength * 100).toFixed(0)}%
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons name="brain" size={64} color={colors.borderLight} />
            <Text style={styles.emptyStateTitle}>No Memory Yet</Text>
            <Text style={styles.emptyStateText}>
              This agent hasn't stored any memory yet. Memory will appear here once the agent starts using memory functions during execution.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Memory functions: agent_memory_write, agent_memory_read, agent_memory_search, agent_memory_clear
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
