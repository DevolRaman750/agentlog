import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemedStyles } from '../theme';

interface ExecutionLoadingIndicatorProps {
  progress: number; // 0-100
  maxProgress: number;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

const ExecutionLoadingIndicator: React.FC<ExecutionLoadingIndicatorProps> = ({
  progress,
  maxProgress,
  message = 'Processing...',
  size = 'medium',
  color,
  onCancel,
  showCancel = true,
}) => {
  const { colors } = useTheme();
  const effectiveColor = color || colors.accent;

  const styles = useThemedStyles((colors) => ({
    container: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 20,
    },
    outerRing: {
      position: 'absolute' as const,
      borderRadius: 1000,
      borderWidth: 2,
    },
    progressContainer: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      position: 'relative' as const,
    },
    progressBackground: {
      position: 'absolute' as const,
      borderRadius: 1000,
      borderWidth: 3,
    },
    progressIndicator: {
      position: 'absolute' as const,
      borderRadius: 1000,
      borderWidth: 3,
      borderTopColor: 'transparent',
      borderRightColor: 'transparent',
      borderBottomColor: 'transparent',
    },
    centerContent: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      zIndex: 10,
    },
    progressText: {
      fontWeight: '700' as const,
      marginTop: 2,
    },
    messageContainer: {
      alignItems: 'center' as const,
      marginTop: 16,
    },
    message: {
      fontSize: 16,
      fontWeight: '600' as const,
      textAlign: 'center' as const,
    },
    subMessage: {
      fontSize: 14,
      fontWeight: '500' as const,
      marginTop: 4,
      textAlign: 'center' as const,
    },
    dotsContainer: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: 12,
      gap: 4,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    cancelButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginTop: 20,
      paddingVertical: 10,
      paddingHorizontal: 16,
      backgroundColor: `${colors.statusError}10`,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${colors.statusError}20`,
      gap: 8,
    },
    cancelButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.statusError,
    },
  }));

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const progressPercentage = Math.min((progress / maxProgress) * 100, 100);

  const sizeConfig = {
    small: { containerSize: 60, iconSize: 20, fontSize: 12 },
    medium: { containerSize: 80, iconSize: 24, fontSize: 14 },
    large: { containerSize: 100, iconSize: 28, fontSize: 16 },
  };

  const config = sizeConfig[size];

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Rotation animation
    const rotateAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    // Scale animation
    const scaleAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 1500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();
    rotateAnimation.start();
    scaleAnimation.start();

    return () => {
      pulseAnimation.stop();
      rotateAnimation.stop();
      scaleAnimation.stop();
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressArc = (progressPercentage / 100) * 360;

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim }
      ]}
    >
      {/* Outer pulsing ring */}
      <Animated.View
        style={[
          styles.outerRing,
          {
            width: config.containerSize + 20,
            height: config.containerSize + 20,
            borderColor: `${effectiveColor}20`,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Progress ring */}
      <View
        style={[
          styles.progressContainer,
          {
            width: config.containerSize,
            height: config.containerSize,
          },
        ]}
      >
        {/* Background circle */}
        <View
          style={[
            styles.progressBackground,
            {
              width: config.containerSize,
              height: config.containerSize,
              borderColor: `${effectiveColor}15`,
            },
          ]}
        />

        {/* Progress indicator */}
        <Animated.View
          style={[
            styles.progressIndicator,
            {
              width: config.containerSize,
              height: config.containerSize,
              borderColor: effectiveColor,
              transform: [
                { rotate: rotateInterpolate },
                { scale: scaleAnim },
              ],
            },
          ]}
        />

        {/* Center content */}
        <View style={styles.centerContent}>
          <Ionicons
            name="rocket"
            size={config.iconSize}
            color={effectiveColor}
          />
          <Text style={[styles.progressText, { fontSize: config.fontSize, color: effectiveColor }]}>
            {Math.round(progressPercentage)}%
          </Text>
        </View>
      </View>

      {/* Message */}
      <View style={styles.messageContainer}>
        <Text style={[styles.message, { color: effectiveColor }]}>{message}</Text>
        <Text style={[styles.subMessage, { color: `${effectiveColor}80` }]}>
          {progress}/{maxProgress}
        </Text>
      </View>

      {/* Floating dots animation */}
      <View style={styles.dotsContainer}>
        {[0, 1, 2].map((index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: effectiveColor,
                transform: [
                  {
                    translateY: pulseAnim.interpolate({
                      inputRange: [1, 1.2],
                      outputRange: [0, -4],
                    }),
                  },
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0.8, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                ],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.2],
                  outputRange: [0.5, 0.9],
                }),
              },
            ]}
          />
        ))}
      </View>

      {/* Cancel button */}
      {showCancel && onCancel && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={onCancel}
          activeOpacity={0.7}
        >
          <Ionicons name="stop-circle" size={20} color={colors.statusError} />
          <Text style={styles.cancelButtonText}>Cancel Execution</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

export default ExecutionLoadingIndicator;
