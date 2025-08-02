import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
  PanResponder,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
    if (percentage < 0.3) return '#34C759'; // Green for low
    if (percentage < 0.7) return '#FF9500'; // Orange for medium  
    return '#FF3B30'; // Red for high
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
          <Ionicons name="help-circle-outline" size={20} color="#007AFF" />
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
                <Ionicons name="close" size={24} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpContent}>
              <Text style={styles.helpDescription}>{helpInfo.description}</Text>
              
              <View style={styles.helpSection}>
                <Text style={styles.helpSectionTitle}>Understanding Values:</Text>
                <View style={styles.helpRow}>
                  <View style={[styles.helpDot, { backgroundColor: '#34C759' }]} />
                  <Text style={styles.helpRowText}>Low Values: {helpInfo.lowValue}</Text>
                </View>
                <View style={styles.helpRow}>
                  <View style={[styles.helpDot, { backgroundColor: '#FF3B30' }]} />
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

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  helpButton: {
    padding: 4,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  valueText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  valueIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  valueIndicatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  sliderContainer: {
    marginBottom: 20,
  },
  sliderTrack: {
    height: 6,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: 6,
    backgroundColor: '#007AFF',
    borderRadius: 3,
    position: 'absolute',
  },
  sliderKnob: {
    position: 'absolute',
    top: -9,
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  knobInner: {
    width: 12,
    height: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: '#8E8E93',
  },
  presetsContainer: {
    marginBottom: 12,
  },
  presetsLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  presetsList: {
    flexDirection: 'row',
  },
  presetButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  presetButtonActive: {
    backgroundColor: '#007AFF',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  presetButtonTextActive: {
    color: '#FFFFFF',
  },
  presetValue: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 2,
  },
  presetValueActive: {
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: screenWidth * 0.9,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  helpHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  helpContent: {
    padding: 20,
  },
  helpDescription: {
    fontSize: 14,
    color: '#1A1A1A',
    lineHeight: 20,
    marginBottom: 20,
  },
  helpSection: {
    marginBottom: 20,
  },
  helpSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  helpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  helpDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  helpRowText: {
    fontSize: 14,
    color: '#1A1A1A',
    flex: 1,
  },
  recommendationCard: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationTask: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  recommendationRange: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 12,
    color: '#6C757D',
    lineHeight: 16,
  },
});

export default ParameterSlider; 