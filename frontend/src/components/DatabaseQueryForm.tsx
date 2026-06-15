import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import TextEditor from './TextEditor';

import { FunctionDefinition } from '../types';
import { useTheme, useThemedStyles } from '../theme';
import { spacing, radius, typography } from '../theme';

interface DatabaseQueryFormProps {
  onExecuteQuery: (queryData: DatabaseQueryData) => void;
  loading?: boolean;
  mysqlFunction?: FunctionDefinition;
}

export interface DatabaseQueryData {
  query: string;
  database: string;
  limit: number;
  timeout: number;
  format: 'json' | 'csv' | 'table';
}

interface ValidationError {
  field: string;
  message: string;
}

const DATABASES = ['main', 'analytics', 'logs', 'reporting'];
const FORMATS = ['json', 'csv', 'table'];
const SAMPLE_QUERIES = {
  users: 'SELECT id, name, email FROM users LIMIT 10;',
  functions: 'SELECT name, display_name, function_group, is_active FROM function_definitions WHERE is_system_resource = 1;',
  executions: 'SELECT id, name, created_at FROM execution_runs ORDER BY created_at DESC LIMIT 5;',
  analytics: 'SELECT DATE(created_at) as date, COUNT(*) as executions FROM execution_runs GROUP BY DATE(created_at);'
};

