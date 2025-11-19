import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { theme } from '../theme';
import { groupsApi } from '../api';
import { Group } from '../types/api';
import { useResourceTypes } from '../contexts/ResourceTypesContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { GroupsStackParamList } from '../navigation/GroupsStackNavigator';
import { MaterialIcons } from '@expo/vector-icons';

type NavigationProp = StackNavigationProp<GroupsStackParamList, 'GroupsList'>;

export const GroupsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { getGroupTypeLabel } = useResourceTypes();
  const [groups, setGroups] = useState<Group[]>([]);
  const [includedData, setIncludedData] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [parentGroupsCache, setParentGroupsCache] = useState<Map<string, Group>>(new Map());

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async (search?: string, page = 1, append = false) => {
    try {
      setError(null);
      if (!append) {
        setLoading(true);
      }
      
      const params: any = {
        page: page,
        page_size: 25,
        include: 'parent_group,members',
      };
      
      // Add search filters if search term is provided
      if (search && search.trim()) {
        params['filter[name_en_cont]'] = search.trim();
      }

      const response = await groupsApi.getGroups(params);
      
      const newGroups = response.data || [];
      
      if (append) {
        setGroups(prev => [...prev, ...newGroups]);
      } else {
        setGroups(newGroups);
      }
      
      // Fetch parent group names for groups that have parent relationships
      const parentIds = new Set<string>();
      newGroups.forEach(group => {
        if (group.relationships?.parent_group?.data?.id && !parentGroupsCache.has(group.relationships.parent_group.data.id)) {
          parentIds.add(group.relationships.parent_group.data.id);
        }
      });
      
      if (parentIds.size > 0) {
        // Fetch parent groups in parallel
        const parentPromises = Array.from(parentIds).map(async (parentId) => {
          try {
            const parentResponse = await groupsApi.getGroup(parentId);
            return { id: parentId, group: parentResponse.data };
          } catch (error) {
            console.error(`Failed to fetch parent group ${parentId}:`, error);
            return null;
          }
        });
        
        const parentResults = await Promise.all(parentPromises);
        const newCache = new Map(parentGroupsCache);
        
        parentResults.forEach(result => {
          if (result && result.group) {
            newCache.set(result.id, result.group);
          }
        });
        
        setParentGroupsCache(newCache);
      }

      // Update pagination info from response meta
      if (response.meta?.page) {
        setCurrentPage(response.meta.page.number);
        setTotalPages(response.meta.page.total_pages);
        // Use the correct total items from the API response (per API blueprint)
        const totalCount = response.meta.page.total_items || 0;
        setTotalRecords(totalCount);
      }
      
    } catch (error: any) {
      console.error('Error fetching groups:', error);
      setError(error.message || 'Failed to load groups');
      if (!append) {
        setGroups([]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchGroups(searchQuery, 1, false);
  };

  const handleLoadMore = () => {
    if (currentPage < totalPages && !loadingMore) {
      setLoadingMore(true);
      fetchGroups(searchQuery, currentPage + 1, true);
    }
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      fetchGroups(text, 1, false);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchGroups('', 1, false);
  };

  const navigateToGroupDetails = (groupId: string) => {
    navigation.navigate('GroupDetails', { groupId });
  };

  const renderGroup = ({ item }: { item: Group }) => {
    // Try to get member count from relationships meta first, then fallback to attributes
    const memberCount = item.relationships?.members?.meta?.count || item.attributes.active_member_count || item.attributes.member_count || 0;
    const childGroupsCount = item.relationships?.child_groups?.meta?.count || 0;
    const hasParentGroup = item.relationships?.parent_group?.data !== null;
    
    // Get parent group name from cache
    let parentGroupName = '';
    if (hasParentGroup && item.relationships?.parent_group?.data) {
      const parentGroup = parentGroupsCache.get(item.relationships.parent_group.data.id);
      if (parentGroup) {
        parentGroupName = parentGroup.attributes.name || parentGroup.attributes.name_en || '';
      }
    }
    
    return (
      <TouchableOpacity 
        style={styles.groupCard} 
        onPress={() => navigateToGroupDetails(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardContent}>
            <Text style={styles.groupName}>{item.attributes.name || 'Unnamed Group'}</Text>
            {item.attributes.type && (
              <Text style={styles.groupType}>{getGroupTypeLabel?.(item.attributes.type) || item.attributes.type}</Text>
            )}
          </View>
          <MaterialIcons name="chevron-right" size={24} color={theme.colors.textSecondary} />
        </View>
        
        <View style={styles.groupMeta}>
          <View style={styles.metaLeft}>
            {hasParentGroup && (
              <View style={styles.metaItem}>
                <MaterialIcons name="subdirectory-arrow-right" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.metaText}>
                  {parentGroupName ? `Sub-group of ${parentGroupName}` : 'Sub-group'}
                </Text>
              </View>
            )}
            {childGroupsCount > 0 && (
              <View style={styles.metaItem}>
                <MaterialIcons name="folder" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.metaText}>
                  {childGroupsCount} sub-{childGroupsCount === 1 ? 'group' : 'groups'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.metaRight}>
            <View style={styles.metaItem}>
              <MaterialIcons name="person" size={16} color={theme.colors.textSecondary} />
              <Text style={styles.metaText}>
                {memberCount} {memberCount === 1 ? 'member' : 'members'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="group" size={48} color={theme.colors.textLight} />
        <Text style={styles.emptyText}>
          {searchQuery ? 'No groups found matching your search' : 'No groups found'}
        </Text>
      </View>
    );
  };

  if (loading && groups.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search groups..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={theme.colors.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton} 
              onPress={handleClearSearch}
            >
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {groups.length} of {totalRecords} {groups.length === 1 && totalRecords === 1 ? 'group' : 'groups'} shown
        </Text>
      </View>

      <FlatList
        data={groups}
        renderItem={renderGroup}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={groups.length === 0 ? styles.emptyListContent : undefined}
      />
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
  searchContainer: {
    padding: theme.spacing.md,
    backgroundColor: theme.colors.white,
  },
  searchInputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.backgroundSecondary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingRight: 40,
    borderRadius: theme.borderRadius.md,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.text,
  },
  clearButton: {
    position: 'absolute',
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.textLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  errorContainer: {
    backgroundColor: `${theme.colors.error}15`,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSizes.sm,
    textAlign: 'center',
  },
  resultsContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.background,
  },
  resultsText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  groupCard: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
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
  groupName: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  groupType: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeights.medium,
  },
  groupMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.md,
  },
  metaLeft: {
    flexDirection: 'column',
    gap: theme.spacing.xs,
    flex: 1,
    flexShrink: 1,
  },
  metaRight: {
    flexShrink: 0,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
  },
  metaText: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
  },
  footerLoader: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textLight,
    marginTop: theme.spacing.md,
    textAlign: 'center',
  },
});