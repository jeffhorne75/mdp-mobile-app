import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';

const EMAIL_APP_OPTIONS = [
  { value: 'default', label: 'System Default', description: 'Use default mail app' },
  { value: 'gmail', label: 'Gmail', description: 'Open Gmail app' },
  { value: 'outlook', label: 'Outlook', description: 'Open Outlook app' },
  { value: 'copy', label: 'Copy Email', description: 'Copy email to clipboard' },
];

export const SettingsScreen: React.FC = () => {
  const { settings, updateSettings } = useSettings();
  const { showNotification } = useNotification();

  const handleEmailAppChange = async (value: string) => {
    try {
      await updateSettings({ preferredEmailApp: value as any });
      showNotification({
        message: 'Email app preference has been saved.',
        type: 'success',
      });
    } catch (_error) {
      showNotification({
        message: 'Failed to update settings.',
        type: 'error',
      });
    }
  };

  const renderEmailAppOption = (option: typeof EMAIL_APP_OPTIONS[0]) => {
    const isSelected = settings.preferredEmailApp === option.value;
    
    return (
      <TouchableOpacity
        key={option.value}
        style={[styles.optionContainer, isSelected && styles.selectedOption]}
        onPress={() => handleEmailAppChange(option.value)}
      >
        <View style={styles.optionContent}>
          <Text style={[styles.optionLabel, isSelected && styles.selectedOptionText]}>
            {option.label}
          </Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
        {isSelected && (
          <MaterialIcons name="check" size={24} color={theme.colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email Preferences</Text>
        <Text style={styles.sectionDescription}>
          Choose how email links should be handled when you tap on email addresses.
        </Text>
        
        {EMAIL_APP_OPTIONS.map(renderEmailAppOption)}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
  },
  section: {
    backgroundColor: theme.colors.white,
    marginTop: theme.spacing.sm,
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  sectionDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedOption: {
    backgroundColor: theme.colors.primary + '10',
    borderColor: theme.colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  selectedOptionText: {
    color: theme.colors.primary,
  },
  optionDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
});