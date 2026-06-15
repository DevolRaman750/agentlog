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
import { spacing, radius, typography, touchTarget } from '../theme';

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
      borderRadius: radius.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.borderLight,
      overflow: 'hidden' as const,
    },
    systemContainer: {
      borderColor: colors.accent,
      borderWidth: 1.5,
      backgroundColor: colors.bgSurface,
    },
    systemBadge: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.accent,
    },
    systemBadgeText: {
      ...typography.micro,
      color: colors.accent,
      letterSpacing: 0.5,
    },
    header: {
      flexDirection: 'row' as const,
      padding: spacing.md,
      alignItems: 'flex-start' as const,
    },
    titleContainer: {
      flex: 1,
    },
    variationName: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    metadataRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    temperatureBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    temperatureBadgeText: {
      ...typography.micro,
      color: colors.textInverse,
    },
    ownershipBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.bgApp,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: radius.md,
      gap: 2,
    },
    ownershipText: {
      ...typography.micro,
      color: colors.textSecondary,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    actionButton: {
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.bgApp,
    },
    actionButtonDisabled: {
      backgroundColor: colors.bgSurface,
    },
    modelRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.xs,
    },
    modelText: {
      ...typography.label,
      color: colors.textSecondary,
    },
    separator: {
      ...typography.label,
      color: colors.textTertiary,
    },
    configId: {
      ...typography.micro,
      color: colors.textSecondary,
      fontFamily: 'monospace',
    },
    promptContainer: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    promptLabel: {
      ...typography.caption,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    promptText: {
      ...typography.body,
      color: colors.textPrimary,
    },
    systemInfo: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: `${colors.accent}40`,
    },
    systemInfoText: {
      ...typography.micro,
      color: colors.accent,
      textAlign: 'center' as const,
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
    if (temperature <= 0.7) return colors.statusWarning; // Orange for balanced
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
