import { apiClient } from './client';
import { Organization, ApiResponse } from '../types/api';

export const organizationsApi = {
  // Get list of organizations with optional filters
  async getList(params?: {
    page_number?: number;
    page_size?: number;
    search_matcher?: string;
    filter_value?: string;
    sort?: string;
    attribute?: string;
    include?: string[];
  }): Promise<ApiResponse<Organization[]>> {
    // Include addresses by default (memberships are fetched separately)
    const requestParams: Record<string, any> = {
      include: ['addresses'],
      ...params,
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

    return apiClient.get<ApiResponse<Organization[]>>('/organizations', requestParams);
  },

  // Get a single organization by ID
  async getById(id: string, include?: string[]): Promise<Organization> {
    const params = include ? { include } : { include: ['addresses', 'memberships', 'touchpoints'] };
    return apiClient.get<Organization>(`/organizations/${id}`, params);
  },

  // Create a new organization
  async create(data: Partial<Organization>): Promise<Organization> {
    return apiClient.post<Organization>('/organizations', data);
  },

  // Update an organization
  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return apiClient.put<Organization>(`/organizations/${id}`, data);
  },

  // Get organization's membership entries
  async getMemberships(organizationId: string, params?: {
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
    
    return apiClient.get<ApiResponse<any[]>>(`/organizations/${organizationId}/membership_entries`, requestParams);
  },

  // Delete an organization
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/organizations/${id}`);
  },
};