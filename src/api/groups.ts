import { apiClient } from './client';
import { Group, ApiResponse } from '../types/api';

interface GroupsParams {
  sort?: string;
  page?: number;
  page_size?: number;
  search?: string;
  'filter[name_cont]'?: string;
  'filter[type_eq]'?: string;
  include?: string;
}

class GroupsApi {
  async getGroups(params: GroupsParams = {}): Promise<ApiResponse<Group[]>> {
    const requestParams: any = { ...params };
    
    // Transform page to page[number] and page_size to page[size] to match API expectations
    if (params?.page) {
      requestParams['page[number]'] = params.page;
      delete requestParams.page;
    }
    if (params?.page_size) {
      requestParams['page[size]'] = params.page_size;
      delete requestParams.page_size;
    }
    
    return apiClient.get<ApiResponse<Group[]>>('/groups', requestParams);
  }

  async getGroup(id: string, params: { include?: string } = {}): Promise<ApiResponse<Group>> {
    return apiClient.get<ApiResponse<Group>>(`/groups/${id}`, params);
  }

  async getGroupMembers(groupId: string, params: any = {}): Promise<ApiResponse<any[]>> {
    return apiClient.get<ApiResponse<any[]>>(`/groups/${groupId}/people`, params);
  }

  async searchGroups(query: string): Promise<ApiResponse<Group[]>> {
    return this.getGroups({
      'filter[name_cont]': query,
      page_size: 50,
      sort: 'name',
      page: 1,
    });
  }
}

export const groupsApi = new GroupsApi();