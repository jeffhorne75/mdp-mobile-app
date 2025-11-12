import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { theme } from '../theme';

interface AuthScreenProps {
  onAuthenticate: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticate }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Wicket Mobile</Text>
        <Text style={styles.subtitle}>Access your CRM on the go</Text>
        
        <View style={styles.placeholderContainer}>
          <Text style={styles.placeholderText}>
            Phase 2: OAuth authentication will be implemented here
          </Text>
        </View>
        
        <TouchableOpacity style={styles.continueButton} onPress={onAuthenticate}>
          <Text style={styles.continueButtonText}>Continue to App</Text>
        </TouchableOpacity>
        
        <Text style={styles.devNote}>Development Mode - Using JWT Token</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSizes['4xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.typography.fontSizes.lg,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing['2xl'],
  },
  placeholderContainer: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.xl,
    width: '100%',
  },
  placeholderText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.borderRadius.full,
    ...theme.shadows.md,
  },
  continueButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
  },
  devNote: {
    position: 'absolute',
    bottom: theme.spacing.xl,
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textLight,
  },
});