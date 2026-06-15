import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FunctionDefinition } from '../types';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

interface FunctionSelectorProps {
  visible: boolean;
  onClose: () => void;
  functions: FunctionDefinition[];
  selectedFunctions: string[];
  onSelectionChange: (functionIDs: string[]) => void;
  title?: string;
  subtitle?: string;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  visible,
  onClose,
  functions,
  selectedFunctions,
  onSelectionChange,
  title = "Select Functions",
  subtitle = "Add AI functions to extend capabilities with external data and services"
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.bgOverlay,
      justifyContent: 'flex-end' as const,
    },
    modalContainer: {
      backgroundColor: colors.bgCard,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      maxHeight: '85%' as const,
      paddingBottom: 0,
    },
    modalHeader: {
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    headerContent: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    modalTitle: {
      ...typography.h1,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.sm,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    modalSubheader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginTop: spacing.sm,
    },
    modalSubtitle: {
      ...typography.body,
      color: colors.textSecondary,
      flex: 1,
      marginRight: spacing.md,
    },
    selectedCount: {
      ...typography.bodyStrong,
      color: colors.accent,
      backgroundColor: colors.bgHover,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    modalContent: {
      flex: 1,
      paddingHorizontal: spacing.lg,
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
      borderBottomColor: colors.bgSurface,
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
    },
    selectAllText: {
      ...typography.body,
      color: colors.textSecondary,
      marginLeft: spacing.sm,
      fontWeight: '500' as const,
    },
    selectAllTextActive: {
      color: colors.accent,
    },
    functionCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: 'transparent',
    },
    functionCardSelected: {
      backgroundColor: colors.accentSoft,
      borderColor: colors.accent,
    },
    functionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
    },
    functionInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    functionDisplayName: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    functionDescription: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    functionMeta: {
      marginTop: spacing.xs,
    },
    metaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    metaValue: {
      ...typography.caption,
      color: colors.statusWarning,
      marginLeft: spacing.xs,
      fontWeight: '500' as const,
    },
    checkboxContainer: {
      marginTop: 2,
    },
    modalFooter: {
      padding: spacing.lg,
      borderTopWidth: 1,
      borderTopColor: colors.borderLight,
      backgroundColor: colors.bgCard,
    },
    doneButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.lg,
      padding: spacing.lg,
      alignItems: 'center' as const,
    },
    doneButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
  }));

  // Group functions by functionGroup
  const groupedFunctions = useMemo(() => {
    const activeFunctions = functions.filter(func => func.isActive);

    if (activeFunctions.length === 0) {
      return [] as Array<{ title: string; data: FunctionDefinition[] }>;
    }

    const groups = activeFunctions.reduce((acc, func) => {
      const group = func.functionGroup || 'Other';
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(func);
      return acc;
    }, {} as Record<string, FunctionDefinition[]>);

    return Object.entries(groups).map(([title, data]) => ({ title, data }));
  }, [functions]);

  const toggleFunction = (functionId: string) => {
    const newSelection = selectedFunctions.includes(functionId)
      ? selectedFunctions.filter(id => id !== functionId)
      : [...selectedFunctions, functionId];
    onSelectionChange(newSelection);
  };

  const toggleGroupSelection = (groupFunctions: FunctionDefinition[]) => {
    const groupFunctionIds = groupFunctions.map(f => f.id);
    const allGroupSelected = groupFunctionIds.every(id => selectedFunctions.includes(id));

    if (allGroupSelected) {
      // Deselect all functions in this group
      const newSelection = selectedFunctions.filter(id => !groupFunctionIds.includes(id));
      onSelectionChange(newSelection);
    } else {
      // Select all functions in this group
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

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.headerContent}>
              <Text style={styles.modalTitle}>{title}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSubheader}>
              <Text style={styles.modalSubtitle}>{subtitle}</Text>
              <Text style={styles.selectedCount}>
                {selectedFunctions.length} selected
              </Text>
            </View>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {groupedFunctions.map((group) => {
              const selectionState = getGroupSelectionState(group.data);
              return (
                <View key={group.title} style={styles.functionGroupContainer}>
                  <View style={styles.groupHeader}>
                    <Text style={styles.functionGroupTitle}>{group.title}</Text>
                    <TouchableOpacity
                      style={styles.selectAllButton}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => toggleGroupSelection(group.data)}
                    >
                      <Ionicons
                        name={
                          selectionState === 'all' ? 'checkmark-circle' :
                          selectionState === 'partial' ? 'remove-circle' : 'ellipse-outline'
                        }
                        size={20}
                        color={
                          selectionState === 'all' ? colors.accent :
                          selectionState === 'partial' ? colors.statusWarning : colors.textTertiary
                        }
                      />
                      <Text style={[
                        styles.selectAllText,
                        selectionState !== 'none' && styles.selectAllTextActive
                      ]}>
                        {selectionState === 'all' ? 'Deselect All' : 'Select All'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {group.data.map((func) => {
                    const isSelected = selectedFunctions.includes(func.id);
                    return (
                      <TouchableOpacity
                        key={func.id}
                        style={[
                          styles.functionCard,
                          isSelected && styles.functionCardSelected
                        ]}
                        onPress={() => toggleFunction(func.id)}
                      >
                        <View style={styles.functionHeader}>
                          <View style={styles.functionInfo}>
                            <Text style={styles.functionDisplayName}>{func.displayName || func.name}</Text>
                            <Text style={styles.functionDescription} numberOfLines={2}>
                              {func.description}
                            </Text>
                            {func.requiredApiKeys && func.requiredApiKeys.length > 0 && (
                              <View style={styles.functionMeta}>
                                <View style={styles.metaItem}>
                                  <Ionicons name="key" size={14} color={colors.statusWarning} />
                                  <Text style={styles.metaValue}>
                                    Requires: {func.requiredApiKeys.join(', ')} API key{func.requiredApiKeys.length > 1 ? 's' : ''}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                          <View style={styles.checkboxContainer}>
                            <Ionicons
                              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
                              size={24}
                              color={isSelected ? colors.accent : colors.textTertiary}
                            />
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.doneButton} onPress={onClose}>
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};
