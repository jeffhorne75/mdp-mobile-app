import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { connectionsApi } from '../api';
import { Connection } from '../types/api';
import { useResourceTypes } from '../contexts/ResourceTypesContext';
import { CollapsibleSection } from './CollapsibleSection';

interface PersonRelationshipsProps {
  personId: string;
}

export const PersonRelationships: React.FC<PersonRelationshipsProps> = ({ personId }) => {
  const navigation = useNavigation();
  const { getOrganizationTypeLabel, getConnectionTypeLabel } = useResourceTypes();
  const [activeConnections, setActiveConnections] = useState<Connection[]>([]);
  const [historicalConnections, setHistoricalConnections] = useState<Connection[]>([]);
  const [includedData, setIncludedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllHistorical, setShowAllHistorical] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, [personId]);

  const fetchConnections = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await connectionsApi.getPersonConnections(personId, {
        connection_type_eq: 'all',
        sort: '-starts_at',
        page_size: 50,
      });
      
      // Handle the response structure
      const connectionData = response.data || [];
      const included = response.included || [];
      
      // Separate active and historical relationships
      const active: Connection[] = [];
      const historical: Connection[] = [];
      
      connectionData.forEach((conn: Connection) => {
        const endsAt = conn.attributes?.ends_at;
        if (!endsAt || new Date(endsAt) > new Date()) {
          active.push(conn);
        } else {
          historical.push(conn);
        }
      });
      
      // Sort both arrays: Start Date Desc with empty dates at bottom
      const sortConnections = (connections: Connection[]) => {
        return connections.sort((a: Connection, b: Connection) => {
          const aDate = a.attributes?.starts_at;
          const bDate = b.attributes?.starts_at;
          
          // If both have dates, sort descending
          if (aDate && bDate) {
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          }
          
          // Empty dates go to bottom
          if (aDate && !bDate) return -1;
          if (!aDate && bDate) return 1;
          
          // Both empty, maintain original order
          return 0;
        });
      };
      
      setActiveConnections(sortConnections(active));
      setHistoricalConnections(sortConnections(historical));
      setIncludedData(included);
      
    } catch (error: any) {
      console.error('Error fetching connections:', error);
      setError(error.message || 'Failed to load relationships');
    } finally {
      setLoading(false);
    }
  };

  const getRelatedEntity = (connection: Connection) => {
    // Find the related entity (person or organization) in the included data
    let relatedId: string | undefined;
    let relatedType: string | undefined;
    let direction: 'from' | 'to' | 'unknown' = 'unknown';
    
    // For person connections, we need to find the OTHER person (not the current person)
    // Check the from/to relationships
    if (connection.relationships?.from && connection.relationships?.to) {
      // If 'from' is the current person, then 'to' is the related entity
      if (connection.relationships.from.data.id === personId) {
        relatedId = connection.relationships.to.data.id;
        relatedType = connection.relationships.to.data.type;
        direction = 'to'; // Current person points TO the related entity
      } 
      // If 'to' is the current person, then 'from' is the related entity
      else if (connection.relationships.to.data.id === personId) {
        relatedId = connection.relationships.from.data.id;
        relatedType = connection.relationships.from.data.type;
        direction = 'from'; // Related entity points TO the current person
      }
    } else if (connection.relationships?.person) {
      // Legacy format - this should be the related person
      relatedId = connection.relationships.person.data.id;
      relatedType = 'people';
    } else if (connection.relationships?.organization) {
      // Legacy format - organization relationships
      relatedId = connection.relationships.organization.data.id;
      relatedType = 'organizations';
    }
    
    if (!relatedId || !relatedType) return null;
    
    // Find the entity in included data
    const entity = includedData.find(
      item => item.id === relatedId && item.type === relatedType
    );
    
    return entity ? { entity, direction } : null;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };


  const formatConnectionType = (type?: string) => {
    if (!type) return '';
    
    // Use the connection type label from resource types context
    return getConnectionTypeLabel(type);
  };

  const formatDirectionalConnectionType = (type?: string, direction?: 'from' | 'to' | 'unknown', entityName?: string) => {
    if (!type) return '';
    
    // Get the properly formatted type label from the API or fallback
    const baseType = getConnectionTypeLabel(type);
    
    if (entityName && direction && direction !== 'unknown') {
      if (direction === 'to') {
        // Current person -> Entity: "[Type] - [Entity]"
        return `${baseType} - ${entityName}`;
      } else {
        // Entity -> Current person: "[Entity] - [Type]"
        return `${entityName} - ${baseType}`;
      }
    }
    
    // If no entity name or direction, just return the formatted type
    return baseType;
  };

  const handleNavigateToDetails = (relatedEntity: any) => {
    if (relatedEntity.type === 'people') {
      // Navigate to Person Details within the same stack
      (navigation as any).push('PersonDetails', { personId: relatedEntity.id });
    } else if (relatedEntity.type === 'organizations') {
      // Navigate to Organization Details within the same stack
      (navigation as any).push('OrganizationDetails', { organizationId: relatedEntity.id });
    }
  };

  const renderConnection = ({ item, isHistorical = false }: { item: Connection; isHistorical?: boolean }) => {
    const result = getRelatedEntity(item);
    
    if (!result) return null;
    
    const { entity: relatedEntity, direction } = result;
    
    let name = '';
    let subtitle = '';
    
    if (relatedEntity.type === 'people') {
      const person = relatedEntity;
      name = [
        person.attributes?.given_name,
        person.attributes?.family_name,
      ].filter(Boolean).join(' ');
      subtitle = person.attributes?.job_title || '';
    } else if (relatedEntity.type === 'organizations') {
      const org = relatedEntity;
      name = org.attributes?.legal_name || org.attributes?.alternate_name || '';
      subtitle = getOrganizationTypeLabel(org.attributes?.type) || '';
    }
    
    // Get the directional arrow icon
    const getDirectionIcon = () => {
      if (direction === 'to') {
        return 'arrow-forward';
      } else if (direction === 'from') {
        return 'arrow-back';
      }
      return null;
    };
    
    const directionIcon = getDirectionIcon();
    
    return (
      <TouchableOpacity 
        style={[styles.relationshipCard, isHistorical && styles.historicalCard]}
        onPress={() => handleNavigateToDetails(relatedEntity)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <Text style={[styles.relationshipName, isHistorical && styles.historicalText]}>{name}</Text>
            {subtitle ? (
              <Text style={[styles.relationshipSubtitle, isHistorical && styles.historicalTextSecondary]}>{subtitle}</Text>
            ) : null}
          </View>
          <MaterialIcons 
            name="open-in-new" 
            size={16} 
            color={isHistorical ? '#999' : theme.colors.textSecondary}
            style={styles.externalLinkIcon}
          />
        </View>
        <View style={styles.relationshipTypeRow}>
          {directionIcon && (
            <MaterialIcons 
              name={directionIcon} 
              size={16} 
              color={isHistorical ? '#999' : theme.colors.primary}
              style={styles.directionIcon}
            />
          )}
          <Text style={[styles.relationshipType, isHistorical && styles.historicalTextPrimary]}>
            {formatDirectionalConnectionType(item.attributes.type, direction, name)}
          </Text>
        </View>
        {item.attributes.description && (
          <Text style={[styles.relationshipDescription, isHistorical && styles.historicalTextSecondary]}>{item.attributes.description}</Text>
        )}
        <View style={styles.relationshipDates}>
          <View style={styles.dateField}>
            <Text style={[styles.dateLabel, isHistorical && styles.historicalTextSecondary]}>Start Date</Text>
            <Text style={[styles.dateValue, isHistorical && styles.historicalText]}>{formatDate(item.attributes.starts_at)}</Text>
          </View>
          <View style={styles.dateField}>
            <Text style={[styles.dateLabel, isHistorical && styles.historicalTextSecondary]}>End Date</Text>
            <Text style={[styles.dateValue, isHistorical && styles.historicalText]}>{formatDate(item.attributes.ends_at)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (activeConnections.length === 0 && historicalConnections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No relationships found</Text>
      </View>
    );
  }

  const displayedActiveConnections = showAllActive ? activeConnections : activeConnections.slice(0, 5);
  const displayedHistoricalConnections = showAllHistorical ? historicalConnections : historicalConnections.slice(0, 5);

  return (
    <View>
      {activeConnections.length > 0 && (
        <View style={styles.relationshipCards}>
          {displayedActiveConnections.map((connection) => (
            <View key={connection.id}>
              {renderConnection({ item: connection })}
            </View>
          ))}
          {activeConnections.length > 5 && (
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => setShowAllActive(!showAllActive)}
              activeOpacity={0.7}
            >
              <Text style={styles.moreText}>
                {showAllActive 
                  ? 'Less'
                  : `More (${activeConnections.length - 5} additional)`
                }
              </Text>
              <MaterialIcons 
                name={showAllActive ? "expand-less" : "expand-more"} 
                size={20} 
                color={theme.colors.primary} 
              />
            </TouchableOpacity>
          )}
        </View>
      )}
      
      {historicalConnections.length > 0 && (
        <View style={styles.historicalContainer}>
          <CollapsibleSection title="Historical Relationships" count={historicalConnections.length} noPadding>
            <View style={styles.historicalRelationshipCards}>
              {displayedHistoricalConnections.map((connection) => (
                <View key={`historical-${connection.id}`}>
                  {renderConnection({ item: connection, isHistorical: true })}
                </View>
              ))}
              {historicalConnections.length > 5 && (
                <TouchableOpacity 
                  style={styles.moreButton}
                  onPress={() => setShowAllHistorical(!showAllHistorical)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moreText}>
                    {showAllHistorical 
                      ? 'Less'
                      : `More (${historicalConnections.length - 5} additional)`
                    }
                  </Text>
                  <MaterialIcons 
                    name={showAllHistorical ? "expand-less" : "expand-more"} 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                </TouchableOpacity>
              )}
            </View>
          </CollapsibleSection>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  errorContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
  },
  emptyContainer: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
  },
  relationshipCards: {
    gap: theme.spacing.md,
  },
  historicalContainer: {
    marginHorizontal: -16, // Compensate for CollapsibleSection's margins
  },
  historicalRelationshipCards: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
  },
  relationshipCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs,
  },
  cardContent: {
    flex: 1,
  },
  externalLinkIcon: {
    marginLeft: theme.spacing.sm,
    marginTop: 2,
  },
  relationshipName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
  },
  relationshipSubtitle: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  relationshipTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  directionIcon: {
    marginRight: theme.spacing.xs,
  },
  relationshipType: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  relationshipDescription: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: theme.spacing.sm,
  },
  relationshipDates: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  dateField: {
    flex: 1,
  },
  dateLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  dateValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.text,
  },
  historicalCard: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  historicalText: {
    color: '#666',
  },
  historicalTextSecondary: {
    color: '#999',
  },
  historicalTextPrimary: {
    color: '#888',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    marginTop: theme.spacing.xs,
  },
  moreText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
    marginRight: theme.spacing.xs,
  },
});