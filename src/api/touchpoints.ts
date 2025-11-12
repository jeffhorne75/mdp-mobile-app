import { apiClient } from './client';
import { Touchpoint, CreateTouchpointRequest, ApiResponse } from '../types/api';

export const touchpointsApi = {
  // Get list of touchpoints
  async getList(params?: {
    page?: number;
    per_page?: number;
    person_id?: string;
  }): Promise<ApiResponse<Touchpoint[]>> {
    return apiClient.get<ApiResponse<Touchpoint[]>>('/touchpoints', params);
  },

  // Get a single touchpoint by ID
  async getById(id: string): Promise<Touchpoint> {
    return apiClient.get<Touchpoint>(`/touchpoints/${id}`);
  },

  // Create a new touchpoint
  async create(data: CreateTouchpointRequest): Promise<Touchpoint> {
    return apiClient.post<Touchpoint>('/touchpoints', data);
  },

  // Update a touchpoint
  async update(id: string, data: Partial<Touchpoint>): Promise<Touchpoint> {
    return apiClient.put<Touchpoint>(`/touchpoints/${id}`, data);
  },

  // Delete a touchpoint
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/touchpoints/${id}`);
  },
};