export const DatabaseQueryForm: React.FC<DatabaseQueryFormProps> = ({
  onExecuteQuery,
  loading = false,
  mysqlFunction
}) => {
  const { colors } = useTheme();

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgSurface,
      paddingHorizontal: spacing.lg,
    },
    header: {
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      marginBottom: spacing.lg,
    },
    titleRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    title: {
      ...typography.display,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginLeft: spacing.md,
    },
    subtitle: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
    },
    section: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionHeader: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    samplesButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.bgHover,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    samplesButtonText: {
      ...typography.label,
      color: colors.accent,
      marginLeft: spacing.xs,
    },
    samplesContainer: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    samplesTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    sampleItem: {
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    sampleLabel: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.accent,
      textTransform: 'uppercase' as const,
      marginBottom: spacing.xs,
    },
    sampleQuery: {
      ...typography.body,
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    queryEditor: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
    },
    queryEditorError: {
      borderColor: colors.statusError,
    },
    errorContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
    },
    errorText: {
      ...typography.body,
      color: colors.statusError,
      marginLeft: spacing.sm,
      flex: 1,
    },
    configGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      marginHorizontal: -spacing.sm,
    },
    configItem: {
      flex: 1,
      minWidth: 150,
      paddingHorizontal: spacing.sm,
      marginBottom: spacing.lg,
    },
    configLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      backgroundColor: colors.bgCard,
    },
    picker: {
      height: 50,
    },
    formatButtons: {
      flexDirection: 'row' as const,
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
      overflow: 'hidden' as const,
    },
    formatButton: {
      flex: 1,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.bgCard,
      alignItems: 'center' as const,
      borderRightWidth: 1,
      borderRightColor: colors.borderLight,
    },
    formatButtonActive: {
      backgroundColor: colors.accent,
    },
    formatButtonText: {
      ...typography.label,
      color: colors.textSecondary,
    },
    formatButtonTextActive: {
      color: colors.textInverse,
    },
    numberInput: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
    },
    executeSection: {
      paddingVertical: spacing.lg,
    },
    executeButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.xl,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    executeButtonDisabled: {
      backgroundColor: colors.textTertiary,
    },
    executeButtonText: {
      ...typography.title,
      color: colors.textInverse,
      marginLeft: spacing.sm,
    },
    warningContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: spacing.md,
      paddingHorizontal: spacing.sm,
    },
    warningText: {
      ...typography.body,
      color: colors.statusWarning,
      marginLeft: spacing.sm,
      flex: 1,
    },
    alertOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    alertContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      maxWidth: 300,
    },
    alertTitle: {
      ...typography.h2,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    alertMessage: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    alertButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center' as const,
    },
    alertButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
  }));

  const [queryData, setQueryData] = useState<DatabaseQueryData>({
    query: '',
    database: 'main',
    limit: 100,
    timeout: 30,
    format: 'json'
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [showSamples, setShowSamples] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
  }>({ visible: false, title: '', message: '', type: 'info' });

  // Validate query for security and syntax
  const validateQuery = useCallback((query: string): ValidationError[] => {
    const validationErrors: ValidationError[] = [];
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      validationErrors.push({ field: 'query', message: 'SQL query is required' });
      return validationErrors;
    }

    if (trimmedQuery.length < 10) {
      validationErrors.push({ field: 'query', message: 'Query must be at least 10 characters long' });
    }

    if (trimmedQuery.length > 5000) {
      validationErrors.push({ field: 'query', message: 'Query must be less than 5000 characters' });
    }

    // Check if query starts with SELECT
    const queryUpper = trimmedQuery.toUpperCase();
    if (!queryUpper.startsWith('SELECT')) {
      validationErrors.push({ field: 'query', message: 'Only SELECT queries are allowed for security' });
    }

    // Check for dangerous patterns
    const dangerousPatterns = [
      'DROP', 'DELETE', 'UPDATE', 'INSERT', 'CREATE', 'ALTER', 'TRUNCATE',
      'EXEC', 'EXECUTE', 'CALL', 'MERGE', 'GRANT', 'REVOKE', 'LOAD', 'OUTFILE',
      '--', '/*', '*/', 'UNION', 'INTO OUTFILE', 'LOAD_FILE'
    ];

    for (const pattern of dangerousPatterns) {
      if (queryUpper.includes(pattern)) {
        validationErrors.push({
          field: 'query',
          message: `Dangerous SQL pattern detected: ${pattern}. Only safe SELECT queries are allowed.`
        });
        break; // Only show first dangerous pattern
      }
    }

    return validationErrors;
  }, []);

  // Real-time validation
  useEffect(() => {
    const validationErrors = validateQuery(queryData.query);
    setErrors(validationErrors);
  }, [queryData.query, validateQuery]);

  const handleQueryChange = (query: string) => {
    setQueryData(prev => ({ ...prev, query }));
  };

  const handleDatabaseChange = (database: string) => {
    setQueryData(prev => ({ ...prev, database }));
  };

  const handleLimitChange = (limit: string) => {
    const numLimit = parseInt(limit, 10);
    if (!isNaN(numLimit) && numLimit >= 1 && numLimit <= 1000) {
      setQueryData(prev => ({ ...prev, limit: numLimit }));
    }
  };

  const handleTimeoutChange = (timeout: string) => {
    const numTimeout = parseInt(timeout, 10);
    if (!isNaN(numTimeout) && numTimeout >= 5 && numTimeout <= 60) {
      setQueryData(prev => ({ ...prev, timeout: numTimeout }));
    }
  };

  const handleFormatChange = (format: 'json' | 'csv' | 'table') => {
    setQueryData(prev => ({ ...prev, format }));
  };

  const handleSampleQuery = (query: string) => {
    setQueryData(prev => ({ ...prev, query }));
    setShowSamples(false);
  };

  const handleExecuteQuery = () => {
    const validationErrors = validateQuery(queryData.query);

    if (validationErrors.length > 0) {
      setAlertConfig({
        visible: true,
        title: 'Validation Error',
        message: validationErrors.map(e => e.message).join('\n'),
        type: 'error'
      });
      return;
    }

    onExecuteQuery(queryData);
  };

  const hasErrors = errors.length > 0;
  const isQueryValid = queryData.query.trim().length >= 10 && !hasErrors;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="server-outline" size={24} color={colors.accent} />
          <Text style={styles.title}>MySQL Database Query</Text>
        </View>
        <Text style={styles.subtitle}>
          Execute secure SELECT queries against configured databases
        </Text>
      </View>

      {/* Query Editor */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>SQL Query</Text>
          <TouchableOpacity
            style={styles.samplesButton}
            onPress={() => setShowSamples(!showSamples)}
          >
            <Ionicons name="code-outline" size={16} color={colors.accent} />
            <Text style={styles.samplesButtonText}>Samples</Text>
          </TouchableOpacity>
        </View>

        {showSamples && (
          <View style={styles.samplesContainer}>
            <Text style={styles.samplesTitle}>Sample Queries:</Text>
            {Object.entries(SAMPLE_QUERIES).map(([key, query]) => (
              <TouchableOpacity
                key={key}
                style={styles.sampleItem}
                onPress={() => handleSampleQuery(query)}
              >
                <Text style={styles.sampleLabel}>{key}:</Text>
                <Text style={styles.sampleQuery} numberOfLines={2}>
                  {query}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TextEditor
          value={queryData.query}
          onChangeText={handleQueryChange}
          placeholder="SELECT * FROM table_name WHERE condition LIMIT 10;"
          language="sql"
          showLineNumbers={true}
          minHeight={120}
          maxHeight={200}
          style={[styles.queryEditor, hasErrors && styles.queryEditorError]}
        />

        {/* Validation Errors */}
        {errors.map((error, index) => (
          <View key={index} style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color={colors.statusError} />
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        ))}
      </View>

      {/* Database Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>

        <View style={styles.configGrid}>
          {/* Database Selection */}
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Database</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={queryData.database}
                onValueChange={handleDatabaseChange}
                style={styles.picker}
              >
                {DATABASES.map(db => (
                  <Picker.Item key={db} label={db} value={db} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Format Selection */}
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Format</Text>
            <View style={styles.formatButtons}>
              {FORMATS.map(format => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.formatButton,
                    queryData.format === format && styles.formatButtonActive
                  ]}
                  onPress={() => handleFormatChange(format as any)}
                >
                  <Text style={[
                    styles.formatButtonText,
                    queryData.format === format && styles.formatButtonTextActive
                  ]}>
                    {format.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Limit and Timeout */}
        <View style={styles.configGrid}>
          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Limit (1-1000)</Text>
            <TextEditor
              value={queryData.limit.toString()}
              onChangeText={handleLimitChange}
              placeholder="100"
              minHeight={40}
              maxHeight={40}
              showLineNumbers={false}
              showCharacterCount={false}
              showWordCount={false}
              style={styles.numberInput}
            />
          </View>

          <View style={styles.configItem}>
            <Text style={styles.configLabel}>Timeout (5-60s)</Text>
            <TextEditor
              value={queryData.timeout.toString()}
              onChangeText={handleTimeoutChange}
              placeholder="30"
              minHeight={40}
              maxHeight={40}
              showLineNumbers={false}
              showCharacterCount={false}
              showWordCount={false}
              style={styles.numberInput}
            />
          </View>
        </View>
      </View>

      {/* Execute Button */}
      <View style={styles.executeSection}>
        <TouchableOpacity
          style={[
            styles.executeButton,
            (!isQueryValid || loading) && styles.executeButtonDisabled
          ]}
          onPress={handleExecuteQuery}
          disabled={!isQueryValid || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Ionicons name="play" size={20} color={colors.textInverse} />
          )}
          <Text style={styles.executeButtonText}>
            {loading ? 'Executing...' : 'Execute Query'}
          </Text>
        </TouchableOpacity>

        {!mysqlFunction && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning-outline" size={16} color={colors.statusWarning} />
            <Text style={styles.warningText}>
              MySQL function not found. Please ensure the function is configured.
            </Text>
          </View>
        )}
      </View>

      <Modal visible={alertConfig.visible} transparent>
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <Text style={styles.alertTitle}>{alertConfig.title}</Text>
            <Text style={styles.alertMessage}>{alertConfig.message}</Text>
            <TouchableOpacity
              style={styles.alertButton}
              onPress={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};
