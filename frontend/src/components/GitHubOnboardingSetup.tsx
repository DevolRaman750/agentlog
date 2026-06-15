import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../context/ToastContext';
import { goGentAPI } from '../api/client';
import { CreateApiKeyRequest } from '../types';
import { useTheme, useThemedStyles } from '../theme';
import { spacing, radius, typography, touchTarget } from '../theme';

interface GitHubOnboardingSetupProps {
  onComplete: (success: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

type GitHubAuthMode = 'personal_access_token' | 'github_app';

export const GitHubOnboardingSetup: React.FC<GitHubOnboardingSetupProps> = ({
  onComplete,
  isLoading,
  setIsLoading,
}) => {
  const { colors } = useTheme();
  const { showSuccess, showError } = useToast();
  const [selectedMode, setSelectedMode] = useState<GitHubAuthMode>('personal_access_token');
  const [patToken, setPATToken] = useState('');
  const [appId, setAppId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [installationId, setInstallationId] = useState('');

  const styles = useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: colors.bgCard,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
      backgroundColor: colors.bgCard,
    },
    backButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: spacing.sm,
      minHeight: touchTarget.min,
    },
    backButtonText: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.accent,
      marginLeft: spacing.xs,
    },
    headerTitle: {
      ...typography.h2,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: spacing.sm,
      minWidth: touchTarget.min,
      minHeight: touchTarget.min,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    scrollContainer: {
      flex: 1,
    },
    content: {
      padding: spacing.lg,
    },
    title: {
      ...typography.display,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      ...typography.title,
      fontWeight: '400' as const,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
    },
    modeSelection: {
      marginBottom: spacing.xl,
    },
    modeCard: {
      borderWidth: 1,
      borderColor: colors.borderLight,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
    },
    selectedModeCard: {
      borderColor: colors.accent,
      backgroundColor: colors.bgHover,
    },
    modeHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
    },
    modeTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginLeft: spacing.md,
      flex: 1,
    },
    recommendedBadge: {
      ...typography.micro,
      fontWeight: '700' as const,
      color: colors.statusSuccess,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    advancedBadge: {
      ...typography.micro,
      fontWeight: '700' as const,
      color: colors.statusWarning,
      backgroundColor: `${colors.statusWarning}15`,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    modeDescription: {
      ...typography.body,
      color: colors.textSecondary,
    },
    instructionsCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.xl,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    instructionsHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.lg,
    },
    instructionsTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginLeft: spacing.sm,
      flex: 1,
    },
    linkButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
    },
    linkButtonText: {
      ...typography.caption,
      color: colors.textInverse,
      fontWeight: '600' as const,
      marginRight: spacing.xs,
    },
    scopesSection: {
      marginBottom: spacing.xl,
    },
    scopesTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    scopesDescription: {
      ...typography.body,
      color: colors.textSecondary,
      marginBottom: spacing.lg,
    },
    scopesList: {
      marginBottom: spacing.lg,
    },
    scopeItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.md,
    },
    scopeBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      marginRight: spacing.md,
      minWidth: 80,
      alignItems: 'center' as const,
    },
    scopeBadgeText: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    scopeDetails: {
      flex: 1,
    },
    scopeName: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 2,
    },
    scopeDescription: {
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.textSecondary,
    },
    securityTip: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: colors.accentSoft,
      padding: spacing.md,
      borderRadius: radius.md,
    },
    securityTipText: {
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.statusSuccess,
      marginLeft: spacing.sm,
      flex: 1,
    },
    securityTipBold: {
      fontWeight: '600' as const,
    },
    permissionsList: {
      marginBottom: spacing.lg,
    },
    permissionCategory: {
      marginBottom: spacing.lg,
    },
    permissionCategoryTitle: {
      ...typography.body,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    permissionItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      marginBottom: spacing.sm,
      paddingLeft: spacing.lg,
    },
    permissionName: {
      ...typography.label,
      color: colors.textPrimary,
      fontWeight: '500' as const,
      width: 100,
    },
    permissionLevel: {
      backgroundColor: colors.bgHover,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      marginRight: spacing.md,
    },
    permissionLevelText: {
      ...typography.micro,
      fontWeight: '600' as const,
      color: colors.accent,
    },
    permissionDescription: {
      ...typography.caption,
      color: colors.textSecondary,
      flex: 1,
    },
    repositoryTip: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      backgroundColor: colors.bgHover,
      padding: spacing.md,
      borderRadius: radius.md,
    },
    repositoryTipText: {
      ...typography.label,
      fontWeight: '400' as const,
      color: colors.accent,
      marginLeft: spacing.sm,
      flex: 1,
    },
    repositoryTipBold: {
      fontWeight: '600' as const,
    },
    stepsSection: {
      marginBottom: 0,
    },
    stepsTitle: {
      ...typography.title,
      color: colors.textPrimary,
      marginBottom: spacing.lg,
    },
    stepItem: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      marginBottom: spacing.md,
    },
    stepNumber: {
      width: 24,
      height: 24,
      borderRadius: radius.lg,
      backgroundColor: colors.accent,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginRight: spacing.md,
    },
    stepNumberText: {
      ...typography.caption,
      fontWeight: '600' as const,
      color: colors.textInverse,
    },
    stepText: {
      ...typography.body,
      color: colors.textPrimary,
      flex: 1,
    },
    inputSection: {
      marginBottom: spacing.xl,
    },
    inputContainer: {
      marginBottom: spacing.lg,
    },
    inputLabel: {
      ...typography.title,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: spacing.sm,
    },
    textInput: {
      borderWidth: 1,
      borderColor: colors.borderMedium,
      borderRadius: radius.md,
      padding: spacing.md,
      ...typography.title,
      fontWeight: '400' as const,
      backgroundColor: colors.bgSurface,
    },
    textArea: {
      borderWidth: 1,
      borderColor: colors.borderMedium,
      borderRadius: radius.md,
      padding: spacing.md,
      ...typography.body,
      backgroundColor: colors.bgSurface,
      minHeight: 120,
      textAlignVertical: 'top' as const,
    },
    invalidInput: {
      borderColor: colors.statusError,
      backgroundColor: colors.bgSurface,
    },
    errorText: {
      ...typography.caption,
      color: colors.statusError,
      marginTop: spacing.xs,
    },
    successText: {
      ...typography.caption,
      color: colors.statusSuccess,
      marginTop: spacing.xs,
    },
    saveButton: {
      backgroundColor: colors.accent,
      borderRadius: radius.md,
      paddingVertical: spacing.lg,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      minHeight: touchTarget.min,
    },
    disabledButton: {
      backgroundColor: colors.borderMedium,
    },
    saveButtonText: {
      ...typography.title,
      color: colors.textInverse,
    },
  }));

  const validatePAT = (token: string): boolean => {
    return /^ghp_[A-Za-z0-9]{36}$/.test(token) || /^github_pat_[A-Za-z0-9_]{82}$/.test(token);
  };

  const validateAppId = (id: string): boolean => {
    return /^\d+$/.test(id) && parseInt(id) > 0;
  };

  const validateInstallationId = (id: string): boolean => {
    return /^\d+$/.test(id) && parseInt(id) > 0;
  };

  const validatePrivateKey = (key: string): boolean => {
    return key.includes('-----BEGIN') && key.includes('-----END') && key.includes('PRIVATE KEY');
  };

  const isFormValid = (): boolean => {
    if (selectedMode === 'personal_access_token') {
      return validatePAT(patToken);
    } else {
      return validateAppId(appId) && validateInstallationId(installationId) && validatePrivateKey(privateKey);
    }
  };

  const handleSave = async () => {
    if (!isFormValid()) {
      showError('Please fill in all required fields with valid values');
      return;
    }

    setIsLoading(true);
    try {
      if (selectedMode === 'personal_access_token') {
        const createRequest: CreateApiKeyRequest = {
          keyName: 'GitHub Personal Access Token',
          serviceName: 'github',
          keyType: 'access_token',
          keyValue: patToken,
          authMode: 'personal_access_token',
          authConfig: { token: patToken },
          displayName: 'GitHub Personal Access Token',
          description: 'Personal Access Token for GitHub API access with repository-specific permissions',
          accessLevel: 'read_write',
          scopes: ['repo', 'read:user'],
          isDefault: true,
          environment: 'production',
        };

        const response = await goGentAPI.createApiKey(createRequest);

        if (response.success) {
          showSuccess('GitHub Personal Access Token configured successfully!');
          onComplete(true);
        } else {
          throw new Error(response.error || 'Failed to save GitHub PAT');
        }
      } else {
        const createRequest: CreateApiKeyRequest = {
          keyName: 'GitHub App Integration',
          serviceName: 'github',
          keyType: 'github_app_credentials',
          keyValue: 'github_app_auth',
          authMode: 'github_app',
          authConfig: {
            app_id: parseInt(appId),
            private_key: privateKey,
            installation_id: parseInt(installationId),
          },
          displayName: 'GitHub App Integration',
          description: 'GitHub App authentication with fine-grained repository permissions',
          accessLevel: 'read_write',
          scopes: ['repo', 'read:user'],
          isDefault: true,
          environment: 'production',
        };

        const response = await goGentAPI.createApiKey(createRequest);

        if (response.success) {
          showSuccess('GitHub App configured successfully!');
          onComplete(true);
        } else {
          throw new Error(response.error || 'Failed to save GitHub App');
        }
      }
    } catch (error) {
      console.error('GitHub setup error:', error);
      showError(error instanceof Error ? error.message : 'Failed to configure GitHub');
      onComplete(false);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPATInstructions = () => (
    <View style={styles.instructionsCard}>
      <View style={styles.instructionsHeader}>
        <Ionicons name="list" size={20} color={colors.accent} />
        <Text style={styles.instructionsTitle}>Personal Access Token Setup</Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL('https://github.com/settings/tokens')}
        >
          <Text style={styles.linkButtonText}>Open GitHub</Text>
          <Ionicons name="open-outline" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.scopesSection}>
        <Text style={styles.scopesTitle}>🔐 Required Permissions (Scopes)</Text>
        <Text style={styles.scopesDescription}>
          When creating your token, select these scopes for optimal agent functionality:
        </Text>

        <View style={styles.scopesList}>
          <View style={styles.scopeItem}>
            <View style={styles.scopeBadge}>
              <Text style={styles.scopeBadgeText}>repo</Text>
            </View>
            <View style={styles.scopeDetails}>
              <Text style={styles.scopeName}>Full repository access</Text>
              <Text style={styles.scopeDescription}>
                Allows agents to read code, create/update files, manage issues and PRs
              </Text>
            </View>
          </View>

          <View style={styles.scopeItem}>
            <View style={styles.scopeBadge}>
              <Text style={styles.scopeBadgeText}>read:user</Text>
            </View>
            <View style={styles.scopeDetails}>
              <Text style={styles.scopeName}>Read user information</Text>
              <Text style={styles.scopeDescription}>
                Allows agents to access basic profile information
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.securityTip}>
          <Ionicons name="shield-checkmark" size={16} color={colors.statusSuccess} />
          <Text style={styles.securityTipText}>
            <Text style={styles.securityTipBold}>Security Tip:</Text> Only grant access to repositories you want your agents to work with. You can always modify permissions later.
          </Text>
        </View>
      </View>

      <View style={styles.stepsSection}>
        <Text style={styles.stepsTitle}>📋 Step-by-step Guide</Text>
        {[
          'Go to GitHub.com and sign in to your account',
          'Click your profile picture → Settings',
          'Scroll down and click "Developer settings"',
          'Click "Personal access tokens" → "Tokens (classic)"',
          'Click "Generate new token" → "Generate new token (classic)"',
          'Enter a descriptive name like "AgentLog Integration"',
          'Set expiration (90 days recommended for security)',
          'Select the "repo" scope (this includes all repository permissions)',
          'Select "read:user" for user information access',
          'Click "Generate token" at the bottom',
          'Copy the token immediately - you won\'t see it again!',
          'Paste the token in the field below'
        ].map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderGitHubAppInstructions = () => (
    <View style={styles.instructionsCard}>
      <View style={styles.instructionsHeader}>
        <Ionicons name="list" size={20} color={colors.accent} />
        <Text style={styles.instructionsTitle}>GitHub App Setup</Text>
        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => Linking.openURL('https://github.com/settings/apps')}
        >
          <Text style={styles.linkButtonText}>Open GitHub</Text>
          <Ionicons name="open-outline" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <View style={styles.scopesSection}>
        <Text style={styles.scopesTitle}>🔐 Recommended Permissions</Text>
        <Text style={styles.scopesDescription}>
          Configure your GitHub App with these repository permissions for optimal agent functionality:
        </Text>

        <View style={styles.permissionsList}>
          <View style={styles.permissionCategory}>
            <Text style={styles.permissionCategoryTitle}>Repository Permissions</Text>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionName}>Contents</Text>
              <View style={styles.permissionLevel}>
                <Text style={styles.permissionLevelText}>Read & Write</Text>
              </View>
              <Text style={styles.permissionDescription}>Read and modify repository files</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionName}>Issues</Text>
              <View style={styles.permissionLevel}>
                <Text style={styles.permissionLevelText}>Write</Text>
              </View>
              <Text style={styles.permissionDescription}>Create and manage issues</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionName}>Pull requests</Text>
              <View style={styles.permissionLevel}>
                <Text style={styles.permissionLevelText}>Write</Text>
              </View>
              <Text style={styles.permissionDescription}>Create and manage pull requests</Text>
            </View>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionName}>Metadata</Text>
              <View style={styles.permissionLevel}>
                <Text style={styles.permissionLevelText}>Read</Text>
              </View>
              <Text style={styles.permissionDescription}>Access repository metadata (required)</Text>
            </View>
          </View>

          <View style={styles.permissionCategory}>
            <Text style={styles.permissionCategoryTitle}>Account Permissions</Text>
            <View style={styles.permissionItem}>
              <Text style={styles.permissionName}>Email addresses</Text>
              <View style={styles.permissionLevel}>
                <Text style={styles.permissionLevelText}>Read</Text>
              </View>
              <Text style={styles.permissionDescription}>Access user email (optional)</Text>
            </View>
          </View>
        </View>

        <View style={styles.repositoryTip}>
          <Ionicons name="information-circle" size={16} color={colors.accent} />
          <Text style={styles.repositoryTipText}>
            <Text style={styles.repositoryTipBold}>Repository Scope:</Text> Install the app only on specific repositories you want your agents to access, not all repositories.
          </Text>
        </View>
      </View>

      <View style={styles.stepsSection}>
        <Text style={styles.stepsTitle}>📋 Step-by-step Guide</Text>
        {[
          'Go to GitHub.com and sign in to your account',
          'Click your profile picture → Settings',
          'Click "Developer settings" in the left sidebar',
          'Click "GitHub Apps"',
          'Click "New GitHub App"',
          'Fill in basic information:',
          '  • App name: "AgentLog Integration" (or your preferred name)',
          '  • Homepage URL: Your website or GitHub profile',
          '  • Webhook URL: Leave blank for now',
          'Set Repository permissions as shown above',
          'Click "Create GitHub App"',
          'Note the App ID (you\'ll need this below)',
          'Scroll down to "Private keys" and click "Generate a private key"',
          'Download the .pem file and copy its entire contents',
          'Go to "Install App" and install it on your desired repositories',
          'Note the Installation ID from the URL after installation'
        ].map((step, index) => (
          <View key={index} style={styles.stepItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>{index + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onComplete(false)}
        >
          <Ionicons name="chevron-back" size={24} color={colors.accent} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>GitHub Setup</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => onComplete(false)}
        >
          <Ionicons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
        <Text style={styles.title}>GitHub Integration Setup</Text>
        <Text style={styles.subtitle}>
          Choose how your agents will authenticate with GitHub APIs
        </Text>

        {/* Auth Mode Selection */}
        <View style={styles.modeSelection}>
          <TouchableOpacity
            style={[
              styles.modeCard,
              selectedMode === 'personal_access_token' && styles.selectedModeCard
            ]}
            onPress={() => setSelectedMode('personal_access_token')}
          >
            <View style={styles.modeHeader}>
              <Ionicons
                name={selectedMode === 'personal_access_token' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedMode === 'personal_access_token' ? colors.accent : colors.textTertiary}
              />
              <Text style={styles.modeTitle}>Personal Access Token</Text>
              <Text style={styles.recommendedBadge}>RECOMMENDED</Text>
            </View>
            <Text style={styles.modeDescription}>
              Simple setup with your personal GitHub token. Perfect for individual developers.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.modeCard,
              selectedMode === 'github_app' && styles.selectedModeCard
            ]}
            onPress={() => setSelectedMode('github_app')}
          >
            <View style={styles.modeHeader}>
              <Ionicons
                name={selectedMode === 'github_app' ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={selectedMode === 'github_app' ? colors.accent : colors.textTertiary}
              />
              <Text style={styles.modeTitle}>GitHub App</Text>
              <Text style={styles.advancedBadge}>ADVANCED</Text>
            </View>
            <Text style={styles.modeDescription}>
              Fine-grained permissions and better rate limits. Requires app creation.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        {selectedMode === 'personal_access_token' ? renderPATInstructions() : renderGitHubAppInstructions()}

        {/* Input Fields */}
        <View style={styles.inputSection}>
          {selectedMode === 'personal_access_token' ? (
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Personal Access Token *</Text>
              <TextInput
                style={[styles.textInput, !validatePAT(patToken) && patToken.length > 0 && styles.invalidInput]}
                value={patToken}
                onChangeText={setPATToken}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              {patToken.length > 0 && !validatePAT(patToken) && (
                <Text style={styles.errorText}>
                  Token should start with 'ghp_' or 'github_pat_' and have the correct length
                </Text>
              )}
              {validatePAT(patToken) && (
                <Text style={styles.successText}>✅ Valid token format</Text>
              )}
            </View>
          ) : (
            <>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>App ID *</Text>
                <TextInput
                  style={[styles.textInput, !validateAppId(appId) && appId.length > 0 && styles.invalidInput]}
                  value={appId}
                  onChangeText={setAppId}
                  placeholder="123456"
                  keyboardType="numeric"
                />
                {appId.length > 0 && !validateAppId(appId) && (
                  <Text style={styles.errorText}>Please enter a valid numeric App ID</Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Private Key (.pem file content) *</Text>
                <TextInput
                  style={[styles.textArea, !validatePrivateKey(privateKey) && privateKey.length > 0 && styles.invalidInput]}
                  value={privateKey}
                  onChangeText={setPrivateKey}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;MIIEpAIBAAKCAQEA...&#10;-----END RSA PRIVATE KEY-----"
                  multiline
                  numberOfLines={6}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {privateKey.length > 0 && !validatePrivateKey(privateKey) && (
                  <Text style={styles.errorText}>
                    Please paste the complete private key including BEGIN/END lines
                  </Text>
                )}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Installation ID *</Text>
                <TextInput
                  style={[styles.textInput, !validateInstallationId(installationId) && installationId.length > 0 && styles.invalidInput]}
                  value={installationId}
                  onChangeText={setInstallationId}
                  placeholder="12345678"
                  keyboardType="numeric"
                />
                {installationId.length > 0 && !validateInstallationId(installationId) && (
                  <Text style={styles.errorText}>Please enter a valid numeric Installation ID</Text>
                )}
              </View>
            </>
          )}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, (!isFormValid() || isLoading) && styles.disabledButton]}
          onPress={handleSave}
          disabled={!isFormValid() || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.textInverse} />
          ) : (
            <Text style={styles.saveButtonText}>
              Configure GitHub {selectedMode === 'personal_access_token' ? 'PAT' : 'App'}
            </Text>
          )}
        </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};
