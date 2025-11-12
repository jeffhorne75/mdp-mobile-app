import { config } from '../config/environment';
import { ApiError } from '../types/api';

class ApiClient {
  private baseUrl: string;
  private jwtToken: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.jwtToken = config.jwtToken;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.jwtToken}`,
      ...options.headers,
    };

    console.log('API Request:', {
      url,
      method: options.method || 'GET',
      headers: {
        ...headers,
        'Authorization': `Bearer ${this.jwtToken.substring(0, 10)}...` // Log first 10 chars only
      }
    });

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error: ApiError = {
          error: 'API Error',
          message: `Request failed with status ${response.status}`,
          status: response.status,
        };

        // Try to parse error message from response
        try {
          const errorData = await response.json();
          console.log('API Error Response:', errorData);
          error.message = errorData.message || errorData.error || error.message;
        } catch {
          // If parsing fails, use default error message
          console.log('Could not parse error response');
        }

        throw error;
      }

      const responseData = await response.json();
      console.log('API Response:', {
        url,
        status: response.status,
        data: JSON.stringify(responseData, null, 2).substring(0, 500) + '...' // Log first 500 chars
      });
      return responseData;
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      
      // Network error
      throw {
        error: 'Network Error',
        message: 'Unable to connect to the server',
        status: 0,
      } as ApiError;
    }
  }

  // GET request
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return this.request<T>(url, {
      method: 'GET',
    });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // Update JWT token (for future OAuth implementation)
  updateToken(newToken: string) {
    this.jwtToken = newToken;
  }
}

export const apiClient = new ApiClient();