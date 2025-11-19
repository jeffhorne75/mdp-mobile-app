import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { organizationsApi } from '../api';
import { theme } from '../theme';
import { CollapsibleSection } from './CollapsibleSection';

interface AssignedMember {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

interface MembershipAssignedMembersProps {
  organizationId: string;
  organizationMembershipId: string;
  membershipName: string;
}

export const MembershipAssignedMembers: React.FC<MembershipAssignedMembersProps> = ({ 
  organizationId, 
  organizationMembershipId, 
  membershipName 
}) => {
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(true);
  const [activeMembers, setActiveMembers] = useState<AssignedMember[]>([]);
  const [historicalMembers, setHistoricalMembers] = useState<AssignedMember[]>([]);
  const [showAllActive, setShowAllActive] = useState(false);
  const [showAllHistorical, setShowAllHistorical] = useState(false);
  const [isPastMembersCollapsed, setIsPastMembersCollapsed] = useState(true);

  useEffect(() => {
    fetchAssignedMembers();
  }, [organizationId, organizationMembershipId]);

  const fetchAssignedMembers = async () => {
    try {
      setLoading(true);
      
      const response = await organizationsApi.getPersonMemberships(organizationMembershipId, {
        page_number: 1,
        page_size: 100,
      });
      
      if (response.data && response.included) {
        const activeMembersList: AssignedMember[] = [];
        const historicalMembersList: AssignedMember[] = [];
        
        response.data.forEach((entry: any) => {
          if (entry.relationships?.person?.data) {
            const personId = entry.relationships.person.data.id;
            // Find the person in included data
            const person = response.included?.find(
              (inc: any) => inc.type === 'people' && inc.id === personId
            );

            if (person) {
              const memberData: AssignedMember = {
                id: personId,
                name: person.attributes.full_name || 
                      `${person.attributes.given_name} ${person.attributes.family_name}`.trim(),
                startDate: entry.attributes.starts_at,
                endDate: entry.attributes.ends_at,
                status: entry.attributes.status
              };

              if (entry.attributes.status === 'Active') {
                activeMembersList.push(memberData);
              } else {
                historicalMembersList.push(memberData);
              }
            }
          }
        });

        // Sort by start date (most recent first)
        activeMembersList.sort((a, b) => {
          if (!a.startDate || !b.startDate) return 0;
          return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
        });
        
        historicalMembersList.sort((a, b) => {
          if (!a.endDate || !b.endDate) return 0;
          return new Date(b.endDate).getTime() - new Date(a.endDate).getTime();
        });

        setActiveMembers(activeMembersList);
        setHistoricalMembers(historicalMembersList);
      }
    } catch (error) {
      console.error('Error fetching assigned members:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (activeMembers.length === 0 && historicalMembers.length === 0) {
    return null;
  }

  const renderMember = (member: AssignedMember, isHistorical: boolean = false, index: number) => (
    <TouchableOpacity
      key={`${organizationMembershipId}-${member.id}-${isHistorical ? 'hist' : 'active'}-${index}`}
      style={[styles.memberCard, isHistorical && styles.historicalMemberCard]}
      onPress={() => navigation.navigate('PersonDetails', { personId: member.id })}
      activeOpacity={0.7}
    >
      <View style={styles.memberInfo}>
        <Text style={[styles.memberName, isHistorical && styles.historicalText]}>
          {member.name}
        </Text>
        <View style={styles.memberDates}>
          <Text style={[styles.memberDate, isHistorical && styles.historicalText]}>
            {formatDate(member.startDate)} - {formatDate(member.endDate)}
          </Text>
        </View>
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={20} 
        color={isHistorical ? theme.colors.textSecondary : theme.colors.textLight} 
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {activeMembers.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>
            Current Members ({activeMembers.length})
          </Text>
          <View style={styles.membersContainer}>
            {(showAllActive ? activeMembers : activeMembers.slice(0, 3)).map((member, index) => 
              renderMember(member, false, index)
            )}
            {activeMembers.length > 3 && (
              <TouchableOpacity
                style={styles.moreButton}
                onPress={() => setShowAllActive(!showAllActive)}
                activeOpacity={0.7}
              >
                <Text style={styles.moreText}>
                  {showAllActive 
                    ? 'Show Less'
                    : `Show ${activeMembers.length - 3} More`
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
        </View>
      )}

      {historicalMembers.length > 0 && (
        <View style={styles.pastMembersWrapper}>
          <CollapsibleSection 
            title="Past Members" 
            count={historicalMembers.length}
            isCollapsed={isPastMembersCollapsed}
            onToggle={() => setIsPastMembersCollapsed(!isPastMembersCollapsed)}
          >
            <View style={styles.historicalMembersContainer}>
            {(showAllHistorical ? historicalMembers : historicalMembers.slice(0, 3)).map((member, index) => 
              renderMember(member, true, index)
            )}
            {historicalMembers.length > 3 && (
              <TouchableOpacity
                style={[styles.moreButton, styles.historicalMoreButton]}
                onPress={() => setShowAllHistorical(!showAllHistorical)}
                activeOpacity={0.7}
              >
                <Text style={[styles.moreText, styles.historicalMoreText]}>
                  {showAllHistorical 
                    ? 'Show Less'
                    : `Show ${historicalMembers.length - 3} More`
                  }
                </Text>
                <MaterialIcons
                  name={showAllHistorical ? "expand-less" : "expand-more"}
                  size={20}
                  color={theme.colors.textSecondary}
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
  container: {
    marginTop: theme.spacing.md,
  },
  loadingContainer: {
    padding: theme.spacing.md,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  membersContainer: {
    gap: theme.spacing.xs,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.xs,
  },
  historicalMemberCard: {
    backgroundColor: theme.colors.backgroundLight,
    borderColor: theme.colors.backgroundSecondary,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: theme.typography.fontSizes.sm,
    fontWeight: theme.typography.fontWeights.medium,
    color: theme.colors.text,
  },
  memberDates: {
    marginTop: theme.spacing.xs,
  },
  memberDate: {
    fontSize: theme.typography.fontSizes.xs,
    color: theme.colors.textSecondary,
  },
  historicalText: {
    color: theme.colors.textSecondary,
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
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
  historicalMembersContainer: {
    gap: theme.spacing.xs,
  },
  historicalMoreButton: {
    borderColor: theme.colors.backgroundSecondary,
    backgroundColor: theme.colors.background,
  },
  historicalMoreText: {
    color: theme.colors.textSecondary,
  },
  pastMembersWrapper: {
    marginHorizontal: -16,
  },
});