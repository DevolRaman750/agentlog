import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceAgent } from '../types/marketplace';
import ScreenContainer from './ScreenContainer';
import { FunctionDefinition } from '../types/index';
import { goGentAPI } from '../api/client';

interface AgentResumeModalProps {
  visible: boolean;
  agent: MarketplaceAgent | null;
  onClose: () => void;
  onHire?: () => void;
}

const { width } = Dimensions.get('window');

const AgentResumeModal: React.FC<AgentResumeModalProps> = ({
  visible,
  agent,
  onClose,
  onHire,
}) => {
  const [availableFunctions, setAvailableFunctions] = useState<FunctionDefinition[]>([]);
  const [isLoadingFunctions, setIsLoadingFunctions] = useState(false);

  // Fetch available functions when modal opens
  useEffect(() => {
    if (visible && agent) {
      loadAvailableFunctions();
    }
  }, [visible, agent]);

  const loadAvailableFunctions = async () => {
    setIsLoadingFunctions(true);
    try {
      const response = await goGentAPI.getFunctions();
      
      if (response.success && response.data) {
        const functions = response.data;
        // Filter to only active functions
        const activeFunctions = functions.filter(f => f.isActive);
        setAvailableFunctions(activeFunctions);
      } else {
        setAvailableFunctions([]);
      }
    } catch (error) {
      console.error('Error loading functions:', error);
      setAvailableFunctions([]);
    } finally {
      setIsLoadingFunctions(false);
    }
  };

  if (!agent) return null;

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'Expert': return '#FF3B30';
      case 'Senior': return '#FF9500';
      case 'Mid-Level': return '#007AFF';
      case 'Junior': return '#34C759';
      default: return '#8E8E93';
    }
  };

  const getFunctionGroupIcon = (group: string) => {
    switch (group.toLowerCase()) {
      case 'github (read-only)':
      case 'github (full access)':
        return 'logo-github';
      case 'slack communication':
        return 'chatbubbles';
      case 'weather api':
        return 'partly-sunny';
      default:
        return 'extension-puzzle';
    }
  };

  // Map marketplace agent function groups to actual database function groups
  const groupMapping: { [key: string]: string } = {
    'github (read-only)': 'github',
    'github (full access)': 'github', 
    'slack communication': 'communication',
    'weather api': 'weather'
  };

  // Function to get the count of functions for a specific group based on actual function data
  const getFunctionCountForGroup = (group: string) => {
    if (isLoadingFunctions || availableFunctions.length === 0) {
      // Fallback to the specificFunctions array if we don't have real function data
      return agent.capabilities.specificFunctions.filter(func => 
        func.toLowerCase().includes(group.toLowerCase().replace(' ', ''))
      ).length;
    }

    const actualGroup = groupMapping[group.toLowerCase()] || group.toLowerCase();
    
    // Use real function data to count functions in this group
    const functionsInGroup = availableFunctions.filter(func => 
      func.functionGroup.toLowerCase() === actualGroup
    );
    
    return functionsInGroup.length;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScreenContainer enableScrolling={true}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Agent Resume</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Agent Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={[
                styles.avatar,
                { backgroundColor: agent.avatar.backgroundColor }
              ]}>
                <Text style={[
                  styles.avatarText,
                  { color: agent.avatar.textColor }
                ]}>
                  {agent.avatar.initials}
                </Text>
              </View>
              {/* Removed availability dot - no fake metrics */}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.agentName}>{agent.name}</Text>
              <Text style={styles.agentRole}>{agent.role}</Text>
                          <View style={styles.profileMeta}>
              <View style={[
                styles.experienceBadge,
                { backgroundColor: `${getExperienceColor(agent.experienceLevel)}15` }
              ]}>
                <Text style={[
                  styles.experienceText,
                  { color: getExperienceColor(agent.experienceLevel) }
                ]}>
                  {agent.experienceLevel}
                </Text>
              </View>
              {/* Removed availability status - no fake metrics */}
            </View>
            </View>
          </View>

          {/* API Requirements */}
          <View style={styles.apiRequirementsSection}>
            <Text style={styles.apiRequirementsTitle}>Required API Keys</Text>
            <View style={styles.apiRequirementsContainer}>
              {agent.apiRequirements.displayNames.map((displayName, index) => (
                <View key={index} style={styles.apiRequirementTag}>
                  <Ionicons name="key" size={16} color="#007AFF" />
                  <Text style={styles.apiRequirementText}>{displayName}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Model Configuration */}
          <View style={styles.modelConfigSection}>
            <Text style={styles.modelConfigTitle}>AI Model Configuration</Text>
            <View style={styles.modelConfigContainer}>
              <View style={styles.modelConfigRow}>
                <Text style={styles.modelConfigLabel}>Model:</Text>
                <Text style={styles.modelConfigValue}>{agent.modelConfig.modelName}</Text>
              </View>
              <View style={styles.modelConfigRow}>
                <Text style={styles.modelConfigLabel}>Configuration:</Text>
                <Text style={styles.modelConfigValue}>{agent.modelConfig.configName}</Text>
              </View>
              <View style={styles.modelConfigRow}>
                <Text style={styles.modelConfigLabel}>Temperature:</Text>
                <Text style={styles.modelConfigValue}>{agent.modelConfig.temperature}</Text>
              </View>
              <View style={styles.modelConfigRow}>
                <Text style={styles.modelConfigLabel}>Max Tokens:</Text>
                <Text style={styles.modelConfigValue}>{agent.modelConfig.maxTokens}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.description}>{agent.description}</Text>
        </View>

        {/* Key Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Key Strengths</Text>
          {agent.highlights.map((highlight, index) => (
            <View key={index} style={styles.highlight}>
              <Ionicons name="checkmark-circle" size={20} color="#34C759" />
              <Text style={styles.highlightText}>{highlight}</Text>
            </View>
          ))}
        </View>

        {/* Technical Capabilities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Technical Capabilities</Text>
          
          {/* Integration Groups */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Available Integrations</Text>
            <View style={styles.capabilitiesGrid}>
              {agent.capabilities.functionGroups.map((group, index) => (
                <View key={index} style={styles.capabilityCard}>
                  <Ionicons 
                    name={getFunctionGroupIcon(group)} 
                    size={24} 
                    color="#007AFF" 
                  />
                  <Text style={styles.capabilityTitle}>{group}</Text>
                  <Text style={styles.capabilityCount}>
                    {getFunctionCountForGroup(group)} functions
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Specialties */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Specialties</Text>
            <View style={styles.specialtiesContainer}>
              {agent.capabilities.specialties.map((specialty, index) => (
                <View key={index} style={styles.specialtyTag}>
                  <Text style={styles.specialtyText}>{specialty}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tools & Technologies */}
          <View style={styles.subsection}>
            <Text style={styles.subsectionTitle}>Tools & Technologies</Text>
            <View style={styles.toolsContainer}>
              {agent.capabilities.tools.map((tool, index) => (
                <View key={index} style={styles.toolTag}>
                  <Text style={styles.toolText}>{tool}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>



        {/* Template Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Execution Template</Text>
          <View style={styles.templateCard}>
            <View style={styles.templateHeader}>
              <Ionicons name="document-text" size={24} color="#AF52DE" />
              <View style={styles.templateInfo}>
                <Text style={styles.templateName}>{agent.templateName}</Text>
                <Text style={styles.templateCategory}>{agent.category}</Text>
              </View>
            </View>
            <Text style={styles.templateDescription}>
              This agent is powered by a specialized execution template designed for {agent.category.toLowerCase()} tasks.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <Text style={styles.secondaryButtonText}>View More Agents</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.primaryButton} onPress={onHire}>
            <Ionicons name="person-add" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Hire This Agent</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerSpacer: {
    width: 32,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  availabilityDot: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  agentRole: {
    fontSize: 18,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 12,
  },
  profileMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  experienceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  experienceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  availability: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },

  apiRequirementsSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  apiRequirementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  apiRequirementsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  apiRequirementTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  apiRequirementText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  modelConfigSection: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  modelConfigTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  modelConfigContainer: {
    gap: 8,
  },
  modelConfigRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modelConfigLabel: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  modelConfigValue: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B6B6B',
    lineHeight: 24,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  highlightText: {
    fontSize: 16,
    color: '#1A1A1A',
    flex: 1,
    lineHeight: 22,
  },
  subsection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  capabilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  capabilityCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 120,
    flex: 1,
  },
  capabilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  capabilityCount: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  specialtyTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  specialtyText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  toolsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toolTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  toolText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'center',
  },
  templateCard: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  templateCategory: {
    fontSize: 14,
    color: '#6B6B6B',
  },
  templateDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AgentResumeModal;