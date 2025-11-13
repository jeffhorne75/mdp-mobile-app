import { apiClient } from './client';
import { Person, ApiResponse } from '../types/api';

export const peopleApi = {
  // Get list of people with optional filters
  async getList(params?: {
    page_number?: number;
    page_size?: number;
    search_matcher?: string;
    filter_value?: string;
    sort?: string;
    attribute?: string;
    include?: string[];
  }): Promise<ApiResponse<Person[]>> {
    // Include addresses by default (memberships might be causing the 500 error)
    const includeParam = params?.include || ['addresses'];
    
    // Transform parameters to match API expectations
    const requestParams: Record<string, any> = {
      ...params,
      include: includeParam.join(','),
    };

    // Transform page_number to page[number] and page_size to page[size]
    if (params?.page_number) {
      requestParams['page[number]'] = params.page_number;
      delete requestParams.page_number;
    }
    if (params?.page_size) {
      requestParams['page[size]'] = params.page_size;
      delete requestParams.page_size;
    }

    return apiClient.get<ApiResponse<Person[]>>('/people', requestParams);
  },

  // Get a single person by ID
  async getById(id: string, include?: string[]): Promise<any> {
    const params = include ? { include: include.join(',') } : { include: 'addresses,phones,emails,web_addresses' };
    const response = await apiClient.get<any>(`/people/${id}`, params);
    // TODO: Remove debug logging before production
    // console.log('Raw API response for getById:', JSON.stringify(response, null, 2));
    
    // Return the full response to preserve included data
    return response;
  },

  // Get person's membership entries
  async getMemberships(personId: string, params?: {
    page_number?: number;
    page_size?: number;
    active_at?: string;
  }): Promise<ApiResponse<any[]>> {
    const requestParams: Record<string, any> = {};
    
    // Transform page parameters
    if (params?.page_number) {
      requestParams['page[number]'] = params.page_number;
    }
    if (params?.page_size) {
      requestParams['page[size]'] = params.page_size;
    }
    if (params?.active_at) {
      requestParams['filter[active_at]'] = params.active_at;
    }
    
    // Include membership relationship to get tier details
    requestParams['include'] = 'membership';
    
    return apiClient.get<ApiResponse<any[]>>(`/people/${personId}/membership_entries`, requestParams);
  },

  // Get person's touchpoints
  async getTouchpoints(personId: string, params?: {
    page_number?: number;
    page_size?: number;
  }): Promise<ApiResponse<any[]>> {
    const requestParams: Record<string, any> = {};
    
    // Transform page parameters
    if (params?.page_number) {
      requestParams['page[number]'] = params.page_number;
    }
    if (params?.page_size) {
      requestParams['page[size]'] = params.page_size;
    }
    
    // Include services to get service data for each touchpoint
    requestParams['include'] = 'service';
    
    return apiClient.get<ApiResponse<any[]>>(`/people/${personId}/touchpoints`, requestParams);
  },

  // Create a new person
  async create(data: Partial<Person>): Promise<Person> {
    return apiClient.post<Person>('/people', data);
  },

  // Update a person
  async update(id: string, data: Partial<Person>): Promise<Person> {
    return apiClient.put<Person>(`/people/${id}`, data);
  },

  // Delete a person
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/people/${id}`);
  },
};