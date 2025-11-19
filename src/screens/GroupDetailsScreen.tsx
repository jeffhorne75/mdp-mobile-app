import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../theme';
import { groupsApi, peopleApi, organizationsApi } from '../api';
import { Group, Person, Organization } from '../types/api';
import { useResourceTypes } from '../contexts/ResourceTypesContext';
import { GroupsStackParamList } from '../navigation/GroupsStackNavigator';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { SystemInformationDrawer } from '../components/SystemInformationDrawer';
import { useSectionCollapse } from '../contexts/SectionCollapseContext';

type RouteParams = RouteProp<GroupsStackParamList, 'GroupDetails'>;
type NavigationProp = StackNavigationProp<GroupsStackParamList, 'GroupDetails'>;

export const GroupDetailsScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<NavigationProp>();
  const { groupId } = route.params;
  const { getGroupTypeLabel } = useResourceTypes();
  const { toggleSection, isSectionCollapsed } = useSectionCollapse();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentGroup, setParentGroup] = useState<Group | null>(null);
  const [groupAdmin, setGroupAdmin] = useState<Person | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subGroups, setSubGroups] = useState<Group[]>([]);
  const [activeMembers, setActiveMembers] = useState<any[]>([]);
  const [historicalMembers, setHistoricalMembers] = useState<any[]>([]);
  const [memberIncludedData, setMemberIncludedData] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showAllActiveMembers, setShowAllActiveMembers] = useState(false);
  const [showAllHistoricalMembers, setShowAllHistoricalMembers] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  useEffect(() => {
    if (group) {
      fetchGroupMembers();
    }
  }, [group]);

  const fetchGroupDetails = async () => {
    try {
      setError(null);
      if (!refreshing) {
        setLoading(true);
      }

      const response = await groupsApi.getGroup(groupId, {
        include: 'parent_group,child_groups,members,group_admin,internal_group_administrator,organization,administrators',
      });
      
      setGroup(response.data);

      // Fetch parent group details if exists
      if (response.data.relationships?.parent_group?.data?.id) {
        try {
          const parentResponse = await groupsApi.getGroup(response.data.relationships.parent_group.data.id);
          setParentGroup(parentResponse.data);
        } catch (error) {
          console.error('Error fetching parent group:', error);
        }
      }

      // Fetch group admin details if exists (check administrators array first, then fallback to other fields)
      const administratorsData = response.data.relationships?.administrators?.data;
      let adminId = null;
      
      if (administratorsData && administratorsData.length > 0) {
        // Use the first administrator from the array
        adminId = administratorsData[0].id;
      } else {
        // Fallback to group_admin or internal_group_administrator
        adminId = response.data.relationships?.group_admin?.data?.id || 
                  response.data.relationships?.internal_group_administrator?.data?.id;
      }
      
      if (adminId) {
        try {
          const adminResponse = await peopleApi.getById(adminId);
          setGroupAdmin(adminResponse.data);
        } catch (error) {
          console.error('Error fetching group admin:', error);
        }
      }

      // Fetch organization details if exists
      if (response.data.relationships?.organization?.data?.id) {
        try {
          const orgResponse = await organizationsApi.getById(response.data.relationships.organization.data.id);
          setOrganization(orgResponse.data);
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      }

      // Fetch sub groups by searching for groups with this group as parent
      try {
        const allGroupsResponse = await groupsApi.getGroups({
          include: 'parent_group',
          page_size: 100, // Get more groups to find all children
        });
        
        const childGroups = allGroupsResponse.data.filter(g => 
          g.relationships?.parent_group?.data?.id === groupId
        );
        
        setSubGroups(childGroups);
      } catch (error) {
        console.error('Error fetching sub groups:', error);
        setSubGroups([]);
      }
    } catch (error: any) {
      console.error('Error fetching group details:', error);
      setError(error.message || 'Failed to load group details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchGroupDetails();
  };

  const fetchGroupMembers = async () => {
    try {
      setLoadingMembers(true);
      setMembersError(null);
      
      const response = await groupsApi.getGroupMembers(groupId, {
        include: 'person',
        sort: '-created_at',
        'page[size]': 50,
      });
      
      const memberData = response.data || [];
      const included = response.included || [];
      
      // Separate active and historical members
      const active: any[] = [];
      const historical: any[] = [];
      
      memberData.forEach((member: any) => {
        const endDate = member.attributes?.end_date;
        if (!endDate || new Date(endDate) > new Date()) {
          active.push(member);
        } else {
          historical.push(member);
        }
      });
      
      // Sort both arrays by Start Date Desc
      const sortMembers = (members: any[]) => {
        return members.sort((a, b) => {
          const aDate = a.attributes?.start_date;
          const bDate = b.attributes?.start_date;
          
          if (aDate && bDate) {
            return new Date(bDate).getTime() - new Date(aDate).getTime();
          }
          
          if (aDate && !bDate) return -1;
          if (!aDate && bDate) return 1;
          
          return 0;
        });
      };
      
      setActiveMembers(sortMembers(active));
      setHistoricalMembers(sortMembers(historical));
      setMemberIncludedData(included);
      
    } catch (error: any) {
      console.error('Error fetching group members:', error);
      setMembersError(error.message || 'Failed to load members');
    } finally {
      setLoadingMembers(false);
    }
  };


  const navigateToParentGroup = () => {
    if (parentGroup) {
      navigation.push('GroupDetails', { groupId: parentGroup.id });
    }
  };

  const navigateToPerson = (personId: string) => {
    // Navigate to person details within the same stack
    navigation.navigate('PersonDetails', { personId });
  };

  const navigateToOrganization = (organizationId: string) => {
    // Navigate to organization details within the same stack
    navigation.navigate('OrganizationDetails', { organizationId });
  };

  const navigateToSubGroup = (subGroupId: string) => {
    navigation.push('GroupDetails', { groupId: subGroupId });
  };

  const getMemberPerson = (member: any) => {
    if (!member.relationships?.person?.data?.id) return null;
    
    const personId = member.relationships.person.data.id;
    const person = memberIncludedData.find(
      item => item.id === personId && item.type === 'people'
    );
    
    return person;
  };

  const getMemberRole = (member: any) => {
    // Group members have a type attribute instead of role relationship
    return member.attributes?.type || 'member';
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

  const renderMember = ({ item, isHistorical = false }: { item: any; isHistorical?: boolean }) => {
    const person = getMemberPerson(item);
    const role = getMemberRole(item);
    
    if (!person) return null;
    
    const name = person.attributes?.full_name || [
      person.attributes?.given_name,
      person.attributes?.family_name,
    ].filter(Boolean).join(' ');
    
    const roleTitle = typeof role === 'string' ? role.charAt(0).toUpperCase() + role.slice(1) : 'Member';
    
    return (
      <TouchableOpacity 
        style={[styles.memberCard, isHistorical && styles.historicalCard]}
        onPress={() => navigateToPerson(person.id)}
        activeOpacity={0.7}
      >
        <View style={styles.memberCardHeader}>
          <View style={styles.memberCardContent}>
            <Text style={[styles.memberName, isHistorical && styles.historicalText]}>{name}</Text>
            <Text style={[styles.memberRole, isHistorical && styles.historicalTextSecondary]}>{roleTitle}</Text>
            <View style={styles.memberDates}>
              <View style={styles.dateField}>
                <Text style={[styles.dateLabel, isHistorical && styles.historicalTextSecondary]}>Start Date</Text>
                <Text style={[styles.dateValue, isHistorical && styles.historicalText]}>
                  {formatDate(item.attributes?.start_date)}
                </Text>
              </View>
              {item.attributes?.end_date && (
                <View style={styles.dateField}>
                  <Text style={[styles.dateLabel, isHistorical && styles.historicalTextSecondary]}>End Date</Text>
                  <Text style={[styles.dateValue, isHistorical && styles.historicalText]}>
                    {formatDate(item.attributes?.end_date)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <MaterialIcons 
            name="open-in-new" 
            size={16} 
            color={isHistorical ? '#999' : theme.colors.textSecondary}
            style={styles.externalLinkIcon}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !group) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchGroupDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <Text style={styles.groupName}>{group.attributes.name || 'Unnamed Group'}</Text>
      </View>
      
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {/* Group Information */}
        <CollapsibleSection
          title="Group Information"
          isCollapsed={isSectionCollapsed('group', 'groupInfo')}
          onToggle={() => toggleSection('group', 'groupInfo')}
        >
          <View style={styles.profileGrid}>
            {/* Start Date */}
            {group.attributes.start_date && (
              <View style={styles.gridField}>
                <Text style={styles.fieldLabel}>Start Date</Text>
                <Text style={styles.fieldValue}>{new Date(group.attributes.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
              </View>
            )}

            {/* End Date */}
            {group.attributes.end_date && (
              <View style={styles.gridField}>
                <Text style={styles.fieldLabel}>End Date</Text>
                <Text style={styles.fieldValue}>{new Date(group.attributes.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</Text>
              </View>
            )}

            {/* Group Type */}
            {group.attributes.type && (
              <View style={styles.gridField}>
                <Text style={styles.fieldLabel}>Group Type</Text>
                <Text style={styles.fieldValue}>
                  {getGroupTypeLabel?.(group.attributes.type) || group.attributes.type}
                </Text>
              </View>
            )}

            {/* Parent Group */}
            {parentGroup && (
              <View style={styles.gridField}>
                <Text style={styles.fieldLabel}>Parent Group</Text>
                <TouchableOpacity onPress={navigateToParentGroup}>
                  <Text style={styles.linkText}>{parentGroup.attributes.name}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Organization */}
            {organization && (
              <View style={styles.gridField}>
                <Text style={styles.fieldLabel}>Organization</Text>
                <TouchableOpacity onPress={() => navigateToOrganization(organization.id)}>
                  <Text style={styles.linkText}>{organization.attributes.legal_name}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Group Administrator */}
            {groupAdmin && (
              <View style={styles.gridField}>
                <Text style={styles.fieldLabel}>Group Administrator</Text>
                <TouchableOpacity onPress={() => navigateToPerson(groupAdmin.id)}>
                  <Text style={styles.linkText}>
                    {groupAdmin.attributes.full_name}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Description */}
            {group.attributes.description && (
              <View style={styles.fullWidthField}>
                <Text style={styles.fieldLabel}>Description</Text>
                <Text style={styles.fieldValue}>{group.attributes.description}</Text>
              </View>
            )}
          </View>
        </CollapsibleSection>


        {/* Group Members */}
        <CollapsibleSection
          title="Group Members"
          isCollapsed={isSectionCollapsed('group', 'members')}
          onToggle={() => toggleSection('group', 'members')}
        >
          {loadingMembers ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : membersError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{membersError}</Text>
            </View>
          ) : activeMembers.length === 0 && historicalMembers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No members found</Text>
            </View>
          ) : (
            <View>
              {activeMembers.length > 0 && (
                <View style={styles.memberCards}>
                  {(showAllActiveMembers ? activeMembers : activeMembers.slice(0, 5)).map((member) => (
                    <View key={member.id}>
                      {renderMember({ item: member })}
                    </View>
                  ))}
                  {activeMembers.length > 5 && (
                    <TouchableOpacity 
                      style={styles.moreButton}
                      onPress={() => setShowAllActiveMembers(!showAllActiveMembers)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.moreText}>
                        {showAllActiveMembers 
                          ? 'Less'
                          : `More (${activeMembers.length - 5} additional)`
                        }
                      </Text>
                      <MaterialIcons 
                        name={showAllActiveMembers ? "expand-less" : "expand-more"} 
                        size={20} 
                        color={theme.colors.primary} 
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              {historicalMembers.length > 0 && (
                <View style={styles.historicalContainer}>
                  <CollapsibleSection title="Historical Members" count={historicalMembers.length} noPadding>
                    <View style={styles.historicalMemberCards}>
                    {(showAllHistoricalMembers ? historicalMembers : historicalMembers.slice(0, 5)).map((member) => (
                      <View key={`historical-${member.id}`}>
                        {renderMember({ item: member, isHistorical: true })}
                      </View>
                    ))}
                    {historicalMembers.length > 5 && (
                      <TouchableOpacity 
                        style={styles.moreButton}
                        onPress={() => setShowAllHistoricalMembers(!showAllHistoricalMembers)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.moreText}>
                          {showAllHistoricalMembers 
                            ? 'Less'
                            : `More (${historicalMembers.length - 5} additional)`
                          }
                        </Text>
                        <MaterialIcons 
                          name={showAllHistoricalMembers ? "expand-less" : "expand-more"} 
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
          )}
        </CollapsibleSection>

        {/* Sub Groups */}
        {subGroups.length > 0 && (
          <CollapsibleSection
            title="Sub Groups"
            isCollapsed={isSectionCollapsed('group', 'subGroups')}
            onToggle={() => toggleSection('group', 'subGroups')}
          >
            <View style={styles.subGroupsContainer}>
              {subGroups.map((subGroup) => (
                <TouchableOpacity
                  key={subGroup.id}
                  style={styles.subGroupCard}
                  onPress={() => navigateToSubGroup(subGroup.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subGroupCardContent}>
                    <View style={styles.subGroupHeader}>
                      <MaterialIcons name="folder" size={20} color={theme.colors.primary} />
                      <Text style={styles.subGroupName}>{subGroup.attributes.name}</Text>
                    </View>
                    <View style={styles.subGroupDetails}>
                      {subGroup.attributes.type && (
                        <View style={styles.subGroupBadge}>
                          <Text style={styles.subGroupBadgeText}>
                            {getGroupTypeLabel?.(subGroup.attributes.type) || subGroup.attributes.type}
                          </Text>
                        </View>
                      )}
                      {subGroup.attributes.active_member_count !== undefined && (
                        <View style={styles.subGroupMembersContainer}>
                          <MaterialIcons name="group" size={16} color={theme.colors.textSecondary} />
                          <Text style={styles.subGroupMembersText}>
                            {subGroup.attributes.active_member_count} members
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </View>
          </CollapsibleSection>
        )}

        {/* Tags */}
        {group.attributes.tags && group.attributes.tags.length > 0 && (
          <CollapsibleSection
            title="Tags"
            isCollapsed={isSectionCollapsed('group', 'tags')}
            onToggle={() => toggleSection('group', 'tags')}
          >
            <View style={styles.tagsContainer}>
              {group.attributes.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </CollapsibleSection>
        )}

        {/* System Information */}
        <CollapsibleSection
          title="System Information"
          isCollapsed={isSectionCollapsed('group', 'systemInfo')}
          onToggle={() => toggleSection('group', 'systemInfo')}
        >
          <SystemInformationDrawer
            uuid={group.attributes?.uuid}
            createdAt={group.attributes?.created_at}
            updatedAt={group.attributes?.updated_at}
          />
        </CollapsibleSection>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.white,
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.medium,
  },
  stickyHeader: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    zIndex: 10,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  headerSection: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  groupName: {
    fontSize: theme.typography.fontSizes['2xl'],
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  groupType: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  section: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  infoSection: {
    gap: theme.spacing.md,
  },
  infoRow: {
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border + '20',
  },
  infoLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  gridField: {
    minWidth: '45%',
    marginBottom: theme.spacing.md,
  },
  fullWidthField: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  fieldLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  fieldValue: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
    lineHeight: 20,
  },
  linkText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    flex: 1,
  },
  statValue: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    marginVertical: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  tag: {
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  tagText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  subGroupsContainer: {
    gap: theme.spacing.md,
  },
  subGroupCard: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  subGroupCardContent: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  subGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  subGroupName: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.fontWeights.semibold,
    flex: 1,
  },
  subGroupDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  subGroupBadge: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs / 2,
    borderRadius: theme.borderRadius.sm,
  },
  subGroupBadgeText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  subGroupMembersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs / 2,
  },
  subGroupMembersText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
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
  memberCards: {
    gap: theme.spacing.md,
  },
  memberCard: {
    backgroundColor: theme.colors.backgroundSecondary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  memberCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  memberCardContent: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  externalLinkIcon: {
    marginLeft: theme.spacing.sm,
    marginTop: 2,
  },
  memberName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
  },
  memberRole: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  memberDates: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    marginTop: theme.spacing.xs,
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
  historicalContainer: {
    marginHorizontal: -16,
    marginTop: theme.spacing.md,
  },
  historicalMemberCards: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
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
});