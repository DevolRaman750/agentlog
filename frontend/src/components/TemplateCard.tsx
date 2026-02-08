import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ExecutionTemplate } from '../types/templates';
import { useTheme, useThemedStyles } from '../theme';

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
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    systemTemplateCard: {
      backgroundColor: colors.bgHover,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    templateHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'flex-start' as const,
      marginBottom: 12,
    },
    templateInfo: {
      flex: 1,
    },
    templateNameRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: 4,
      gap: 8,
    },
    templateName: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    systemBadge: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: '#E8F4FD',
      borderRadius: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      gap: 2,
    },
    systemBadgeText: {
      fontSize: 10,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    templateDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    templateActions: {
      flexDirection: 'row' as const,
      gap: 8,
    },
    actionButton: {
      padding: 8,
      borderRadius: 6,
      backgroundColor: colors.bgApp,
    },
    templateMeta: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 12,
      marginBottom: 8,
    },
    metaItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
    },
    metaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    tagsContainer: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: 6,
      marginTop: 8,
    },
    tag: {
      backgroundColor: '#E8F4FD',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    tagText: {
      fontSize: 10,
      color: colors.accent,
      fontWeight: '500' as const,
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
          >
            <Ionicons name="play-outline" size={20} color={colors.statusSuccess} />
          </TouchableOpacity>

          {/* View button - always available */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onPress(template)}
          >
            <Ionicons name="eye-outline" size={20} color={colors.accent} />
          </TouchableOpacity>

          {/* System template actions: Copy */}
          {isSystem && onCopy && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onCopy(template)}
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
              >
                <Ionicons name="key-outline" size={20} color={colors.statusSuccess} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(template)}
              >
                <Ionicons name="create-outline" size={20} color={colors.accent} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onDelete(template.id)}
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
