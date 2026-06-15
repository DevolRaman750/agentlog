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
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerButton: {
      padding: spacing.sm,
      minWidth: 60,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    doneButton: {
      alignItems: 'flex-end' as const,
    },
    doneButtonText: {
      ...typography.title,
      color: colors.accent,
    },
    title: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    subtitle: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    subtitleText: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    selectionInfo: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
    },
    selectionCount: {
      ...typography.bodyStrong,
      color: colors.statusSuccess,
      backgroundColor: `${colors.statusSuccess}15`,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    controls: {
      backgroundColor: colors.bgCard,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    searchContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    searchInput: {
      flex: 1,
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textPrimary,
    },
    bulkActions: {
      flexDirection: 'row' as const,
      gap: spacing.md,
    },
    bulkButton: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    bulkButtonText: {
      ...typography.label,
      color: colors.accent,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
    },
    loadingText: {
      marginTop: spacing.md,
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
    },
    scrollContent: {
      flex: 1,
    },
    scrollContentContainer: {
      padding: spacing.lg,
    },
    emptyState: {
      alignItems: 'center' as const,
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
    },
    emptyStateTitle: {
      ...typography.h2,
      color: colors.textSecondary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      textAlign: 'center' as const,
    },
    emptyStateText: {
      ...typography.body,
      color: colors.textTertiary,
      textAlign: 'center' as const,
    },
    functionGroupContainer: {
      marginBottom: spacing.xl,
    },
    groupHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
      paddingBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    functionGroupTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    selectAllButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      backgroundColor: colors.bgSurface,
      gap: spacing.sm,
    },
    selectAllText: {
      ...typography.label,
      color: colors.textSecondary,
    },
    selectAllTextActive: {
      color: colors.accent,
    },
    functionCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
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
      marginBottom: spacing.sm,
    },
    functionInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    functionName: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    functionNameSelected: {
      color: colors.statusSuccess,
    },
    functionCategory: {
      ...typography.caption,
      color: colors.textSecondary,
      backgroundColor: colors.bgSurface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      alignSelf: 'flex-start' as const,
    },
    functionCategorySelected: {
      color: colors.statusSuccess,
      backgroundColor: `${colors.statusSuccess}15`,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: radius.lg,
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
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    functionDescriptionSelected: {
      color: colors.statusSuccess,
    },
    functionMeta: {
      flexDirection: 'row' as const,
      gap: spacing.lg,
    },
    functionMetaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    functionMetaText: {
      ...typography.caption,
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
              <Ionicons name="checkmark" size={14} color={colors.textInverse} />
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
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
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
