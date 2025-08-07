import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  StyleSheet,
  TextInput,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FunctionDefinition } from '../types';
import { useResponsive } from '../context/ResponsiveContext';

interface FunctionsModalProps {
  visible: boolean;
  onClose: () => void;
  functions: FunctionDefinition[];
  selectedFunctions: string[];
  onSelectionChange: (functionIds: string[]) => void;
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
            <Ionicons name="code" size={12} color="#666" />
            <Text style={styles.functionMetaText}>Function</Text>
          </View>
          
          {func.parametersSchema && Object.keys(func.parametersSchema.properties || {}).length > 0 && (
            <View style={styles.functionMetaItem}>
              <Ionicons name="list" size={12} color="#666" />
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
              color={selectionState !== 'none' ? '#007AFF' : '#666'} 
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
            <Ionicons name="close" size={24} color="#007AFF" />
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
            <Ionicons name="search" size={16} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search functions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#666" />
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
            <ActivityIndicator size="large" color="#007AFF" />
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
                <Ionicons name="extension-puzzle-outline" size={48} color="#999" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 8, // Increased for better touch target
    minWidth: 60,
    minHeight: 44, // Ensure minimum touch target size
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButton: {
    alignItems: 'flex-end',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34C759',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  controls: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  bulkActions: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  bulkButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
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
    gap: 6,
  },
  selectAllText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  selectAllTextActive: {
    color: '#007AFF',
  },
  functionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  functionCardSelected: {
    borderColor: '#34C759',
    backgroundColor: '#F8FFF9',
  },
  functionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  functionInfo: {
    flex: 1,
    marginRight: 12,
  },
  functionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  functionNameSelected: {
    color: '#34C759',
  },
  functionCategory: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  functionCategorySelected: {
    color: '#2D7D32',
    backgroundColor: '#E8F5E8',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  functionDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  functionDescriptionSelected: {
    color: '#2D7D32',
  },
  functionMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  functionMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  functionMetaText: {
    fontSize: 12,
    color: '#666',
  },
});

export default FunctionsModal;