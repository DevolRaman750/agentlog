import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Agent, LifecycleStatus } from '../types';

interface AgentAvatarProps {
  agent: {
    firstName: string;
    lastName: string;
    lifecycleStatus: LifecycleStatus;
    templateName?: string;
  };
  size?: 'small' | 'medium' | 'large' | 'xl';
  showStatus?: boolean;
  animated?: boolean;
}

const AgentAvatar: React.FC<AgentAvatarProps> = ({ 
  agent, 
  size = 'medium', 
  showStatus = true,
  animated = false 
}) => {
  // Generate consistent colors based on name
  const generateColors = (firstName: string, lastName: string) => {
    const name = `${firstName}${lastName}`.toLowerCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Generate beautiful gradient colors
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 60) % 360; // Complementary color
    
    return {
      primary: `hsl(${hue1}, 70%, 60%)`,
      secondary: `hsl(${hue2}, 70%, 70%)`,
      text: '#fff'
    };
  };

  // Get avatar size dimensions
  const getSizeDimensions = () => {
    switch (size) {
      case 'small': return { width: 32, height: 32, fontSize: 12 };
      case 'medium': return { width: 48, height: 48, fontSize: 16 };
      case 'large': return { width: 64, height: 64, fontSize: 20 };
      case 'xl': return { width: 80, height: 80, fontSize: 24 };
      default: return { width: 48, height: 48, fontSize: 16 };
    }
  };

  // Get status color
  const getStatusColor = (status: LifecycleStatus): string => {
    switch (status) {
      case 'ACTIVE': return '#28a745';
      case 'STANDBY': return '#ffc107';
      case 'PAUSED': return '#6c757d';
      case 'KILLED': return '#dc3545';
      default: return '#6c757d';
    }
  };

  // Get avatar icon based on template or status
  const getAvatarIcon = (): string => {
    if (agent.templateName?.toLowerCase().includes('engineer')) return 'code';
    if (agent.templateName?.toLowerCase().includes('analyst')) return 'analytics';
    if (agent.templateName?.toLowerCase().includes('writer')) return 'document-text';
    if (agent.templateName?.toLowerCase().includes('assistant')) return 'chatbubble';
    if (agent.templateName?.toLowerCase().includes('researcher')) return 'search';
    if (agent.templateName?.toLowerCase().includes('manager')) return 'people';
    return 'construct'; // Default robot/agent icon
  };

  const colors = generateColors(agent.firstName, agent.lastName);
  const dimensions = getSizeDimensions();
  const initials = `${agent.firstName.charAt(0)}${agent.lastName.charAt(0)}`.toUpperCase();
  const statusColor = getStatusColor(agent.lifecycleStatus);
  const avatarIcon = getAvatarIcon();

  return (
    <View style={[styles.container, { width: dimensions.width, height: dimensions.height }]}>
      {/* Main Avatar */}
      <View 
        style={[
          styles.avatar,
          {
            width: dimensions.width,
            height: dimensions.height,
            backgroundColor: colors.primary,
            borderRadius: dimensions.width / 2,
          },
          animated && styles.animated
        ]}
      >
        {/* Gradient Background Effect */}
        <View 
          style={[
            styles.gradientOverlay,
            {
              width: dimensions.width,
              height: dimensions.height,
              borderRadius: dimensions.width / 2,
              backgroundColor: colors.secondary,
            }
          ]}
        />
        
        {/* Avatar Content */}
        <View style={styles.avatarContent}>
          {size === 'small' ? (
            <Text style={[styles.initials, { fontSize: dimensions.fontSize, color: colors.text }]}>
              {initials}
            </Text>
          ) : (
            <Ionicons 
              name={avatarIcon as any} 
              size={dimensions.fontSize} 
              color={colors.text} 
            />
          )}
        </View>
      </View>

      {/* Status Indicator */}
      {showStatus && (
        <View 
          style={[
            styles.statusIndicator,
            {
              backgroundColor: statusColor,
              width: dimensions.width * 0.3,
              height: dimensions.width * 0.3,
              borderRadius: dimensions.width * 0.15,
              bottom: -2,
              right: -2,
            }
          ]}
        >
          <View style={styles.statusInner} />
        </View>
      )}

      {/* Pulse Animation for Active Status */}
      {animated && agent.lifecycleStatus === 'ACTIVE' && (
        <View 
          style={[
            styles.pulseRing,
            {
              width: dimensions.width + 8,
              height: dimensions.height + 8,
              borderRadius: (dimensions.width + 8) / 2,
              borderColor: colors.primary,
            }
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  gradientOverlay: {
    position: 'absolute',
    opacity: 0.3,
  },
  avatarContent: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  initials: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  statusInner: {
    width: '50%',
    height: '50%',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
  },
  animated: {
    // Animation will be handled by Animated API in usage
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
    opacity: 0.6,
    // Pulse animation would be added via Animated API
  },
});

export default AgentAvatar; 