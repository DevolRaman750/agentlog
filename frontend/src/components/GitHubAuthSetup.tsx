import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthTooltip } from './AuthTooltip';

interface GitHubAuthSetupProps {
  onSave: (authMode: 'personal_access_token' | 'github_app', config: any) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const GitHubAuthSetup: React.FC<GitHubAuthSetupProps> = ({
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [selectedMode, setSelectedMode] = useState<'personal_access_token' | 'github_app'>('personal_access_token');
  const [patToken, setPATToken] = useState('');
  const [appId, setAppId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [installationId, setInstallationId] = useState('');

  const validatePAT = (token: string): boolean => {
    return /^ghp_[A-Za-z0-9]{36}$/.test(token);
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

  const handleSave = async () => {
    if (selectedMode === 'personal_access_token') {
      if (!validatePAT(patToken)) {
        Alert.alert(
          'Invalid Token Format',
          'Please enter a valid GitHub Personal Access Token. It should start with "ghp_" and be 40 characters long.'
        );
        return;
      }
      
      await onSave('personal_access_token', { token: patToken });
    } else {
      if (!validateAppId(appId)) {
        Alert.alert('Invalid App ID', 'Please enter a valid numeric GitHub App ID.');
        return;
      }
      
      if (!validateInstallationId(installationId)) {
        Alert.alert('Invalid Installation ID', 'Please enter a valid numeric Installation ID.');
        return;
      }
      
      if (!validatePrivateKey(privateKey)) {
        Alert.alert(
          'Invalid Private Key',
          'Please paste the complete private key file content, including the BEGIN and END lines.'
        );
        return;
      }
      
      await onSave('github_app', {
        app_id: parseInt(appId),
        private_key: privateKey,
        installation_id: parseInt(installationId),
      });
    }
  };

  const isFormValid = () => {
    if (selectedMode === 'personal_access_token') {
      return validatePAT(patToken);
    } else {
      return validateAppId(appId) && validateInstallationId(installationId) && validatePrivateKey(privateKey);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>GitHub Authentication Setup</Text>
        <Text style={styles.subtitle}>
          Choose how your agents will authenticate with GitHub APIs
        </Text>
      </View>

      {/* Auth Mode Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authentication Method</Text>
        
        <TouchableOpacity
          style={[styles.optionCard, selectedMode === 'personal_access_token' && styles.selectedOption]}
          onPress={() => setSelectedMode('personal_access_token')}
        >
          <View style={styles.optionHeader}>
            <View style={styles.optionTitleContainer}>
              <Ionicons 
                name={selectedMode === 'personal_access_token' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color={selectedMode === 'personal_access_token' ? '#007AFF' : '#999'} 
              />
              <Text style={styles.optionTitle}>Personal Access Token (PAT)</Text>
              <Text style={styles.recommendedBadge}>RECOMMENDED FOR BEGINNERS</Text>
            </View>
          </View>
          <Text style={styles.optionDescription}>
            Simple setup using your personal GitHub token. Perfect for individual developers and small teams.
          </Text>
          <View style={styles.optionFeatures}>
            <Text style={styles.featureText}>✅ Quick 2-minute setup</Text>
            <Text style={styles.featureText}>✅ Uses your GitHub permissions</Text>
            <Text style={styles.featureText}>✅ No app creation required</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.optionCard, selectedMode === 'github_app' && styles.selectedOption]}
          onPress={() => setSelectedMode('github_app')}
        >
          <View style={styles.optionHeader}>
            <View style={styles.optionTitleContainer}>
              <Ionicons 
                name={selectedMode === 'github_app' ? 'radio-button-on' : 'radio-button-off'} 
                size={20} 
                color={selectedMode === 'github_app' ? '#007AFF' : '#999'} 
              />
              <Text style={styles.optionTitle}>GitHub App</Text>
              <Text style={styles.advancedBadge}>ADVANCED</Text>
            </View>
          </View>
          <Text style={styles.optionDescription}>
            Enterprise-grade authentication with fine-grained permissions and higher rate limits.
          </Text>
          <View style={styles.optionFeatures}>
            <Text style={styles.featureText}>🚀 Higher rate limits (5000/hour per installation)</Text>
            <Text style={styles.featureText}>🔒 Fine-grained repository permissions</Text>
            <Text style={styles.featureText}>📊 Better audit logs and monitoring</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Configuration Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>

        {selectedMode === 'personal_access_token' ? (
          <AuthTooltip
            title="GitHub Personal Access Token"
            description="A Personal Access Token (PAT) is like a password that gives your agents permission to access your GitHub repositories on your behalf. It's the simplest way to get started with GitHub integration."
            steps={[
              "Go to GitHub.com and sign in to your account",
              "Click your profile picture in the top-right corner",
              "Select 'Settings' from the dropdown menu",
              "Scroll down and click 'Developer settings' in the left sidebar",
              "Click 'Personal access tokens' → 'Tokens (classic)'",
              "Click 'Generate new token' → 'Generate new token (classic)'",
              "Give your token a descriptive name like 'AgentLog Integration'",
              "Select an expiration date (90 days recommended for security)",
              "Check the 'repo' scope to give full repository access",
              "Optionally check 'read:user' for user information access",
              "Click 'Generate token' at the bottom",
              "IMPORTANT: Copy the token immediately - you won't see it again!",
              "Paste the token in the field below"
            ]}
            warnings={[
              "Never share your token with anyone - treat it like a password",
              "The token will start with 'ghp_' and be exactly 40 characters long",
              "If you lose the token, you'll need to generate a new one",
              "Tokens can expire - set a calendar reminder to renew them"
            ]}
            benefits={[
              "Quick setup in under 5 minutes",
              "Uses your existing GitHub permissions",
              "No additional app configuration needed",
              "Perfect for personal projects and small teams"
            ]}
            links={[
              {
                text: "Creating a Personal Access Token",
                url: "https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token",
                description: "Official GitHub guide with screenshots"
              },
              {
                text: "Token Scopes Explained",
                url: "https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps",
                description: "Understanding what permissions each scope grants"
              }
            ]}
          >
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
                  Token should start with 'ghp_' and be 40 characters long
                </Text>
              )}
              {validatePAT(patToken) && (
                <Text style={styles.successText}>✅ Valid token format</Text>
              )}
            </View>
          </AuthTooltip>
        ) : (
          <>
            <AuthTooltip
              title="GitHub App ID"
              description="The App ID is a unique number that identifies your GitHub App. Think of it as your app's ID card that GitHub uses to recognize it."
              steps={[
                "Go to GitHub.com and sign in to your account",
                "Click your profile picture → Settings",
                "Click 'Developer settings' in the left sidebar",
                "Click 'GitHub Apps'",
                "Click 'New GitHub App'",
                "Fill in the app details:",
                "  • App name: 'AgentLog Integration' (or your preferred name)",
                "  • Homepage URL: Your website or GitHub profile",
                "  • Webhook URL: Leave blank for now",
                "Set Repository permissions:",
                "  • Contents: Read (to read code)",
                "  • Issues: Write (to create/update issues)",
                "  • Pull requests: Write (to create/update PRs)",
                "  • Metadata: Read (required)",
                "Click 'Create GitHub App'",
                "Your App ID will be displayed at the top of the app settings page"
              ]}
              warnings={[
                "The App ID is a number, typically 6-7 digits long",
                "Don't confuse this with the Client ID (which is longer)",
                "You can find this on your GitHub App's settings page anytime"
              ]}
              links={[
                {
                  text: "Creating a GitHub App",
                  url: "https://docs.github.com/en/developers/apps/building-github-apps/creating-a-github-app",
                  description: "Complete guide to creating your first GitHub App"
                },
                {
                  text: "GitHub App Permissions",
                  url: "https://docs.github.com/en/developers/apps/building-github-apps/setting-permissions-for-github-apps",
                  description: "Understanding what permissions your app needs"
                }
              ]}
            >
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
            </AuthTooltip>

            <AuthTooltip
              title="Private Key"
              description="The private key is like a secret password that proves your app is authentic. GitHub uses this to verify that requests are really coming from your app and not someone pretending to be your app."
              steps={[
                "On your GitHub App settings page, scroll down to 'Private keys'",
                "Click 'Generate a private key'",
                "A .pem file will be downloaded to your computer",
                "Open the .pem file in a text editor (like Notepad or TextEdit)",
                "Copy the ENTIRE contents of the file, including the BEGIN and END lines",
                "Paste it in the field below"
              ]}
              warnings={[
                "NEVER share your private key with anyone - it's like giving away your password",
                "The key should start with '-----BEGIN RSA PRIVATE KEY-----' or '-----BEGIN PRIVATE KEY-----'",
                "Include the entire key, including all the dashes and line breaks",
                "Store the .pem file securely - you might need it again"
              ]}
              benefits={[
                "Enables secure authentication without passwords",
                "Allows your app to act independently of user accounts",
                "Required for GitHub App authentication"
              ]}
              links={[
                {
                  text: "Generating Private Keys",
                  url: "https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps#generating-a-private-key",
                  description: "How to generate and manage private keys"
                }
              ]}
            >
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
            </AuthTooltip>

            <AuthTooltip
              title="Installation ID"
              description="The Installation ID tells GitHub which specific installation of your app to use. When you install your GitHub App on repositories, each installation gets a unique ID number."
              steps={[
                "After creating your GitHub App, you need to install it",
                "Go to your GitHub App settings page",
                "Click 'Install App' in the left sidebar",
                "Choose your account or organization",
                "Select which repositories to give access to:",
                "  • 'All repositories' for full access",
                "  • 'Selected repositories' to choose specific ones",
                "Click 'Install'",
                "After installation, look at the URL in your browser",
                "The Installation ID is the number at the end of the URL",
                "Example: github.com/settings/installations/12345678",
                "In this case, 12345678 is your Installation ID"
              ]}
              warnings={[
                "Each installation has a different ID - make sure you use the right one",
                "If you install the app on multiple accounts, each will have its own Installation ID",
                "The Installation ID is usually 8 digits long"
              ]}
              benefits={[
                "Allows your app to access the specific repositories you chose",
                "Enables fine-grained permission control",
                "Required for GitHub App API calls"
              ]}
              links={[
                {
                  text: "Installing GitHub Apps",
                  url: "https://docs.github.com/en/developers/apps/managing-github-apps/installing-github-apps",
                  description: "How to install your app and find the Installation ID"
                },
                {
                  text: "GitHub App Authentication Flow",
                  url: "https://docs.github.com/en/developers/apps/building-github-apps/authenticating-with-github-apps",
                  description: "Understanding how GitHub App authentication works"
                }
              ]}
            >
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
            </AuthTooltip>
          </>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          disabled={isLoading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, (!isFormValid() || isLoading) && styles.disabledButton]}
          onPress={handleSave}
          disabled={!isFormValid() || isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  optionCard: {
    borderWidth: 2,
    borderColor: '#E5E5E7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  optionHeader: {
    marginBottom: 8,
  },
  optionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginLeft: 8,
    flex: 1,
  },
  recommendedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34C759',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  advancedBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FF9500',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  optionFeatures: {
    gap: 4,
  },
  featureText: {
    fontSize: 13,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D1D6',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  invalidInput: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
  },
  successText: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D1D6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D1D6',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
