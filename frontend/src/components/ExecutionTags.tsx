import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../context/ResponsiveContext';

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
  color = '#007AFF',
  backgroundColor = '#F0F8FF' 
}) => {
  const { screenWidth } = useResponsive();
  const isCompact = screenWidth < 480;

  const displayLabel = count !== undefined ? `${label} (${count})` : label;

  return (
    <TouchableOpacity 
      style={[
        styles.tag, 
        { backgroundColor },
        isCompact && styles.tagCompact
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={isCompact ? 14 : 16} color={color} />
      <Text style={[
        styles.tagText, 
        { color },
        isCompact && styles.tagTextCompact
      ]}>
        {displayLabel}
      </Text>
      <Ionicons name="chevron-forward" size={isCompact ? 12 : 14} color={color} />
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
  const { screenWidth } = useResponsive();
  const isCompact = screenWidth < 480;

  return (
    <View style={[styles.container, isCompact && styles.containerCompact]}>
      <View style={styles.tagsHeader}>
        <Ionicons name="options" size={16} color="#666" />
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
          color={selectedConfigsCount > 0 ? "#007AFF" : "#666"}
          backgroundColor={selectedConfigsCount > 0 ? "#F0F8FF" : "#F8F9FA"}
        />
        
        <ExecutionTag
          label="Functions"
          count={selectedFunctionsCount}
          icon="extension-puzzle"
          onPress={onFunctionsPress}
          color={selectedFunctionsCount > 0 ? "#34C759" : "#666"}
          backgroundColor={selectedFunctionsCount > 0 ? "#F0FDF4" : "#F8F9FA"}
        />
        
        <ExecutionTag
          label="Other Options"
          count={otherOptionsCount}
          icon="ellipsis-horizontal"
          onPress={onOtherOptionsPress}
          color={otherOptionsCount > 0 ? "#FF9500" : "#666"}
          backgroundColor={otherOptionsCount > 0 ? "#FFF8F0" : "#F8F9FA"}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  containerCompact: {
    padding: 12,
    marginBottom: 16,
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  headerTextCompact: {
    fontSize: 14,
    marginLeft: 6,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  tagsRowCompact: {
    flexDirection: 'column',
    gap: 8,
  },
  tag: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
    gap: 6,
  },
  tagCompact: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  tagTextCompact: {
    fontSize: 12,
  },
});

export default ExecutionTags;