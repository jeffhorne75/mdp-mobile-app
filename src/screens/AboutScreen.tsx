import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

export const AboutScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About</Text>
      <Text style={styles.content}>
        This is the Beta version of Wicket's Member Data Platform mobile app for iOS and Android. This app is intended for testing only, and should not be used in a production context. The app will be planned for full production deployment in the future, at which time you'll be notified by Wicket. In the meantime, browse and explore using the app, and provide us feedback if you come across any issues or have ideas for improvement.
      </Text>
      <Text style={styles.version}>Version: 0.1</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: 30,
    textAlign: 'center',
  },
  content: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
    lineHeight: 24,
    textAlign: 'left',
    marginBottom: 40,
  },
  version: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
});