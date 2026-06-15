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
import { useThemedStyles, spacing, radius, typography, touchTarget } from '../theme';
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
    ...typography.title,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  header: {
    backgroundColor: colors.bgCard,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: spacing.sm,
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  helpBanner: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    padding: spacing.md,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  helpBannerContent: {
    marginLeft: spacing.md,
    flex: 1,
  },
  helpBannerTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  helpBannerText: {
    ...typography.body,
    color: colors.accent,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  emptyStateContainer: {
    alignItems: 'center' as const,
    padding: spacing.xl,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  emptyStateTitle: {
    ...typography.h2,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: spacing.xl,
  },
  createFirstTokenButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    minHeight: touchTarget.min,
    justifyContent: 'center' as const,
  },
  createFirstTokenText: {
    ...typography.title,
    color: colors.textInverse,
  },
  tokenCard: {
    backgroundColor: colors.bgSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  tokenCardHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  tokenTitleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  tokenName: {
    ...typography.title,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  tokenActions: {
    flexDirection: 'row' as const,
    gap: spacing.sm,
  },
  tokenActionButton: {
    padding: spacing.xs,
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  tokenStatusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
    alignSelf: 'flex-start' as const,
  },
  tokenStatusText: {
    ...typography.caption,
    fontWeight: '600' as const,
    color: colors.textInverse,
  },
  tokenDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  tokenDetailsGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  tokenDetailItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  tokenDetailLabel: {
    ...typography.caption,
    fontWeight: '500' as const,
    color: colors.textSecondary,
  },
  tokenDetailValue: {
    ...typography.bodyStrong,
    color: colors.textPrimary,
  },
  expiredText: {
    color: colors.statusError,
  },
  tokenValueContainer: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginTop: spacing.sm,
  },
  tokenValueLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tokenValue: {
    ...typography.caption,
    fontFamily: 'monospace' as const,
    color: colors.textPrimary,
  },
  formSection: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  formHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
  },
  formTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  closeFormButton: {
    padding: spacing.xs,
    minWidth: touchTarget.min,
    minHeight: touchTarget.min,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  inputLabel: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputDescription: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: spacing.md,
    ...typography.title,
    fontWeight: '400' as const,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  createTokenButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: spacing.sm,
    marginTop: spacing.lg,
    minHeight: touchTarget.min,
  },
  createTokenText: {
    ...typography.title,
    color: colors.textInverse,
  },
  securityInfo: {
    flexDirection: 'row' as const,
    alignItems: 'flex-start' as const,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.bgHover,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  securityInfoContent: {
    marginLeft: spacing.md,
  },
  securityInfoTitle: {
    ...typography.title,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  securityInfoText: {
    ...typography.body,
    color: colors.accent,
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