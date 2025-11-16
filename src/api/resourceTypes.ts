import { ApiResponse, ResourceType } from '../types/api';
import { apiClient } from './client';

export const resourceTypesApi = {
  /**
   * Fetch resource types filtered by resource_type
   * @param resourceType - The resource type to filter by (e.g., 'organizations', 'connections')
   * @param pageSize - Number of results per page (default: 100)
   */
  async getByResourceType(resourceType: string, pageSize = 100): Promise<ApiResponse<ResourceType[]>> {
    try {
      const response = await apiClient.get('/resource_types', {
        'filter[resource_type]': resourceType,
        'page[size]': pageSize
      });
      
      // Handle case where data is a string that needs to be parsed
      let parsedData = response.data;
      if (typeof response.data === 'string') {
        try {
          parsedData = JSON.parse(response.data);
        } catch (parseError) {
          console.error('Failed to parse API response data:', parseError);
          throw new Error('Invalid API response format');
        }
      }
      
      return parsedData;
    } catch (error) {
      console.error('Error fetching resource types:', error);
      throw error;
    }
  },

  /**
   * Get all organization types
   */
  async getOrganizationTypes(): Promise<ApiResponse<ResourceType[]>> {
    return this.getByResourceType('organizations');
  },

  /**
   * Get all organization statuses
   */
  async getOrganizationStatuses(): Promise<ApiResponse<ResourceType[]>> {
    try {
      // Get all resource types and filter for organization-statuses
      const response = await this.getByResourceType('organization-statuses', 100);
      
      // Filter client-side for organization-statuses since API filter doesn't work as expected
      if (response.data && Array.isArray(response.data)) {
        const statusTypes = response.data.filter(item => item.attributes?.resource_type === 'organization-statuses');
        return {
          ...response,
          data: statusTypes
        };
      }
      
      return response;
    } catch (error) {
      console.error('Error fetching organization statuses:', error);
      throw error;
    }
  },

  /**
   * Get all connection types
   */
  async getConnectionTypes(): Promise<ApiResponse<ResourceType[]>> {
    return this.getByResourceType('connections');
  }
};