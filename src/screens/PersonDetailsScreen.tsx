import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { theme } from '../theme';
import { peopleApi } from '../api';
import { Person, Address, Phone, Email, WebAddress, Touchpoint } from '../types/api';
import {
  formatPersonName,
  formatAddress,
  formatGender,
  formatPronoun,
  formatBirthDate,
  calculateAge,
} from '../utils/formatters';
import { PersonMembershipInfo } from '../components/PersonMembershipInfo';
import { ContactInformation } from '../components/ContactInformation';
import { PersonRelationships } from '../components/PersonRelationships';
import { PersonTouchpoints } from '../components/PersonTouchpoints';
import { SystemInformationDrawer } from '../components/SystemInformationDrawer';
import { ActiveMemberBadge } from '../components/ActiveMemberBadge';

type PersonDetailsScreenRouteProp = RouteProp<
  { PersonDetails: { personId: string } },
  'PersonDetails'
>;

interface PersonDetailsScreenProps {
  route: PersonDetailsScreenRouteProp;
}

export const PersonDetailsScreen: React.FC<PersonDetailsScreenProps> = ({
  route,
}) => {
  const { personId } = route.params;
  const [person, setPerson] = useState<Person | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [webAddresses, setWebAddresses] = useState<WebAddress[]>([]);
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [touchpointsIncludedData, setTouchpointsIncludedData] = useState<any[]>([]);
  const [includedData, setIncludedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);

  useEffect(() => {
    fetchPersonDetails();
  }, [personId]);

  const fetchPersonDetails = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);
      
      // Get the full response to access included data
      const response = await peopleApi.getById(personId);
      console.log('Fetched person data:', JSON.stringify(response, null, 2));
      
      // Handle both wrapped and unwrapped responses
      const personData = response.data || response;
      const included = response.included || [];
      
      setPerson(personData);
      setIncludedData(included);
      
      // Extract related data from included array
      const addressData: Address[] = [];
      const phoneData: Phone[] = [];
      const emailData: Email[] = [];
      const webAddressData: WebAddress[] = [];
      
      included.forEach((item: any) => {
        console.log('Processing included item:', { 
          type: item.type, 
          id: item.id,
          attributes: item.attributes 
        });
        switch (item.type) {
          case 'addresses':
            addressData.push(item);
            break;
          case 'phones':
            phoneData.push(item);
            break;
          case 'emails':
            emailData.push(item);
            break;
          case 'web_addresses':
            webAddressData.push(item);
            break;
          default:
            console.log('Unhandled type in included:', item.type);
        }
      });
      
      setAddresses(addressData);
      setPhones(phoneData);
      setEmails(emailData);
      setWebAddresses(webAddressData);
      
      // Debug logging
      console.log('Emails found:', emailData);
      console.log('Phones found:', phoneData);
      console.log('Addresses found:', addressData);
      console.log('Web addresses found:', webAddressData);
      
      // Check for active membership
      try {
        const membershipResponse = await peopleApi.getMemberships(personId, {
          page_number: 1,
          page_size: 50,
        });
        
        if (membershipResponse.data && membershipResponse.data.length > 0) {
          const hasActive = membershipResponse.data.some((entry: any) => 
            entry.attributes?.status === 'Active'
          );
          setHasActiveMembership(hasActive);
        }
      } catch (membershipError) {
        console.error('Error checking membership status:', membershipError);
      }
      
      // Fetch touchpoints
      try {
        const touchpointsResponse = await peopleApi.getTouchpoints(personId, {
          page_number: 1,
          page_size: 20, // Fetch up to 20 touchpoints
        });
        
        if (touchpointsResponse.data) {
          setTouchpoints(touchpointsResponse.data);
          // Store included data from touchpoints response (contains service information)
          setTouchpointsIncludedData(touchpointsResponse.included || []);
        }
      } catch (touchpointsError) {
        console.error('Error fetching touchpoints:', touchpointsError);
      }
      
    } catch (error: any) {
      console.error('Error fetching person details:', error);
      setError(error.message || 'Failed to load person details');
      Alert.alert('Error', error.message || 'Failed to load person details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPersonDetails();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading person details...</Text>
      </View>
    );
  }

  if (error || !person) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Person not found'}
        </Text>
      </View>
    );
  }

  
  // Transform contact data for ContactInformation component
  const transformedEmails = emails.map(email => ({
    id: email.id,
    value: email.attributes.address || email.attributes.email || '', // API returns 'address' field
    primary: email.attributes.primary || false,
    type: email.attributes.type || 'Email'
  }));
  
  // Include user email if no emails are found in relationships
  if (transformedEmails.length === 0 && person?.attributes?.user?.email) {
    transformedEmails.push({
      id: 'user-email',
      value: person.attributes.user.email,
      primary: true,
      type: 'User Email'
    });
  }
  
  const transformedPhones = phones.map(phone => ({
    id: phone.id,
    value: phone.attributes.number_national_format || phone.attributes.number_international_format || phone.attributes.number || phone.attributes.formatted || phone.attributes.phone_number || '',
    primary: phone.attributes.primary || false,
    type: phone.attributes.type || 'Phone'
  }));
  
  const transformedAddresses = addresses.map(addr => ({
    id: addr.id,
    value: formatAddress(addr),
    primary: addr.attributes.primary || false,
    type: addr.attributes.type || 'Address'
  }));
  
  const transformedWebAddresses = webAddresses.map(web => ({
    id: web.id,
    value: web.attributes.address || web.attributes.url || '', // API returns 'address' field
    label: web.attributes.label,
    primary: web.attributes.primary || false,
    type: web.attributes.type || 'Website'
  }));

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={theme.colors.primary}
          colors={[theme.colors.primary]}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{formatPersonName(person)}</Text>
          {hasActiveMembership && (
            <ActiveMemberBadge size="medium" />
          )}
        </View>
      </View>

      <ContactInformation 
        emails={transformedEmails}
        phones={transformedPhones}
        addresses={transformedAddresses}
        webAddresses={transformedWebAddresses}
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Information</Text>
        
        <View style={styles.profileGrid}>
          {person.attributes?.job_title && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Job Title</Text>
              <Text style={styles.fieldValue}>{person.attributes.job_title}</Text>
            </View>
          )}
          
          {person.attributes?.gender && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <Text style={styles.fieldValue}>{formatGender(person.attributes.gender)}</Text>
            </View>
          )}
          
          {person.attributes?.birth_date && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Birth Date</Text>
              <Text style={styles.fieldValue}>{formatBirthDate(person.attributes.birth_date)}</Text>
            </View>
          )}
          
          {person.attributes?.preferred_pronoun && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Pronouns</Text>
              <Text style={styles.fieldValue}>{formatPronoun(person.attributes.preferred_pronoun)}</Text>
            </View>
          )}
          
          {person.attributes?.birth_date && calculateAge(person.attributes.birth_date) !== null && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Age</Text>
              <Text style={styles.fieldValue}>{calculateAge(person.attributes.birth_date)} years</Text>
            </View>
          )}
        </View>
      </View>


      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Membership Information</Text>
        <PersonMembershipInfo 
          personId={personId} 
          membershipNumber={person.attributes?.membership_number}
          membershipBeganOn={person.attributes?.membership_began_on}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Relationships</Text>
        <PersonRelationships personId={personId} />
      </View>

      {person.attributes?.tags && person.attributes.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagsContainer}>
            {person.attributes?.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <PersonTouchpoints touchpoints={touchpoints} includedData={touchpointsIncludedData} />
      </View>

      <View style={[styles.section, { marginBottom: theme.spacing.lg }]}>
        <SystemInformationDrawer
          uuid={person.attributes?.uuid}
          createdAt={person.attributes?.created_at}
          updatedAt={person.attributes?.updated_at}
        />
      </View>
    </ScrollView>
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
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.textLight,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.xl,
  },
  errorText: {
    fontSize: theme.typography.fontSizes.md,
    color: theme.colors.error,
    textAlign: 'center',
  },
  header: {
    backgroundColor: theme.colors.white,
    padding: theme.spacing.lg,
    margin: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  name: {
    fontSize: theme.typography.fontSizes.xl,
    fontWeight: theme.typography.fontWeights.bold,
    color: theme.colors.text,
    flex: 1,
  },
  section: {
    backgroundColor: theme.colors.white,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.lg,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSizes.lg,
    fontWeight: theme.typography.fontWeights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    paddingBottom: theme.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  field: {
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
});