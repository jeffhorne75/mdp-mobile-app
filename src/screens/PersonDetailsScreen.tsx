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
import { peopleApi, resourceTypesApi } from '../api';
import { Person, Address, Phone, Email, WebAddress, Touchpoint, ResourceType } from '../types/api';
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
import { CollapsibleSection } from '../components/CollapsibleSection';
import { useSectionCollapse } from '../contexts/SectionCollapseContext';

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
  const { toggleSection, isSectionCollapsed } = useSectionCollapse();
  const [person, setPerson] = useState<Person | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [webAddresses, setWebAddresses] = useState<WebAddress[]>([]);
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>([]);
  const [touchpointsIncludedData, setTouchpointsIncludedData] = useState<any[]>([]);
  const [_includedData, setIncludedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [resourceTypes, setResourceTypes] = useState<{
    personTypes: ResourceType[];
    personStatuses: ResourceType[];
    jobFunctions: ResourceType[];
    jobLevels: ResourceType[];
    pronouns: ResourceType[];
    genders: ResourceType[];
  }>({ personTypes: [], personStatuses: [], jobFunctions: [], jobLevels: [], pronouns: [], genders: [] });

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
      
      // Fetch resource types for lookups
      try {
        // Clear cache to ensure fresh data
        resourceTypesApi.clearCache();
        
        const [personTypes, personStatuses, jobFunctions, jobLevels, pronouns, genders] = await Promise.all([
          resourceTypesApi.getPersonTypes(),
          resourceTypesApi.getPersonStatuses(),
          resourceTypesApi.getJobFunctions(),
          resourceTypesApi.getJobLevels(),
          resourceTypesApi.getPronouns(),
          resourceTypesApi.getGenders(),
        ]);
        
        
        console.log('Resource Types Debug:', {
          personTypes: personTypes.data?.filter(rt => rt && rt.attributes).map(rt => ({ slug: rt.attributes.slug, name_en: rt.attributes.name_en })),
          personStatuses: personStatuses.data?.filter(rt => rt && rt.attributes).map(rt => ({ slug: rt.attributes.slug, name_en: rt.attributes.name_en })),
          jobFunctions: jobFunctions.data?.filter(rt => rt && rt.attributes).map(rt => ({ slug: rt.attributes.slug, name_en: rt.attributes.name_en })),
          jobLevels: jobLevels.data?.filter(rt => rt && rt.attributes).map(rt => ({ slug: rt.attributes.slug, name_en: rt.attributes.name_en })),
          pronouns: pronouns.data?.filter(rt => rt && rt.attributes).map(rt => ({ slug: rt.attributes.slug, name_en: rt.attributes.name_en })),
          genders: genders.data?.filter(rt => rt && rt.attributes).map(rt => ({ slug: rt.attributes.slug, name_en: rt.attributes.name_en })),
        });
        
        console.log('Person attribute values:', {
          person_type: person?.attributes?.person_type,
          status: person?.attributes?.status,
          job_function: person?.attributes?.job_function,
          job_level: person?.attributes?.job_level,
          preferred_pronoun: person?.attributes?.preferred_pronoun,
          gender: person?.attributes?.gender,
        });
        
        setResourceTypes({
          personTypes: personTypes.data?.filter(rt => rt && rt.attributes) || [],
          personStatuses: personStatuses.data?.filter(rt => rt && rt.attributes) || [],
          jobFunctions: jobFunctions.data?.filter(rt => rt && rt.attributes) || [],
          jobLevels: jobLevels.data?.filter(rt => rt && rt.attributes) || [],
          pronouns: pronouns.data?.filter(rt => rt && rt.attributes) || [],
          genders: genders.data?.filter(rt => rt && rt.attributes) || [],
        });
      } catch (resourceError) {
        console.error('Error fetching resource types:', resourceError);
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

  // Helper function to get display name for resource type
  const getResourceTypeName = (value: string | undefined, resourceTypeList: ResourceType[]): string | undefined => {
    if (!value) return undefined;
    console.log(`Looking up resource type: "${value}" in list with ${resourceTypeList.length} items`);
    const resource = resourceTypeList.find(rt => rt.attributes.slug === value);
    
    if (!resource) {
      console.log(`No match found for "${value}". Available slugs:`, resourceTypeList.map(rt => rt.attributes.slug));
      return value;
    }
    
    // Try to get the best available name, preferring English
    const name = resource.attributes.name_en || 
                 resource.attributes.name || 
                 resource.attributes.name_fr || 
                 resource.attributes.name_es ||
                 resource.attributes.slug;
    
    console.log(`Found match for "${value}": "${name}"`);
    return name || value;
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
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{formatPersonName(person)}</Text>
          {hasActiveMembership && (
            <ActiveMemberBadge size="medium" />
          )}
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >

      <CollapsibleSection
        title="Contact Information"
        isCollapsed={isSectionCollapsed('person', 'contactInfo')}
        onToggle={() => toggleSection('person', 'contactInfo')}
      >
        <ContactInformation 
          emails={transformedEmails}
          phones={transformedPhones}
          addresses={transformedAddresses}
          webAddresses={transformedWebAddresses}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Profile Information"
        isCollapsed={isSectionCollapsed('person', 'attributes')}
        onToggle={() => toggleSection('person', 'attributes')}
      >
        <View style={styles.profileGrid}>
          {person.attributes?.honorific_prefix && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Salutation</Text>
              <Text style={styles.fieldValue}>{person.attributes.honorific_prefix}</Text>
            </View>
          )}
          
          {person.attributes?.alternate_name && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Alternate Name</Text>
              <Text style={styles.fieldValue}>{person.attributes.alternate_name}</Text>
            </View>
          )}
          
          {person.attributes?.maiden_name && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Maiden Name</Text>
              <Text style={styles.fieldValue}>{person.attributes.maiden_name}</Text>
            </View>
          )}
          
          {person.attributes?.middle_name && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Middle Name(s)/Initial(s)</Text>
              <Text style={styles.fieldValue}>{person.attributes.middle_name}</Text>
            </View>
          )}
          
          {person.attributes?.honorific_suffix && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Suffix</Text>
              <Text style={styles.fieldValue}>{person.attributes.honorific_suffix}</Text>
            </View>
          )}
          
          {person.attributes?.post_nominal && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Post-nominal</Text>
              <Text style={styles.fieldValue}>{person.attributes.post_nominal}</Text>
            </View>
          )}
          
          {person.attributes?.nickname && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Nickname</Text>
              <Text style={styles.fieldValue}>{person.attributes.nickname}</Text>
            </View>
          )}
          
          {person.attributes?.preferred_pronoun && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Pronouns</Text>
              <Text style={styles.fieldValue}>
                {getResourceTypeName(person.attributes.preferred_pronoun, resourceTypes.pronouns) || formatPronoun(person.attributes.preferred_pronoun)}
              </Text>
            </View>
          )}
          
          {person.attributes?.gender && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Gender</Text>
              <Text style={styles.fieldValue}>
                {getResourceTypeName(person.attributes.gender, resourceTypes.genders) || formatGender(person.attributes.gender)}
              </Text>
            </View>
          )}
          
          {person.attributes?.birth_date && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Birth Date</Text>
              <Text style={styles.fieldValue}>{formatBirthDate(person.attributes.birth_date)}</Text>
            </View>
          )}
          
          {person.attributes?.birth_date && calculateAge(person.attributes.birth_date) !== null && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Age</Text>
              <Text style={styles.fieldValue}>{calculateAge(person.attributes.birth_date)} years</Text>
            </View>
          )}
          
          {person.attributes?.person_type && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Person Type</Text>
              <Text style={styles.fieldValue}>
                {getResourceTypeName(person.attributes.person_type, resourceTypes.personTypes) || person.attributes.person_type}
              </Text>
            </View>
          )}
          
          {person.attributes?.status && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>
                {getResourceTypeName(person.attributes.status, resourceTypes.personStatuses) || person.attributes.status}
              </Text>
            </View>
          )}
          
          {person.attributes?.job_title && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Title</Text>
              <Text style={styles.fieldValue}>{person.attributes.job_title}</Text>
            </View>
          )}
          
          {person.attributes?.job_function && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Job Function</Text>
              <Text style={styles.fieldValue}>
                {getResourceTypeName(person.attributes.job_function, resourceTypes.jobFunctions) || person.attributes.job_function}
              </Text>
            </View>
          )}
          
          {person.attributes?.job_level && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Job Level</Text>
              <Text style={styles.fieldValue}>
                {getResourceTypeName(person.attributes.job_level, resourceTypes.jobLevels) || person.attributes.job_level}
              </Text>
            </View>
          )}
        </View>
      </CollapsibleSection>

      <CollapsibleSection
        title="Membership Information"
        isCollapsed={isSectionCollapsed('person', 'membershipInfo')}
        onToggle={() => toggleSection('person', 'membershipInfo')}
      >
        <PersonMembershipInfo 
          personId={personId} 
          membershipNumber={person.attributes?.membership_number}
          membershipBeganOn={person.attributes?.membership_began_on}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Relationships"
        isCollapsed={isSectionCollapsed('person', 'relationships')}
        onToggle={() => toggleSection('person', 'relationships')}
      >
        <PersonRelationships personId={personId} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Touchpoints"
        isCollapsed={isSectionCollapsed('person', 'touchpoints')}
        onToggle={() => toggleSection('person', 'touchpoints')}
      >
        <PersonTouchpoints touchpoints={touchpoints} includedData={touchpointsIncludedData} />
      </CollapsibleSection>

      {person.attributes?.tags && person.attributes.tags.length > 0 && (
        <CollapsibleSection
          title="Tags"
          isCollapsed={isSectionCollapsed('person', 'tags')}
          onToggle={() => toggleSection('person', 'tags')}
        >
          <View style={styles.tagsContainer}>
            {person.attributes?.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="System Information"
        isCollapsed={isSectionCollapsed('person', 'systemInfo')}
        onToggle={() => toggleSection('person', 'systemInfo')}
      >
        <SystemInformationDrawer
          uuid={person.attributes?.uuid}
          createdAt={person.attributes?.created_at}
          updatedAt={person.attributes?.updated_at}
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
});