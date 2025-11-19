import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { theme } from '../theme';
import { useResourceTypes } from '../contexts/ResourceTypesContext';
import { organizationsApi, connectionsApi, peopleApi } from '../api';
import { Ionicons } from '@expo/vector-icons';
import Markdown from 'react-native-markdown-display';

const formatDate = (dateString?: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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

interface OrganizationTouchpointsProps {
  organizationId: string;
}

interface TouchpointWithPerson {
  touchpoint: any;
  person: any;
  service?: any;
}

export const OrganizationTouchpoints: React.FC<OrganizationTouchpointsProps> = ({
  organizationId,
}) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const resourceTypes = useResourceTypes();
  const [touchpoints, setTouchpoints] = useState<TouchpointWithPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [displayCount, setDisplayCount] = useState(5);

  useEffect(() => {
    fetchOrganizationTouchpoints();
  }, [organizationId]);

  const fetchOrganizationTouchpoints = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Get all people related to the organization
      const relatedPeople = new Map<string, any>(); // Use Map to avoid duplicates

      // Fetch people from membership entries
      try {
        const membershipsResponse = await organizationsApi.getMemberships(organizationId, {
          page_size: 100, // Get more memberships at once
          active_at: new Date().toISOString(), // Include both active and inactive
        });

        if (membershipsResponse.data) {
          // Extract unique people from memberships
          membershipsResponse.data.forEach((membership: any) => {
            const personId = membership.relationships?.person?.data?.id;
            if (personId && !relatedPeople.has(personId)) {
              // Find the person in included data
              const person = membershipsResponse.included?.find(
                (item: any) => item.type === 'people' && item.id === personId
              );
              if (person) {
                relatedPeople.set(personId, person);
              }
            }
            
            // Also check owner relationship
            const ownerId = membership.relationships?.owner?.data?.id;
            if (ownerId && !relatedPeople.has(ownerId)) {
              const owner = membershipsResponse.included?.find(
                (item: any) => item.type === 'people' && item.id === ownerId
              );
              if (owner) {
                relatedPeople.set(ownerId, owner);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error fetching memberships:', error);
      }

      // Fetch people from connections (relationships)
      try {
        const connectionsResponse = await connectionsApi.getOrganizationConnections(
          organizationId,
          {
            page_size: 100,
            connection_type_eq: 'person_to_organization',
          }
        );

        if (connectionsResponse.data) {
          connectionsResponse.data.forEach((connection: any) => {
            const personId = connection.relationships?.person?.data?.id ||
                           connection.relationships?.from?.data?.id;
            if (personId && !relatedPeople.has(personId)) {
              const person = connectionsResponse.included?.find(
                (item: any) => item.type === 'people' && item.id === personId
              );
              if (person) {
                relatedPeople.set(personId, person);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error fetching connections:', error);
      }

      // Step 2: Fetch touchpoints for all related people (batch efficiently)
      const allTouchpoints: TouchpointWithPerson[] = [];
      const peopleArray = Array.from(relatedPeople.entries());
      

      // Process in batches of 5 to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < peopleArray.length; i += batchSize) {
        const batch = peopleArray.slice(i, i + batchSize);
        
        const touchpointPromises = batch.map(async ([personId, person]) => {
          try {
            const touchpointsResponse = await peopleApi.getTouchpoints(personId, {
              page_size: 50, // Get recent touchpoints
            });
            
            if (touchpointsResponse.data) {
              return touchpointsResponse.data.map((touchpoint: any) => ({
                touchpoint,
                person,
                service: touchpointsResponse.included?.find(
                  (item: any) => 
                    item.type === 'services' && 
                    item.id === touchpoint.relationships?.service?.data?.id
                ),
              }));
            }
            return [];
          } catch (error) {
            console.error(`Error fetching touchpoints for person ${personId}:`, error);
            return [];
          }
        });

        const batchResults = await Promise.all(touchpointPromises);
        batchResults.forEach(personTouchpoints => {
          allTouchpoints.push(...personTouchpoints);
        });
      }

      // Sort touchpoints by date (most recent first)
      allTouchpoints.sort((a, b) => {
        const dateA = new Date(a.touchpoint.attributes?.occurred_at || 0);
        const dateB = new Date(b.touchpoint.attributes?.occurred_at || 0);
        return dateB.getTime() - dateA.getTime();
      });

      setTouchpoints(allTouchpoints);
    } catch (error: any) {
      console.error('Error fetching organization touchpoints:', error);
      setError(error.message || 'Failed to load touchpoints');
    } finally {
      setLoading(false);
    }
  };

  const renderTouchpoint = ({ item }: { item: TouchpointWithPerson }) => {
    const { touchpoint, person, service } = item;
    const attributes = touchpoint.attributes || {};
    
    // Handle different person object structures
    let personName = 'Unknown';
    if (person) {
      if (person.attributes) {
        // Person has standard JSON:API structure
        // Use full_name if available, otherwise combine given_name and family_name
        personName = person.attributes.full_name || 
                    `${person.attributes.given_name || ''} ${person.attributes.family_name || ''}`.trim() || 
                    'Unknown';
      } else if (person.full_name || person.given_name || person.family_name) {
        // Person attributes are at top level
        personName = person.full_name || 
                    `${person.given_name || ''} ${person.family_name || ''}`.trim() || 
                    'Unknown';
      }
    }
    
    const iconName = getIconForService(service);
    const color = getColorForServiceType(service?.attributes?.type, service?.attributes?.name);

    return (
      <TouchableOpacity
        style={styles.touchpointItem}
        onPress={() => {
          navigation.navigate('PersonDetails', { personId: person.id });
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <Ionicons 
            name={iconName as any} 
            size={20} 
            color={color} 
          />
        </View>
        
        <View style={styles.touchpointContent}>
          <View style={styles.touchpointHeader}>
            <Text style={styles.actionText}>{attributes.action || 'Interaction'}</Text>
            <Text style={styles.dateText}>{formatDateTime(attributes.created_at || attributes.occurred_at)}</Text>
          </View>
          
          <Text style={styles.personName}>{personName}</Text>
          
          {service?.attributes?.name && (
            <Text style={styles.serviceText}>{service.attributes.name}</Text>
          )}
          
          {attributes.details && (
            <View style={styles.markdownContainer}>
              <Markdown
                style={markdownStyles}
              >
                {attributes.details.replace(/<br\s*\/?>/gi, '\n')}
              </Markdown>
            </View>
          )}
          
          {attributes.notes && !attributes.details && (
            <Text style={styles.notesText}>{attributes.notes}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load touchpoints</Text>
      </View>
    );
  }

  if (touchpoints.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No touchpoints recorded</Text>
      </View>
    );
  }

  const displayedTouchpoints = touchpoints.slice(0, displayCount);
  const hasMore = touchpoints.length > displayCount;

  const handleShowMore = () => {
    setDisplayCount(prevCount => prevCount + 20);
  };

  return (
    <View style={styles.container}>
      {displayedTouchpoints.map((item, index) => (
        <View key={`${item.touchpoint.id}-${index}`}>
          {renderTouchpoint({ item })}
        </View>
      ))}
      
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 16,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
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
  personName: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '500',
    marginBottom: 2,
  },
  notesText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    marginTop: 4,
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