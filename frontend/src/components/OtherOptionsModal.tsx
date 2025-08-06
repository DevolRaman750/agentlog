import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Modal, 
  StyleSheet,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import TextEditor from './TextEditor';
import { useResponsive } from '../context/ResponsiveContext';

interface OtherOptionsModalProps {
  visible: boolean;
  onClose: () => void;
  executionName: string;
  description: string;
  context: string;
  onExecutionNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onContextChange: (value: string) => void;
  defaultExecutionName?: string;
}

const OtherOptionsModal: React.FC<OtherOptionsModalProps> = ({
  visible,
  onClose,
  executionName,
  description,
  context,
  onExecutionNameChange,
  onDescriptionChange,
  onContextChange,
  defaultExecutionName,
}) => {
  const { screenWidth } = useResponsive();

  const getFilledOptionsCount = () => {
    let count = 0;
    if (executionName?.trim()) count++;
    if (description?.trim()) count++;
    if (context?.trim()) count++;
    return count;
  };

  const clearAllFields = () => {
    onExecutionNameChange('');
    onDescriptionChange('');
    onContextChange('');
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Other Options</Text>
          
          <TouchableOpacity 
            onPress={onClose} 
            style={[styles.headerButton, styles.doneButton]}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
        
        {/* Subtitle and info */}
        <View style={styles.subtitle}>
          <Text style={styles.subtitleText}>
            Add optional details to customize your execution
          </Text>
          
          <View style={styles.selectionInfo}>
            <Text style={styles.selectionCount}>
              {getFilledOptionsCount()} filled
            </Text>
          </View>
        </View>
        
        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity onPress={clearAllFields} style={styles.clearButton}>
            <Ionicons name="refresh" size={16} color="#FF3B30" />
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
        </View>
        
        {/* Content */}
        <ScrollView 
          style={styles.scrollContent} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Execution Name */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldLabelContainer}>
                <Ionicons name="bookmark" size={18} color="#FF9500" />
                <Text style={styles.fieldLabel}>Execution Name</Text>
              </View>
              
              {executionName?.trim() && (
                <TouchableOpacity onPress={() => onExecutionNameChange('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.fieldDescription}>
              Give this execution a memorable name for easy identification in your history
            </Text>
            
            <TextInput
              style={styles.textInput}
              value={executionName}
              onChangeText={onExecutionNameChange}
              placeholder={defaultExecutionName || 'My AI Execution'}
              placeholderTextColor="#999"
              multiline={false}
            />
            
            <Text style={styles.characterCount}>
              {executionName?.length || 0}/100 characters
            </Text>
          </View>

          {/* Description */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldLabelContainer}>
                <Ionicons name="document-text" size={18} color="#FF9500" />
                <Text style={styles.fieldLabel}>Description</Text>
              </View>
              
              {description?.trim() && (
                <TouchableOpacity onPress={() => onDescriptionChange('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.fieldDescription}>
              Add notes about this execution - what you're testing, why, or what you expect
            </Text>
            
            <TextEditor
              value={description}
              onChangeText={onDescriptionChange}
              placeholder="Notes about this execution..."
              minHeight={100}
              maxHeight={250}
              allowFullscreen={true}
              showCharacterCount={true}
              showWordCount={false}
              showLineNumbers={false}
            />
          </View>

          {/* Additional Context */}
          <View style={styles.fieldContainer}>
            <View style={styles.fieldHeader}>
              <View style={styles.fieldLabelContainer}>
                <Ionicons name="information-circle" size={18} color="#FF9500" />
                <Text style={styles.fieldLabel}>Additional Context</Text>
              </View>
              
              {context?.trim() && (
                <TouchableOpacity onPress={() => onContextChange('')}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.fieldDescription}>
              Provide additional context like target audience, tone, constraints, or special requirements
            </Text>
            
            <TextEditor
              value={context}
              onChangeText={onContextChange}
              placeholder="Target audience, tone, constraints, etc..."
              minHeight={120}
              maxHeight={300}
              allowFullscreen={true}
              showCharacterCount={true}
              showWordCount={true}
              showLineNumbers={false}
            />
          </View>

          {/* Usage Tips */}
          <View style={styles.tipsContainer}>
            <View style={styles.tipsHeader}>
              <Ionicons name="lightbulb" size={16} color="#FF9500" />
              <Text style={styles.tipsTitle}>Tips</Text>
            </View>
            
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Use descriptive names to easily find executions later
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  Add context to help AI understand your specific requirements
                </Text>
              </View>
              
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={styles.tipText}>
                  All fields are optional - add only what's helpful for your use case
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  doneButton: {
    alignItems: 'flex-end',
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  subtitle: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF9500',
    backgroundColor: '#FFF8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  controls: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF5F5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD7D7',
    gap: 6,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF3B30',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    padding: 16,
  },
  fieldContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  fieldDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1A1A1A',
    backgroundColor: '#F8F9FA',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  tipsContainer: {
    backgroundColor: '#FFF8F0',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#FFE4B5',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9500',
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: '#FF9500',
    fontWeight: 'bold',
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#B8860B',
    lineHeight: 20,
  },
});

export default OtherOptionsModal;