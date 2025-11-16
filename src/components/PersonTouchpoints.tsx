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
import Markdown from 'react-native-markdown-display';

interface PersonTouchpointsProps {
  touchpoints?: Touchpoint[];
  includedData?: any[];
}

export const PersonTouchpoints: React.FC<PersonTouchpointsProps> = ({ touchpoints, includedData = [] }) => {
  const [displayCount, setDisplayCount] = useState(5);

  // Helper function to get service data from included data
  const getServiceForTouchpoint = (touchpoint: Touchpoint) => {
    if (!touchpoint.relationships?.service?.data?.id) return null;
    
    const serviceId = touchpoint.relationships.service.data.id;
    const service = includedData.find(item => item.type === 'services' && item.id === serviceId);
    
    return service;
  };

  if (!touchpoints || touchpoints.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>No touchpoints recorded</Text>
      </View>
    );
  }

  const displayedTouchpoints = touchpoints.slice(0, displayCount);
  const hasMore = touchpoints.length > displayCount;

  const handleShowMore = () => {
    setDisplayCount(prevCount => prevCount + 20);
  };

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

  // Get icon based on service type
  const getIconForService = (service: any): string => {
    const serviceType = service?.attributes?.type;
    const serviceName = service?.attributes?.name;
    
    // Check type first
    if (serviceType) {
      switch (serviceType) {
        case 'learning-management-system':
          return 'school';
        case 'community-engagement':
          return 'people';
        case 'e-commerce':
          return 'cart';
        case 'email-marketing':
          return 'mail';
        case 'event-management':
          return 'calendar';
        case 'identity-management':
          return 'log-in';
        case 'other':
          return 'apps';
        default:
          // If type exists but doesn't match any known types, use generic icon
          return 'apps';
      }
    }
    
    // If no type, check if it's Wicket CRM
    if (serviceName && serviceName.toLowerCase().includes('wicket crm')) {
      return 'person';
    }
    
    // Default generic icon
    return 'apps';
  };

  const getColorForServiceType = (serviceType?: string, serviceName?: string) => {
    if (serviceType) {
      switch (serviceType) {
        case 'learning-management-system':
          return '#3F51B5'; // Indigo
        case 'community-engagement':
          return '#FF6B35'; // Orange
        case 'e-commerce':
          return '#4CAF50'; // Green
        case 'email-marketing':
          return '#FF9800'; // Amber
        case 'event-management':
          return '#F44336'; // Red
        case 'identity-management':
          return '#9C27B0'; // Purple
        case 'other':
          return theme.colors.primary;
        default:
          return theme.colors.primary;
      }
    }
    
    // Special case for Wicket CRM when no type
    if (serviceName && serviceName.toLowerCase().includes('wicket crm')) {
      return '#607D8B'; // Blue Grey
    }
    
    return theme.colors.primary;
  };

  return (
    <View style={styles.container}>
      {displayedTouchpoints.map((touchpoint) => {
        const service = getServiceForTouchpoint(touchpoint);
        const iconName = getIconForService(service);
        const color = getColorForServiceType(service?.attributes?.type, service?.attributes?.name);
        
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
              
              {service?.attributes?.name && (
                <Text style={styles.serviceText}>{service.attributes.name}</Text>
              )}
              
              {touchpoint.attributes.details && (
                <View style={styles.markdownContainer}>
                  <Markdown
                    style={markdownStyles}
                  >
                    {touchpoint.attributes.details.replace(/<br\s*\/?>/gi, '\n')}
                  </Markdown>
                </View>
              )}
            </View>
          </View>
        );
      })}

      {hasMore && (
        <TouchableOpacity 
          style={styles.toggleButton} 
          onPress={handleShowMore}
        >
          <Text style={styles.toggleButtonText}>
            Show {Math.min(20, touchpoints.length - displayCount)} more
          </Text>
          <Ionicons 
            name="chevron-down" 
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
    backgroundColor: theme.colors.white,
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
  serviceText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  markdownContainer: {
    marginTop: 2,
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

const markdownStyles = StyleSheet.create({
  body: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 0,
  },
  link: {
    color: theme.colors.primary,
  },
  strong: {
    fontWeight: '600',
  },
});