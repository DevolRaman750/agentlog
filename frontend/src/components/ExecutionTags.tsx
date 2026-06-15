import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../context/ResponsiveContext';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

interface TagProps {
  label: string;
  count?: number;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
}

interface ExecutionTagsProps {
  selectedConfigsCount: number;
  selectedFunctionsCount: number;
  otherOptionsCount: number;
  onConfigurationPress: () => void;
  onFunctionsPress: () => void;
  onOtherOptionsPress: () => void;
}

const ExecutionTag: React.FC<TagProps> = ({
  label,
  count,
  icon,
  onPress,
  color,
  backgroundColor,
}) => {
  const { colors } = useTheme();
  const effectiveColor = color || colors.accent;
  const effectiveBg = backgroundColor || colors.bgHover;
  const { screenWidth } = useResponsive();
  const isCompact = screenWidth < 480;

  const styles = useThemedStyles((colors) => ({
    tag: {
      flex: 1,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: touchTarget.min,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: `${colors.accent}33`,
      gap: spacing.sm,
    },
    tagCompact: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      gap: spacing.xs,
    },
    tagText: {
      ...typography.bodyStrong,
      flex: 1,
      textAlign: 'center' as const,
    },
    tagTextCompact: {
      ...typography.caption,
      fontWeight: '600' as const,
    },
  }));

  const displayLabel = count !== undefined ? `${label} (${count})` : label;

  return (
    <TouchableOpacity
      style={[
        styles.tag,
        { backgroundColor: effectiveBg },
        isCompact && styles.tagCompact
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={isCompact ? 14 : 16} color={effectiveColor} />
      <Text style={[
        styles.tagText,
        { color: effectiveColor },
        isCompact && styles.tagTextCompact
      ]}>
        {displayLabel}
      </Text>
      <Ionicons name="chevron-forward" size={isCompact ? 12 : 14} color={effectiveColor} />
    </TouchableOpacity>
  );
};

const ExecutionTags: React.FC<ExecutionTagsProps> = ({
  selectedConfigsCount,
  selectedFunctionsCount,
  otherOptionsCount,
  onConfigurationPress,
  onFunctionsPress,
  onOtherOptionsPress,
}) => {
  const { colors } = useTheme();
  const { screenWidth } = useResponsive();
  const isCompact = screenWidth < 480;

  const styles = useThemedStyles((colors) => ({
    container: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    containerCompact: {
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    tagsHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    headerText: {
      ...typography.title,
      color: colors.textPrimary,
      marginLeft: spacing.sm,
    },
    headerTextCompact: {
      ...typography.body,
      fontWeight: '600' as const,
      marginLeft: spacing.sm,
    },
    tagsRow: {
      flexDirection: 'row' as const,
      gap: spacing.md,
    },
    tagsRowCompact: {
      flexDirection: 'column' as const,
      gap: spacing.sm,
    },
  }));

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <View style={styles.tagsHeader}>
        <Ionicons name="options" size={16} color={colors.textSecondary} />
        <Text style={[styles.headerText, isCompact && styles.headerTextCompact]}>
          Quick Configuration
        </Text>
      </View>

      <View style={[styles.tagsRow, isCompact && styles.tagsRowCompact]}>
        <ExecutionTag
          label="Configuration"
          count={selectedConfigsCount}
          icon="settings"
          onPress={onConfigurationPress}
          color={selectedConfigsCount > 0 ? colors.accent : colors.textSecondary}
          backgroundColor={selectedConfigsCount > 0 ? colors.bgHover : colors.bgSurface}
        />

        <ExecutionTag
          label="Functions"
          count={selectedFunctionsCount}
          icon="extension-puzzle"
          onPress={onFunctionsPress}
          color={selectedFunctionsCount > 0 ? colors.statusSuccess : colors.textSecondary}
          backgroundColor={selectedFunctionsCount > 0 ? `${colors.statusSuccess}15` : colors.bgSurface}
        />

        <ExecutionTag
          label="Other Options"
          count={otherOptionsCount}
          icon="ellipsis-horizontal"
          onPress={onOtherOptionsPress}
          color={otherOptionsCount > 0 ? colors.statusWarning : colors.textSecondary}
          backgroundColor={otherOptionsCount > 0 ? `${colors.statusWarning}15` : colors.bgSurface}
        />
      </View>
    </View>
  );
};

export default ExecutionTags;
