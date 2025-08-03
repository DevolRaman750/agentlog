import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { ExecutionTemplate, TemplateFormData, TemplateParameter } from '../types/templates';

interface TemplateFormProps {
  template: ExecutionTemplate | null;
  isEditMode: boolean;
  isViewMode: boolean;
  configurations: any[];
  availableFunctions: any[];
  onSave: (
    formData: TemplateFormData,
    parameters: Omit<TemplateParameter, 'id'>[],
    selectedFunctions: string[]
  ) => Promise<boolean>;
  onClose: () => void;
}

const TemplateForm: React.FC<TemplateFormProps> = ({
  template,
  isEditMode,
  isViewMode,
  configurations,
  availableFunctions,
  onSave,
  onClose,
}) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {isViewMode ? 'View Template' : isEditMode ? 'Edit Template' : 'Create Template'}
        </Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.message}>
          Template form component coming soon...
        </Text>
        <Text style={styles.details}>
          This will contain the full template creation/editing form.
        </Text>
      </View>
    </SafeAreaView>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 8,
  },
  details: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});

export default TemplateForm; 