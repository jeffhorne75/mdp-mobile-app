import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { theme } from '../theme';

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
  return (
    <View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  content: {},
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