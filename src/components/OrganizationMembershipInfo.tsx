import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { organizationsApi } from '../api';
import { MembershipEntry, MembershipData } from '../types/api';
import { theme } from '../theme';
import { CollapsibleSection } from './CollapsibleSection';
import { MembershipAssignedMembers } from './MembershipAssignedMembers';

interface OrganizationMembershipInfoProps {
  organizationId: string;
  membershipNumber?: string;
  membershipBeganOn?: string;
}

interface MembershipInfo {
  id: string;
  organizationMembershipId: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  ownerId?: string;
  ownerName?: string;
}

export const OrganizationMembershipInfo: React.FC<OrganizationMembershipInfoProps> = ({ organizationId, membershipNumber, membershipBeganOn }) => {
  const navigation = useNavigation();
  const [activeMemberships, setActiveMemberships] = useState<MembershipInfo[]>([]);
  const [historicalMemberships, setHistoricalMemberships] = useState<MembershipInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllHistorical, setShowAllHistorical] = useState(false);

  useEffect(() => {
    fetchMemberships();
  }, [organizationId]);

  const fetchMemberships = async () => {
    try {
      // Fetch all memberships without date filter
      const response = await organizationsApi.getMemberships(organizationId, {
        page_number: 1,
        page_size: 50,
      });

      if (response.data) {
        // Separate active and historical memberships
        const activeMembershipsList: MembershipInfo[] = [];
        const historicalMembershipsList: MembershipInfo[] = [];
        
        if (response.included && response.included.length > 0) {
          const includedData = response.included;
          response.data.forEach((entry: MembershipEntry) => {
            const membershipId = entry.relationships?.membership?.data?.id;
            if (membershipId) {
              const membership = includedData.find(
                (inc: MembershipData) => inc.type === 'memberships' && inc.id === membershipId
              );
              if (membership?.attributes?.name) {
                const membershipData: MembershipInfo = {
                  id: membershipId,
                  organizationMembershipId: entry.id,
                  name: membership.attributes.name,
                  startDate: entry.attributes.starts_at || null,
                  endDate: entry.attributes.ends_at || null
                };
                
                // Check for owner relationship
                if (entry.relationships?.owner?.data) {
                  const ownerId = entry.relationships.owner.data.id;
                  membershipData.ownerId = ownerId;
                  
                  // Find the owner in included data
                  const owner = includedData.find(
                    (inc: any) => inc.type === 'people' && inc.id === ownerId
                  );
                  
                  if (owner) {
                    const ownerName = [
                      owner.attributes?.given_name,
                      owner.attributes?.family_name
                    ].filter(Boolean).join(' ');
                    membershipData.ownerName = ownerName;
                  }
                }
                
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
      console.error('Error fetching organization memberships:', error);
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
          {(showAllActive ? activeMemberships : activeMemberships.slice(0, 5)).map((membership) => (
            <View key={`active-${membership.organizationMembershipId}`} style={styles.membershipCard}>
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
              {membership.ownerId && membership.ownerName && (
                <TouchableOpacity 
                  style={styles.ownerField}
                  onPress={() => (navigation as any).navigate('People', {
                    screen: 'PersonDetails',
                    params: { personId: membership.ownerId }
                  })}
                  activeOpacity={0.7}
                >
                  <Text style={styles.ownerLabel}>Owner</Text>
                  <Text style={styles.ownerValue}>{membership.ownerName}</Text>
                </TouchableOpacity>
              )}
              <MembershipAssignedMembers 
                organizationId={organizationId}
                organizationMembershipId={membership.organizationMembershipId}
                membershipName={membership.name}
              />
            </View>
          ))}
          {activeMemberships.length > 5 && (
            <TouchableOpacity 
              style={styles.moreButton}
              onPress={() => setShowAllActive(!showAllActive)}
              activeOpacity={0.7}
            >
              <Text style={styles.moreText}>
                {showAllActive 
                  ? 'Less'
                  : `More (${activeMemberships.length - 5} additional)`
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

      {historicalMemberships.length > 0 && (
        <View style={styles.historicalContainer}>
          <CollapsibleSection title="Historical Memberships" count={historicalMemberships.length} noPadding>
            <View style={styles.historicalMembershipCards}>
            {(showAllHistorical ? historicalMemberships : historicalMemberships.slice(0, 5)).map((membership) => (
              <View key={`historical-${membership.organizationMembershipId}`} style={[styles.membershipCard, styles.historicalCard]}>
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
                {membership.ownerId && membership.ownerName && (
                  <TouchableOpacity 
                    style={styles.ownerField}
                    onPress={() => (navigation as any).navigate('People', {
                      screen: 'PersonDetails',
                      params: { personId: membership.ownerId }
                    })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.ownerLabel, styles.historicalText]}>Owner</Text>
                    <Text style={[styles.ownerValue, styles.historicalText]}>{membership.ownerName}</Text>
                  </TouchableOpacity>
                )}
                <MembershipAssignedMembers 
                  organizationId={organizationId}
                  organizationMembershipId={membership.organizationMembershipId}
                  membershipName={membership.name}
                />
              </View>
            ))}
            {historicalMemberships.length > 5 && (
              <TouchableOpacity 
                style={styles.moreButton}
                onPress={() => setShowAllHistorical(!showAllHistorical)}
                activeOpacity={0.7}
              >
                <Text style={styles.moreText}>
                  {showAllHistorical 
                    ? 'Less'
                    : `More (${historicalMemberships.length - 5} additional)`
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
  historicalContainer: {
    marginHorizontal: -16, // Compensate for CollapsibleSection's margins
  },
  historicalMembershipCards: {
    marginTop: theme.spacing.md,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
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
  ownerField: {
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  ownerLabel: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  ownerValue: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
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