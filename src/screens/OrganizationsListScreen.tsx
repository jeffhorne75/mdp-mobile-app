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
import { organizationsApi } from '../api';
import { Organization } from '../types/api';
import { 
  formatAddress, 
  getPrimaryAddress, 
  formatMembershipCount 
} from '../utils/formatters';
import { OrganizationMembershipInfo } from '../components/OrganizationMembershipInfo';
import { useResourceTypes } from '../contexts/ResourceTypesContext';

export const OrganizationsListScreen: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const { getOrganizationTypeLabel } = useResourceTypes();

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async (search?: string, page = 1, append = false) => {
    try {
      setError(null);
      if (!append) {
        setCurrentPage(1);
      }
      
      const params: any = {
        page_number: page,
        page_size: 25,
      };
      
      // Add search filters if search term is provided
      if (search && search.trim()) {
        params['filter[legal_name_or_alternate_name_or_legal_name_en_or_legal_name_fr_or_legal_name_es_or_alternate_name_en_or_alternate_name_fr_or_alternate_name_es_cont]'] = search.trim();
      }
      
      const response = await organizationsApi.getList(params);
      
      setApiResponse(response);
      const newOrganizations = response.data || [];
      setOrganizations(append ? [...organizations, ...newOrganizations] : newOrganizations);
      
      // Update pagination info from response meta
      if (response.meta?.page) {
        setCurrentPage(response.meta.page.number);
        setTotalPages(response.meta.page.total_pages);
        // Use the correct total items from the API response (per API blueprint)
        const totalCount = response.meta.page.total_items || 0;
        setTotalRecords(totalCount);
      }
    } catch (error: any) {
      console.error('Error fetching organizations:', error);
      setError(error.message || 'Failed to load organizations');
      Alert.alert('Error', error.message || 'Failed to load organizations');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchOrganizations(searchQuery, 1, false);
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
      fetchOrganizations(text, 1, false);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchOrganizations('', 1, false);
  };
  
  const handleLoadMore = () => {
    if (!loadingMore && currentPage < totalPages) {
      setLoadingMore(true);
      fetchOrganizations(searchQuery, currentPage + 1, true);
    }
  };

  const renderOrganization = ({ item }: { item: Organization }) => {
    // Extract addresses from included data if available
    const addresses = apiResponse?.included?.filter(
      (inc: any) => inc.type === 'addresses' && 
      item.relationships?.addresses?.data?.some((addr: any) => addr.id === inc.id)
    ) || [];
    
    const primaryAddress = getPrimaryAddress(addresses);
    const location = formatAddress(primaryAddress);

    const organizationTypeLabel = getOrganizationTypeLabel(item.attributes.type);

    return (
      <TouchableOpacity style={styles.organizationItem}>
        <Text style={styles.organizationName}>{item.attributes.legal_name}</Text>
        {organizationTypeLabel && <Text style={styles.organizationType}>{organizationTypeLabel}</Text>}
        {location && <Text style={styles.organizationLocation}>{location}</Text>}
        <OrganizationMembershipInfo 
          organizationId={item.id} 
          membershipNumber={item.attributes.membership_number}
        />
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
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
            placeholder="Search organizations..."
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
      
      <View style={styles.resultsContainer}>
        <Text style={styles.resultsText}>
          {organizations.length} of {totalRecords} {organizations.length === 1 && totalRecords === 1 ? 'organization' : 'organizations'} shown
        </Text>
      </View>
      
      <FlatList
        data={organizations}
        renderItem={renderOrganization}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {error ? error : 'No organizations found'}
            </Text>
          </View>
        }
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
  listContent: {
    padding: theme.spacing.md,
  },
  organizationItem: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  organizationName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  organizationType: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  organizationLocation: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing['2xl'],
  },
  emptyText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textLight,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  loadingMoreText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textLight,
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
});