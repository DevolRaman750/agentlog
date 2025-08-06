import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  StyleSheet,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APIConfiguration } from '../types';
import { useResponsive } from '../context/ResponsiveContext';

interface ConfigurationModalProps {
  visible: boolean;
  onClose: () => void;
  configurations: APIConfiguration[];
  selectedConfigurations: string[];
  onSelectionChange: (configIds: string[]) => void;
  isLoading?: boolean;
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  visible,
  onClose,
  configurations,
  selectedConfigurations,
  onSelectionChange,
  isLoading = false,
}) => {
  const { screenWidth } = useResponsive();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConfigurations = useMemo(() => {
    if (!searchQuery.trim()) return configurations;
    
    const query = searchQuery.toLowerCase();
    return configurations.filter(config => 
      config.variationName.toLowerCase().includes(query) ||
      config.modelName.toLowerCase().includes(query) ||
      config.systemPrompt?.toLowerCase().includes(query)
    );
  }, [configurations, searchQuery]);

  const toggleConfiguration = (configId: string) => {
    const newSelection = selectedConfigurations.includes(configId)
      ? selectedConfigurations.filter(id => id !== configId)
      : [...selectedConfigurations, configId];
    
    onSelectionChange(newSelection);
  };

  const selectAll = () => {
    onSelectionChange(filteredConfigurations.map(config => config.id));
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const renderConfigurationCard = (config: APIConfiguration) => {
    const isSelected = selectedConfigurations.includes(config.id);
    
    return (
      <TouchableOpacity
        key={config.id}
        style={[styles.configCard, isSelected && styles.configCardSelected]}
        onPress={() => toggleConfiguration(config.id)}
        activeOpacity={0.7}
      >
        <View style={styles.configHeader}>
          <View style={styles.configInfo}>
            <Text style={[styles.configName, isSelected && styles.configNameSelected]}>
              {config.variationName}
            </Text>
            <Text style={[styles.configModel, isSelected && styles.configModelSelected]}>
              {config.modelName}
            </Text>
          </View>
          
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </View>
        </View>
        
        {config.systemPrompt && (
          <Text 
            style={[styles.configPrompt, isSelected && styles.configPromptSelected]} 
            numberOfLines={2}
          >
            {config.systemPrompt}
          </Text>
        )}
        
        <View style={styles.configMeta}>
          <View style={styles.configMetaItem}>
            <Ionicons name="thermometer" size={12} color="#666" />
            <Text style={styles.configMetaText}>Temp: {config.temperature}</Text>
          </View>
          
          {config.maxTokens && (
            <View style={styles.configMetaItem}>
              <Ionicons name="flash" size={12} color="#666" />
              <Text style={styles.configMetaText}>Max: {config.maxTokens}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
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
          
          <Text style={styles.title}>AI Configurations</Text>
          
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
            Choose which AI model configurations to test your prompt against
          </Text>
          
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {selectedConfigurations.length} selected
            </Text>
          </View>
        </View>
        
        {/* Search and controls */}
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search configurations..."
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
            <Text style={styles.loadingText}>Loading configurations...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.scrollContent} 
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {filteredConfigurations.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="settings-outline" size={48} color="#999" />
                <Text style={styles.emptyStateTitle}>
                  {searchQuery ? 'No matching configurations' : 'No configurations available'}
                </Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery 
                    ? 'Try adjusting your search terms'
                    : 'Create configurations in the Configure tab first'
                  }
                </Text>
              </View>
            ) : (
              filteredConfigurations.map(renderConfigurationCard)
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
    padding: 4,
    minWidth: 60,
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
    color: '#007AFF',
    backgroundColor: '#F0F8FF',
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
  configCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
  },
  configCardSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#F8FBFF',
  },
  configHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  configInfo: {
    flex: 1,
    marginRight: 12,
  },
  configName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  configNameSelected: {
    color: '#007AFF',
  },
  configModel: {
    fontSize: 14,
    color: '#666',
  },
  configModelSelected: {
    color: '#0056CC',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  configPrompt: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginBottom: 8,
  },
  configPromptSelected: {
    color: '#0056CC',
  },
  configMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  configMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  configMetaText: {
    fontSize: 12,
    color: '#666',
  },
});

export default ConfigurationModal;