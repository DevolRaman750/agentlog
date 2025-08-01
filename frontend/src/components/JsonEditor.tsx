import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { containerStyles, shadowPresets } from '../styles/containers';

interface JsonEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  helpText?: string;
  minHeight?: number;
  maxHeight?: number;
  readOnly?: boolean;
}

const JsonEditor: React.FC<JsonEditorProps> = ({
  value,
  onChangeText,
  placeholder = '{}',
  label,
  helpText,
  minHeight = 200,
  maxHeight = 400,
  readOnly = false
}) => {
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isFormatted, setIsFormatted] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  // Validate JSON when value changes
  useEffect(() => {
    validateJson(value);
  }, [value]);

  const validateJson = (text: string) => {
    if (!text.trim()) {
      setIsValid(true);
      setErrorMessage('');
      return;
    }

    try {
      JSON.parse(text);
      setIsValid(true);
      setErrorMessage('');
    } catch (error) {
      setIsValid(false);
      setErrorMessage(error instanceof Error ? error.message : 'Invalid JSON');
    }
  };

  const formatJson = () => {
    if (readOnly) return;
    
    try {
      if (!value.trim()) return;
      
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChangeText(formatted);
      setIsFormatted(true);
      
      setTimeout(() => setIsFormatted(false), 2000);
    } catch (error) {
      Alert.alert('Format Error', 'Cannot format invalid JSON');
    }
  };

  const minifyJson = () => {
    if (readOnly) return;
    
    try {
      if (!value.trim()) return;
      
      const parsed = JSON.parse(value);
      const minified = JSON.stringify(parsed);
      onChangeText(minified);
    } catch (error) {
      Alert.alert('Minify Error', 'Cannot minify invalid JSON');
    }
  };

  const clearContent = () => {
    if (readOnly) return;
    
    Alert.alert(
      'Clear Content',
      'Are you sure you want to clear all content?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: () => onChangeText('')
        }
      ]
    );
  };

  const renderToolbar = () => (
    <View style={styles.toolbar}>
      <View style={styles.toolbarLeft}>
        <View style={styles.statusIndicator}>
          <Ionicons 
            name={isValid ? "checkmark-circle" : "alert-circle"} 
            size={14} 
            color={isValid ? "#34C759" : "#FF3B30"} 
          />
          <Text style={[styles.statusText, { color: isValid ? "#34C759" : "#FF3B30" }]}>
            {isValid ? "Valid JSON" : errorMessage}
          </Text>
        </View>
      </View>

      {!readOnly && (
        <View style={styles.toolbarRight}>
          <TouchableOpacity 
            style={[styles.toolbarButton, isFormatted && styles.toolbarButtonActive]}
            onPress={formatJson}
            disabled={!isValid}
          >
            <Ionicons 
              name={isFormatted ? "checkmark" : "code-outline"} 
              size={16} 
              color={isFormatted ? "#FFFFFF" : (isValid ? "#007AFF" : "#C7C7CC")} 
            />
            <Text style={[
              styles.toolbarButtonText, 
              isFormatted && styles.toolbarButtonActiveText,
              !isValid && styles.toolbarButtonDisabledText
            ]}>
              Format
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={minifyJson}
            disabled={!isValid}
          >
            <Ionicons 
              name="contract-outline" 
              size={16} 
              color={isValid ? "#007AFF" : "#C7C7CC"} 
            />
            <Text style={[
              styles.toolbarButtonText,
              !isValid && styles.toolbarButtonDisabledText
            ]}>
              Minify
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.toolbarButton, styles.clearButton]}
            onPress={clearContent}
          >
            <Ionicons name="trash-outline" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>{label}</Text>
          {helpText && (
            <Text style={styles.helpText}>{helpText}</Text>
          )}
        </View>
      )}

      <View style={[styles.editorContainer, !isValid && styles.editorContainerError]}>
        {renderToolbar()}
        
        <View style={styles.editorContent}>
          <TextInput
            ref={textInputRef}
            style={[
              styles.textInput,
              { 
                minHeight: Math.max(minHeight, 200),
                maxHeight: Math.min(maxHeight, Dimensions.get('window').height * 0.6)
              }
            ]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="#C7C7CC"
            multiline
            textAlignVertical="top"
            scrollEnabled={true}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            keyboardType="default"
            returnKeyType="default"
            enablesReturnKeyAutomatically={false}
            editable={!readOnly}
          />
          
          {/* Line numbers */}
          <View style={styles.lineNumbers}>
            {value.split('\n').map((_, index) => (
              <Text key={index} style={styles.lineNumber}>
                {index + 1}
              </Text>
            ))}
          </View>
        </View>

        {!isValid && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={16} color="#FF3B30" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20, // Increased spacing between JSON editors
  },
  labelContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  helpText: {
    fontSize: 13,
    color: '#8E8E93',
    lineHeight: 18,
  },
  editorContainer: {
    ...containerStyles.inputContainer,
    ...shadowPresets.medium, // Enhanced shadow for better separation
  },
  editorContainerError: {
    borderColor: '#FF3B30',
    borderWidth: 2,
    ...shadowPresets.strong, // More prominent shadow for errors
  },
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  toolbarLeft: {
    flex: 1,
  },
  toolbarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  toolbarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  toolbarButtonActive: {
    backgroundColor: '#007AFF',
  },
  toolbarButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#007AFF',
  },
  toolbarButtonActiveText: {
    color: '#FFFFFF',
  },
  toolbarButtonDisabledText: {
    color: '#C7C7CC',
  },
  clearButton: {
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFB3B3',
  },
  editorContent: {
    position: 'relative',
    flexDirection: 'row',
  },
  textInput: {
    flex: 1,
    paddingLeft: 50, // Space for line numbers
    paddingRight: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#000000',
    lineHeight: 20,
  },
  lineNumbers: {
    position: 'absolute',
    left: 0,
    top: 16,
    paddingLeft: 12,
    paddingRight: 8,
    backgroundColor: '#F8F9FA',
    borderRightWidth: 1,
    borderRightColor: '#E5E5EA',
  },
  lineNumber: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#8E8E93',
    lineHeight: 20,
    textAlign: 'right',
    minWidth: 30,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderTopWidth: 1,
    borderTopColor: '#FED7D7',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    flex: 1,
  },
});

export default JsonEditor; 