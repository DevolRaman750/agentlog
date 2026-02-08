import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Platform, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Team, TeamMemory, MemoryNode, MemoryGraph, TeamMemoryResponse, MemorySearchResult } from '../types';
import { goGentAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme, useThemedStyles } from '../theme';

interface TeamMemoryViewerProps {
  team: Team;
  onClose: () => void;
}

export const TeamMemoryViewer: React.FC<TeamMemoryViewerProps> = ({ team, onClose }) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgCard,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerLeft: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold' as const,
      marginLeft: 8,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: 8,
    },
    controls: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    searchContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgSurface,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      padding: 12,
      fontSize: 16,
    },
    filterContainer: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    filterButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.bgSurface,
    },
    filterButtonActive: {
      backgroundColor: colors.accent,
    },
    filterButtonText: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    filterButtonTextActive: {
      color: colors.textInverse,
    },
    errorContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 16,
      backgroundColor: `${colors.statusError}15`,
      marginHorizontal: 16,
      marginTop: 8,
      borderRadius: 8,
    },
    errorText: {
      color: colors.statusError,
      marginLeft: 8,
      flex: 1,
    },
    memoryContainer: {
      flex: 1,
    },
    loadingContainer: {
      padding: 32,
      alignItems: 'center' as const,
    },
    loadingText: {
      color: colors.textSecondary,
      fontSize: 16,
    },
    memoryInfo: {
      padding: 16,
      backgroundColor: colors.bgSurface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    memoryInfoText: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 4,
    },
    memoryTree: {
      padding: 16,
    },
    nodeContainer: {
      marginBottom: 4,
    },
    nodeHeader: {
      padding: 8,
      borderRadius: 6,
    },
    selectedNode: {
      backgroundColor: colors.accentSoft,
    },
    contextNode: {
      backgroundColor: `${colors.statusWarning}15`,
    },
    nodeContent: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    chevron: {
      marginRight: 4,
    },
    nodeIcon: {
      marginRight: 8,
    },
    nodeLabel: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    contextLabel: {
      fontWeight: 'bold' as const,
    },
    clearButton: {
      padding: 4,
    },
    nodeData: {
      marginTop: 8,
      padding: 12,
      backgroundColor: colors.bgSurface,
      borderRadius: 6,
      marginLeft: 20,
    },
    dataLabel: {
      fontSize: 12,
      fontWeight: 'bold' as const,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    dataValue: {
      fontSize: 14,
      color: colors.textPrimary,
      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    childrenContainer: {
      marginTop: 4,
    },
    searchResults: {
      padding: 16,
    },
    searchResultsTitle: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      marginBottom: 12,
      color: colors.textPrimary,
    },
    searchResult: {
      padding: 12,
      backgroundColor: colors.bgSurface,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
    },
    searchResultHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginBottom: 4,
    },
    searchResultPath: {
      fontSize: 14,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      flex: 1,
    },
    searchResultContext: {
      fontSize: 12,
      color: colors.textSecondary,
      backgroundColor: colors.borderLight,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 10,
    },
    searchResultData: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    searchResultRelevance: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: 'bold' as const,
    },
    noResults: {
      padding: 16,
      textAlign: 'center' as const,
      color: colors.textSecondary,
      fontStyle: 'italic' as const,
    },
    relationshipsContainer: {
      padding: 16,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
    },
    relationshipsTitle: {
      fontSize: 16,
      fontWeight: 'bold' as const,
      marginBottom: 12,
      color: colors.textPrimary,
    },
    relationship: {
      padding: 12,
      backgroundColor: `${colors.statusWarning}15`,
      borderRadius: 8,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.statusWarning,
    },
    relationshipText: {
      fontSize: 14,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    relationshipStrength: {
      fontSize: 12,
      color: colors.statusWarning,
      fontWeight: 'bold' as const,
    },
    emptyStateContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 32,
      minHeight: 400,
    },
    emptyStateTitle: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    emptyStateText: {
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center' as const,
      marginBottom: 12,
      lineHeight: 24,
    },
    emptyStateSubtext: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center' as const,
      fontStyle: 'italic' as const,
      lineHeight: 20,
      marginBottom: 16,
    },
    tooltipContainer: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: colors.bgHover,
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      maxWidth: 300,
    },
    tooltipText: {
      fontSize: 14,
      color: colors.textPrimary,
      marginLeft: 8,
      lineHeight: 20,
    },
    emptyMessage: {
      padding: 32,
      textAlign: 'center' as const,
      color: colors.textSecondary,
      fontSize: 16,
      fontStyle: 'italic' as const,
    },
  }));

  const { user, isAuthenticated } = useAuth();
  const [memoryData, setMemoryData] = useState<TeamMemory | null>(team.memory || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterContext, setFilterContext] = useState<string>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchResults, setSearchResults] = useState<MemorySearchResult[]>([]);

  // Load memory data
  const loadMemory = async () => {
    if (!isAuthenticated || !user) return;

    setLoading(true);
    setError(null);

    try {
      // Use the first agent in the team as the requesting agent, or create a dummy agent ID
      const agentId = user.id; // For now, use user ID as agent ID for team memory access

      const response = await goGentAPI.getTeamMemory(team.id, agentId, {
        context: filterContext === 'all' ? undefined : filterContext
      });

      if (response.success) {
        if (response.data) {
          setMemoryData(response.data as TeamMemory);
        } else {
          // No memory data exists yet - this is normal for new teams
          setMemoryData(null);
        }
      } else {
        setError(response.error || 'Failed to load team memory');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team memory');
    } finally {
      setLoading(false);
    }
  };

  // Search memory
  const searchMemory = async (query: string) => {
    if (!isAuthenticated || !user || !query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const agentId = user.id; // Use user ID as agent ID for team memory access
      const response = await goGentAPI.searchTeamMemory(team.id, agentId, {
        searchQuery: query,
        limit: 20
      });

      if (response.success) {
        setSearchResults(response.results || []);
      }
    } catch (err) {
      console.error('Team memory search failed:', err);
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
    if (!isAuthenticated || !user) return;

    if (Platform.OS === 'web') {
      if (!confirm(`Are you sure you want to clear the ${context} context from team memory? This action cannot be undone.`)) {
        return;
      }
    } else {
      Alert.alert(
        'Clear Team Memory Context',
        `Are you sure you want to clear the ${context} context from team memory? This action cannot be undone.`,
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
      const agentId = user!.id; // Use user ID as agent ID for team memory access
      const response = await goGentAPI.clearTeamMemory(team.id, agentId, {
        action: 'clear_context',
        context: context
      });

      if (response.success) {
        await loadMemory(); // Reload memory after clearing
      } else {
        setError(response.error || 'Failed to clear team memory');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear team memory');
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
                  ? 'folder-multiple'
                  : node.type === 'relationship'
                    ? 'link-variant'
                    : 'file-document-multiple'
              }
              size={16}
              color={
                node.type === 'context'
                  ? colors.accent
                  : node.type === 'relationship'
                    ? colors.statusWarning
                    : colors.accentSecondary
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
          <MaterialCommunityIcons name="account-group" size={24} color={colors.accent} />
          <Text style={styles.title}>
            {team.name} - Team Memory
          </Text>
        </View>
        <TouchableOpacity style={styles.closeButton} onPress={onClose} testID="close-button">
          <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search team memory..."
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
            <Text style={styles.loadingText}>Loading team memory...</Text>
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
                  <Text style={styles.emptyMessage}>No team memory data available</Text>
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
            <MaterialCommunityIcons name="account-group" size={64} color={colors.borderLight} />
            <Text style={styles.emptyStateTitle}>No Team Memory Yet</Text>
            <Text style={styles.emptyStateText}>
              This team hasn't stored any shared memory yet. Team memory will appear here once agents in the team start using team memory functions during execution.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Team memory functions: team_memory_write, team_memory_read, team_memory_search, team_memory_clear
            </Text>
            <View style={styles.tooltipContainer}>
              <MaterialCommunityIcons name="information" size={16} color={colors.textSecondary} />
              <Text style={styles.tooltipText}>
                Team memory allows agents to share information and collaborate on tasks. All agents in the team can read and write to this shared memory.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};
