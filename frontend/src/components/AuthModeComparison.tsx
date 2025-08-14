import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ComparisonFeature {
  feature: string;
  pat: {
    value: string;
    description: string;
    icon: 'checkmark-circle' | 'close-circle' | 'warning';
    color: string;
  };
  githubApp: {
    value: string;
    description: string;
    icon: 'checkmark-circle' | 'close-circle' | 'warning';
    color: string;
  };
}

interface AuthModeComparisonProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectMode: (mode: 'personal_access_token' | 'github_app') => void;
}

export const AuthModeComparison: React.FC<AuthModeComparisonProps> = ({
  isVisible,
  onClose,
  onSelectMode,
}) => {
  const comparisonFeatures: ComparisonFeature[] = [
    {
      feature: 'Setup Difficulty',
      pat: {
        value: 'Very Easy',
        description: '2-3 minutes, just generate a token',
        icon: 'checkmark-circle',
        color: '#34C759',
      },
      githubApp: {
        value: 'Moderate',
        description: '10-15 minutes, requires app creation',
        icon: 'warning',
        color: '#FF9500',
      },
    },
    {
      feature: 'Rate Limits',
      pat: {
        value: '5,000/hour',
        description: 'Shared with your personal usage',
        icon: 'warning',
        color: '#FF9500',
      },
      githubApp: {
        value: '5,000/hour per installation',
        description: 'Dedicated limits, better for teams',
        icon: 'checkmark-circle',
        color: '#34C759',
      },
    },
    {
      feature: 'Security & Permissions',
      pat: {
        value: 'User-level',
        description: 'Uses your personal permissions',
        icon: 'warning',
        color: '#FF9500',
      },
      githubApp: {
        value: 'Fine-grained',
        description: 'Specific repository permissions only',
        icon: 'checkmark-circle',
        color: '#34C759',
      },
    },
    {
      feature: 'Audit Logging',
      pat: {
        value: 'Basic',
        description: 'Shows as your personal activity',
        icon: 'close-circle',
        color: '#FF3B30',
      },
      githubApp: {
        value: 'Detailed',
        description: 'Clear app-specific audit trail',
        icon: 'checkmark-circle',
        color: '#34C759',
      },
    },
    {
      feature: 'Team Collaboration',
      pat: {
        value: 'Limited',
        description: 'Tied to your personal account',
        icon: 'close-circle',
        color: '#FF3B30',
      },
      githubApp: {
        value: 'Excellent',
        description: 'Independent of individual users',
        icon: 'checkmark-circle',
        color: '#34C759',
      },
    },
    {
      feature: 'Token Expiration',
      pat: {
        value: 'Manual renewal',
        description: 'You set expiration, manual renewal',
        icon: 'warning',
        color: '#FF9500',
      },
      githubApp: {
        value: 'Auto-refresh',
        description: 'Tokens refresh automatically',
        icon: 'checkmark-circle',
        color: '#34C759',
      },
    },
    {
      feature: 'Best For',
      pat: {
        value: 'Personal projects',
        description: 'Individual developers, quick setup',
        icon: 'checkmark-circle',
        color: '#34C759',
      },
      githubApp: {
        value: 'Teams & Production',
        description: 'Organizations, better security',
        icon: 'checkmark-circle',
        color: '#34C759',
      },
    },
  ];

  const useCases = {
    pat: [
      'You\'re an individual developer',
      'You want to get started quickly',
      'You\'re working on personal projects',
      'You don\'t need advanced audit logging',
      'You\'re comfortable managing token renewals',
    ],
    githubApp: [
      'You\'re working in a team environment',
      'You need detailed audit logs',
      'You want fine-grained permissions',
      'You\'re building production applications',
      'You want automatic token management',
      'You need higher rate limits',
    ],
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Authentication Method</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Quick Decision Guide */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤔 Not sure which to choose?</Text>
            
            <View style={styles.decisionCard}>
              <View style={styles.decisionOption}>
                <Text style={styles.decisionTitle}>Choose Personal Access Token if:</Text>
                {useCases.pat.map((useCase, index) => (
                  <View key={index} style={styles.useCaseItem}>
                    <Ionicons name="checkmark" size={16} color="#34C759" />
                    <Text style={styles.useCaseText}>{useCase}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.selectButton, styles.patButton]}
                  onPress={() => {
                    onSelectMode('personal_access_token');
                    onClose();
                  }}
                >
                  <Text style={styles.selectButtonText}>Choose Personal Access Token</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.decisionOption}>
                <Text style={styles.decisionTitle}>Choose GitHub App if:</Text>
                {useCases.githubApp.map((useCase, index) => (
                  <View key={index} style={styles.useCaseItem}>
                    <Ionicons name="checkmark" size={16} color="#007AFF" />
                    <Text style={styles.useCaseText}>{useCase}</Text>
                  </View>
                ))}
                <TouchableOpacity
                  style={[styles.selectButton, styles.appButton]}
                  onPress={() => {
                    onSelectMode('github_app');
                    onClose();
                  }}
                >
                  <Text style={styles.selectButtonText}>Choose GitHub App</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Detailed Comparison Table */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Detailed Comparison</Text>
            
            <View style={styles.comparisonTable}>
              <View style={styles.tableHeader}>
                <Text style={styles.featureHeader}>Feature</Text>
                <Text style={styles.methodHeader}>Personal Token</Text>
                <Text style={styles.methodHeader}>GitHub App</Text>
              </View>

              {comparisonFeatures.map((feature, index) => (
                <View key={index} style={styles.tableRow}>
                  <View style={styles.featureCell}>
                    <Text style={styles.featureName}>{feature.feature}</Text>
                  </View>
                  
                  <View style={styles.valueCell}>
                    <View style={styles.valueHeader}>
                      <Ionicons 
                        name={feature.pat.icon} 
                        size={16} 
                        color={feature.pat.color} 
                      />
                      <Text style={[styles.valueText, { color: feature.pat.color }]}>
                        {feature.pat.value}
                      </Text>
                    </View>
                    <Text style={styles.valueDescription}>{feature.pat.description}</Text>
                  </View>
                  
                  <View style={styles.valueCell}>
                    <View style={styles.valueHeader}>
                      <Ionicons 
                        name={feature.githubApp.icon} 
                        size={16} 
                        color={feature.githubApp.color} 
                      />
                      <Text style={[styles.valueText, { color: feature.githubApp.color }]}>
                        {feature.githubApp.value}
                      </Text>
                    </View>
                    <Text style={styles.valueDescription}>{feature.githubApp.description}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Security Considerations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Security Considerations</Text>
            
            <View style={styles.securityCard}>
              <View style={styles.securityItem}>
                <Ionicons name="shield-checkmark" size={20} color="#34C759" />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>Both methods are secure when used properly</Text>
                  <Text style={styles.securityDescription}>
                    GitHub uses industry-standard security practices for both authentication methods.
                  </Text>
                </View>
              </View>

              <View style={styles.securityItem}>
                <Ionicons name="key" size={20} color="#007AFF" />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>Personal tokens are simpler but broader</Text>
                  <Text style={styles.securityDescription}>
                    PATs inherit your personal permissions, which might be more than needed.
                  </Text>
                </View>
              </View>

              <View style={styles.securityItem}>
                <Ionicons name="lock-closed" size={20} color="#FF9500" />
                <View style={styles.securityContent}>
                  <Text style={styles.securityTitle}>GitHub Apps offer principle of least privilege</Text>
                  <Text style={styles.securityDescription}>
                    Apps only get the specific permissions you grant, nothing more.
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Migration Note */}
          <View style={styles.section}>
            <View style={styles.migrationCard}>
              <Ionicons name="information-circle" size={24} color="#007AFF" />
              <View style={styles.migrationContent}>
                <Text style={styles.migrationTitle}>You can always change later</Text>
                <Text style={styles.migrationDescription}>
                  Don't worry about making the "wrong" choice. You can switch between authentication 
                  methods anytime in your API key settings. Start with what feels comfortable and 
                  upgrade when you need more features.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 16,
  },
  decisionCard: {
    gap: 16,
  },
  decisionOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  decisionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  useCaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  useCaseText: {
    fontSize: 14,
    color: '#3A3A3C',
    marginLeft: 8,
    flex: 1,
  },
  selectButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  patButton: {
    backgroundColor: '#34C759',
  },
  appButton: {
    backgroundColor: '#007AFF',
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  comparisonTable: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E7',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  featureHeader: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
  },
  methodHeader: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#1D1D1F',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E7',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  featureCell: {
    flex: 1,
    justifyContent: 'center',
  },
  featureName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1D1D1F',
  },
  valueCell: {
    flex: 1,
    paddingHorizontal: 8,
  },
  valueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  valueDescription: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  securityCard: {
    gap: 16,
  },
  securityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityContent: {
    marginLeft: 12,
    flex: 1,
  },
  securityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  securityDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  migrationCard: {
    flexDirection: 'row',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  migrationContent: {
    marginLeft: 12,
    flex: 1,
  },
  migrationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 4,
  },
  migrationDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
});
