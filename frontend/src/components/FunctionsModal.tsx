import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FunctionDefinition } from '../types';
import { useResponsive } from '../context/ResponsiveContext';
import { useTheme, useThemedStyles } from '../theme';
import { ThemeColors } from '../theme';

interface FunctionsModalProps {
  visible: boolean;
  onClose: () => void;
  functions: FunctionDefinition[];
  selectedFunctions: string[];
  onSelectionChange: (functionIDs: string[]) => void;
  isLoading?: boolean;
}

interface FunctionGroup {
  name: string;
  functions: FunctionDefinition[];
}

const FunctionsModal: React.FC<FunctionsModalProps> = ({
  visible,
  onClose,
  functions,
  selectedFunctions,
  onSelectionChange,
  isLoading = false,
}) => {
  const { screenWidth } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useTheme();

  const styles = useThemedStyles((colors: ThemeColors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgApp,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerButton: {
      padding: 8,
      minWidth: 60,
      minHeight: 44,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    doneButton: {
      alignItems: 'flex-end' as const,
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    subtitle: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: 16,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    subtitleText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 8,
    },
    selectionInfo: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
    },
    selectionCount: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.statusSuccess,
      backgroundColor: `${colors.statusSuccess}15`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    controls: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    searchContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgSurface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
      gap: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: colors.textPrimary,
    },
    bulkActions: {
      flexDirection: 'row' as const,
      gap: 12,
    },
    bulkButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.bgSurface,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    bulkButtonText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.accent,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: 20,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: colors.textSecondary,
    },
    scrollContent: {
      flex: 1,
    },
    scrollContentContainer: {
      padding: 16,
    },
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: 60,
      paddingHorizontal: 20,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    emptyStateText: {
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: 'center' as const,
      lineHeight: 20,
    },
    functionGroupContainer: {
      marginBottom: 24,
    },
    groupHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    functionGroupTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    selectAllButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.bgSurface,
      gap: 6,
    },
    selectAllText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    selectAllTextActive: {
      color: colors.accent,
    },
    functionCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 8,
      borderWidth: 2,
      borderColor: colors.borderLight,
    },
    functionCardSelected: {
      borderColor: colors.statusSuccess,
      backgroundColor: `${colors.statusSuccess}10`,
    },
    functionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 8,
    },
    functionInfo: {
      flex: 1,
      marginRight: 12,
    },
    functionName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    functionNameSelected: {
      color: colors.statusSuccess,
    },
    functionCategory: {
      fontSize: 12,
      color: colors.textSecondary,
      backgroundColor: colors.bgSurface,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start' as const,
    },
    functionCategorySelected: {
      color: colors.statusSuccess,
      backgroundColor: `${colors.statusSuccess}15`,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: colors.borderLight,
      backgroundColor: colors.bgCard,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    checkboxSelected: {
      backgroundColor: colors.statusSuccess,
      borderColor: colors.statusSuccess,
    },
    functionDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    functionDescriptionSelected: {
      color: colors.statusSuccess,
    },
    functionMeta: {
      flexDirection: 'row' as const,
      gap: 16,
    },
    functionMetaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    functionMetaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  }));

  const functionGroups = useMemo(() => {
    const groups: { [key: string]: FunctionDefinition[] } = {};

    functions.forEach(func => {
      const category = func.functionGroup || 'General';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(func);
    });

    return Object.entries(groups).map(([name, funcs]) => ({
      name,
      functions: funcs.sort((a, b) => a.name.localeCompare(b.name))
    }));
  }, [functions]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return functionGroups;

    const query = searchQuery.toLowerCase();
    return functionGroups.map(group => ({
      ...group,
      functions: group.functions.filter(func =>
        func.name.toLowerCase().includes(query) ||
        func.description?.toLowerCase().includes(query) ||
        func.functionGroup?.toLowerCase().includes(query)
      )
    })).filter(group => group.functions.length > 0);
  }, [functionGroups, searchQuery]);

  const toggleFunction = (functionId: string) => {
    const newSelection = selectedFunctions.includes(functionId)
      ? selectedFunctions.filter(id => id !== functionId)
      : [...selectedFunctions, functionId];

    onSelectionChange(newSelection);
  };

  const toggleGroupSelection = (groupFunctions: FunctionDefinition[]) => {
    const groupFunctionIds = groupFunctions.map(f => f.id);
    const selectedInGroup = groupFunctionIds.filter(id => selectedFunctions.includes(id));

    if (selectedInGroup.length === groupFunctionIds.length) {
      // All selected, deselect all
      const newSelection = selectedFunctions.filter(id => !groupFunctionIds.includes(id));
      onSelectionChange(newSelection);
    } else {
      // Not all selected, select all
      const newSelection = [...new Set([...selectedFunctions, ...groupFunctionIds])];
      onSelectionChange(newSelection);
    }
  };

  const getGroupSelectionState = (groupFunctions: FunctionDefinition[]) => {
    const groupFunctionIds = groupFunctions.map(f => f.id);
    const selectedInGroup = groupFunctionIds.filter(id => selectedFunctions.includes(id));

    if (selectedInGroup.length === 0) return 'none';
    if (selectedInGroup.length === groupFunctionIds.length) return 'all';
    return 'partial';
  };

  const selectAll = () => {
    const allFunctionIds = functions.map(func => func.id);
    onSelectionChange(allFunctionIds);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const renderFunctionCard = (func: FunctionDefinition) => {
    const isSelected = selectedFunctions.includes(func.id);

    return (
      <TouchableOpacity
        key={func.id}
        style={[styles.functionCard, isSelected && styles.functionCardSelected]}
        onPress={() => toggleFunction(func.id)}
        activeOpacity={0.7}
      >
        <View style={styles.functionHeader}>
          <View style={styles.functionInfo}>
            <Text style={[styles.functionName, isSelected && styles.functionNameSelected]}>
              {func.name}
            </Text>
            {func.functionGroup && (
              <Text style={[styles.functionCategory, isSelected && styles.functionCategorySelected]}>
                {func.functionGroup}
              </Text>
            )}
          </View>

          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && (
              <Ionicons name="checkmark" size={14} color="white" />
            )}
          </View>
        </View>

        {func.description && (
          <Text
            style={[styles.functionDescription, isSelected && styles.functionDescriptionSelected]}
            numberOfLines={2}
          >
            {func.description}
          </Text>
        )}

        <View style={styles.functionMeta}>
          <View style={styles.functionMetaItem}>
            <Ionicons name="code" size={12} color={colors.textSecondary} />
            <Text style={styles.functionMetaText}>Function</Text>
          </View>

          {func.parametersSchema && Object.keys(func.parametersSchema.properties || {}).length > 0 && (
            <View style={styles.functionMetaItem}>
              <Ionicons name="list" size={12} color={colors.textSecondary} />
              <Text style={styles.functionMetaText}>
                {Object.keys(func.parametersSchema.properties).length} params
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFunctionGroup = (group: FunctionGroup) => {
    const selectionState = getGroupSelectionState(group.functions);

    return (
      <View key={group.name} style={styles.functionGroupContainer}>
        <View style={styles.groupHeader}>
          <Text style={styles.functionGroupTitle}>{group.name}</Text>

          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={() => toggleGroupSelection(group.functions)}
          >
            <Ionicons
              name={
                selectionState === 'all' ? 'checkmark-circle' :
                selectionState === 'partial' ? 'remove-circle' : 'ellipse-outline'
              }
              size={16}
              color={selectionState !== 'none' ? colors.accent : colors.textSecondary}
            />
            <Text style={[
              styles.selectAllText,
              selectionState !== 'none' && styles.selectAllTextActive
            ]}>
              {selectionState === 'all' ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        </View>

        {group.functions.map(renderFunctionCard)}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.accent} />
          </TouchableOpacity>

          <Text style={styles.title}>AI Functions</Text>

          <TouchableOpacity
            onPress={onClose}
            style={[styles.headerButton, styles.doneButton]}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Subtitle and selection info */}
        <View style={styles.subtitle}>
          <Text style={styles.subtitleText}>
            Enable AI functions to access external services like web search, databases, or APIs during execution
          </Text>

          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {selectedFunctions.length} selected
            </Text>
          </View>
        </View>

        {/* Search and controls */}
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search functions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textTertiary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.bulkActions}>
            <TouchableOpacity onPress={selectAll} style={styles.bulkButton}>
              <Text style={styles.bulkButtonText}>Select All</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={clearAll} style={styles.bulkButton}>
              <Text style={styles.bulkButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={styles.loadingText}>Loading functions...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredGroups.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="extension-puzzle-outline" size={48} color={colors.textTertiary} />
                <Text style={styles.emptyStateTitle}>
                  {searchQuery ? 'No matching functions' : 'No functions available'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery
                    ? 'Try adjusting your search terms'
                    : 'Functions will appear here when they are configured'
                  }
                </Text>
              </View>
            ) : (
              filteredGroups.map(renderFunctionGroup)
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default FunctionsModal;
