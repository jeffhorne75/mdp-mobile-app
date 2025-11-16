import { apiClient } from './client';
import { Connection, ApiResponse } from '../types/api';

export const connectionsApi = {
  // Get person's connections
  async getPersonConnections(personId: string, params?: {
    page_number?: number;
    page_size?: number;
    connection_type_eq?: 'person_to_organization' | 'person_to_person' | 'all';
    sort?: string;
  }): Promise<any> {
    const requestParams: Record<string, any> = {};
    
    // Transform page parameters
    if (params?.page_number) {
      requestParams['page[number]'] = params.page_number;
    }
    if (params?.page_size) {
      requestParams['page[size]'] = params.page_size;
    }
    
    // Add connection type filter
    if (params?.connection_type_eq) {
      requestParams['filter[connection_type_eq]'] = params.connection_type_eq;
    }
    
    // Add sort parameter
    if (params?.sort) {
      requestParams['sort'] = params.sort;
    }
    
    // Include related data
    requestParams['include'] = 'person,organization,to,from';
    
    const response = await apiClient.get<any>(`/people/${personId}/connections`, requestParams);
    console.log('Person connections response:', JSON.stringify(response, null, 2));
    return response;
  },

  // Get organization's connections
  async getOrganizationConnections(organizationId: string, params?: {
    page_number?: number;
    page_size?: number;
    connection_type_eq?: 'person_to_organization' | 'organization_to_organization' | 'all';
    sort?: string;
  }): Promise<any> {
    const requestParams: Record<string, any> = {};
    
    // Transform page parameters
    if (params?.page_number) {
      requestParams['page[number]'] = params.page_number;
    }
    if (params?.page_size) {
      requestParams['page[size]'] = params.page_size;
    }
    
    // Add connection type filter
    if (params?.connection_type_eq) {
      requestParams['filter[connection_type_eq]'] = params.connection_type_eq;
    }
    
    // Add sort parameter
    if (params?.sort) {
      requestParams['sort'] = params.sort;
    }
    
    // Include related data
    requestParams['include'] = 'person,organization,to,from';
    
    const response = await apiClient.get<any>(`/organizations/${organizationId}/connections`, requestParams);
    console.log('Organization connections response:', JSON.stringify(response, null, 2));
    return response;
  },
};