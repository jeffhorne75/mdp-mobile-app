// API Response Types

export interface AddressAttributes {
  type: string;
  company_name?: string;
  city?: string;
  zip_code?: string;
  address1?: string;
  address2?: string;
  state_name?: string;
  country_code?: string;
  country_name?: string;
  formatted_address_label?: string;
  latitude?: string;
  longitude?: string;
  active?: boolean;
  primary?: boolean;
  consent?: boolean;
  consent_third_party?: boolean;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Address {
  id: string;
  type: 'addresses';
  attributes: AddressAttributes;
  relationships?: any;
}

export interface PhoneAttributes {
  type?: string;
  phone_number?: string;
  number?: string;
  number_national_format?: string;
  number_international_format?: string;
  extension?: string;
  country_code_number?: number;
  phone_number_canonical?: string;
  formatted?: string;
  active?: boolean;
  primary?: boolean;
  primary_sms?: boolean;
  consent?: boolean;
  consent_third_party?: boolean;
  consent_directory?: boolean;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Phone {
  id: string;
  type: 'phones';
  attributes: PhoneAttributes;
  relationships?: any;
}

export interface EmailAttributes {
  type?: string;
  email?: string;
  address?: string;
  localpart?: string;
  domain?: string;
  unique?: boolean;
  active?: boolean;
  primary?: boolean;
  consent?: boolean;
  consent_third_party?: boolean;
  consent_directory?: boolean;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Email {
  id: string;
  type: 'emails';
  attributes: EmailAttributes;
  relationships?: any;
}

export interface WebAddressAttributes {
  type?: string;
  url?: string;
  address?: string;
  label?: string;
  active?: boolean;
  primary?: boolean;
  consent?: boolean;
  consent_third_party?: boolean;
  consent_directory?: boolean;
  data?: any;
  uuid?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface WebAddress {
  id: string;
  type: 'web_addresses';
  attributes: WebAddressAttributes;
  relationships?: any;
}

export interface ConnectionAttributes {
  description?: string;
  connection_type?: 'person_to_person' | 'person_to_organization';
  starts_at?: string;
  ends_at?: string;
  type: string;
  tags?: string[];
  uuid?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConnectionRelationships {
  person?: {
    data: {
      type: 'people';
      id: string;
    };
  };
  organization?: {
    data: {
      type: 'organizations';
      id: string;
    };
  };
  to?: {
    data: {
      type: 'people' | 'organizations';
      id: string;
    };
  };
  from?: {
    data: {
      type: 'people' | 'organizations';
      id: string;
    };
  };
}

export interface Connection {
  id: string;
  type: 'connections';
  attributes: ConnectionAttributes;
  relationships: ConnectionRelationships;
}

export interface Membership {
  id: string;
  membership_type: string;
  status: string;
  start_date: string;
  end_date?: string;
  organization?: {
    id: string;
    name: string;
  };
}

export interface MembershipEntryAttributes {
  starts_at: string;
  ends_at: string;
  expires_at?: string;
  grace_period_days?: number;
  in_grace?: boolean;
  status: string;
  active: boolean;
  data?: any;
  external_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  membership_category?: string;
}

export interface MembershipEntryRelationships {
  membership?: {
    data: {
      id: string;
      type: string;
    };
  };
  person?: {
    data: {
      id: string;
      type: string;
    };
  };
  organization_membership?: {
    data: {
      id: string;
      type: string;
    };
  };
  fusebill_subscription?: {
    data: {
      id: string;
      type: string;
    };
  };
}

export interface MembershipEntry {
  id: string;
  type: string;
  attributes: MembershipEntryAttributes;
  relationships?: MembershipEntryRelationships;
}

export interface MembershipData {
  id: string;
  type: string;
  attributes: {
    type: string;
    name?: string;
    [key: string]: any;
  };
}

export interface PersonAttributes {
  given_name: string;
  family_name: string;
  full_name?: string;
  additional_name?: string;
  alternate_name?: string;
  identifying_number?: number;
  slug?: string;
  gender?: string;
  honorific_prefix?: string;
  honorific_suffix?: string;
  preferred_pronoun?: string;
  job_title?: string;
  birth_date?: string;
  language?: string;
  languages_spoken?: string[];
  languages_written?: string[];
  data_fields?: any[];
  uuid: string;
  created_at: string;
  updated_at: string;
  membership_number?: string;
  membership_began_on?: string;
  tags?: string[];
  data?: any;
  role_names?: string[];
  user?: {
    email?: string;
    username?: string;
    reset_password_sent_at?: string;
    confirmation_sent_at?: string;
    confirmed_at?: string;
  };
}

export interface PersonRelationships {
  phones?: { data: Array<{ id: string; type: string }> };
  emails?: { data: Array<{ id: string; type: string }> };
  addresses?: { data: Array<{ id: string; type: string }> };
  web_addresses?: { data: Array<{ id: string; type: string }> };
  orders?: { data: Array<{ id: string; type: string }> };
  groups?: { data: Array<{ id: string; type: string }> };
  roles?: { data: Array<{ id: string; type: string }> };
  touchpoints?: { links?: { related: string } };
  comments?: { links?: { related: string }; meta?: { total_count: number } };
  pinned_comments?: { data: Array<{ id: string; type: string }> };
}

export interface Person {
  id: string;
  type: 'people';
  attributes: PersonAttributes;
  relationships?: PersonRelationships;
  touchpoints?: Touchpoint[];
}

export interface OrganizationAttributes {
  type: string;
  legal_name: string;
  legal_name_en?: string;
  legal_name_fr?: string;
  legal_name_es?: string;
  alternate_name?: string;
  alternate_name_en?: string;
  alternate_name_fr?: string;
  alternate_name_es?: string;
  description?: string;
  description_en?: string;
  description_fr?: string;
  description_es?: string;
  identifying_number?: number;
  data_fields?: any[];
  uuid: string;
  created_at: string;
  updated_at: string;
  slug?: string;
  destroyable?: boolean;
  ancestry?: number;
  people_count?: number;
  duns?: string;
  assignable_role_names?: string[];
  tags?: string[];
  data?: any;
  membership_number?: string;
  membership_began_on?: string;
  inheritable_from_parent?: any[];
  inherits_from_parent?: any;
}

export interface OrganizationRelationships {
  addresses?: { data: Array<{ id: string; type: string }> };
  child_organizations?: { meta?: any };
  comments?: { links?: { related: string }; meta?: { total_count: number } };
  connections?: { links?: { related: string } };
  emails?: { data: Array<{ id: string; type: string }> };
  json_schemas_available?: { data: Array<{ id: string; type: string }> };
  parent_organization?: { data: Array<{ id: string; type: string }> };
  phones?: { data: Array<{ id: string; type: string }> };
  pinned_comments?: { data: Array<{ id: string; type: string }> };
  roles?: { data: Array<{ id: string; type: string }> };
  web_addresses?: { data: Array<{ id: string; type: string }> };
}

export interface Organization {
  id: string;
  type: 'organizations';
  attributes: OrganizationAttributes;
  meta?: {
    ancestry_depth?: number;
  };
  relationships?: OrganizationRelationships;
}

export interface TouchpointAttributes {
  action: string;
  details?: string;
  code?: string;
  uuid?: string;
  created_at: string;
  updated_at?: string;
  data?: any;
}

export interface Touchpoint {
  id: string;
  type: 'touchpoints';
  attributes: TouchpointAttributes;
  relationships?: {
    person?: {
      data: {
        id: string;
        type: 'people';
      };
    };
    service?: {
      data: {
        id: string;
        type: 'services';
      };
    };
  };
}

// API Request Types
export interface CreateTouchpointRequest {
  type: string;
  subject?: string;
  notes?: string;
  person_id: string;
}

// API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  included?: any[];
  links?: {
    first?: string;
    prev?: string;
    self?: string;
    next?: string;
    last?: string;
  };
  meta?: {
    page?: {
      total_items: number;
      total_pages: number;
      number: number;
      size: number;
    };
  };
}

// Error Response
export interface ApiError {
  error: string;
  message: string;
  status: number;
}

// Resource Type
export interface ResourceType {
  id: string;
  type: string;
  attributes: {
    uuid: string;
    slug: string;
    name: string;
    name_en: string;
    name_fr: string;
    name_es: string;
    default: boolean;
    weight: number;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
    available_for_entity: string;
    external_id: string | null;
    resource_type: string;
    supports_available_for_entity: boolean;
  };
}