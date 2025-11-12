import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { peopleApi } from '../api';
import { MembershipEntry, MembershipData } from '../types/api';
import { theme } from '../theme';
import { CollapsibleSection } from './CollapsibleSection';

interface PersonMembershipInfoProps {
  personId: string;
  membershipNumber?: string;
  membershipBeganOn?: string;
}

export const PersonMembershipInfo: React.FC<PersonMembershipInfoProps> = ({ personId, membershipNumber, membershipBeganOn }) => {
  const [activeMemberships, setActiveMemberships] = useState<Array<{ name: string; startDate: string | null; endDate: string | null }>>([]);
  const [historicalMemberships, setHistoricalMemberships] = useState<Array<{ name: string; startDate: string | null; endDate: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  console.log('PersonMembershipInfo props:', { personId, membershipNumber, membershipBeganOn });

  useEffect(() => {
    fetchMemberships();
  }, [personId]);

  const fetchMemberships = async () => {
    try {
      // Fetch all memberships without date filter
      const response = await peopleApi.getMemberships(personId, {
        page_number: 1,
        page_size: 50,
      });

      if (response.data) {
        // Separate active and historical memberships
        const activeMembershipsList: Array<{ name: string; startDate: string | null; endDate: string | null }> = [];
        const historicalMembershipsList: Array<{ name: string; startDate: string | null; endDate: string | null }> = [];
        
        if (response.included && response.included.length > 0) {
          response.data.forEach((entry: MembershipEntry) => {
            const membershipId = entry.relationships?.membership?.data?.id;
            if (membershipId) {
              const membership = response.included.find(
                (inc: MembershipData) => inc.type === 'memberships' && inc.id === membershipId
              );
              if (membership?.attributes?.name) {
                const membershipData = {
                  name: membership.attributes.name,
                  startDate: entry.attributes.starts_at || null,
                  endDate: entry.attributes.ends_at || null
                };
                
                if (entry.attributes.status === 'Active') {
                  activeMembershipsList.push(membershipData);
                } else {
                  historicalMembershipsList.push(membershipData);
                }
              }
            }
          });
        }

        setActiveMemberships(activeMembershipsList);
        setHistoricalMemberships(historicalMembershipsList);
      }
    } catch (error) {
      console.error('Error fetching memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text style={styles.loadingText}>Loading memberships...</Text>;
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  // Use the earliest membership start date if membershipBeganOn is a placeholder value
  const allMemberships = [...activeMemberships, ...historicalMemberships];
  const effectiveStartDate = membershipBeganOn === '2000-01-01' && allMemberships.length > 0
    ? allMemberships.reduce((earliest, membership) => {
        if (!membership.startDate) return earliest;
        if (!earliest) return membership.startDate;
        return new Date(membership.startDate) < new Date(earliest) ? membership.startDate : earliest;
      }, allMemberships[0].startDate)
    : membershipBeganOn;

  return (
    <View>
      <View style={styles.membershipGrid}>
        {membershipNumber && (
          <View style={styles.gridField}>
            <Text style={styles.fieldLabel}>Member Number</Text>
            <Text style={styles.fieldValue}>#{membershipNumber}</Text>
          </View>
        )}
        
        {effectiveStartDate && (
          <View style={styles.gridField}>
            <Text style={styles.fieldLabel}>Member Since</Text>
            <Text style={styles.fieldValue}>{formatDate(effectiveStartDate)}</Text>
          </View>
        )}
      </View>

      {activeMemberships.length > 0 && (
        <View style={styles.membershipCards}>
          {activeMemberships.map((membership, index) => (
            <View key={index} style={styles.membershipCard}>
              <Text style={styles.membershipName}>{membership.name}</Text>
              <View style={styles.membershipDates}>
                <View style={styles.dateField}>
                  <Text style={styles.dateLabel}>Start Date</Text>
                  <Text style={styles.dateValue}>{formatDate(membership.startDate)}</Text>
                </View>
                <View style={styles.dateField}>
                  <Text style={styles.dateLabel}>End Date</Text>
                  <Text style={styles.dateValue}>{formatDate(membership.endDate)}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {historicalMemberships.length > 0 && (
        <CollapsibleSection title="Historical Memberships" count={historicalMemberships.length}>
          <View style={styles.membershipCards}>
            {historicalMemberships.map((membership, index) => (
              <View key={`historical-${index}`} style={[styles.membershipCard, styles.historicalCard]}>
                <Text style={[styles.membershipName, styles.historicalText]}>{membership.name}</Text>
                <View style={styles.membershipDates}>
                  <View style={styles.dateField}>
                    <Text style={[styles.dateLabel, styles.historicalText]}>Start Date</Text>
                    <Text style={[styles.dateValue, styles.historicalText]}>{formatDate(membership.startDate)}</Text>
                  </View>
                  <View style={styles.dateField}>
                    <Text style={[styles.dateLabel, styles.historicalText]}>End Date</Text>
                    <Text style={[styles.dateValue, styles.historicalText]}>{formatDate(membership.endDate)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </CollapsibleSection>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  membershipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  gridField: {
    minWidth: '45%',
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
  loadingText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
  membershipCards: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
  },
  membershipCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
  },
  membershipName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  membershipDates: {
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
    backgroundColor: theme.colors.backgroundLight,
    opacity: 0.8,
  },
  historicalText: {
    color: theme.colors.textSecondary,
  },
});