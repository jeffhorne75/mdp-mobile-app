import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme';

export interface TopNotificationProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

export const TopNotification: React.FC<TopNotificationProps> = ({
  message,
  type = 'success',
  duration = 3000,
  onHide,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Show animation
    translateY.value = withTiming(0, { duration: 300 });
    opacity.value = withTiming(1, { duration: 300 });

    // Auto hide
    const timer = setTimeout(() => {
      hideNotification();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideNotification = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished && onHide) {
        runOnJS(onHide)();
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getTypeConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#4CAF50',
          icon: 'check-circle' as const,
        };
      case 'error':
        return {
          backgroundColor: '#F44336',
          icon: 'error' as const,
        };
      case 'info':
      default:
        return {
          backgroundColor: theme.colors.primary,
          icon: 'info' as const,
        };
    }
  };

  const typeConfig = getTypeConfig();

  return (
    <Animated.View
      style={[
        styles.container,
        { 
          top: insets.top,
          backgroundColor: typeConfig.backgroundColor,
        },
        animatedStyle,
      ]}
    >
      <MaterialIcons
        name={typeConfig.icon}
        size={20}
        color="#FFFFFF"
        style={styles.icon}
      />
      <Text style={styles.message}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  icon: {
    marginRight: theme.spacing.sm,
  },
  message: {
    flex: 1,
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: '#FFFFFF',
  },
});