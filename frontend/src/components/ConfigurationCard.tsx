import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConfigurationCardProps, getResourceOwnership } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme, useThemedStyles } from '../theme';
import { ThemeColors } from '../theme';

const ConfigurationCard: React.FC<ConfigurationCardProps> = ({
  configuration,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const { user } = useAuth();
  const { showToast, showWarning } = useToast();
  const ownership = getResourceOwnership(configuration, user?.id);
  const { colors } = useTheme();

  const styles = useThemedStyles((colors: ThemeColors) => ({
    container: {
      backgroundColor: colors.bgCard,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden' as const,
    },
    systemContainer: {
      borderColor: colors.accent,
      borderWidth: 1.5,
      backgroundColor: '#F8F9FE',
    },
    systemBadge: {
      backgroundColor: '#E3F2FD',
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent,
    },
    systemBadgeText: {
      fontSize: 10,
      fontWeight: '700' as const,
      color: colors.accent,
      letterSpacing: 0.5,
    },
    header: {
      flexDirection: 'row' as const,
      padding: 16,
      alignItems: 'flex-start' as const,
    },
    titleContainer: {
      flex: 1,
    },
    variationName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    metadataRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    temperatureBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
    },
    temperatureBadgeText: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    ownershipBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgApp,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 8,
      gap: 2,
    },
    ownershipText: {
      fontSize: 9,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.bgApp,
    },
    actionButtonDisabled: {
      backgroundColor: colors.bgSurface,
    },
    modelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
      paddingBottom: 12,
      gap: 6,
    },
    modelText: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500' as const,
    },
    separator: {
      fontSize: 13,
      color: colors.textTertiary,
    },
    configId: {
      fontSize: 11,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    promptContainer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    promptLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    promptText: {
      fontSize: 13,
      color: colors.textPrimary,
      lineHeight: 18,
    },
    systemInfo: {
      backgroundColor: '#E3F2FD',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: '#B3D9FF',
    },
    systemInfoText: {
      fontSize: 11,
      color: '#1976D2',
      textAlign: 'center' as const,
      lineHeight: 14,
    },
  }));

  const handleEdit = () => {
    if (!ownership.canEdit) {
      showToast('warning', 'Cannot Edit', 'This is a system configuration and cannot be modified. You can duplicate it to create your own version.', {
        action: {
          label: 'Duplicate Instead',
          onPress: handleDuplicate
        },
        duration: 6000
      });
      return;
    }
    onEdit(configuration);
  };

  const handleDelete = () => {
    console.log('🖱️ ConfigurationCard delete button clicked for:', configuration.variationName);
    console.log('🔐 Card ownership check:', ownership);
    console.log('📋 Configuration data:', configuration);

    if (!ownership.canDelete) {
      console.warn('🚫 ConfigurationCard: Cannot delete - permission denied');
      showWarning('Cannot Delete', 'This is a system configuration and cannot be deleted.');
      return;
    }

    console.log('✅ ConfigurationCard: Showing delete confirmation via toast');

    showToast('warning', 'Delete Configuration?', `Are you sure you want to delete "${configuration.variationName}"? This action cannot be undone.`, {
      duration: 8000,
      action: {
        label: 'Delete',
        onPress: () => {
          console.log('🗑️ ConfigurationCard: User confirmed via toast, calling onDelete with ID:', configuration.id);
          onDelete(configuration.id!);
        }
      }
    });
  };

  const handleDuplicate = () => {
    const duplicatedConfig = {
      ...configuration,
      id: `config-${Date.now()}`,
      userId: user?.id, // Set current user as owner
      variationName: `${configuration.variationName} (Copy)`,
      isSystemResource: false, // User copies are never system resources
    };
    onDuplicate(duplicatedConfig);
  };

  const getTemperatureColor = (temperature?: number) => {
    if (!temperature) return colors.textSecondary;
    if (temperature <= 0.3) return colors.statusSuccess; // Green for conservative
    if (temperature <= 0.7) return '#FF9500'; // Orange for balanced
    return colors.statusError; // Red for creative
  };

  const getTemperatureLabel = (temperature?: number) => {
    if (!temperature) return 'Default';
    if (temperature <= 0.3) return 'Conservative';
    if (temperature <= 0.7) return 'Balanced';
    return 'Creative';
  };

  return (
    <View style={[
      styles.container,
      ownership.ownershipType === 'system' && styles.systemContainer
    ]}>
      {/* System Resource Badge */}
      {ownership.ownershipType === 'system' && (
        <View style={styles.systemBadge}>
          <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
          <Text style={styles.systemBadgeText}>SYSTEM</Text>
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.variationName}>{configuration.variationName}</Text>
          <View style={styles.metadataRow}>
            <View style={[
              styles.temperatureBadge,
              { backgroundColor: getTemperatureColor(configuration.temperature) }
            ]}>
              <Text style={styles.temperatureBadgeText}>
                {getTemperatureLabel(configuration.temperature)}
              </Text>
            </View>

            {/* Ownership indicator */}
            {ownership.ownershipType !== 'system' && ownership.ownerInfo && !ownership.ownerInfo.isCurrentUser && (
              <View style={styles.ownershipBadge}>
                <Ionicons name="person" size={10} color={colors.textSecondary} />
                <Text style={styles.ownershipText}>Other User</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.actions}>
          {/* Always show view button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onView(configuration)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="eye" size={16} color={colors.accent} />
          </TouchableOpacity>

          {/* Always show duplicate button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleDuplicate}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons name="copy" size={16} color={colors.accent} />
          </TouchableOpacity>

          {/* Conditional edit button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              !ownership.canEdit && styles.actionButtonDisabled
            ]}
            onPress={handleEdit}
            disabled={!ownership.canEdit}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="pencil"
              size={16}
              color={ownership.canEdit ? colors.accent : colors.textTertiary}
            />
          </TouchableOpacity>

          {/* Conditional delete button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              !ownership.canDelete && styles.actionButtonDisabled
            ]}
            onPress={handleDelete}
            disabled={!ownership.canDelete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name="trash"
              size={16}
              color={ownership.canDelete ? colors.statusError : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Model Info */}
      <View style={styles.modelRow}>
        <Ionicons name="hardware-chip" size={16} color={colors.textSecondary} />
        <Text style={styles.modelText}>{configuration.modelName}</Text>

        {/* Configuration ID for traceability */}
        {configuration.id && (
          <>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.configId}>
              {configuration.id.substring(0, 8)}...
            </Text>
          </>
        )}
      </View>

      {/* System Prompt Preview */}
      {configuration.systemPrompt && (
        <View style={styles.promptContainer}>
          <Text style={styles.promptLabel}>System Prompt:</Text>
          <Text style={styles.promptText} numberOfLines={2}>
            {configuration.systemPrompt}
          </Text>
        </View>
      )}

      {/* Additional metadata for system resources */}
      {ownership.ownershipType === 'system' && (
        <View style={styles.systemInfo}>
          <Text style={styles.systemInfoText}>
            💡 This is a system-provided configuration. Duplicate to customize.
          </Text>
        </View>
      )}
    </View>
  );
};

export default ConfigurationCard;
