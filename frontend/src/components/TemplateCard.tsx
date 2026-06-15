import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExecutionTemplate } from '../types/templates';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

interface TemplateCardProps {
  template: ExecutionTemplate;
  onPress: (template: ExecutionTemplate) => void;
  onEdit: (template: ExecutionTemplate) => void;
  onDelete: (templateId: string) => void;
  onExecute: (template: ExecutionTemplate) => void;
  onTokenManager: (template: ExecutionTemplate) => void;
  onCopy?: (template: ExecutionTemplate) => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPress,
  onEdit,
  onDelete,
  onExecute,
  onTokenManager,
  onCopy,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    templateCard: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    systemTemplateCard: {
      backgroundColor: colors.bgHover,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    templateHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.md,
    },
    templateInfo: {
      flex: 1,
    },
    templateNameRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    templateName: {
      ...typography.title,
      color: colors.textPrimary,
    },
    systemBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.accentSoft,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.none,
      gap: spacing.none,
    },
    systemBadgeText: {
      ...typography.micro,
      color: colors.accent,
    },
    templateDescription: {
      ...typography.body,
      color: colors.textSecondary,
    },
    templateActions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    actionButton: {
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: colors.bgApp,
    },
    templateMeta: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.md,
      marginBottom: spacing.sm,
    },
    metaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
    },
    metaText: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    tagsContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    tag: {
      backgroundColor: colors.accentSoft,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    tagText: {
      ...typography.micro,
      color: colors.accent,
    },
  }));

  // Detect system templates by userId
  const isSystem = template.userId === 'system';

  return (
    <View style={[styles.templateCard, isSystem && styles.systemTemplateCard]}>
      <View style={styles.templateHeader}>
        <View style={styles.templateInfo}>
          <View style={styles.templateNameRow}>
            <Text style={styles.templateName}>{template.name}</Text>
            {isSystem && (
              <View style={styles.systemBadge}>
                <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
                <Text style={styles.systemBadgeText}>SYSTEM</Text>
              </View>
            )}
          </View>
          <Text style={styles.templateDescription}>
            {template.description || 'No description available'}
          </Text>
        </View>

        <View style={styles.templateActions}>
          {/* Execute button - always available */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onExecute(template)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="play-outline" size={20} color={colors.statusSuccess} />
          </TouchableOpacity>

          {/* View button - always available */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPress(template)}
            hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          >
            <Ionicons name="eye-outline" size={20} color={colors.accent} />
          </TouchableOpacity>

          {/* System template actions: Copy */}
          {isSystem && onCopy && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onCopy(template)}
              hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
            >
              <Ionicons name="copy-outline" size={20} color={colors.statusWarning} />
            </TouchableOpacity>
          )}

          {/* User-only actions: Token Manager, Edit, Delete */}
          {!isSystem && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onTokenManager(template)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="key-outline" size={20} color={colors.statusSuccess} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(template)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="create-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDelete(template.id)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Ionicons name="trash-outline" size={20} color={colors.statusError} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Template Metadata */}
      <View style={styles.templateMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="settings-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            Parameters: {template.parameters?.length || 0}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="key-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            Tokens: {template.authTokens?.length || 0}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="code-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            Functions: {template.functionIDs?.length || 0}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="power" size={12} color={colors.textSecondary} />
          <Text style={styles.metaText}>
            Function Calling: {template.enableFunctionCalling ? 'On' : 'Off'}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons
            name={template.isActive ? "checkmark-circle" : "close-circle"}
            size={12}
            color={colors.textSecondary}
          />
          <Text style={styles.metaText}>
            Status: {template.isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Tags */}
      {((Array.isArray(template.tags) ? template.tags.length : Object.keys(template.tags || {}).length) > 0) && (
        <View style={styles.tagsContainer}>
          {(Array.isArray(template.tags) ? template.tags : Object.keys(template.tags || {}))?.map((tag: string, index: number) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export default TemplateCard;
