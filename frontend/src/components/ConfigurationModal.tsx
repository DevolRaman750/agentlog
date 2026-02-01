import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { APIConfiguration } from '../types';
import { useResponsive } from '../context/ResponsiveContext';
import { useTheme, useThemedStyles } from '../theme';
import { ThemeColors } from '../theme';

interface ConfigurationModalProps {
  visible: boolean;
  onClose: () => void;
  configurations: APIConfiguration[];
  selectedConfigurations: string[];
  onSelectionChange: (configIds: string[]) => void;
  isLoading?: boolean;
  maxSelections?: number;
  modeInfo?: {
    mode: string;
    title: string;
    allowMultiple: boolean;
  };
}

const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  visible,
  onClose,
  configurations,
  selectedConfigurations,
  onSelectionChange,
  isLoading = false,
  maxSelections,
  modeInfo,
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
      color: colors.accent,
      backgroundColor: '#F0F8FF',
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
    configCard: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 2,
      borderColor: colors.borderLight,
    },
    configCardSelected: {
      borderColor: colors.accent,
      backgroundColor: '#F8FBFF',
    },
    configHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 8,
    },
    configInfo: {
      flex: 1,
      marginRight: 12,
    },
    configName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    configNameSelected: {
      color: colors.accent,
    },
    configModel: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    configModelSelected: {
      color: '#0056CC',
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.borderLight,
      backgroundColor: colors.bgCard,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    checkboxSelected: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    configPrompt: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
      marginBottom: 8,
    },
    configPromptSelected: {
      color: '#0056CC',
    },
    configMeta: {
      flexDirection: 'row' as const,
      gap: 16,
    },
    configMetaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    configMetaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  }));

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
    if (selectedConfigurations.includes(configId)) {
      // Deselecting
      const newSelection = selectedConfigurations.filter(id => id !== configId);
      onSelectionChange(newSelection);
    } else {
      // Selecting
      if (maxSelections && selectedConfigurations.length >= maxSelections) {
        // For single selection modes, replace the current selection
        if (maxSelections === 1) {
          onSelectionChange([configId]);
        }
        return; // Don't allow more selections if at limit
      }

      const newSelection = [...selectedConfigurations, configId];
      onSelectionChange(newSelection);
    }
  };

  const selectAll = () => {
    if (maxSelections === 1) return; // Don't allow select all for single selection modes

    const availableIds = filteredConfigurations.map(config => config.id).filter((id): id is string => !!id);
    const idsToSelect = maxSelections ? availableIds.slice(0, maxSelections) : availableIds;
    onSelectionChange(idsToSelect);
  };

  const clearAll = () => {
    onSelectionChange([]);
  };

  const renderConfigurationCard = (config: APIConfiguration) => {
    const isSelected = config.id ? selectedConfigurations.includes(config.id) : false;

    return (
      <TouchableOpacity
        key={config.id}
        style={[styles.configCard, isSelected && styles.configCardSelected]}
        onPress={() => config.id && toggleConfiguration(config.id)}
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
            <Ionicons name="thermometer" size={12} color={colors.textSecondary} />
            <Text style={styles.configMetaText}>Temp: {config.temperature}</Text>
          </View>

          {config.maxTokens && (
            <View style={styles.configMetaItem}>
              <Ionicons name="flash" size={12} color={colors.textSecondary} />
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
            <Ionicons name="close" size={24} color={colors.accent} />
          </TouchableOpacity>

          <Text style={styles.title}>
            {modeInfo ? `${modeInfo.title} - Configurations` : 'AI Configurations'}
          </Text>

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
            {modeInfo && !modeInfo.allowMultiple
              ? `${modeInfo.title} mode - Choose one configuration`
              : 'Choose which AI model configurations to test your prompt against'
            }
          </Text>

          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {selectedConfigurations.length} selected
              {maxSelections && ` (max ${maxSelections})`}
            </Text>
          </View>
        </View>

        {/* Search and controls */}
        <View style={styles.controls}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search configurations..."
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
            {maxSelections !== 1 && (
              <TouchableOpacity onPress={selectAll} style={styles.bulkButton}>
                <Text style={styles.bulkButtonText}>Select All</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={clearAll} style={styles.bulkButton}>
              <Text style={styles.bulkButtonText}>Clear All</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.accent} />
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
                <Ionicons name="settings-outline" size={48} color={colors.textTertiary} />
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

export default ConfigurationModal;
export type { ConfigurationModalProps };
