import { Address, Person, Organization } from '../types/api';

export const formatPersonName = (person: Person): string => {
  // Check if the person object has the expected properties
  if (!person || !person.attributes) {
    console.warn('formatPersonName: person or attributes is null/undefined', person);
    return 'Unknown Person';
  }
  
  const { given_name, family_name } = person.attributes;
  
  if (!given_name && !family_name) {
    console.warn('formatPersonName: Missing name properties. Available attributes:', Object.keys(person.attributes));
    return 'Unknown Person';
  }
  
  return `${family_name || ''}, ${given_name || ''}`;
};

export const formatAddress = (address?: Address): string => {
  if (!address || !address.attributes) return '';
  
  // If there's a pre-formatted address, use that
  if (address.attributes.formatted_address_label) {
    return address.attributes.formatted_address_label;
  }
  
  // Otherwise build the address from components
  const parts = [];
  
  if (address.attributes.address1) parts.push(address.attributes.address1);
  if (address.attributes.address2) parts.push(address.attributes.address2);
  
  // City, State ZIP
  const cityStateZip = [];
  if (address.attributes.city) cityStateZip.push(address.attributes.city);
  if (address.attributes.state_name) cityStateZip.push(address.attributes.state_name);
  if (address.attributes.zip_code) cityStateZip.push(address.attributes.zip_code);
  
  if (cityStateZip.length > 0) {
    parts.push(cityStateZip.join(', '));
  }
  
  if (address.attributes.country_name && address.attributes.country_name !== 'United States') {
    parts.push(address.attributes.country_name);
  }
  
  return parts.join('\n');
};

export const formatCityState = (address?: Address): string => {
  if (!address || !address.attributes) return '';
  
  const parts = [];
  
  if (address.attributes.city) parts.push(address.attributes.city);
  if (address.attributes.state_name) parts.push(address.attributes.state_name);
  
  return parts.join(', ');
};

export const getPrimaryAddress = (addresses?: Address[]): Address | undefined => {
  if (!addresses || addresses.length === 0) return undefined;
  
  // First try to find an address marked as primary
  const primaryAddress = addresses.find(addr => addr.attributes?.primary === true);
  
  // If no primary address, return the first one
  return primaryAddress || addresses[0];
};

export const getActiveMemberships = (memberships?: any[]): any[] => {
  if (!memberships) return [];
  
  return memberships.filter(m => m.status === 'active' || m.status === 'Active');
};

export const formatMembershipCount = (memberships?: any[]): string => {
  const active = getActiveMemberships(memberships);
  
  if (active.length === 0) return 'No active memberships';
  if (active.length === 1) return '1 active membership';
  return `${active.length} active memberships`;
};

export const formatGender = (gender?: string): string => {
  if (!gender) return '';
  
  const genderLabels: { [key: string]: string } = {
    'male': 'Male',
    'female': 'Female',
    'man': 'Man',
    'woman': 'Woman',
    'non-binary': 'Non-binary',
    'other': 'Other',
    'prefer-not-to-say': 'Prefer not to say',
    'agender': 'Agender',
    'genderfluid': 'Gender fluid',
    'genderqueer': 'Genderqueer',
    'questioning': 'Questioning',
    'two-spirit': 'Two-spirit'
  };
  
  return genderLabels[gender.toLowerCase()] || gender;
};

export const formatPronoun = (pronoun?: string): string => {
  if (!pronoun) return '';
  
  const pronounLabels: { [key: string]: string } = {
    'he-him-his': 'He/Him/His',
    'she-her-hers': 'She/Her/Hers',
    'they-them-theirs': 'They/Them/Theirs',
    'xe-xir-xirs': 'Xe/Xir/Xirs',
    'ze-zir-zirs': 'Ze/Zir/Zirs',
    'prefer-not-to-say': 'Prefer not to say',
    'ask-me': 'Ask me'
  };
  
  return pronounLabels[pronoun.toLowerCase()] || pronoun.replace(/-/g, '/');
};

export const formatBirthDate = (birthDate?: string): string => {
  if (!birthDate) return '';
  
  try {
    const date = new Date(birthDate);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  } catch (error) {
    return birthDate;
  }
};

export const calculateAge = (birthDate?: string): number | null => {
  if (!birthDate) return null;
  
  try {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  } catch (error) {
    return null;
  }
};