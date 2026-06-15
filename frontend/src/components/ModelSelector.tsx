import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { APIConfiguration } from '../types';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

const { width } = Dimensions.get('window');

// Model information interface
export interface ModelInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: 'gemini' | 'gpt' | 'claude' | 'kimi' | 'openrouter' | 'ollama' | 'other';
  isRecommended?: boolean;
  isNew?: boolean;
}

// Helper function to determine model category from model name
const getModelCategory = (modelName: string): ModelInfo['category'] => {
  if (modelName.includes('llama')) return 'ollama';
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
    'llama3.1:latest',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'anthropic/claude-sonnet-4',
    'openai/gpt-4.1',
    'moonshotai/kimi-k2.5'
  ];
  return recommendedModels.includes(modelName);
};

// Helper function to determine if a model should be marked as new
const isNewModel = (modelName: string): boolean => {
  const newModels = [
    'llama3.1:latest',
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'anthropic/claude-sonnet-4',
    'openai/gpt-4.1'
  ];
  return newModels.includes(modelName);
};

// Transform API configuration to ModelInfo
const transformConfigurationToModel = (config: APIConfiguration): ModelInfo => ({
  id: config.id || `config-${config.modelName}`,
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
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    container: {
      marginBottom: spacing.xl,
    },
    selector: {
      backgroundColor: colors.bgApp,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    disabledSelector: {
      backgroundColor: colors.bgSurface,
      borderColor: colors.borderLight,
    },
    selectorContent: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
    },
    selectedModelInfo: {
      flex: 1,
    },
    selectedDisplayName: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    selectedModelName: {
      ...typography.body,
      color: colors.textSecondary,
    },
    disabledText: {
      color: colors.textTertiary,
    },
    modalContainer: {
      flex: 1,
      backgroundColor: colors.bgCard,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    modalTitle: {
      ...typography.h1,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.xs,
    },
    modelList: {
      padding: spacing.lg,
    },
    modelItem: {
      backgroundColor: colors.bgApp,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
      position: 'relative' as const,
    },
    selectedModelItem: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    modelItemHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.sm,
    },
    modelDisplayName: {
      ...typography.title,
      color: colors.textPrimary,
      flex: 1,
      marginRight: spacing.sm,
    },
    selectedModelText: {
      color: colors.textInverse,
    },
    modelBadges: {
      flexDirection: 'row' as const,
      gap: spacing.xs,
    },
    recommendedBadge: {
      backgroundColor: colors.statusSuccess,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    newBadge: {
      backgroundColor: colors.statusWarning,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    badgeText: {
      ...typography.micro,
      fontWeight: '600' as const,
      color: colors.textInverse,
      textTransform: 'uppercase' as const,
    },
    modelName: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    selectedModelSecondaryText: {
      color: colors.borderLight,
    },
    modelDescription: {
      ...typography.body,
      color: colors.textSecondary,
    },
    selectedIndicator: {
      position: 'absolute' as const,
      top: spacing.lg,
      right: spacing.lg,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xxl,
    },
    emptyStateTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    emptyStateDescription: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: 'center' as const,
    },
    loadingState: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      padding: spacing.xxl,
    },
    loadingText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginTop: spacing.lg,
    },
  }));

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
          (config.id && config.id.startsWith('system-config-')) ||
          config.variationName.includes('System configuration:') ||
          // Also include configs that look like system configs based on naming patterns
          (config.id && ['gemini-2-5-pro', 'kimi-k2', 'claude-3-5-sonnet', 'gpt-4o'].includes(config.id))
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
        console.log('Loaded', models.length, 'models from configurations');
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
          <Ionicons name="checkmark-circle" size={20} color={colors.textInverse} />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="warning-outline" size={48} color={colors.textSecondary} />
      <Text style={styles.emptyStateTitle}>No Models Available</Text>
      <Text style={styles.emptyStateDescription}>
        No model configurations found. Please check your system configuration.
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={colors.accent} />
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
            color={disabled ? colors.textTertiary : colors.textSecondary}
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
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

export default ModelSelector;
