import React, { useState, useEffect } from 'react';
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
import { useTheme, useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';

interface MCPOperationsPanelProps {
  onExecuteOperation: (operationData: MCPOperationData) => void;
  loading?: boolean;
  mcpFunction?: FunctionDefinition;
}

export interface MCPOperationData {
  operation: 'create_branch' | 'commit_file' | 'create_pr' | 'list_repos' | 'get_file';
  repository: string;
  parameters: Record<string, any>;
}

interface ValidationError {
  field: string;
  message: string;
}

const OPERATIONS = [
  { value: 'create_branch', label: 'Create Branch', icon: 'git-branch-outline' },
  { value: 'commit_file', label: 'Commit File', icon: 'document-text-outline' },
  { value: 'create_pr', label: 'Create Pull Request', icon: 'git-pull-request-outline' },
  { value: 'list_repos', label: 'List Repositories', icon: 'library-outline' },
  { value: 'get_file', label: 'Get File Content', icon: 'code-outline' },
];

const COMMON_REPOS = [
  'owner/repo',
  'facebook/react',
  'microsoft/vscode',
  'vercel/next.js',
  'nodejs/node',
];

const OPERATION_EXAMPLES = {
  create_branch: {
    repository: 'owner/repo',
    parameters: {
      branch_name: 'feature/new-feature',
      from_branch: 'main',
      description: 'New feature branch for implementing user authentication'
    }
  },
  commit_file: {
    repository: 'owner/repo',
    parameters: {
      path: 'src/components/NewComponent.tsx',
      content: 'export const NewComponent = () => {\n  return <div>Hello World</div>;\n};',
      message: 'Add new component for user interface',
      branch: 'main'
    }
  },
  create_pr: {
    repository: 'owner/repo',
    parameters: {
      title: 'Add new authentication feature',
      body: 'This PR adds authentication functionality with login and logout features.',
      head_branch: 'feature/auth',
      base_branch: 'main',
      draft: false
    }
  },
  list_repos: {
    repository: 'owner/*',
    parameters: {
      type: 'public',
      sort: 'updated',
      per_page: 10
    }
  },
  get_file: {
    repository: 'owner/repo',
    parameters: {
      path: 'src/App.tsx',
      branch: 'main'
    }
  }
};

export const MCPOperationsPanel: React.FC<MCPOperationsPanelProps> = ({
  onExecuteOperation,
  loading = false,
  mcpFunction
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
      ...typography.h1,
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
      marginBottom: spacing.lg,
    },
    sectionTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    exampleButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.bgHover,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    exampleButtonText: {
      ...typography.label,
      color: colors.accent,
      marginLeft: spacing.xs,
    },
    operationGrid: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      marginHorizontal: -spacing.xs,
    },
    operationCard: {
      flex: 1,
      minWidth: '45%' as any,
      margin: spacing.xs,
      padding: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      borderWidth: 2,
      borderColor: colors.borderLight,
      alignItems: 'center' as const,
    },
    operationCardActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    operationLabel: {
      ...typography.bodyStrong,
      marginTop: spacing.sm,
      color: colors.textPrimary,
      textAlign: 'center' as const,
    },
    operationLabelActive: {
      color: colors.textInverse,
    },
    operationInfo: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
    },
    operationDescription: {
      ...typography.body,
      marginLeft: spacing.sm,
      color: colors.textSecondary,
      flex: 1,
    },
    repositoryInput: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
    },
    quickRepos: {
      marginTop: spacing.md,
    },
    quickReposLabel: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    quickRepoButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: colors.bgHover,
      borderRadius: radius.md,
      marginRight: spacing.sm,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    quickRepoText: {
      ...typography.caption,
      color: colors.accent,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    parametersEditor: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.md,
    },
    parametersEditorError: {
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
    guidelinesContainer: {
      marginTop: spacing.md,
      padding: spacing.md,
      backgroundColor: colors.bgSurface,
      borderRadius: radius.md,
    },
    guidelinesTitle: {
      ...typography.bodyStrong,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    guidelinesText: {
      ...typography.body,
      color: colors.textSecondary,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
      backgroundColor: colors.bgOverlay,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    alertContainer: {
      backgroundColor: colors.bgCard,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginHorizontal: spacing.lg,
      maxWidth: 300,
      shadowColor: colors.shadowColor,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
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

  const [operationData, setOperationData] = useState<MCPOperationData>({
    operation: 'create_branch',
    repository: '',
    parameters: {}
  });

  const [parametersJson, setParametersJson] = useState('{}');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'error' | 'warning' | 'info';
  }>({ visible: false, title: '', message: '', type: 'info' });

  // Update parameters when operation changes
  useEffect(() => {
    const example = OPERATION_EXAMPLES[operationData.operation];
    if (example) {
      setOperationData(prev => ({
        ...prev,
        repository: example.repository,
        parameters: example.parameters
      }));
      setParametersJson(JSON.stringify(example.parameters, null, 2));
    }
  }, [operationData.operation]);

  // Validate operation data
  const validateOperation = (): ValidationError[] => {
    const validationErrors: ValidationError[] = [];

    if (!operationData.repository.trim()) {
      validationErrors.push({ field: 'repository', message: 'Repository is required' });
    }

    if (!operationData.repository.includes('/') && operationData.operation !== 'list_repos') {
      validationErrors.push({ field: 'repository', message: 'Repository must be in format "owner/repo"' });
    }

    try {
      const params = JSON.parse(parametersJson);
      if (typeof params !== 'object' || Array.isArray(params)) {
        validationErrors.push({ field: 'parameters', message: 'Parameters must be a valid JSON object' });
      }
    } catch (error) {
      validationErrors.push({ field: 'parameters', message: 'Invalid JSON format in parameters' });
    }

    // Operation-specific validation
    if (operationData.operation === 'create_branch') {
      try {
        const params = JSON.parse(parametersJson);
        if (!params.branch_name) {
          validationErrors.push({ field: 'parameters', message: 'branch_name is required for create_branch operation' });
        }
      } catch (error) {
        // JSON error already handled above
      }
    }

    if (operationData.operation === 'commit_file') {
      try {
        const params = JSON.parse(parametersJson);
        if (!params.path || !params.content || !params.message) {
          validationErrors.push({ field: 'parameters', message: 'path, content, and message are required for commit_file operation' });
        }
      } catch (error) {
        // JSON error already handled above
      }
    }

    if (operationData.operation === 'create_pr') {
      try {
        const params = JSON.parse(parametersJson);
        if (!params.title || !params.head_branch || !params.base_branch) {
          validationErrors.push({ field: 'parameters', message: 'title, head_branch, and base_branch are required for create_pr operation' });
        }
      } catch (error) {
        // JSON error already handled above
      }
    }

    return validationErrors;
  };

  // Real-time validation
  useEffect(() => {
    const validationErrors = validateOperation();
    setErrors(validationErrors);
  }, [operationData, parametersJson]);

  const handleOperationChange = (operation: string) => {
    setOperationData(prev => ({ ...prev, operation: operation as any }));
  };

  const handleRepositoryChange = (repository: string) => {
    setOperationData(prev => ({ ...prev, repository }));
  };

  const handleParametersChange = (parametersText: string) => {
    setParametersJson(parametersText);
    try {
      const params = JSON.parse(parametersText);
      setOperationData(prev => ({ ...prev, parameters: params }));
    } catch (error) {
      // Keep the text but don't update the parameters object
    }
  };

  const handleExecuteOperation = () => {
    const validationErrors = validateOperation();

    if (validationErrors.length > 0) {
      setAlertConfig({
        visible: true,
        title: 'Validation Error',
        message: validationErrors.map(e => e.message).join('\n'),
        type: 'error'
      });
      return;
    }

    try {
      const finalOperationData = {
        ...operationData,
        parameters: JSON.parse(parametersJson)
      };
      onExecuteOperation(finalOperationData);
    } catch (error) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Failed to parse parameters JSON',
        type: 'error'
      });
    }
  };

  const loadExample = () => {
    const example = OPERATION_EXAMPLES[operationData.operation];
    if (example) {
      setOperationData(prev => ({
        ...prev,
        repository: example.repository,
        parameters: example.parameters
      }));
      setParametersJson(JSON.stringify(example.parameters, null, 2));
    }
  };

  const hasErrors = errors.length > 0;
  const isValid = operationData.repository.trim() && !hasErrors;

  const selectedOperation = OPERATIONS.find(op => op.value === operationData.operation);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="git-branch-outline" size={24} color={colors.accent} />
          <Text style={styles.title}>MCP GitHub Operations</Text>
        </View>
        <Text style={styles.subtitle}>
          Perform GitHub operations via Model Context Protocol (MCP) server
        </Text>
      </View>

      {/* Operation Selection */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Operation Type</Text>
          <TouchableOpacity style={styles.exampleButton} onPress={loadExample} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="bulb-outline" size={16} color={colors.accent} />
            <Text style={styles.exampleButtonText}>Example</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.operationGrid}>
          {OPERATIONS.map(operation => (
            <TouchableOpacity
              key={operation.value}
              style={[
                styles.operationCard,
                operationData.operation === operation.value && styles.operationCardActive
              ]}
              onPress={() => handleOperationChange(operation.value)}
            >
              <Ionicons
                name={operation.icon as any}
                size={24}
                color={operationData.operation === operation.value ? colors.textInverse : colors.accent}
              />
              <Text style={[
                styles.operationLabel,
                operationData.operation === operation.value && styles.operationLabelActive
              ]}>
                {operation.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedOperation && (
          <View style={styles.operationInfo}>
            <Ionicons name="information-circle-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.operationDescription}>
              {getOperationDescription(operationData.operation)}
            </Text>
          </View>
        )}
      </View>

      {/* Repository Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Repository</Text>

        <TextEditor
          value={operationData.repository}
          onChangeText={handleRepositoryChange}
          placeholder="owner/repository"
          minHeight={50}
          maxHeight={50}
          showLineNumbers={false}
          showCharacterCount={false}
          showWordCount={false}
          style={styles.repositoryInput}
        />

        <View style={styles.quickRepos}>
          <Text style={styles.quickReposLabel}>Quick Select:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {COMMON_REPOS.map(repo => (
              <TouchableOpacity
                key={repo}
                style={styles.quickRepoButton}
                onPress={() => handleRepositoryChange(repo)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.quickRepoText}>{repo}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Parameters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Parameters (JSON)</Text>

        <TextEditor
          value={parametersJson}
          onChangeText={handleParametersChange}
          placeholder='{"key": "value"}'
          language="json"
          showLineNumbers={true}
          minHeight={150}
          maxHeight={300}
          style={[styles.parametersEditor, hasErrors && styles.parametersEditorError]}
        />

        {/* Validation Errors */}
        {errors.map((error, index) => (
          <View key={index} style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={16} color={colors.statusError} />
            <Text style={styles.errorText}>{error.message}</Text>
          </View>
        ))}

        {/* Parameter Guidelines */}
        <View style={styles.guidelinesContainer}>
          <Text style={styles.guidelinesTitle}>Required Parameters:</Text>
          <Text style={styles.guidelinesText}>
            {getParameterGuidelines(operationData.operation)}
          </Text>
        </View>
      </View>

      {/* Execute Button */}
      <View style={styles.executeSection}>
        <TouchableOpacity
          style={[
            styles.executeButton,
            (!isValid || loading) && styles.executeButtonDisabled
          ]}
          onPress={handleExecuteOperation}
          disabled={!isValid || loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Ionicons name="play" size={20} color={colors.textInverse} />
          )}
          <Text style={styles.executeButtonText}>
            {loading ? 'Executing...' : `Execute ${selectedOperation?.label}`}
          </Text>
        </TouchableOpacity>

        {!mcpFunction && (
          <View style={styles.warningContainer}>
            <Ionicons name="warning-outline" size={16} color={colors.statusWarning} />
            <Text style={styles.warningText}>
              MCP function not found. Please ensure the MCP server is configured.
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
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.alertButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

function getOperationDescription(operation: string): string {
  switch (operation) {
    case 'create_branch':
      return 'Create a new branch from an existing branch or commit';
    case 'commit_file':
      return 'Create or update a file with a commit message';
    case 'create_pr':
      return 'Create a pull request to merge changes between branches';
    case 'list_repos':
      return 'List repositories for a user or organization';
    case 'get_file':
      return 'Retrieve the content of a specific file from a repository';
    default:
      return 'Select an operation to see its description';
  }
}

function getParameterGuidelines(operation: string): string {
  switch (operation) {
    case 'create_branch':
      return 'branch_name (string), from_branch (string, optional, defaults to "main")';
    case 'commit_file':
      return 'path (string), content (string), message (string), branch (string, optional)';
    case 'create_pr':
      return 'title (string), head_branch (string), base_branch (string), body (string, optional)';
    case 'list_repos':
      return 'type (string, optional: "public"|"private"|"all"), sort (string, optional), per_page (number, optional)';
    case 'get_file':
      return 'path (string), branch (string, optional, defaults to "main")';
    default:
      return 'No parameters required';
  }
}
