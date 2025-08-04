import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FunctionDefinition } from '../types';

export interface GroupedFunctionListProps {
  functions: FunctionDefinition[];
  selectedFunctions?: string[]; // Array of function IDs
  onFunctionPress?: (func: FunctionDefinition) => void;
  onFunctionLongPress?: (func: FunctionDefinition) => void;
  onFunctionToggle?: (func: FunctionDefinition, isSelected: boolean) => void;
  showSelectionCheckboxes?: boolean;
  showTypeLabels?: boolean;
  showEditActions?: boolean;
  onEdit?: (func: FunctionDefinition) => void;
  onDelete?: (functionId: string) => void;
  onTest?: (func: FunctionDefinition) => void;
  emptyMessage?: string;
  defaultFunctionType?: 'api' | 'mcp'; // Default type for functions missing functionType
  style?: any;
}

interface GroupedFunctions {
  title: string;
  data: FunctionTypeGroup[];
}

interface FunctionTypeGroup {
  type: 'api' | 'mcp';
  typeName: string;
  functions: FunctionDefinition[];
}

const GroupedFunctionList: React.FC<GroupedFunctionListProps> = ({
  functions,
  selectedFunctions = [],
  onFunctionPress,
  onFunctionLongPress,
  onFunctionToggle,
  showSelectionCheckboxes = false,
  showTypeLabels = true,
  showEditActions = false,
  onEdit,
  onDelete,
  onTest,
  emptyMessage = 'No functions available',
  defaultFunctionType = 'api',
  style,
}) => {
  // Group functions by domain (function_group) and then by type (function_type)
  const groupedFunctions: GroupedFunctions[] = React.useMemo(() => {
    if (!functions.length) return [];

    const grouped = functions.reduce((acc, func) => {
      // Safely handle missing or invalid properties
      if (!func || typeof func !== 'object') {
        console.warn('GroupedFunctionList: Invalid function object:', func);
        return acc;
      }
      
      const groupName = func.functionGroup || 'general';
      const functionType = func.functionType === 'mcp' ? 'mcp' : 
                          func.functionType === 'api' ? 'api' : 
                          defaultFunctionType; // Use prop default for missing/invalid types
      
      // Log warning for functions with missing critical data
      if (!func.functionType) {
        console.warn(`GroupedFunctionList: Function missing functionType, defaulting to "${defaultFunctionType}":`, func.name || func.id);
      }
      if (!func.functionGroup) {
        console.warn('GroupedFunctionList: Function missing functionGroup, defaulting to "general":', func.name || func.id);
      }
      
      if (!acc[groupName]) {
        acc[groupName] = {
          api: [],
          mcp: [],
        };
      }
      
      // Safely push to the correct array
      acc[groupName][functionType].push(func);
      return acc;
    }, {} as Record<string, { api: FunctionDefinition[]; mcp: FunctionDefinition[] }>);

    return Object.entries(grouped)
      .map(([groupName, types]) => {
        const data: FunctionTypeGroup[] = [];
        
        // Add API functions if any
        if (types.api.length > 0) {
          data.push({
            type: 'api',
            typeName: 'API Functions',
            functions: types.api,
          });
        }
        
        // Add MCP functions if any
        if (types.mcp.length > 0) {
          data.push({
            type: 'mcp',
            typeName: 'MCP Functions',
            functions: types.mcp,
          });
        }

        return {
          title: groupName.charAt(0).toUpperCase() + groupName.slice(1),
          data,
        };
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [functions]);

  const getFunctionTypeIcon = (type: 'api' | 'mcp') => {
    return type === 'api' ? 'globe-outline' : 'code-working-outline';
  };

  const getFunctionTypeColor = (type: 'api' | 'mcp') => {
    return type === 'api' ? '#007AFF' : '#34C759';
  };

  const isSelected = (functionId: string) => {
    return selectedFunctions.includes(functionId);
  };

  const handleFunctionPress = (func: FunctionDefinition) => {
    if (showSelectionCheckboxes && onFunctionToggle) {
      onFunctionToggle(func, !isSelected(func.id));
    } else if (onFunctionPress) {
      onFunctionPress(func);
    }
  };

  const renderFunctionItem = (func: FunctionDefinition) => {
    const selected = isSelected(func.id);
    const safeType = func.functionType === 'mcp' ? 'mcp' : 
                    func.functionType === 'api' ? 'api' : 
                    defaultFunctionType;
    
    return (
      <TouchableOpacity
        key={func.id}
        style={[
          styles.functionItem,
          selected && styles.selectedFunctionItem
        ]}
        onPress={() => handleFunctionPress(func)}
        onLongPress={() => onFunctionLongPress?.(func)}
      >
        <View style={styles.functionHeader}>
          <View style={styles.functionInfo}>
            {showSelectionCheckboxes && (
              <View style={[styles.checkbox, selected && styles.checkedCheckbox]}>
                {selected && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
            )}
            <View style={styles.functionDetails}>
              <Text style={styles.functionName}>{func.displayName || func.name || 'Unnamed Function'}</Text>
              <Text style={styles.functionDescription} numberOfLines={2}>
                {func.description || 'No description available'}
              </Text>
              <View style={styles.functionMeta}>
                <View style={styles.metaItem}>
                  <Ionicons 
                    name={getFunctionTypeIcon(safeType)} 
                    size={12} 
                    color={getFunctionTypeColor(safeType)} 
                  />
                  <Text style={[styles.metaText, { color: getFunctionTypeColor(safeType) }]}>
                    {safeType.toUpperCase()}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="code-outline" size={12} color="#8E8E93" />
                  <Text style={styles.metaText}>{func.httpMethod || 'GET'}</Text>
                </View>
              </View>
            </View>
          </View>

          {showEditActions && (
            <View style={styles.actionButtons}>
              {onTest && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onTest(func)}
                >
                  <Ionicons name="play-outline" size={18} color="#34C759" />
                </TouchableOpacity>
              )}
              {onEdit && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onEdit(func)}
                >
                  <Ionicons name="create-outline" size={18} color="#007AFF" />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onDelete(func.id)}
                >
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTypeGroup = (typeGroup: FunctionTypeGroup) => {
    return (
      <View key={typeGroup.type} style={styles.typeGroup}>
        {showTypeLabels && (
          <View style={styles.typeHeader}>
            <Ionicons 
              name={getFunctionTypeIcon(typeGroup.type)} 
              size={16} 
              color={getFunctionTypeColor(typeGroup.type)} 
            />
            <Text style={[styles.typeTitle, { color: getFunctionTypeColor(typeGroup.type) }]}>
              {typeGroup.typeName}
            </Text>
            <Text style={styles.typeCount}>({typeGroup.functions.length})</Text>
          </View>
        )}
        {typeGroup.functions.map(renderFunctionItem)}
      </View>
    );
  };

  const renderGroupHeader = (group: GroupedFunctions) => (
    <View style={styles.groupHeader}>
      <Text style={styles.groupTitle}>{group.title}</Text>
      <Text style={styles.groupCount}>
        {group.data.reduce((sum, typeGroup) => sum + typeGroup.functions.length, 0)} functions
      </Text>
    </View>
  );

  if (functions.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Ionicons name="code-slash-outline" size={48} color="#C7C7CC" />
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {groupedFunctions.map((group) => (
        <View key={group.title} style={styles.group}>
          {renderGroupHeader(group)}
          {group.data.map(renderTypeGroup)}
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  group: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  groupCount: {
    fontSize: 14,
    color: '#8E8E93',
  },
  typeGroup: {
    marginBottom: 12,
  },
  typeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    marginBottom: 4,
    gap: 8,
  },
  typeTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  typeCount: {
    fontSize: 12,
    color: '#8E8E93',
  },
  functionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedFunctionItem: {
    backgroundColor: '#E8F4FD',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  functionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  functionInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkedCheckbox: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  functionDetails: {
    flex: 1,
  },
  functionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  functionDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
    marginBottom: 8,
  },
  functionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F2F2F7',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default GroupedFunctionList; 