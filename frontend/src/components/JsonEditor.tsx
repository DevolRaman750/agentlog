import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';
import { useContainerStyles } from '../styles/useContainerStyles';

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
  const { colors } = useTheme();
  const { containerStyles, shadowPresets } = useContainerStyles();
  const styles = useThemedStyles((colors) => ({
    container: {
      marginBottom: 20,
    },
    labelContainer: {
      marginBottom: 8,
    },
    label: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 4,
    },
    helpText: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    editorContainer: {
      ...containerStyles.inputContainer,
    },
    editorContainerError: {
      borderColor: colors.statusError,
      borderWidth: 2,
    },
    toolbar: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      padding: 12,
      backgroundColor: colors.bgSurface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    toolbarLeft: {
      flex: 1,
    },
    toolbarRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    statusIndicator: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
    toolbarButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: 'transparent',
    },
    toolbarButtonActive: {
      backgroundColor: colors.accent,
    },
    toolbarButtonText: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.accent,
    },
    toolbarButtonActiveText: {
      color: colors.textInverse,
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
      position: 'relative' as const,
      flexDirection: 'row' as const,
    },
    textInput: {
      flex: 1,
      paddingLeft: 50,
      paddingRight: 16,
      paddingTop: 16,
      paddingBottom: 16,
      fontSize: 14,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: colors.textPrimary,
      lineHeight: 20,
    },
    lineNumbers: {
      position: 'absolute' as const,
      left: 0,
      top: 16,
      paddingLeft: 12,
      paddingRight: 8,
      backgroundColor: colors.bgSurface,
      borderRightWidth: 1,
      borderRightColor: colors.borderLight,
    },
    lineNumber: {
      fontSize: 12,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      color: colors.textSecondary,
      lineHeight: 20,
      textAlign: 'right' as const,
      minWidth: 30,
    },
    errorContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      padding: 12,
      backgroundColor: '#FFF5F5',
      borderTopWidth: 1,
      borderTopColor: '#FED7D7',
    },
    errorText: {
      fontSize: 12,
      color: colors.statusError,
      flex: 1,
    },
  }));

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
            color={isValid ? colors.statusSuccess : colors.statusError}
          />
          <Text style={[styles.statusText, { color: isValid ? colors.statusSuccess : colors.statusError }]}>
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
              color={isFormatted ? colors.textInverse : (isValid ? colors.accent : "#C7C7CC")}
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
              color={isValid ? colors.accent : "#C7C7CC"}
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
            <Ionicons name="trash-outline" size={16} color={colors.statusError} />
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
            <Ionicons name="alert-circle" size={16} color={colors.statusError} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </View>
    </View>
  );
};


export default JsonEditor; 