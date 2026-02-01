import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';

interface SuccessTooltipProps {
  visible: boolean;
  message: string;
  onHide?: () => void;
  duration?: number;
}

const { width: screenWidth } = Dimensions.get('window');

const SuccessTooltip: React.FC<SuccessTooltipProps> = ({
  visible,
  message,
  onHide,
  duration = 3000,
}) => {
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  const styles = useThemedStyles((colors) => ({
    container: {
      position: 'absolute' as const,
      top: Platform.OS === 'ios' ? 60 : 40,
      left: 0,
      right: 0,
      zIndex: 9999,
      alignItems: 'center' as const,
      paddingHorizontal: 20,
    },
    tooltip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.statusSuccess,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxWidth: screenWidth - 40,
      minWidth: 200,
      shadowColor: colors.shadowColor,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
    iconContainer: {
      marginRight: 12,
    },
    message: {
      color: colors.textInverse,
      fontSize: 16,
      fontWeight: '600' as const,
      flex: 1,
      textAlign: 'left' as const,
    },
  }));

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideTooltip();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideTooltip();
    }
  }, [visible, duration]);

  const hideTooltip = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Animated.View
        style={[
          styles.tooltip,
          {
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={24} color={colors.textInverse} />
        </View>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
};

export default SuccessTooltip;
