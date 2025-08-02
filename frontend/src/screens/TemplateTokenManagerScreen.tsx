import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
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
    if (!token.isActive) return '#FF3B30';
    if (isTokenExpired(token)) return '#FF9500';
    return '#34C759';
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
          <ActivityIndicator size="large" color="#007AFF" />
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
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Auth Tokens</Text>
            <Text style={styles.subtitle}>{templateName}</Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setIsCreatingToken(true)}
          >
            <Ionicons name="add" size={24} color="#007AFF" />
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
            <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
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
                <Ionicons name="key-outline" size={48} color="#8E8E93" />
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
                          <Ionicons name="pencil-outline" size={16} color="#007AFF" />
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={styles.tokenActionButton}
                          onPress={() => handleDeleteToken(token.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#FF3B30" />
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
                  <Ionicons name="close" size={20} color="#8E8E93" />
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
                  placeholderTextColor="#8E8E93"
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
                  placeholderTextColor="#8E8E93"
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
                  placeholderTextColor="#8E8E93"
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
                  placeholderTextColor="#8E8E93"
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
                  color="#FFFFFF" 
                />
                <Text style={styles.createTokenText}>
                  {isTokenEditMode ? 'Update Token' : 'Create Token'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Security Information */}
          <View style={styles.securityInfo}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#34C759" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 12,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
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
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: '#E8F4FD',
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  helpBannerContent: {
    marginLeft: 12,
    flex: 1,
  },
  helpBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  helpBannerText: {
    fontSize: 14,
    color: '#007AFF',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 16,
  },
  emptyStateContainer: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
  },
  createFirstTokenButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstTokenText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  tokenCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  tokenCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tokenTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 10,
  },
  tokenActions: {
    flexDirection: 'row',
    gap: 8,
  },
  tokenActionButton: {
    padding: 4,
  },
  tokenStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  tokenStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  tokenDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  tokenDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  tokenDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tokenDetailLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  tokenDetailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
  },
  expiredText: {
    color: '#FF3B30',
  },
  tokenValueContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  tokenValueLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  tokenValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#000',
    lineHeight: 16,
  },
  formSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeFormButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  inputDescription: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 18,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  createTokenButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  createTokenText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 24,
    padding: 16,
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3F2FD',
  },
  securityInfoContent: {
    marginLeft: 12,
  },
  securityInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  securityInfoText: {
    fontSize: 14,
    color: '#1976D2',
    lineHeight: 20,
  },
});

export default TemplateTokenManagerScreen; 