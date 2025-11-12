import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
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
  const { getOrganizationTypeLabel } = useResourceTypes();
  const [activeConnections, setActiveConnections] = useState<Connection[]>([]);
  const [historicalConnections, setHistoricalConnections] = useState<Connection[]>([]);
  const [includedData, setIncludedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    
    // Convert connection type slug to label format
    const connectionTypeLabels: { [key: string]: string } = {
      'spouse': 'Spouse',
      'partner': 'Partner',
      'child': 'Child',
      'parent': 'Parent',
      'sibling': 'Sibling',
      'friend': 'Friend',
      'colleague': 'Colleague',
      'mentor': 'Mentor',
      'mentee': 'Mentee',
      'employee': 'Employee',
      'employer': 'Employer',
      'volunteer': 'Volunteer',
      'member': 'Member',
      'board-member': 'Board Member',
      'director': 'Director',
      'founder': 'Founder',
      'co-founder': 'Co-founder',
      'advisor': 'Advisor',
      'consultant': 'Consultant',
      'contractor': 'Contractor',
      'vendor': 'Vendor',
      'client': 'Client',
      'customer': 'Customer',
      'investor': 'Investor',
      'shareholder': 'Shareholder',
      'partner-business': 'Business Partner',
      'associate': 'Associate',
      'acquaintance': 'Acquaintance',
      'other': 'Other'
    };
    
    return connectionTypeLabels[type.toLowerCase()] || type.charAt(0).toUpperCase() + type.slice(1).replace(/-/g, ' ');
  };

  const formatDirectionalConnectionType = (type?: string, direction?: 'from' | 'to' | 'unknown', entityName?: string) => {
    if (!type) return '';
    
    // Define relationship mappings with directional context
    const directionalMappings: { [key: string]: { to: string; from: string } } = {
      'parent': { to: 'Parent of', from: 'Child of' },
      'child': { to: 'Child of', from: 'Parent of' },
      'spouse': { to: 'Spouse of', from: 'Spouse of' },
      'partner': { to: 'Partner of', from: 'Partner of' },
      'sibling': { to: 'Sibling of', from: 'Sibling of' },
      'friend': { to: 'Friend of', from: 'Friend of' },
      'colleague': { to: 'Colleague of', from: 'Colleague of' },
      'mentor': { to: 'Mentor to', from: 'Mentee of' },
      'mentee': { to: 'Mentee of', from: 'Mentor to' },
      'employee': { to: 'Employee of', from: 'Employer of' },
      'employer': { to: 'Employer of', from: 'Employee of' },
      'volunteer': { to: 'Volunteer at', from: 'Has volunteer' },
      'member': { to: 'Member of', from: 'Has member' },
      'board-member': { to: 'Board Member of', from: 'Has board member' },
      'director': { to: 'Director of', from: 'Has director' },
      'founder': { to: 'Founder of', from: 'Founded by' },
      'co-founder': { to: 'Co-founder of', from: 'Co-founded by' },
      'advisor': { to: 'Advisor to', from: 'Advised by' },
      'consultant': { to: 'Consultant for', from: 'Consults with' },
      'contractor': { to: 'Contractor for', from: 'Contracts with' },
      'vendor': { to: 'Vendor for', from: 'Customer of' },
      'client': { to: 'Client of', from: 'Service provider for' },
      'customer': { to: 'Customer of', from: 'Vendor for' },
      'investor': { to: 'Investor in', from: 'Invested in by' },
      'shareholder': { to: 'Shareholder of', from: 'Has shareholder' },
      'partner-business': { to: 'Business Partner of', from: 'Business Partner of' },
      'associate': { to: 'Associate of', from: 'Associate of' },
      'acquaintance': { to: 'Acquaintance of', from: 'Acquaintance of' },
    };
    
    const mapping = directionalMappings[type.toLowerCase()];
    
    if (mapping && direction && direction !== 'unknown') {
      const label = direction === 'to' ? mapping.to : mapping.from;
      return entityName ? `${label} ${entityName}` : label;
    }
    
    // Fallback: format the type and add directional context with entity name
    const baseType = formatConnectionType(type);
    
    // For unmapped types, add generic directional prepositions based on entity type
    if (entityName && direction && direction !== 'unknown') {
      // Check if we're dealing with a person or organization based on context
      // Since we're in PersonRelationships, 'to' means current person has relationship TO entity
      // 'from' means entity has relationship TO current person
      
      if (direction === 'to') {
        // Current person -> Entity: "[Type] for/of [Entity]"
        return `${baseType} for ${entityName}`;
      } else {
        // Entity -> Current person: "[Type] to [Person]"
        return `${baseType} to ${entityName}`;
      }
    }
    
    // If no entity name or direction, just return the formatted type
    return baseType;
  };

  const handleNavigateToDetails = (relatedEntity: any) => {
    if (relatedEntity.type === 'people') {
      // Navigate to Person Details
      (navigation as any).navigate('PersonDetails', { personId: relatedEntity.id });
    } else if (relatedEntity.type === 'organizations') {
      // For now, we'll just show an alert since OrganizationDetails screen doesn't exist yet
      // This can be updated when the OrganizationDetails screen is implemented
      console.log('Navigate to organization:', relatedEntity.id);
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

  return (
    <View>
      {activeConnections.length > 0 && (
        <View style={styles.relationshipCards}>
          {activeConnections.map((connection) => (
            <View key={connection.id}>
              {renderConnection({ item: connection })}
            </View>
          ))}
        </View>
      )}
      
      {historicalConnections.length > 0 && (
        <CollapsibleSection title="Historical Relationships" count={historicalConnections.length}>
          <View style={styles.relationshipCards}>
            {historicalConnections.map((connection) => (
              <View key={`historical-${connection.id}`}>
                {renderConnection({ item: connection, isHistorical: true })}
              </View>
            ))}
          </View>
        </CollapsibleSection>
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
});