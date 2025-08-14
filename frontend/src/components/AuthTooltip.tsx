import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Linking, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AuthTooltipProps {
  title: string;
  description: string;
  steps?: string[];
  links?: Array<{
    text: string;
    url: string;
    description?: string;
  }>;
  warnings?: string[];
  benefits?: string[];
  children: React.ReactNode;
}

export const AuthTooltip: React.FC<AuthTooltipProps> = ({
  title,
  description,
  steps,
  links,
  warnings,
  benefits,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const openLink = async (url: string) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.fieldContainer}>
        {children}
        <TouchableOpacity
          style={styles.helpButton}
          onPress={() => setIsVisible(true)}
          accessibilityLabel={`Help for ${title}`}
        >
          <Ionicons name="help-circle" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📖 What is this?</Text>
              <Text style={styles.description}>{description}</Text>
            </View>

            {/* Benefits */}
            {benefits && benefits.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>✨ Benefits</Text>
                {benefits.map((benefit, index) => (
                  <View key={index} style={styles.listItem}>
                    <Text style={styles.bulletPoint}>•</Text>
                    <Text style={styles.listText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Step-by-step guide */}
            {steps && steps.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>🔧 How to set this up</Text>
                {steps.map((step, index) => (
                  <View key={index} style={styles.stepItem}>
                    <View style={styles.stepNumber}>
                      <Text style={styles.stepNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Warnings */}
            {warnings && warnings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ Important Notes</Text>
                {warnings.map((warning, index) => (
                  <View key={index} style={styles.warningItem}>
                    <Ionicons name="warning" size={16} color="#FF9500" />
                    <Text style={styles.warningText}>{warning}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Documentation links */}
            {links && links.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>📚 Official Documentation</Text>
                {links.map((link, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.linkItem}
                    onPress={() => openLink(link.url)}
                  >
                    <View style={styles.linkContent}>
                      <Ionicons name="open-outline" size={16} color="#007AFF" />
                      <View style={styles.linkTextContainer}>
                        <Text style={styles.linkText}>{link.text}</Text>
                        {link.description && (
                          <Text style={styles.linkDescription}>{link.description}</Text>
                        )}
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  helpButton: {
    marginLeft: 8,
    padding: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E7',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1D1D1F',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1D1D1F',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3A3A3C',
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  bulletPoint: {
    fontSize: 15,
    color: '#007AFF',
    marginRight: 8,
    marginTop: 1,
  },
  listText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3A3A3C',
    flex: 1,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  stepText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3A3A3C',
    flex: 1,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
    backgroundColor: '#FFF9E6',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF9500',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#8B4513',
    marginLeft: 8,
    flex: 1,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  linkContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  linkTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#007AFF',
  },
  linkDescription: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
});
