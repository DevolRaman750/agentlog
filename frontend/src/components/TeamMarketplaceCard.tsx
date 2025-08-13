import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MarketplaceTeam } from '../types/marketplace';

interface TeamMarketplaceCardProps {
  team: MarketplaceTeam;
  onPress: () => void;
  style?: ViewStyle;
}

const TeamMarketplaceCard: React.FC<TeamMarketplaceCardProps> = ({
  team,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity style={[styles.card, style]} onPress={onPress}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: team.avatar.backgroundColor }]}>
          <Text style={[styles.avatarText, { color: team.avatar.textColor }]}>
            {team.avatar.icon}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {team.name}
          </Text>
          <Text style={styles.category} numberOfLines={1}>
            {team.category}
          </Text>
        </View>
        <View style={styles.teamSizeBadge}>
          <Text style={styles.teamSizeText}>{team.teamSize}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={3}>
        {team.description}
      </Text>

      {/* Team Members Preview */}
      <View style={styles.membersSection}>
        <Text style={styles.membersTitle}>Team Members:</Text>
        {team.agents.slice(0, 3).map((agent, index) => (
          <View key={index} style={styles.memberRow}>
            <Ionicons name="person" size={14} color="#6B6B6B" />
            <Text style={styles.memberText} numberOfLines={1}>
              {agent.role}
            </Text>
          </View>
        ))}
        {team.agents.length > 3 && (
          <Text style={styles.moreMembers}>
            +{team.agents.length - 3} more agents
          </Text>
        )}
      </View>

      {/* Capabilities */}
      <View style={styles.capabilitiesSection}>
        <Text style={styles.capabilitiesTitle}>Key Capabilities:</Text>
        <View style={styles.capabilitiesList}>
          {team.capabilities.overview.slice(0, 2).map((capability, index) => (
            <View key={index} style={styles.capabilityItem}>
              <Ionicons name="checkmark-circle" size={12} color="#34C759" />
              <Text style={styles.capabilityText} numberOfLines={1}>
                {capability}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.costContainer}>
          <Text style={styles.costLabel}>Estimated Cost</Text>
          <Text style={styles.costValue}>{team.estimatedCost}</Text>
        </View>
        <View style={styles.actionButton}>
          <Text style={styles.actionButtonText}>View Team</Text>
          <Ionicons name="arrow-forward" size={16} color="#007AFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  category: {
    fontSize: 14,
    color: '#6B6B6B',
    fontWeight: '500',
  },
  teamSizeBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  teamSizeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#6B6B6B',
    lineHeight: 20,
    marginBottom: 16,
  },
  membersSection: {
    marginBottom: 16,
  },
  membersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  memberText: {
    fontSize: 13,
    color: '#6B6B6B',
    marginLeft: 6,
    flex: 1,
  },
  moreMembers: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginTop: 4,
  },
  capabilitiesSection: {
    marginBottom: 16,
  },
  capabilitiesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  capabilitiesList: {
    gap: 4,
  },
  capabilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capabilityText: {
    fontSize: 13,
    color: '#6B6B6B',
    marginLeft: 6,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  costContainer: {
    flex: 1,
  },
  costLabel: {
    fontSize: 12,
    color: '#6B6B6B',
    marginBottom: 2,
  },
  costValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});

export default TeamMarketplaceCard;
