import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Agent, LifecycleStatus } from '../types';
import { useTheme, useThemedStyles } from '../theme';
import type { ThemeColors } from '../theme';

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
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

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
      case 'ACTIVE': return colors.statusSuccess;
      case 'STANDBY': return colors.accentSecondary;
      case 'PAUSED': return colors.statusPaused;
      case 'KILLED': return colors.statusError;
      default: return colors.statusPaused;
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

  const avatarColors = generateColors(agent.firstName, agent.lastName);
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
            backgroundColor: avatarColors.primary,
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
              backgroundColor: avatarColors.secondary,
            }
          ]}
        />

        {/* Avatar Content */}
        <View style={styles.avatarContent}>
          {size === 'small' ? (
            <Text style={[styles.initials, { fontSize: dimensions.fontSize, color: avatarColors.text }]}>
              {initials}
            </Text>
          ) : (
            <Ionicons
              name={avatarIcon as any}
              size={dimensions.fontSize}
              color={avatarColors.text}
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
              borderColor: avatarColors.primary,
            }
          ]}
        />
      )}
    </View>
  );
};

const createStyles = (colors: ThemeColors) => ({
  container: {
    position: 'relative' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  avatar: {
    position: 'relative' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    elevation: 3,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  gradientOverlay: {
    position: 'absolute' as const,
    opacity: 0.3,
  },
  avatarContent: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    zIndex: 1,
  },
  initials: {
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
  },
  statusIndicator: {
    position: 'absolute' as const,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderColor: colors.bgCard,
    elevation: 4,
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  statusInner: {
    width: '50%' as const,
    height: '50%' as const,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 10,
  },
  animated: {
    // Animation will be handled by Animated API in usage
  },
  pulseRing: {
    position: 'absolute' as const,
    borderWidth: 2,
    opacity: 0.6,
    // Pulse animation would be added via Animated API
  },
});

export default AgentAvatar;
