import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';

interface ActiveMemberBadgeProps {
  size?: 'small' | 'medium' | 'large';
}

export const ActiveMemberBadge: React.FC<ActiveMemberBadgeProps> = ({ 
  size: _size = 'medium' 
}) => {
  return (
    <View style={styles.container}>
      <MaterialIcons 
        name="check" 
        size={12} 
        color={theme.colors.white} 
      />
      <Text style={styles.text}>Member</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ACDBC5', // Brand green color
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    gap: 2,
  },
  text: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.white,
    fontWeight: theme.typography.fontWeights.medium,
  },
});