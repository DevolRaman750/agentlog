import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceTeam } from '../types/marketplace';

interface TeamResumeModalProps {
  visible: boolean;
  team: MarketplaceTeam | null;
  onClose: () => void;
  onHire?: () => void;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const TeamResumeModal: React.FC<TeamResumeModalProps> = ({
  visible,
  team,
  onClose,
  onHire,
}) => {
  if (!team) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#6B6B6B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Team Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Team Header */}
          <View style={styles.teamHeader}>
            <View style={[styles.teamAvatar, { backgroundColor: team.avatar.backgroundColor }]}>
              <Text style={[styles.teamAvatarText, { color: team.avatar.textColor }]}>
                {team.avatar.icon}
              </Text>
            </View>
            <View style={styles.teamInfo}>
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamCategory}>{team.category}</Text>
              <View style={styles.teamMetrics}>
                <View style={styles.metric}>
                  <Ionicons name="people" size={16} color="#007AFF" />
                  <Text style={styles.metricText}>{team.teamSize} Agents</Text>
                </View>
                <View style={styles.metric}>
                  <Ionicons name="card" size={16} color="#34C759" />
                  <Text style={styles.metricText}>{team.estimatedCost}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Team</Text>
            <Text style={styles.description}>{team.description}</Text>
          </View>

          {/* Team Members */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Members ({team.agents.length})</Text>
            {team.agents.map((agent, index) => (
              <View key={index} style={styles.agentCard}>
                <View style={styles.agentHeader}>
                  <View style={styles.agentInfo}>
                    <Text style={styles.agentName}>{agent.name}</Text>
                    <Text style={styles.agentRole}>{agent.role}</Text>
                  </View>
                  <View style={styles.agentConfig}>
                    <Text style={styles.configText}>
                      {agent.defaultConfig.maxTokensPerDay.toLocaleString()} tokens/day
                    </Text>
                    <Text style={styles.configText}>
                      {agent.defaultConfig.heartbeatMinutes}min intervals
                    </Text>
                  </View>
                </View>
                <Text style={styles.agentDescription}>{agent.description}</Text>
                <View style={styles.agentCapabilities}>
                  {agent.capabilities.slice(0, 3).map((capability, capIndex) => (
                    <View key={capIndex} style={styles.capabilityTag}>
                      <Text style={styles.capabilityTagText}>{capability}</Text>
                    </View>
                  ))}
                  {agent.capabilities.length > 3 && (
                    <Text style={styles.moreCapabilities}>
                      +{agent.capabilities.length - 3} more
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Capabilities Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Team Capabilities</Text>
            {team.capabilities.overview.map((capability, index) => (
              <View key={index} style={styles.capabilityItem}>
                <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                <Text style={styles.capabilityText}>{capability}</Text>
              </View>
            ))}
          </View>

          {/* Coverage Areas */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Coverage Areas</Text>
            <View style={styles.tagContainer}>
              {team.capabilities.coverage.map((area, index) => (
                <View key={index} style={styles.coverageTag}>
                  <Text style={styles.coverageTagText}>{area}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Integrations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Integrations</Text>
            <View style={styles.tagContainer}>
              {team.capabilities.integrations.map((integration, index) => (
                <View key={index} style={styles.integrationTag}>
                  <Text style={styles.integrationTagText}>{integration}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* API Requirements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Required API Keys</Text>
            {team.apiRequirements.displayNames.map((keyName, index) => (
              <View key={index} style={styles.apiKeyItem}>
                <Ionicons name="key" size={16} color="#FF9500" />
                <Text style={styles.apiKeyText}>{keyName}</Text>
              </View>
            ))}
          </View>

          {/* Highlights */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Highlights</Text>
            {team.highlights.map((highlight, index) => (
              <View key={index} style={styles.highlightItem}>
                <Ionicons name="star" size={16} color="#FF9500" />
                <Text style={styles.highlightText}>{highlight}</Text>
              </View>
            ))}
          </View>

          {/* Testimonial */}
          {team.testimonial && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Customer Testimonial</Text>
              <View style={styles.testimonialCard}>
                <Text style={styles.testimonialText}>"{team.testimonial.text}"</Text>
                <View style={styles.testimonialAuthor}>
                  <Text style={styles.authorName}>{team.testimonial.author}</Text>
                  <View style={styles.rating}>
                    {[...Array(team.testimonial.rating)].map((_, i) => (
                      <Ionicons key={i} name="star" size={14} color="#FF9500" />
                    ))}
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.hireButton} onPress={onHire}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.hireButtonText}>Deploy This Team</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  teamAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  teamAvatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  teamCategory: {
    fontSize: 16,
    color: '#6B6B6B',
    marginBottom: 12,
  },
  teamMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricText: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#6B6B6B',
    lineHeight: 24,
  },
  agentCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  agentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  agentRole: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  agentConfig: {
    alignItems: 'flex-end',
  },
  configText: {
    fontSize: 12,
    color: '#6B6B6B',
  },
  agentDescription: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 12,
  },
  agentCapabilities: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  capabilityTag: {
    backgroundColor: '#E3F2FD',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  capabilityTagText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  moreCapabilities: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    alignSelf: 'center',
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  capabilityText: {
    fontSize: 16,
    color: '#6B6B6B',
    marginLeft: 12,
    flex: 1,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  coverageTag: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coverageTagText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '500',
  },
  integrationTag: {
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  integrationTagText: {
    fontSize: 14,
    color: '#F57C00',
    fontWeight: '500',
  },
  apiKeyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  apiKeyText: {
    fontSize: 16,
    color: '#6B6B6B',
    marginLeft: 12,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  highlightText: {
    fontSize: 16,
    color: '#6B6B6B',
    marginLeft: 12,
    flex: 1,
  },
  testimonialCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  testimonialText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontStyle: 'italic',
    lineHeight: 24,
    marginBottom: 12,
  },
  testimonialAuthor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
  bottomPadding: {
    height: 100,
  },
  actionContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  hireButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  hireButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default TeamResumeModal;
