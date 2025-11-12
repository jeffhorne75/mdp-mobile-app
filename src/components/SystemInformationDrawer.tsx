import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SystemInformationDrawerProps {
  uuid?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const SystemInformationDrawer: React.FC<SystemInformationDrawerProps> = ({
  uuid,
  createdAt,
  updatedAt,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View>
      <TouchableOpacity onPress={toggleExpanded} style={styles.drawerHeader}>
        <Text style={styles.drawerTitle}>System Information</Text>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'chevron-down'} 
          size={20} 
          color={theme.colors.textLight} 
        />
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {uuid && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>UUID</Text>
              <Text style={styles.fieldValue}>{uuid}</Text>
            </View>
          )}
          
          {createdAt && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Created</Text>
              <Text style={styles.fieldValue}>
                {new Date(createdAt).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {updatedAt && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Updated</Text>
              <Text style={styles.fieldValue}>
                {new Date(updatedAt).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  drawerTitle: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
  },
  content: {
    paddingTop: theme.spacing.md,
  },
  field: {
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  fieldValue: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
});