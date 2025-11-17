import { ApiResponse, ResourceType } from '../types/api';
import { apiClient } from './client';

// Cache for all resource types to avoid repeated API calls
let resourceTypesCache: ApiResponse<ResourceType[]> | null = null;

export const resourceTypesApi = {
  /**
   * Fetch all resource types and cache them
   */
  async getAllResourceTypes(): Promise<ApiResponse<ResourceType[]>> {
    if (resourceTypesCache) {
      return resourceTypesCache;
    }

    try {
      const response = await apiClient.get('/resource_types', {
        'page[size]': 200 // Get more to ensure we have all types
      });
      
      
      // The API response is already the full response object with data property
      const apiResponse = response as ApiResponse<ResourceType[]>;
      
      // Validate the response structure
      if (!apiResponse || !apiResponse.data) {
        console.error('Invalid API response structure:', response);
        throw new Error('Invalid API response: missing data property');
      }
      
      // Ensure data is an array
      if (!Array.isArray(apiResponse.data)) {
        console.error('API response data is not an array:', apiResponse.data);
        throw new Error('Invalid API response: data is not an array');
      }
      
      
      resourceTypesCache = apiResponse;
      return apiResponse;
    } catch (error) {
      console.error('Error fetching all resource types:', error);
      throw error;
    }
  },

  /**
   * Fetch resource types filtered by resource_type
   * @param resourceType - The resource type to filter by (e.g., 'organizations', 'connections')
   */
  async getByResourceType(resourceType: string): Promise<ApiResponse<ResourceType[]>> {
    try {
      const allTypes = await this.getAllResourceTypes();
      
      // Validate that we have data to filter
      if (!allTypes || !allTypes.data) {
        console.error('No data to filter in getByResourceType');
        return {
          data: [],
          meta: allTypes?.meta || {},
          links: allTypes?.links || {}
        };
      }
      
      
      // Filter client-side since API filter doesn't work properly
      const filteredData = allTypes.data.filter(
        item => item?.attributes?.resource_type === resourceType
      );
      
      return {
        ...allTypes,
        data: filteredData
      };
    } catch (error) {
      console.error(`Error fetching resource types for ${resourceType}:`, error);
      // Return empty array instead of throwing to prevent app crashes
      return {
        data: [],
        meta: {},
        links: {}
      };
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
    return this.getByResourceType('organization-statuses');
  },

  /**
   * Get all connection types
   */
  async getConnectionTypes(): Promise<ApiResponse<ResourceType[]>> {
    return this.getByResourceType('connections');
  },

  /**
   * Get all person types
   */
  async getPersonTypes(): Promise<ApiResponse<ResourceType[]>> {
    return this.getByResourceType('shared_person_type');
  },

  /**
   * Get all person statuses
   */
  async getPersonStatuses(): Promise<ApiResponse<ResourceType[]>> {
    return this.getByResourceType('person-statuses');
  },

  /**
   * Get all job functions
   */
  async getJobFunctions(): Promise<ApiResponse<ResourceType[]>> {
    return this.getByResourceType('shared_job_function');
  },

  /**
   * Get all job levels
   */
  async getJobLevels(): Promise<ApiResponse<ResourceType[]>> {
    return this.getByResourceType('shared_job_level');
  },

  /**
   * Get all pronouns
   */
  async getPronouns(): Promise<ApiResponse<ResourceType[]>> {
    return this.getByResourceType('shared_preferred_pronoun');
  },

  /**
   * Get all genders
   */
  async getGenders(): Promise<ApiResponse<ResourceType[]>> {
    return this.getByResourceType('shared_gender');
  },

  /**
   * Clear the resource types cache
   */
  clearCache(): void {
    resourceTypesCache = null;
  }
};