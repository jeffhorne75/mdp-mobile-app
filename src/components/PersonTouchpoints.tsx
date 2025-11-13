import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../theme';
import { Touchpoint } from '../types/api';
import { Ionicons } from '@expo/vector-icons';

interface PersonTouchpointsProps {
  touchpoints?: Touchpoint[];
  includedData?: any[];
}

export const PersonTouchpoints: React.FC<PersonTouchpointsProps> = ({ touchpoints, includedData = [] }) => {
  const [showAll, setShowAll] = useState(false);

  // Helper function to get service data from included data
  const getServiceForTouchpoint = (touchpoint: Touchpoint) => {
    if (!touchpoint.relationships?.service?.data?.id) return null;
    
    const serviceId = touchpoint.relationships.service.data.id;
    return includedData.find(item => item.type === 'services' && item.id === serviceId);
  };

  if (!touchpoints || touchpoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Touchpoints</Text>
        <Text style={styles.noDataText}>No touchpoints recorded</Text>
      </View>
    );
  }

  const displayedTouchpoints = showAll ? touchpoints.slice(0, 20) : touchpoints.slice(0, 5);

  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Service category mappings based on service name patterns
  const getServiceCategory = (serviceName?: string): string => {
    if (!serviceName) return 'Other';
    
    const name = serviceName.toLowerCase();
    
    if (name.includes('wicket') && name.includes('crm')) {
      return 'Wicket CRM';
    } else if (name.includes('wicket')) {
      return 'Identity Management';
    } else if (name.includes('mailchimp') || name.includes('constant contact') || name.includes('sendgrid')) {
      return 'Email Marketing';
    } else if (name.includes('eventbrite') || name.includes('cvent') || name.includes('event')) {
      return 'Event Management';
    } else if (name.includes('shopify') || name.includes('woocommerce') || name.includes('commerce') || name.includes('store')) {
      return 'E-Commerce';
    } else if (name.includes('litmos') || name.includes('moodle') || name.includes('learning') || name.includes('lms')) {
      return 'Learning Management System';
    } else if (name.includes('facebook') || name.includes('twitter') || name.includes('linkedin') || name.includes('community') || name.includes('forum')) {
      return 'Community Engagement';
    } else {
      return 'Other';
    }
  };

  const getIconForCategory = (category: string, action: string) => {
    switch (category) {
      case 'Community Engagement':
        return 'people';
      case 'E-Commerce':
        return 'storefront';
      case 'Email Marketing':
        return 'mail';
      case 'Event Management':
        return 'calendar';
      case 'Identity Management':
        return 'person-circle';
      case 'Learning Management System':
        return 'school';
      case 'Wicket CRM':
        // CRM activity icons based on action
        const actionLower = action.toLowerCase();
        if (actionLower.includes('call') || actionLower.includes('phone')) {
          return 'call';
        } else if (actionLower.includes('meeting') || actionLower.includes('appointment')) {
          return 'calendar';
        } else if (actionLower.includes('note') || actionLower.includes('comment')) {
          return 'document-text';
        } else if (actionLower.includes('task') || actionLower.includes('follow')) {
          return 'checkbox';
        } else if (actionLower.includes('email')) {
          return 'mail';
        } else {
          return 'business';
        }
      case 'Other':
      default:
        return 'ellipse';
    }
  };

  const getColorForCategory = (category: string) => {
    switch (category) {
      case 'Community Engagement':
        return '#FF6B35'; // Orange
      case 'E-Commerce':
        return '#4CAF50'; // Green
      case 'Email Marketing':
        return '#FF9800'; // Amber
      case 'Event Management':
        return '#F44336'; // Red
      case 'Identity Management':
        return '#9C27B0'; // Purple
      case 'Learning Management System':
        return '#3F51B5'; // Indigo
      case 'Wicket CRM':
        return '#607D8B'; // Blue Grey
      case 'Other':
      default:
        return theme.colors.primary;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Touchpoints</Text>
      
      {displayedTouchpoints.map((touchpoint) => {
        const service = getServiceForTouchpoint(touchpoint);
        const serviceName = service?.attributes?.name;
        const category = getServiceCategory(serviceName);
        const iconName = getIconForCategory(category, touchpoint.attributes.action);
        const color = getColorForCategory(category);
        
        return (
          <View key={touchpoint.id} style={styles.touchpointItem}>
            <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <Ionicons 
                name={iconName as any} 
                size={20} 
                color={color} 
              />
            </View>
            
            <View style={styles.touchpointContent}>
              <View style={styles.touchpointHeader}>
                <Text style={styles.actionText}>{touchpoint.attributes.action}</Text>
                <Text style={styles.dateText}>{formatDateTime(touchpoint.attributes.created_at)}</Text>
              </View>
              
              {touchpoint.attributes.details && (
                <Text style={styles.detailsText} numberOfLines={2}>{touchpoint.attributes.details}</Text>
              )}
            </View>
          </View>
        );
      })}

      {touchpoints.length > 5 && (
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={() => setShowAll(!showAll)}
        >
          <Text style={styles.toggleButtonText}>
            {showAll 
              ? `Show less` 
              : `Show ${Math.min(15, touchpoints.length - 5)} more`
            }
          </Text>
          <Ionicons 
            name={showAll ? 'chevron-up' : 'chevron-down'} 
            size={16} 
            color={theme.colors.primary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 16,
  },
  noDataText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
  },
  touchpointItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  touchpointContent: {
    flex: 1,
  },
  touchpointHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
  },
  toggleButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    marginRight: 4,
  },
});