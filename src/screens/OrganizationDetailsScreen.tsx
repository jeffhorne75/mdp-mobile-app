import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { organizationsApi } from '../api';
import { Organization, Address, Phone, Email, WebAddress } from '../types/api';
import {
  formatAddress,
  getPrimaryAddress,
} from '../utils/formatters';
import { ContactInformation } from '../components/ContactInformation';
import { OrganizationMembershipInfo } from '../components/OrganizationMembershipInfo';
import { OrganizationRelationships } from '../components/OrganizationRelationships';
import { OrganizationTouchpoints } from '../components/OrganizationTouchpoints';
import { SystemInformationDrawer } from '../components/SystemInformationDrawer';
import { ActiveMemberBadge } from '../components/ActiveMemberBadge';
import { useResourceTypes } from '../contexts/ResourceTypesContext';
import { CollapsibleSection } from '../components/CollapsibleSection';
import { useSectionCollapse } from '../contexts/SectionCollapseContext';

type OrganizationDetailsScreenRouteProp = RouteProp<
  { OrganizationDetails: { organizationId: string } },
  'OrganizationDetails'
>;

interface OrganizationDetailsScreenProps {
  route: OrganizationDetailsScreenRouteProp;
}

export const OrganizationDetailsScreen: React.FC<OrganizationDetailsScreenProps> = ({
  route,
}) => {
  const navigation = useNavigation<any>();
  const { organizationId } = route.params;
  const { toggleSection, isSectionCollapsed } = useSectionCollapse();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [phones, setPhones] = useState<Phone[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);
  const [webAddresses, setWebAddresses] = useState<WebAddress[]>([]);
  const [_includedData, setIncludedData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [hasActiveMembership, setHasActiveMembership] = useState(false);
  const [parentOrganization, setParentOrganization] = useState<Organization | null>(null);
  const { getOrganizationTypeLabel, getOrganizationStatusLabel } = useResourceTypes();

  useEffect(() => {
    fetchOrganizationDetails();
  }, [organizationId]);

  const fetchOrganizationDetails = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);
      
      // Get the full response to access included data
      const response = await organizationsApi.getById(organizationId);
      console.log('Fetched organization data:', JSON.stringify(response, null, 2));
      
      // Handle the wrapped response
      const organizationData = response.data;
      const included = response.included || [];
      
      setOrganization(organizationData);
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
      
      // Check for parent organization
      console.log('Checking for parent organization in relationships:', organizationData.relationships);
      
      let parentId = null;
      if (organizationData.relationships?.parent_organization?.data) {
        // Handle both single object and array formats
        if (Array.isArray(organizationData.relationships.parent_organization.data)) {
          if (organizationData.relationships.parent_organization.data.length > 0) {
            parentId = organizationData.relationships.parent_organization.data[0].id;
          }
        } else {
          // Single object format
          parentId = organizationData.relationships.parent_organization.data.id;
        }
      }
      
      if (parentId) {
        console.log('Found parent organization ID:', parentId);
        const parentFromIncluded = included.find((item: any) => item.type === 'organizations' && item.id === parentId);
        
        if (parentFromIncluded) {
          console.log('Found parent in included data:', parentFromIncluded.attributes?.legal_name);
          setParentOrganization(parentFromIncluded);
        } else {
          console.log('Parent not in included data, fetching separately...');
          // Try to fetch parent organization separately if not in included
          try {
            const parentResponse = await organizationsApi.getById(parentId);
            const parentData = parentResponse.data;
            console.log('Fetched parent organization:', parentData.attributes?.legal_name);
            setParentOrganization(parentData);
          } catch (parentError) {
            console.error('Error fetching parent organization:', parentError);
          }
        }
      } else {
        console.log('No parent organization found in relationships');
      }
      
      // Check for active membership
      try {
        const membershipResponse = await organizationsApi.getMemberships(organizationId, {
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
      
    } catch (error: any) {
      console.error('Error fetching organization details:', error);
      setError(error.message || 'Failed to load organization details');
      Alert.alert('Error', error.message || 'Failed to load organization details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrganizationDetails();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading organization details...</Text>
      </View>
    );
  }

  if (error || !organization) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || 'Organization not found'}
        </Text>
      </View>
    );
  }

  
  // Transform contact data for ContactInformation component
  const transformedEmails = emails.map(email => ({
    id: email.id,
    value: email.attributes.address || email.attributes.email || '',
    primary: email.attributes.primary || false,
    type: email.attributes.type || 'Email'
  }));
  
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
    value: web.attributes.address || web.attributes.url || '',
    label: web.attributes.label,
    primary: web.attributes.primary || false,
    type: web.attributes.type || 'Website'
  }));

  const organizationTypeLabel = getOrganizationTypeLabel(organization.attributes.type);
  const organizationStatusLabel = organization.attributes.status ? getOrganizationStatusLabel(organization.attributes.status) : '';

  return (
    <View style={styles.container}>
      <View style={styles.stickyHeader}>
        <View style={styles.nameContainer}>
          <Text style={styles.name}>{organization.attributes.legal_name}</Text>
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
        isCollapsed={isSectionCollapsed('organization', 'contactInfo')}
        onToggle={() => toggleSection('organization', 'contactInfo')}
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
        isCollapsed={isSectionCollapsed('organization', 'attributes')}
        onToggle={() => toggleSection('organization', 'attributes')}
      >
        <View style={styles.profileGrid}>
          {organizationTypeLabel && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Type</Text>
              <Text style={styles.fieldValue}>{organizationTypeLabel}</Text>
            </View>
          )}
          
          {organization.attributes?.alternate_name && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Alternate Name</Text>
              <Text style={styles.fieldValue}>{organization.attributes.alternate_name}</Text>
            </View>
          )}
          
          {parentOrganization && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Parent Organization</Text>
              <TouchableOpacity
                onPress={() => navigation.push('OrganizationDetails', { organizationId: parentOrganization.id })}
              >
                <Text style={[styles.fieldValue, styles.linkText]}>
                  {parentOrganization.attributes?.legal_name || 'Parent Organization'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          
          {organization.attributes?.status && (
            <View style={styles.gridField}>
              <Text style={styles.fieldLabel}>Status</Text>
              <Text style={styles.fieldValue}>{organizationStatusLabel}</Text>
            </View>
          )}
          
          {organization.attributes?.description && (
            <View style={styles.fullWidthField}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={styles.fieldValue}>{organization.attributes.description}</Text>
            </View>
          )}
        </View>
      </CollapsibleSection>

      <CollapsibleSection
        title="Membership Information"
        isCollapsed={isSectionCollapsed('organization', 'membershipInfo')}
        onToggle={() => toggleSection('organization', 'membershipInfo')}
      >
        <OrganizationMembershipInfo 
          organizationId={organizationId} 
          membershipNumber={organization.attributes?.identifying_number?.toString()}
          membershipBeganOn={organization.attributes?.membership_began_on}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Relationships"
        isCollapsed={isSectionCollapsed('organization', 'relationships')}
        onToggle={() => toggleSection('organization', 'relationships')}
      >
        <OrganizationRelationships organizationId={organizationId} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Touchpoints"
        isCollapsed={isSectionCollapsed('organization', 'touchpoints')}
        onToggle={() => toggleSection('organization', 'touchpoints')}
      >
        <OrganizationTouchpoints organizationId={organizationId} />
      </CollapsibleSection>

      {organization.attributes?.tags && organization.attributes.tags.length > 0 && (
        <CollapsibleSection
          title="Tags"
          isCollapsed={isSectionCollapsed('organization', 'tags')}
          onToggle={() => toggleSection('organization', 'tags')}
        >
          <View style={styles.tagsContainer}>
            {organization.attributes?.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </CollapsibleSection>
      )}

      <CollapsibleSection
        title="System Information"
        isCollapsed={isSectionCollapsed('organization', 'systemInfo')}
        onToggle={() => toggleSection('organization', 'systemInfo')}
      >
        <SystemInformationDrawer
          uuid={organization.attributes?.uuid}
          createdAt={organization.attributes?.created_at}
          updatedAt={organization.attributes?.updated_at}
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
  organizationType: {
    fontSize: theme.typography.fontSizes.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
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
  fullWidthField: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  linkText: {
    color: theme.colors.primary,
    textDecorationLine: 'underline',
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