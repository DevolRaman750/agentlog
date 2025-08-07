import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceAgent } from '../types/marketplace';

interface AgentMarketplaceCardProps {
  agent: MarketplaceAgent;
  onPress: () => void;
  style?: ViewStyle;
}

const AgentMarketplaceCard: React.FC<AgentMarketplaceCardProps> = ({
  agent,
  onPress,
  style,
}) => {
  {/* Removed getAvailabilityColor function - no longer needed */}

  const getExperienceColor = (level: string) => {
    switch (level) {
      case 'Junior': return '#007AFF';
      case 'Mid-Level': return '#32D74B';
      case 'Senior': return '#FF9500';
      case 'Expert': return '#AF52DE';
      default: return '#007AFF';
    }
  };



  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header with Avatar and Basic Info */}
      <View style={styles.cardHeader}>
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
        
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.agentName} numberOfLines={1}>
              {agent.name}
            </Text>
          </View>
          <Text style={styles.agentRole} numberOfLines={1}>
            {agent.role}
          </Text>
          <View style={styles.experienceContainer}>
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
            <Text style={styles.modelText}>
              {agent.modelConfig.modelName.replace('-latest', '')}
            </Text>
          </View>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {agent.description}
      </Text>

      {/* Key Highlights */}
      <View style={styles.highlightsContainer}>
        {agent.highlights.slice(0, 2).map((highlight, index) => (
          <View key={index} style={styles.highlight}>
            <Ionicons name="checkmark-circle" size={16} color="#34C759" />
            <Text style={styles.highlightText} numberOfLines={1}>
              {highlight}
            </Text>
          </View>
        ))}
      </View>

      {/* API Requirements */}
      <View style={styles.skillsContainer}>
        <Text style={styles.skillsLabel}>Required API Keys:</Text>
        <View style={styles.skillsRow}>
          {agent.apiRequirements.displayNames.slice(0, 2).map((apiKey, index) => (
            <View key={index} style={styles.apiKeyTag}>
              <Text style={styles.apiKeyText}>{apiKey}</Text>
            </View>
          ))}
          {agent.apiRequirements.displayNames.length > 2 && (
            <View style={styles.moreSkillsTag}>
              <Text style={styles.moreSkillsText}>
                +{agent.apiRequirements.displayNames.length - 2} more
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Function Groups */}
      <View style={styles.skillsContainer}>
        <Text style={styles.skillsLabel}>Capabilities:</Text>
        <View style={styles.skillsRow}>
          {agent.capabilities.functionGroups.slice(0, 2).map((skill, index) => (
            <View key={index} style={styles.skillTag}>
              <Text style={styles.skillTagText}>{skill}</Text>
            </View>
          ))}
          {agent.capabilities.functionGroups.length > 2 && (
            <View style={styles.moreSkillsTag}>
              <Text style={styles.moreSkillsText}>
                +{agent.capabilities.functionGroups.length - 2} more
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Removed fake performance metrics */}

      {/* Call to Action */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity style={styles.viewDetailsButton} onPress={onPress}>
          <Text style={styles.viewDetailsText}>View Resume</Text>
          <Ionicons name="arrow-forward" size={16} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  availabilityDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  agentName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    flex: 1,
  },

  agentRole: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
    marginBottom: 8,
  },
  experienceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  experienceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  experienceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modelText: {
    fontSize: 12,
    color: '#AF52DE',
    fontWeight: '500',
  },
  apiKeyTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  apiKeyText: {
    fontSize: 11,
    color: '#1976D2',
    fontWeight: '500',
  },
  description: {
    fontSize: 15,
    color: '#6B6B6B',
    lineHeight: 22,
    marginBottom: 16,
  },
  highlightsContainer: {
    marginBottom: 16,
  },
  highlight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  highlightText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500',
    flex: 1,
  },
  skillsContainer: {
    marginBottom: 16,
  },
  skillsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  skillTag: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  skillTagText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  moreSkillsTag: {
    backgroundColor: '#E5E5EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  moreSkillsText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  ctaContainer: {
    alignItems: 'center',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  viewDetailsText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});

export default AgentMarketplaceCard;