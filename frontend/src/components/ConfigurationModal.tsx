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
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
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
      color: colors.accent,
      backgroundColor: colors.accentSoft,
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
    configCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    configCardSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accentSoft,
    },
    configHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.sm,
    },
    configInfo: {
      flex: 1,
      marginRight: spacing.md,
    },
    configName: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    configNameSelected: {
      color: colors.accent,
    },
    configModel: {
      ...typography.body,
      color: colors.textSecondary,
    },
    configModelSelected: {
      color: colors.accent,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: radius.lg,
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
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    configPromptSelected: {
      color: colors.accent,
    },
    configMeta: {
      flexDirection: 'row' as const,
      gap: spacing.lg,
    },
    configMetaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    configMetaText: {
      ...typography.caption,
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
              <Ionicons name="checkmark" size={16} color={colors.textInverse} />
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
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
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
