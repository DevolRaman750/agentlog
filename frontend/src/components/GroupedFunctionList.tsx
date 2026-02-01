import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FunctionDefinition, FunctionApiKeyRequirements } from '../types';
import { useTheme, useThemedStyles } from '../theme';

export interface GroupedFunctionListProps {
  functions: FunctionDefinition[];
  selectedFunctions?: string[]; // Array of function IDs
  onFunctionPress?: (func: FunctionDefinition) => void;
  onFunctionLongPress?: (func: FunctionDefinition) => void;
  onFunctionToggle?: (func: FunctionDefinition, isSelected: boolean) => void;
  showSelectionCheckboxes?: boolean;
  showTypeLabels?: boolean;
  showEditActions?: boolean;
  showApiKeyStatus?: boolean; // New prop to show API key status
  apiKeyRequirements?: Record<string, FunctionApiKeyRequirements>; // Function ID -> requirements
  onEdit?: (func: FunctionDefinition) => void;
  onDelete?: (functionId: string) => void;
  onTest?: (func: FunctionDefinition) => void;
  onConfigureApiKeys?: (func: FunctionDefinition) => void; // New callback for API key configuration
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
  showApiKeyStatus = false,
  apiKeyRequirements,
  onEdit,
  onDelete,
  onTest,
  onConfigureApiKeys,
  emptyMessage = 'No functions available',
  defaultFunctionType = 'api',
  style,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
    },
    group: {
      marginBottom: 24,
    },
    groupHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.bgApp,
      borderRadius: 8,
      marginBottom: 8,
    },
    groupTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    groupCount: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    typeGroup: {
      marginBottom: 12,
    },
    typeHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.bgCard,
      borderRadius: 6,
      marginBottom: 4,
      gap: 8,
    },
    typeTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
    },
    typeCount: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    functionItem: {
      backgroundColor: colors.bgCard,
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      marginHorizontal: 8,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    selectedFunctionItem: {
      backgroundColor: '#E8F4FD',
      borderWidth: 1,
      borderColor: colors.accent,
    },
    functionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
    },
    functionInfo: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      gap: 12,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: colors.textTertiary,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: 2,
    },
    checkedCheckbox: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    functionDetails: {
      flex: 1,
    },
    functionName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    functionDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    functionMeta: {
      flexDirection: 'row' as const,
      gap: 16,
    },
    metaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    actionButtons: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.bgApp,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      paddingVertical: 64,
    },
    emptyMessage: {
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 16,
      textAlign: 'center' as const,
    },
  }));

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

      // Most functions from backend don't have functionType set, which is fine - they default to 'api'
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
    return type === 'api' ? colors.accent : colors.statusSuccess;
  };

  // API Key Status Helper Functions
  const getApiKeyStatus = (func: FunctionDefinition): 'configured' | 'partial' | 'missing' | 'unknown' => {
    if (!showApiKeyStatus || !apiKeyRequirements) return 'unknown';

    const requirements = apiKeyRequirements[func.id];
    if (!requirements) return 'unknown';

    if (requirements.allKeysConfigured) return 'configured';
    if (requirements.configuredServices.length > 0) return 'partial';
    return 'missing';
  };

  const getApiKeyStatusIcon = (status: string) => {
    switch (status) {
      case 'configured':
        return 'checkmark-circle';
      case 'partial':
        return 'warning';
      case 'missing':
        return 'close-circle';
      case 'unknown':
      default:
        return 'help-circle';
    }
  };

  const getApiKeyStatusColor = (status: string) => {
    switch (status) {
      case 'configured':
        return colors.statusSuccess;
      case 'partial':
        return colors.statusWarning;
      case 'missing':
        return colors.statusError;
      case 'unknown':
      default:
        return colors.textSecondary;
    }
  };

  const getApiKeyStatusText = (func: FunctionDefinition): string => {
    if (!showApiKeyStatus || !apiKeyRequirements) return '';

    const requirements = apiKeyRequirements[func.id];
    if (!requirements) return 'Unknown';

    if (requirements.allKeysConfigured) {
      return `${requirements.configuredServices.length} keys ready`;
    } else if (requirements.configuredServices.length > 0) {
      return `${requirements.configuredServices.length}/${requirements.requiredServices.length} keys`;
    } else {
      return `${requirements.requiredServices.length} keys needed`;
    }
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
    const apiKeyStatus = getApiKeyStatus(func);

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
                  <Ionicons name="code-outline" size={12} color={colors.textSecondary} />
                  <Text style={styles.metaText}>{func.httpMethod || 'GET'}</Text>
                </View>
                {showApiKeyStatus && (
                  <View style={styles.metaItem}>
                    <Ionicons
                      name={getApiKeyStatusIcon(apiKeyStatus)}
                      size={12}
                      color={getApiKeyStatusColor(apiKeyStatus)}
                    />
                    <Text style={[styles.metaText, { color: getApiKeyStatusColor(apiKeyStatus) }]}>
                      {getApiKeyStatusText(func)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {showEditActions && (
            <View style={styles.actionButtons}>
              {showApiKeyStatus && apiKeyStatus !== 'configured' && onConfigureApiKeys && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onConfigureApiKeys(func)}
                >
                  <Ionicons name="key-outline" size={18} color={colors.statusWarning} />
                </TouchableOpacity>
              )}
              {onTest && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onTest(func)}
                >
                  <Ionicons name="play-outline" size={18} color={colors.statusSuccess} />
                </TouchableOpacity>
              )}
              {onEdit && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onEdit(func)}
                >
                  <Ionicons name="create-outline" size={18} color={colors.accent} />
                </TouchableOpacity>
              )}
              {onDelete && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => onDelete(func.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.statusError} />
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
        <Ionicons name="code-slash-outline" size={48} color={colors.textTertiary} />
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

export default GroupedFunctionList;
