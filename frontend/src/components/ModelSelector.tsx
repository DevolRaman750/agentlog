import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { APIConfiguration } from '../types';

const { width } = Dimensions.get('window');

// Model information interface
export interface ModelInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'gemini' | 'gpt' | 'claude' | 'kimi' | 'openrouter' | 'other';
  isRecommended?: boolean;
  isNew?: boolean;
}

// Helper function to determine model category from model name
const getModelCategory = (modelName: string): ModelInfo['category'] => {
  if (modelName.includes('gemini')) return 'gemini';
  if (modelName.includes('gpt') || modelName.includes('openai')) return 'gpt';
  if (modelName.includes('claude') || modelName.includes('anthropic')) return 'claude';
  if (modelName.includes('kimi') || modelName.includes('moonshot')) return 'kimi';
  if (modelName.includes('/')) return 'openrouter'; // OpenRouter models typically have provider/model format
  return 'other';
};

// Helper function to determine if a model should be marked as recommended
const isRecommendedModel = (modelName: string): boolean => {
  const recommendedModels = [
    'gemini-1.5-pro',
    'moonshotai/kimi-k2-instruct',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o'
  ];
  return recommendedModels.includes(modelName);
};

// Helper function to determine if a model should be marked as new
const isNewModel = (modelName: string): boolean => {
  const newModels = [
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'qwen/qwen-2.5-coder-32b-instruct',
    'deepseek/deepseek-v3',
    'meta-llama/llama-3.1-405b-instruct'
  ];
  return newModels.includes(modelName);
};

// Transform API configuration to ModelInfo
const transformConfigurationToModel = (config: APIConfiguration): ModelInfo => ({
  id: config.id,
  name: config.modelName,
  displayName: config.variationName,
  description: `System configuration: ${config.variationName}`,
  category: getModelCategory(config.modelName),
  isRecommended: isRecommendedModel(config.modelName),
  isNew: isNewModel(config.modelName),
});

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (model: string) => void;
  style?: any;
  disabled?: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  onModelChange,
  style,
  disabled = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { state } = useApp();

  // Load models from configurations
  useEffect(() => {
    const loadModels = () => {
      setIsLoading(true);
      try {
        // Filter system configurations and transform to models
        const systemConfigs = state.configurations.filter(config => 
          config.id.startsWith('system-config-') || 
          config.variationName.includes('System configuration:') ||
          // Also include configs that look like system configs based on naming patterns
          ['gemini-1-5-pro', 'kimi-k2', 'claude-3-5-sonnet', 'gpt-4o', 'qwen-2-5-coder', 'deepseek-v3', 'llama-3-1-405b'].includes(config.id)
        );
        
        const models = systemConfigs.map(transformConfigurationToModel);
        
        // Sort models: recommended first, then by category, then by name
        models.sort((a, b) => {
          if (a.isRecommended && !b.isRecommended) return -1;
          if (!a.isRecommended && b.isRecommended) return 1;
          if (a.category !== b.category) return a.category.localeCompare(b.category);
          return a.displayName.localeCompare(b.displayName);
        });
        
        setAvailableModels(models);
        console.log('📋 Loaded', models.length, 'models from configurations');
      } catch (error) {
        console.error('Failed to load models:', error);
        setAvailableModels([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadModels();
  }, [state.configurations]);

  const selectedModelInfo = availableModels.find(m => m.name === selectedModel);

  const handleModelSelect = (model: ModelInfo) => {
    onModelChange(model.name);
    setIsModalVisible(false);
  };

  const renderModelItem = ({ item }: { item: ModelInfo }) => (
    <TouchableOpacity
      style={[
        styles.modelItem,
        selectedModel === item.name && styles.selectedModelItem,
      ]}
      onPress={() => handleModelSelect(item)}
    >
      <View style={styles.modelItemHeader}>
        <Text style={[
          styles.modelDisplayName,
          selectedModel === item.name && styles.selectedModelText
        ]}>
          {item.displayName}
        </Text>
        <View style={styles.modelBadges}>
          {item.isRecommended && (
            <View style={styles.recommendedBadge}>
              <Text style={styles.badgeText}>Recommended</Text>
            </View>
          )}
          {item.isNew && (
            <View style={styles.newBadge}>
              <Text style={styles.badgeText}>New</Text>
            </View>
          )}
        </View>
      </View>
      <Text style={[
        styles.modelName,
        selectedModel === item.name && styles.selectedModelSecondaryText
      ]}>
        {item.name}
      </Text>
      <Text style={[
        styles.modelDescription,
        selectedModel === item.name && styles.selectedModelSecondaryText
      ]}>
        {item.description}
      </Text>
      {selectedModel === item.name && (
        <View style={styles.selectedIndicator}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="warning-outline" size={48} color="#8E8E93" />
      <Text style={styles.emptyStateTitle}>No Models Available</Text>
      <Text style={styles.emptyStateDescription}>
        No model configurations found. Please check your system configuration.
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.loadingText}>Loading models...</Text>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.selector,
          disabled && styles.disabledSelector,
        ]}
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled}
      >
        <View style={styles.selectorContent}>
          <View style={styles.selectedModelInfo}>
            <Text style={[
              styles.selectedDisplayName,
              disabled && styles.disabledText
            ]}>
              {selectedModelInfo?.displayName || selectedModel}
            </Text>
            <Text style={[
              styles.selectedModelName,
              disabled && styles.disabledText
            ]}>
              {selectedModel}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={20}
            color={disabled ? "#C7C7CC" : "#8E8E93"}
          />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select AI Model</Text>
            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            renderLoadingState()
          ) : availableModels.length === 0 ? (
            renderEmptyState()
          ) : (
            <FlatList
              data={availableModels}
              keyExtractor={(item) => item.id}
              renderItem={renderModelItem}
              contentContainerStyle={styles.modelList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  selector: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  disabledSelector: {
    backgroundColor: '#F8F8F8',
    borderColor: '#E5E5EA',
  },
  selectorContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedModelInfo: {
    flex: 1,
  },
  selectedDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 2,
  },
  selectedModelName: {
    fontSize: 14,
    color: '#8E8E93',
  },
  disabledText: {
    color: '#C7C7CC',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  modelList: {
    padding: 20,
  },
  modelItem: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    position: 'relative',
  },
  selectedModelItem: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modelItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  modelDisplayName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  selectedModelText: {
    color: '#FFFFFF',
  },
  modelBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  recommendedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  newBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  modelName: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  selectedModelSecondaryText: {
    color: '#E5E5EA',
  },
  modelDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 16,
  },
});

export default ModelSelector;