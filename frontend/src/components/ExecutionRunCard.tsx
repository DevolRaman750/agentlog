import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExecutionRunCardProps } from '../types';
import { AlertAPI } from './CustomAlert';
import { useTheme, useThemedStyles } from '../theme';

const ExecutionRunCard: React.FC<ExecutionRunCardProps> = ({
  executionRun,
  onPress,
  onDelete,
  onReExecute,
  onCreateTemplate,
}) => {
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    container: {
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      padding: 16,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 8,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.bgHover,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: 12,
    },
    titleContainer: {
      flex: 1,
    },
    executionName: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    metadataRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
    },
    timeText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    separator: {
      fontSize: 12,
      color: colors.textTertiary,
      marginHorizontal: 6,
    },
    deleteButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: `${colors.statusError}10`,
    },
    descriptionContainer: {
      marginBottom: 8,
      paddingLeft: 52, // Align with title (icon width + margin)
    },
    descriptionText: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    footer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingTop: 8,
      borderTopWidth: 0.5,
      borderTopColor: colors.borderLight,
    },
    viewDetailsText: {
      fontSize: 14,
      color: colors.accent,
      fontWeight: '500' as const,
    },
    actionsContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    createTemplateButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: `${colors.statusSuccess}10`,
    },
    reExecuteButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.accentSoft,
    },
  }));

  const handleDelete = () => {
    AlertAPI.alert(
      'Delete Execution',
      `Are you sure you want to delete "${executionRun.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(executionRun.id),
        },
      ]
    );
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 24 * 7) {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getTimeOfDay = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const truncateDescription = (description?: string, maxLength: number = 60) => {
    if (!description) return '';
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + '...';
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(executionRun)}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="play-circle" size={24} color={colors.accent} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.executionName} numberOfLines={1}>
            {executionRun.name}
          </Text>
          <View style={styles.metadataRow}>
            <Text style={styles.timeText}>
              {formatDate(executionRun.createdAt)}
            </Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.timeText}>
              {getTimeOfDay(executionRun.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.createTemplateButton}
            onPress={() => onCreateTemplate(executionRun)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="document-text-outline" size={20} color={colors.statusSuccess} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.reExecuteButton}
            onPress={() => onReExecute(executionRun)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="refresh-outline" size={20} color={colors.accent} />
          </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color={colors.statusError} />
        </TouchableOpacity>
        </View>
      </View>

      {/* Description */}
      {executionRun.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText} numberOfLines={2}>
            {truncateDescription(executionRun.description)}
          </Text>
        </View>
      )}

      {/* Footer with chevron */}
      <View style={styles.footer}>
        <Text style={styles.viewDetailsText}>View details</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
};

export default ExecutionRunCard;
