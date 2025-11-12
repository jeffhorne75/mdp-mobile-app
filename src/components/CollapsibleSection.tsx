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
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({ 
  title, 
  count = 0, 
  children, 
  defaultExpanded = false 
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedRotation = useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    LayoutAnimation.configureNext({
      duration: 300,
      create: { type: 'easeInOut', property: 'opacity' },
      update: { type: 'easeInOut' },
      delete: { type: 'easeInOut', property: 'opacity' }
    });
    setExpanded(!expanded);
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
    <View style={{ marginVertical: 8 }}>
      <TouchableOpacity
        onPress={toggleExpanded}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.background.secondary,
          borderRadius: 8,
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
          marginTop: 8,
          paddingHorizontal: 8,
        }}>
          {children}
        </View>
      )}
    </View>
  );
};