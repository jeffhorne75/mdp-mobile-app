import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { EmailService } from '../services/emailService';
import { useSettings } from '../contexts/SettingsContext';
import { useNotification } from '../contexts/NotificationContext';

interface ContactItem {
  id: string;
  value: string;
  type?: string;
  primary?: boolean;
  label?: string; // For web addresses
}

interface ContactInformationProps {
  emails?: ContactItem[];
  phones?: ContactItem[];
  addresses?: ContactItem[];
  webAddresses?: ContactItem[];
}

export const ContactInformation: React.FC<ContactInformationProps> = ({
  emails = [],
  phones = [],
  addresses = [],
  webAddresses = [],
}) => {
  const { settings } = useSettings();
  const { showNotification } = useNotification();
  
  const hasContactInfo = emails.length > 0 || phones.length > 0 || addresses.length > 0 || webAddresses.length > 0;
  
  if (!hasContactInfo) {
    return null;
  }

  const sortByPrimary = (items: ContactItem[]) => {
    return [...items].sort((a, b) => {
      if (a.primary && !b.primary) return -1;
      if (!a.primary && b.primary) return 1;
      return 0;
    });
  };

  const handleEmailPress = async (email: string) => {
    if (settings.preferredEmailApp === 'copy') {
      showNotification({
        message: `Email address "${email}" has been copied to your clipboard.`,
        type: 'success',
      });
    }
    
    await EmailService.handleEmailPress(
      email, 
      settings.preferredEmailApp,
      (errorMessage) => {
        showNotification({
          message: errorMessage,
          type: 'info',
          duration: 4000,
        });
      }
    );
  };

  const handlePhonePress = async (phone: string) => {
    try {
      const phoneNumber = phone.replace(/[^0-9+]/g, '');
      await Linking.openURL(`tel:${phoneNumber}`);
    } catch (error) {
      Alert.alert('Error', 'Could not open phone dialer');
    }
  };

  const handleWebAddressPress = async (url: string) => {
    try {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      await Linking.openURL(formattedUrl);
    } catch (error) {
      Alert.alert('Error', 'Could not open web address');
    }
  };

  const handleAddressPress = async (address: string) => {
    try {
      const encodedAddress = encodeURIComponent(address);
      const mapUrl = Platform.select({
        ios: `maps:0,0?q=${encodedAddress}`,
        android: `geo:0,0?q=${encodedAddress}`,
        default: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
      });
      await Linking.openURL(mapUrl);
    } catch (error) {
      Alert.alert('Error', 'Could not open maps');
    }
  };

  const getIconForContactType = (label: string) => {
    switch (label.toLowerCase()) {
      case 'email':
        return 'email';
      case 'phone':
        return 'phone';
      case 'address':
        return 'location-on';
      case 'web address':
        return 'language';
      default:
        return 'info';
    }
  };

  const renderContactItems = (items: ContactItem[], label: string, onPress: (value: string) => void) => {
    if (items.length === 0) return null;

    const sortedItems = sortByPrimary(items);
    const iconName = getIconForContactType(label);
    
    return (
      <View style={styles.contactGroup}>
        <View style={styles.contactLabelContainer}>
          <MaterialIcons name={iconName} size={20} color={theme.colors.primary} />
          <Text style={styles.contactLabel}>{label}:</Text>
        </View>
        {sortedItems.map((item) => (
          <View key={item.id} style={styles.contactItemContainer}>
            <TouchableOpacity onPress={() => onPress(item.value)} style={styles.contactItem}>
              <Text style={styles.contactValue}>{item.label || item.value}</Text>
              <View style={styles.badgeContainer}>
                {item.type && <Text style={styles.typeBadge}>{item.type}</Text>}
                {item.primary && <Text style={styles.primaryBadge}>Primary</Text>}
              </View>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.section}>
      {renderContactItems(emails, 'Email', handleEmailPress)}
      {renderContactItems(phones, 'Phone', handlePhonePress)}
      {renderContactItems(addresses, 'Address', handleAddressPress)}
      {renderContactItems(webAddresses, 'Web Address', handleWebAddressPress)}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: theme.colors.white,
  },
  contactGroup: {
    marginBottom: theme.spacing.md,
  },
  contactLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  contactLabel: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.textSecondary,
  },
  contactItemContainer: {
    marginBottom: theme.spacing.xs,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  contactValue: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
    flex: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  typeBadge: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    textTransform: 'capitalize',
  },
  primaryBadge: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.white,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
});