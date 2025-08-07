import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FunctionDefinition } from '../types';
import { StyleSheet } from 'react-native';

interface FunctionSelectorProps {
  visible: boolean;
  onClose: () => void;
  functions: FunctionDefinition[];
  selectedFunctions: string[];
  onSelectionChange: (functionIds: string[]) => void;
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
                <Ionicons name="close" size={24} color="#666" />
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
                      onPress={() => toggleGroupSelection(group.data)}
                    >
                      <Ionicons 
                        name={
                          selectionState === 'all' ? 'checkmark-circle' :
                          selectionState === 'partial' ? 'remove-circle' : 'ellipse-outline'
                        } 
                        size={20} 
                        color={
                          selectionState === 'all' ? '#007AFF' :
                          selectionState === 'partial' ? '#FF9500' : '#C7C7CC'
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
                                  <Ionicons name="key" size={14} color="#FF9500" />
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
                              color={isSelected ? "#007AFF" : "#C7C7CC"}
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

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 0,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8, // Increased for better touch target
    minWidth: 44, // Ensure minimum touch target size
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubheader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B6B6B',
    flex: 1,
    marginRight: 12,
  },
  selectedCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    backgroundColor: '#F0F8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  functionGroupContainer: {
    marginBottom: 24,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  functionGroupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  selectAllText: {
    fontSize: 14,
    color: '#6B6B6B',
    marginLeft: 6,
    fontWeight: '500',
  },
  selectAllTextActive: {
    color: '#007AFF',
  },
  functionCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  functionCardSelected: {
    backgroundColor: '#E8F4FD',
    borderColor: '#007AFF',
  },
  functionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  functionInfo: {
    flex: 1,
    marginRight: 12,
  },
  functionDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  functionDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 18,
    marginBottom: 8,
  },
  functionMeta: {
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 12,
    color: '#FF9500',
    marginLeft: 4,
    fontWeight: '500',
  },
  checkboxContainer: {
    marginTop: 2,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  doneButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
}); 