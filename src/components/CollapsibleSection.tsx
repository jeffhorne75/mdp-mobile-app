import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  isCollapsed?: boolean;
  onToggle?: () => void;
  noPadding?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  count = 0, 
  children, 
  defaultExpanded = false,
  isCollapsed,
  onToggle,
  noPadding = false 
}) => {
  const [localExpanded, setLocalExpanded] = useState(defaultExpanded);
  const expanded = isCollapsed !== undefined ? !isCollapsed : localExpanded;
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedRotation = useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: 'easeInOut', property: 'opacity' },
      update: { type: 'easeInOut' },
      delete: { type: 'easeInOut', property: 'opacity' }
    });
    
    if (onToggle) {
      onToggle();
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  useEffect(() => {
    Animated.timing(animatedRotation, {
      toValue: expanded ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  const rotateInterpolate = animatedRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  return (
    <View style={{ 
      marginHorizontal: 16, 
      marginVertical: 8,
      backgroundColor: colors.background.primary,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}>
      <TouchableOpacity
        onPress={toggleExpanded}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.background.secondary,
          borderTopLeftRadius: 12,
          borderTopRightRadius: 12,
          borderBottomLeftRadius: expanded ? 0 : 12,
          borderBottomRightRadius: expanded ? 0 : 12,
          borderWidth: 1,
          borderColor: colors.border.default,
        }}
      >
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Ionicons name="chevron-forward" size={20} color={colors.text.secondary} />
        </Animated.View>
        <Text style={{ 
          flex: 1, 
          marginLeft: 8,
          fontSize: 16,
          fontWeight: '500',
          color: colors.text.primary,
        }}>
          {title}
        </Text>
        {count > 0 && (
          <View style={{
            backgroundColor: colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 2,
            borderRadius: 12,
          }}>
            <Text style={{ 
              color: colors.background.primary,
              fontSize: 14,
              fontWeight: '600',
            }}>
              {count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
      
      {expanded && (
        <View style={{
          padding: noPadding ? 0 : 16,
          backgroundColor: colors.background.primary,
          borderBottomLeftRadius: 12,
          borderBottomRightRadius: 12,
        }}>
          {children}
        </View>
      )}
    </View>
  );
};