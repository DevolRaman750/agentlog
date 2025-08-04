import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Define supported models - easy to extend in the future
// To add a new model:
// 1. Add a new entry to the SUPPORTED_MODELS array below
// 2. Set the appropriate category ('gemini', 'gpt', 'claude', 'other')
// 3. Use isRecommended: true for the preferred default model
// 4. Use isNew: true for newly added models (temporary flag)
export interface ModelInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'gemini' | 'gpt' | 'claude' | 'other';
  isRecommended?: boolean;
  isNew?: boolean;
}

export const SUPPORTED_MODELS: ModelInfo[] = [
  {
    id: 'gemini-1.5-flash',
    name: 'gemini-1.5-flash',
    displayName: 'Gemini 1.5 Flash',
    description: 'Fast and efficient model for quick responses',
    category: 'gemini',
    isRecommended: true,
  },
  {
    id: 'gemini-1.5-pro',
    name: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Advanced model with superior reasoning capabilities',
    category: 'gemini',
  },
  {
    id: 'gemini-1.0-pro',
    name: 'gemini-1.0-pro',
    displayName: 'Gemini 1.0 Pro',
    description: 'Stable production model with proven performance',
    category: 'gemini',
  },
  {
    id: 'gemini-1.5-flash-8b',
    name: 'gemini-1.5-flash-8b',
    displayName: 'Gemini 1.5 Flash 8B',
    description: 'Lightweight model optimized for speed',
    category: 'gemini',
  },
  {
    id: 'moonshotai/kimi-k2-instruct',
    name: 'moonshotai/kimi-k2-instruct',
    displayName: 'Kimi K2 Instruct',
    description: 'Advanced MoE model with excellent tool use and coding capabilities',
    category: 'kimi',
    isRecommended: true,
    isNew: true,
  },
  {
    id: 'moonshotai/kimi-k2',
    name: 'moonshotai/kimi-k2',
    displayName: 'Kimi K2',
    description: '1T parameter MoE model optimized for agentic tasks',
    category: 'kimi',
    isNew: true,
  },
];

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelName: string) => void;
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

  const selectedModelInfo = SUPPORTED_MODELS.find(m => m.name === selectedModel);

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
          
          <FlatList
            data={SUPPORTED_MODELS}
            keyExtractor={(item) => item.id}
            renderItem={renderModelItem}
            contentContainerStyle={styles.modelList}
            showsVerticalScrollIndicator={false}
          />
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
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E5E9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
  },
  disabledSelector: {
    backgroundColor: '#F2F2F7',
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
    color: '#1A1A1A',
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
    backgroundColor: '#F2F2F7',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E5E9',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 4,
  },
  modelList: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modelItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E5E9',
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
    marginBottom: 4,
  },
  modelDisplayName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    flex: 1,
  },
  selectedModelText: {
    color: '#FFFFFF',
  },
  selectedModelSecondaryText: {
    color: '#FFFFFF',
    opacity: 0.8,
  },
  modelBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  recommendedBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  newBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  modelDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
});

export default ModelSelector; 