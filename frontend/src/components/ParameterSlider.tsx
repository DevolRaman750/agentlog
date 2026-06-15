import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

const { width: screenWidth } = Dimensions.get('window');

interface PresetOption {
  label: string;
  value: number;
  description: string;
  useCase: string;
}

interface ParameterSliderProps {
  label: string;
  value: number;
  onValueChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  presets: PresetOption[];
  helpInfo: {
    title: string;
    description: string;
    lowValue: string;
    highValue: string;
    recommendations: { task: string; range: string; description: string }[];
  };
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  presets,
  helpInfo,
}) => {
  const { colors } = useTheme();
  const styles = useThemedStyles((colors) => ({
    container: {
      marginBottom: spacing.xl,
    },
    header: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    label: {
      ...typography.title,
      color: colors.textPrimary,
    },
    helpButton: {
      padding: spacing.xs,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    valueContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
      gap: spacing.md,
    },
    valueText: {
      ...typography.display,
      color: colors.textPrimary,
    },
    valueIndicator: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.lg,
    },
    valueIndicatorText: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    sliderContainer: {
      marginBottom: spacing.lg,
    },
    sliderTrack: {
      height: 6,
      backgroundColor: colors.borderLight,
      borderRadius: radius.sm,
      position: 'relative' as const,
    },
    sliderFill: {
      height: 6,
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
      position: 'absolute' as const,
    },
    sliderKnob: {
      position: 'absolute' as const,
      top: -9,
      width: 24,
      height: 24,
      backgroundColor: colors.bgCard,
      borderRadius: 12,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    knobInner: {
      width: 12,
      height: 12,
      backgroundColor: colors.accent,
      borderRadius: radius.sm,
    },
    sliderLabels: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: spacing.sm,
    },
    sliderLabel: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    presetsContainer: {
      marginBottom: spacing.md,
    },
    presetsLabel: {
      ...typography.body,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    presetsList: {
      flexDirection: 'row' as const,
    },
    presetButton: {
      backgroundColor: colors.bgApp,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      marginRight: spacing.sm,
      alignItems: 'center' as const,
      minWidth: 60,
      minHeight: touchTarget.min,
      justifyContent: 'center' as const,
    },
    presetButtonActive: {
      backgroundColor: colors.accent,
    },
    presetButtonText: {
      ...typography.caption,
      fontWeight: '500' as const,
      color: colors.textPrimary,
    },
    presetButtonTextActive: {
      color: colors.textInverse,
    },
    presetValue: {
      ...typography.micro,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginTop: spacing.none,
    },
    presetValueActive: {
      color: colors.textInverse,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    helpModal: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.xl,
      width: screenWidth * 0.9,
      maxHeight: '80%' as const,
      overflow: 'hidden' as const,
    },
    helpHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    helpTitle: {
      ...typography.h1,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    helpContent: {
      padding: spacing.lg,
    },
    helpDescription: {
      ...typography.body,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    helpSection: {
      marginBottom: spacing.lg,
    },
    helpSectionTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    helpRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    helpDot: {
      width: 8,
      height: 8,
      borderRadius: radius.sm,
      marginRight: spacing.md,
    },
    helpRowText: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    recommendationCard: {
      backgroundColor: colors.bgSurface,
      padding: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.sm,
    },
    recommendationTask: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    recommendationRange: {
      ...typography.caption,
      fontWeight: '500' as const,
      color: colors.accent,
      marginBottom: spacing.xs,
    },
    recommendationDescription: {
      ...typography.caption,
      color: colors.textSecondary,
      lineHeight: 16,
    },
  }));

  const [showHelp, setShowHelp] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const sliderWidth = screenWidth - 80; // Account for padding
  const knobSize = 24;

  // Initialize slider position based on current value
  React.useEffect(() => {
    const percentage = (value - min) / (max - min);
    const newPosition = percentage * (sliderWidth - knobSize);
    translateX.setValue(newPosition);
  }, [value, min, max, sliderWidth]);

  const [currentPosition, setCurrentPosition] = useState(0);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (_, gestureState) => {
      const percentage = (value - min) / (max - min);
      setCurrentPosition(percentage * (sliderWidth - knobSize));
    },
    onPanResponderMove: (_, gestureState) => {
      const percentage = (value - min) / (max - min);
      const startPosition = percentage * (sliderWidth - knobSize);
      const newX = Math.max(0, Math.min(sliderWidth - knobSize, startPosition + gestureState.dx));

      // Calculate new value
      const newPercentage = newX / (sliderWidth - knobSize);
      const newValue = min + newPercentage * (max - min);
      const steppedValue = Math.round(newValue / step) * step;

      onValueChange(steppedValue);
    },
    onPanResponderRelease: () => {
      // Animation will be handled by useEffect when value changes
    },
  });

  const handlePresetPress = (presetValue: number) => {
    onValueChange(presetValue);
  };

  const getValueColor = () => {
    const percentage = (value - min) / (max - min);
    if (percentage < 0.3) return colors.statusSuccess;
    if (percentage < 0.7) return colors.statusWarning;
    return colors.statusError;
  };

  const getValueDescription = () => {
    const percentage = (value - min) / (max - min);
    if (percentage < 0.3) return 'Conservative';
    if (percentage < 0.7) return 'Balanced';
    return 'Creative';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          onPress={() => setShowHelp(true)}
          style={styles.helpButton}
        >
          <Ionicons name="help-circle-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>{value}</Text>
        <View style={[styles.valueIndicator, { backgroundColor: getValueColor() }]}>
          <Text style={styles.valueIndicatorText}>{getValueDescription()}</Text>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <Animated.View
            style={[
              styles.sliderFill,
              {
                width: translateX.interpolate({
                  inputRange: [0, sliderWidth - knobSize],
                  outputRange: [knobSize / 2, sliderWidth - knobSize / 2],
                  extrapolate: 'clamp',
                }),
              }
            ]}
          />
          <Animated.View
            {...panResponder.panHandlers}
            style={[
              styles.sliderKnob,
              {
                transform: [{ translateX }],
              }
            ]}
          >
            <View style={styles.knobInner} />
          </Animated.View>
        </View>

        <View style={styles.sliderLabels}>
          <Text style={styles.sliderLabel}>{min}</Text>
          <Text style={styles.sliderLabel}>{max}</Text>
        </View>
      </View>

      <View style={styles.presetsContainer}>
        <Text style={styles.presetsLabel}>Quick Presets:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsList}>
          {presets.map((preset, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.presetButton,
                value === preset.value && styles.presetButtonActive
              ]}
              onPress={() => handlePresetPress(preset.value)}
            >
              <Text style={[
                styles.presetButtonText,
                value === preset.value && styles.presetButtonTextActive
              ]}>
                {preset.label}
              </Text>
              <Text style={[
                styles.presetValue,
                value === preset.value && styles.presetValueActive
              ]}>
                {preset.value}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Modal
        visible={showHelp}
        transparent
        animationType="fade"
        onRequestClose={() => setShowHelp(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowHelp(false)}>
          <View style={styles.helpModal}>
            <View style={styles.helpHeader}>
              <Text style={styles.helpTitle}>{helpInfo.title}</Text>
              <TouchableOpacity onPress={() => setShowHelp(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpContent}>
              <Text style={styles.helpDescription}>{helpInfo.description}</Text>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Understanding Values:</Text>
                <View style={styles.helpRow}>
                  <View style={[styles.helpDot, { backgroundColor: colors.statusSuccess }]} />
                  <Text style={styles.helpRowText}>Low Values: {helpInfo.lowValue}</Text>
                </View>
                <View style={styles.helpRow}>
                  <View style={[styles.helpDot, { backgroundColor: colors.statusError }]} />
                  <Text style={styles.helpRowText}>High Values: {helpInfo.highValue}</Text>
                </View>
              </View>

              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Recommended for Different Tasks:</Text>
                {helpInfo.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationCard}>
                    <Text style={styles.recommendationTask}>{rec.task}</Text>
                    <Text style={styles.recommendationRange}>{rec.range}</Text>
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default ParameterSlider;
