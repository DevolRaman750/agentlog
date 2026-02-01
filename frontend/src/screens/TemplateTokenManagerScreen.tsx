import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useThemedStyles } from '../theme';
import { AlertAPI } from '../components/CustomAlert';
import { goGentAPI } from '../api/client';
import DatePicker, { formatDateForAPI, parseDateFromAPI } from '../components/DatePicker';

interface AuthToken {
  id: string;
  tokenName: string;
  description: string;
  tokenValue: string;
  isActive: boolean;
  allowedOrigins?: Record<string, boolean>;
  customRateLimitPerHour?: number;
  expiresAt?: string;
  createdAt: string;
  totalUses?: number;
}

interface ExecutionTemplate {
  id: string;
  name: string;
  authTokens?: AuthToken[];
}

const TemplateTokenManagerScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { templateId, templateName } = route.params as { templateId: string; templateName: string };
  const styles = useTokenManagerStyles();

  const [template, setTemplate] = useState<ExecutionTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [editingToken, setEditingToken] = useState<AuthToken | null>(null);
  const [isTokenEditMode, setIsTokenEditMode] = useState(false);

  // Token form data
  const [tokenFormData, setTokenFormData] = useState({
    name: '',
    description: '',
    allowedOrigins: '',
    customRateLimitPerHour: '',
    expiresAt: '',
  });

  useEffect(() => {
    fetchTemplateTokens();
  }, [templateId]);

  const fetchTemplateTokens = async () => {
    try {
      setLoading(true);
      const response = await goGentAPI.getTemplates();
      
      if (response.success && response.data) {
        const foundTemplate = response.data.templates?.find(t => t.id === templateId);
        if (foundTemplate) {
          setTemplate({
            ...foundTemplate,
            authTokens: foundTemplate.authTokens || [],
          });
        }
      }
    } catch (err) {
      console.error('Error fetching template tokens:', err);
      AlertAPI.alert('Error', 'Failed to load template tokens');
    } finally {
      setLoading(false);
    }
  };

  const resetTokenForm = () => {
    setTokenFormData({
      name: '',
      description: '',
      allowedOrigins: '',
      customRateLimitPerHour: '',
      expiresAt: '',
    });
    setEditingToken(null);
    setIsTokenEditMode(false);
    setIsCreatingToken(false);
  };

  const openTokenEdit = (token: AuthToken) => {
    setTokenFormData({
      name: token.tokenName,
      description: token.description || '',
      allowedOrigins: token.allowedOrigins ? Object.keys(token.allowedOrigins).join(', ') : '',
      customRateLimitPerHour: token.customRateLimitPerHour?.toString() || '',
      expiresAt: token.expiresAt || '',
    });
    setEditingToken(token);
    setIsTokenEditMode(true);
    setIsCreatingToken(true);
  };

  const isTokenExpired = (token: AuthToken): boolean => {
    if (!token.expiresAt) return false;
    return new Date(token.expiresAt) < new Date();
  };

  const getTokenStatusColor = (token: AuthToken): string => {
    if (!token.isActive) return styles.statusError.color as string;
    if (isTokenExpired(token)) return styles.statusWarning.color as string;
    return styles.statusSuccess.color as string;
  };

  const getTokenStatusText = (token: AuthToken): string => {
    if (!token.isActive) return 'Inactive';
    if (isTokenExpired(token)) return 'Expired';
    return 'Active';
  };

  const handleCreateToken = async () => {
    if (!tokenFormData.name.trim()) {
      AlertAPI.alert(
        'Validation Error',
        'Token name is required',
        [{ text: 'OK', style: 'default' }]
      );
      return;
    }

    try {
      const tokenData = {
        templateId: templateId,
        tokenName: tokenFormData.name.trim(),
        description: tokenFormData.description.trim(),
        allowedOrigins: tokenFormData.allowedOrigins.split(',')
          .map(o => o.trim())
          .filter(o => o.length > 0)
          .reduce((acc: Record<string, boolean>, origin: string) => {
            acc[origin] = true;
            return acc;
          }, {}),
        customRateLimitPerHour: tokenFormData.customRateLimitPerHour ? parseInt(tokenFormData.customRateLimitPerHour) : undefined,
        expiresAt: tokenFormData.expiresAt || undefined,
      };

      const response = await goGentAPI.createTemplateToken(templateId, tokenData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create token');
      }

      resetTokenForm();
      fetchTemplateTokens();
      
      AlertAPI.alert(
        'Success',
        'Auth token created successfully!',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (err) {
      console.error('Error creating token:', err);
      AlertAPI.alert(
        'Error',
        'Failed to create auth token. Please try again.',
        [{ text: 'OK', style: 'destructive' }]
      );
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    AlertAPI.alert(
      'Confirm Delete',
      'Are you sure you want to delete this auth token? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await goGentAPI.deleteTemplateToken(templateId, tokenId);

              if (!response.success) {
                throw new Error(response.error || 'Failed to delete token');
              }

              fetchTemplateTokens();
              AlertAPI.alert(
                'Success',
                'Token deleted successfully',
                [{ text: 'OK', style: 'default' }]
              );
            } catch (err) {
              console.error('Error deleting token:', err);
              AlertAPI.alert(
                'Error',
                'Failed to delete token. Please try again.',
                [{ text: 'OK', style: 'destructive' }]
              );
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={styles.helpBannerText.color} />
          <Text style={styles.loadingText}>Loading tokens...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={styles.helpBannerText.color} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Auth Tokens</Text>
            <Text style={styles.subtitle}>{templateName}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsCreatingToken(true)}
          >
            <Ionicons name="add" size={24} color={styles.helpBannerText.color} />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Help Banner */}
          <View style={styles.helpBanner}>
            <Ionicons name="information-circle-outline" size={20} color={styles.helpBannerText.color} />
            <View style={styles.helpBannerContent}>
              <Text style={styles.helpBannerTitle}>Authentication Tokens</Text>
              <Text style={styles.helpBannerText}>
                Auth tokens allow secure API access to your template. Create tokens to integrate your templates into applications, websites, or automated systems.
              </Text>
            </View>
          </View>

          {/* Existing Tokens */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Existing Tokens ({template?.authTokens?.length || 0})
            </Text>

            {(template?.authTokens?.length || 0) === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="key-outline" size={48} color={styles.emptyStateText.color} />
                <Text style={styles.emptyStateTitle}>No Auth Tokens</Text>
                <Text style={styles.emptyStateText}>
                  Create your first authentication token to enable API access to this template.
                </Text>
                <TouchableOpacity
                  style={styles.createFirstTokenButton}
                  onPress={() => setIsCreatingToken(true)}
                >
                  <Text style={styles.createFirstTokenText}>Create First Token</Text>
                </TouchableOpacity>
              </View>
            ) : (
              template?.authTokens?.map((token, index) => (
                <View key={index} style={styles.tokenCard}>
                  <View style={styles.tokenCardHeader}>
                    <View style={styles.tokenTitleRow}>
                      <Text style={styles.tokenName}>{token.tokenName}</Text>
                      <View style={styles.tokenActions}>
                        <TouchableOpacity 
                          style={styles.tokenActionButton}
                          onPress={() => openTokenEdit(token)}
                        >
                          <Ionicons name="pencil-outline" size={16} color={styles.helpBannerText.color} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.tokenActionButton}
                          onPress={() => handleDeleteToken(token.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color={styles.statusError.color} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View 
                      style={[
                        styles.tokenStatusBadge, 
                        { backgroundColor: getTokenStatusColor(token) }
                      ]}
                    >
                      <Text style={styles.tokenStatusText}>
                        {getTokenStatusText(token)}
                      </Text>
                    </View>
                  </View>

                  {token.description && (
                    <Text style={styles.tokenDescription}>{token.description}</Text>
                  )}

                  <View style={styles.tokenDetailsGrid}>
                    <View style={styles.tokenDetailItem}>
                      <Text style={styles.tokenDetailLabel}>Created: </Text>
                      <Text style={styles.tokenDetailValue}>
                        {new Date(token.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    {token.expiresAt && (
                      <View style={styles.tokenDetailItem}>
                        <Text style={styles.tokenDetailLabel}>Expires: </Text>
                        <Text style={[
                          styles.tokenDetailValue,
                          isTokenExpired(token) && styles.expiredText
                        ]}>
                          {new Date(token.expiresAt).toLocaleDateString()}
                        </Text>
                      </View>
                    )}
                    {token.customRateLimitPerHour && (
                      <View style={styles.tokenDetailItem}>
                        <Text style={styles.tokenDetailLabel}>Rate Limit: </Text>
                        <Text style={styles.tokenDetailValue}>
                          {token.customRateLimitPerHour}/hour
                        </Text>
                      </View>
                    )}
                    <View style={styles.tokenDetailItem}>
                      <Text style={styles.tokenDetailLabel}>Total Uses: </Text>
                      <Text style={styles.tokenDetailValue}>
                        {token.totalUses || 0}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.tokenValueContainer}>
                    <Text style={styles.tokenValueLabel}>Token Value (Keep Secret)</Text>
                    <Text style={styles.tokenValue}>{token.tokenValue}</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Token Creation/Edit Form */}
          {isCreatingToken && (
            <View style={styles.formSection}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>
                  {isTokenEditMode ? 'Edit Token' : 'Create New Token'}
                </Text>
                <TouchableOpacity
                  style={styles.closeFormButton}
                  onPress={resetTokenForm}
                >
                  <Ionicons name="close" size={20} color={styles.loadingText.color} />
                </TouchableOpacity>
              </View>
              
              {/* Token Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Token Name *</Text>
                <Text style={styles.inputDescription}>
                  A descriptive name for this token. This helps you identify the token's purpose (e.g., "Production API", "Mobile App").
                </Text>
                <TextInput
                  style={styles.input}
                  value={tokenFormData.name}
                  onChangeText={(text) => setTokenFormData({...tokenFormData, name: text})}
                  placeholder="e.g., Production API Access"
                  placeholderTextColor={styles.loadingText.color}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <Text style={styles.inputDescription}>
                  Optional detailed description of this token's intended use, restrictions, or context.
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={tokenFormData.description}
                  onChangeText={(text) => setTokenFormData({...tokenFormData, description: text})}
                  placeholder="Describe the purpose and usage of this token..."
                  placeholderTextColor={styles.loadingText.color}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Allowed Origins */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Allowed Origins</Text>
                <Text style={styles.inputDescription}>
                  Comma-separated list of allowed domains/origins for CORS. Leave empty to allow all origins. 
                  Examples: https://myapp.com, http://localhost:3000
                </Text>
                <TextInput
                  style={styles.input}
                  value={tokenFormData.allowedOrigins}
                  onChangeText={(text) => setTokenFormData({...tokenFormData, allowedOrigins: text})}
                  placeholder="https://myapp.com, http://localhost:3000"
                  placeholderTextColor={styles.loadingText.color}
                />
              </View>

              {/* Rate Limit */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Custom Rate Limit (per hour)</Text>
                <Text style={styles.inputDescription}>
                  Maximum requests per hour for this token. Leave empty to use default limits. Helps prevent abuse and manage costs.
                </Text>
                <TextInput
                  style={styles.input}
                  value={tokenFormData.customRateLimitPerHour}
                  onChangeText={(text) => setTokenFormData({...tokenFormData, customRateLimitPerHour: text})}
                  placeholder="e.g., 100"
                  placeholderTextColor={styles.loadingText.color}
                  keyboardType="numeric"
                />
              </View>

              {/* Expiration Date */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Expiration Date</Text>
                <Text style={styles.inputDescription}>
                  Optional expiration date for enhanced security. After this date, the token will stop working. Leave empty for no expiration.
                </Text>
                <DatePicker
                  label="Token Expiration"
                  description="When this token should expire (optional)"
                  value={tokenFormData.expiresAt ? parseDateFromAPI(tokenFormData.expiresAt) : null}
                  onChange={(date: Date | null) => {
                    const formattedDate = formatDateForAPI(date);
                    setTokenFormData({...tokenFormData, expiresAt: formattedDate || ''});
                  }}
                  mode="date"
                  minimumDate={new Date()}
                />
              </View>

              {/* Create/Update Button */}
              <TouchableOpacity 
                style={styles.createTokenButton}
                onPress={() => {
                  if (isTokenEditMode && editingToken) {
                    AlertAPI.alert(
                      'Feature Coming Soon',
                      'Token editing will be available in the next update.'
                    );
                  } else {
                    handleCreateToken();
                  }
                }}
              >
                <Ionicons
                  name={isTokenEditMode ? "checkmark-circle-outline" : "add-circle-outline"}
                  size={20}
                  color={styles.createTokenText.color}
                />
                <Text style={styles.createTokenText}>
                  {isTokenEditMode ? 'Update Token' : 'Create Token'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Security Information */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark-outline" size={20} color={styles.statusSuccess.color} />
            <View style={styles.securityInfoContent}>
              <Text style={styles.securityInfoTitle}>Security Best Practices</Text>
              <Text style={styles.securityInfoText}>
                • Store tokens securely and never expose them in client-side code{'\n'}
                • Use HTTPS when making API calls with tokens{'\n'}
                • Set expiration dates for enhanced security{'\n'}
                • Restrict origins to only necessary domains{'\n'}
                • Monitor token usage and rotate regularly
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const useTokenManagerStyles = () => useThemedStyles((colors) => ({
  container: {
    flex: 1,
    backgroundColor: colors.bgApp,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 12,
  },
  header: {
    backgroundColor: colors.bgCard,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  helpBanner: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: 16,
    backgroundColor: colors.accentSoft,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  helpBannerContent: {
    marginLeft: 12,
    flex: 1,
  },
  helpBannerTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  helpBannerText: {
    fontSize: 14,
    color: colors.accent,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: 'center' as const,
    padding: 32,
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 24,
  },
  createFirstTokenButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstTokenText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  tokenCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tokenCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 8,
  },
  tokenTitleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginRight: 10,
  },
  tokenActions: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  tokenActionButton: {
    padding: 4,
  },
  tokenStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start' as const,
  },
  tokenStatusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  tokenDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  tokenDetailsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 12,
    marginBottom: 12,
  },
  tokenDetailItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  tokenDetailLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  tokenDetailValue: {
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: '600' as const,
  },
  expiredText: {
    color: colors.statusError,
  },
  tokenValueContainer: {
    backgroundColor: colors.bgApp,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  tokenValueLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 12,
    fontFamily: 'monospace' as const,
    color: colors.textPrimary,
    lineHeight: 16,
  },
  formSection: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  formHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.textPrimary,
  },
  closeFormButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.bgApp,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  createTokenButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 16,
  },
  createTokenText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  securityInfo: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.bgHover,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.accentSoft,
  },
  securityInfoContent: {
    marginLeft: 12,
  },
  securityInfoTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  securityInfoText: {
    fontSize: 14,
    color: colors.accent,
    lineHeight: 20,
  },
  // Status color helpers
  statusError: {
    color: colors.statusError,
  },
  statusWarning: {
    color: colors.statusWarning,
  },
  statusSuccess: {
    color: colors.statusSuccess,
  },
}));

export default TemplateTokenManagerScreen; 