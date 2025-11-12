import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

interface ActiveMemberBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

export const ActiveMemberBadge: React.FC<ActiveMemberBadgeProps> = ({ 
  size = 'medium' 
}) => {
  const dimensions = {
    small: 20,
    medium: 24,
    large: 28,
  };
  
  const iconSizes = {
    small: 12,
    medium: 14,
    large: 16,
  };
  
  const badgeSize = dimensions[size];
  const iconSize = iconSizes[size];
  
  return (
    <View style={[
      styles.container,
      {
        width: badgeSize,
        height: badgeSize,
        borderRadius: badgeSize / 2,
      }
    ]}>
      <MaterialIcons 
        name="check" 
        size={iconSize} 
        color={theme.colors.white} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.success,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
});