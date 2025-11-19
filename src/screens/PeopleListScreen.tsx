import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PeopleStackParamList } from '../navigation/PeopleStackNavigator';
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
import { peopleApi } from '../api';
import { Person, Address } from '../types/api';
import { 
  formatPersonName, 
  formatCityState, 
  getPrimaryAddress, 
  formatMembershipCount 
} from '../utils/formatters';

type PeopleListNavigationProp = StackNavigationProp<PeopleStackParamList, 'PeopleList'>;

export const PeopleListScreen: React.FC = () => {
  const navigation = useNavigation<PeopleListNavigationProp>();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [included, setIncluded] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [membershipInfo, setMembershipInfo] = useState<{ [key: string]: Array<{ name: string; endDate: string | null }> }>({});

  useEffect(() => {
    fetchPeople();
  }, []);

  const fetchMembershipData = async (personIds: string[]) => {
    const membershipData: { [key: string]: Array<{ name: string; endDate: string | null }> } = {};
    const today = new Date().toISOString().split('T')[0];
    
    // Batch fetch memberships for all people
    const promises = personIds.map(async (personId) => {
      try {
        const response = await peopleApi.getMemberships(personId, {
          page_number: 1,
          page_size: 50,
          active_at: today,
        });
        
        if (response.data && response.included) {
          const includedData = response.included;
          // Filter active memberships and extract their names
          const activeMemberships = response.data.filter(
            (entry: any) => entry.attributes.status === 'Active'
          );
          
          const memberships: Array<{ name: string; endDate: string | null }> = [];
          
          activeMemberships.forEach((entry: any) => {
            const membershipId = entry.relationships?.membership?.data?.id;
            if (membershipId) {
              const membership = includedData.find(
                (inc: any) => inc.type === 'memberships' && inc.id === membershipId
              );
              if (membership?.attributes?.name) {
                memberships.push({
                  name: membership.attributes.name,
                  endDate: entry.attributes.ends_at || null
                });
              }
            }
          });
          
          membershipData[personId] = memberships;
        } else {
          membershipData[personId] = [];
        }
      } catch (error) {
        console.error(`Error fetching memberships for person ${personId}:`, error);
        membershipData[personId] = [];
      }
    });
    
    await Promise.all(promises);
    return membershipData;
  };

  const fetchPeople = async (search?: string, page = 1, append = false, currentPeopleList?: Person[]) => {
    try {
      setError(null);
      
      const params: any = {
        page_number: page,
        page_size: 25,
      };
      
      // Add search filters if search term is provided
      if (search && search.trim()) {
        params['filter[given_name_or_family_name_or_full_name_or_emails_address_cont]'] = search.trim();
      }
      
      const response = await peopleApi.getList(params);
      
      const newPeople = response.data || [];
      const peopleToUse = currentPeopleList || people;
      const finalPeopleList = append ? [...peopleToUse, ...newPeople] : newPeople;
      setPeople(finalPeopleList);
      setIncluded(response.included || []);
      
      // Fetch membership data for all people
      const personIds = finalPeopleList.map(p => p.id);
      const membershipsData = await fetchMembershipData(personIds);
      setMembershipInfo(membershipsData);
      
      // Update pagination info from response meta
      if (response.meta?.page) {
        setTotalPages(response.meta.page.total_pages);
        setCurrentPage(response.meta.page.number);
        // Use the correct total items from the API response (per API blueprint)
        const totalCount = response.meta.page.total_items || 0;
        setTotalRecords(totalCount);
      }
    } catch (error: any) {
      console.error('Error fetching people:', error);
      setError(error.message || 'Failed to load people');
      Alert.alert('Error', error.message || 'Failed to load people');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setCurrentPage(1);
    fetchPeople(searchQuery, 1, false);
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
      fetchPeople(text, 1, false);
    }, 500);
    
    setSearchTimeout(timeout);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    fetchPeople('', 1, false);
  };
  
  const handleLoadMore = () => {
    if (!loadingMore && currentPage < totalPages) {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      fetchPeople(searchQuery, nextPage, true, people);
    }
  };

  const renderPerson = ({ item }: { item: Person }) => {
    // Get email from user object in attributes
    const email = item.attributes.user?.email;
    
    // Find addresses from relationships and included data
    const addresses: Address[] = [];
    if (item.relationships?.addresses?.data) {
      item.relationships.addresses.data.forEach(rel => {
        const address = included.find(inc => inc.type === 'addresses' && inc.id === rel.id);
        if (address) addresses.push(address);
      });
    }
    
    const primaryAddress = getPrimaryAddress(addresses);
    const location = formatCityState(primaryAddress);

    return (
      <TouchableOpacity 
        style={styles.personItem}
        onPress={() => navigation.navigate('PersonDetails', { personId: item.id })}
      >
        <Text style={styles.personName}>{formatPersonName(item)}</Text>
        {email && <Text style={styles.personEmail}>{email}</Text>}
        {location && <Text style={styles.personLocation}>{location}</Text>}
        {item.attributes.membership_number && (
          <Text style={styles.membershipNumber}>
            Member #{item.attributes.membership_number}
          </Text>
        )}
        {membershipInfo[item.id] && membershipInfo[item.id].length > 0 && (
          <View style={styles.membershipList}>
            {membershipInfo[item.id].map((membership, index) => (
              <Text key={index} style={styles.membershipListItem}>
                • {membership.name} {membership.endDate && `(${new Date(membership.endDate).toLocaleDateString()})`}
              </Text>
            ))}
          </View>
        )}
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
            placeholder="Search people..."
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
          {people.length} of {totalRecords} {people.length === 1 && totalRecords === 1 ? 'person' : 'people'} shown
        </Text>
      </View>
      
      <FlatList
        data={people}
        renderItem={renderPerson}
        keyExtractor={(item, index) => `${item.id}-${index}`}
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
              {error ? error : 'No people found'}
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
  personItem: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  personName: {
    fontSize: theme.typography.fontSizes.md,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  personEmail: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  personLocation: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  membershipNumber: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontStyle: 'italic',
  },
  membershipList: {
    marginTop: theme.spacing.xs,
  },
  membershipListItem: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.primary,
    lineHeight: 20,
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