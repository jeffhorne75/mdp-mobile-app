import React, { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { organizationsApi } from '../api';
import { MembershipEntry, MembershipData } from '../types/api';
import { theme } from '../theme';

interface OrganizationMembershipInfoProps {
  organizationId: string;
  membershipNumber?: string;
}

export const OrganizationMembershipInfo: React.FC<OrganizationMembershipInfoProps> = ({ organizationId, membershipNumber }) => {
  const [memberships, setMemberships] = useState<Array<{ name: string; endDate: string | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberships();
  }, [organizationId]);

  const fetchMemberships = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
      const response = await organizationsApi.getMemberships(organizationId, {
        page_number: 1,
        page_size: 50,
        active_at: today,
      });

      if (response.data) {
        // Filter for active memberships
        const activeMemberships = response.data.filter(
          (entry: MembershipEntry) => entry.attributes.status === 'Active'
        );

        // Extract membership tier names and end dates from included data
        const membershipData: Array<{ name: string; endDate: string | null }> = [];
        
        if (response.included && response.included.length > 0) {
          activeMemberships.forEach((entry: MembershipEntry) => {
            const membershipId = entry.relationships?.membership?.data?.id;
            if (membershipId) {
              const membership = response.included.find(
                (inc: MembershipData) => inc.type === 'memberships' && inc.id === membershipId
              );
              if (membership?.attributes?.name) {
                membershipData.push({
                  name: membership.attributes.name,
                  endDate: entry.attributes.ends_at || null
                });
              }
            }
          });
        }

        setMemberships(membershipData);
      }
    } catch (error) {
      console.error('Error fetching organization memberships:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Text style={styles.membershipText}>Loading memberships...</Text>;
  }

  if (memberships.length === 0) {
    return null;
  }

  return (
    <>
      {membershipNumber && (
        <Text style={styles.membershipNumber}>Member #{membershipNumber}</Text>
      )}
      <View style={styles.membershipContainer}>
        {memberships.map((membership, index) => {
          const formattedEndDate = membership.endDate ? membership.endDate.split('T')[0] : '∞';
          return (
            <View key={index} style={styles.membershipItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.membershipText}>
                {membership.name} ({formattedEndDate})
              </Text>
            </View>
          );
        })}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  membershipContainer: {
    marginTop: theme.spacing.xs,
  },
  membershipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xs / 2,
  },
  bulletPoint: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.bold,
    marginRight: theme.spacing.xs,
    lineHeight: theme.typography.fontSizes.sm * 1.2,
  },
  membershipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
    flex: 1,
    lineHeight: theme.typography.fontSizes.sm * 1.2,
  },
  membershipNumber: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  noMembershipText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    fontStyle: 'italic',
  },
});