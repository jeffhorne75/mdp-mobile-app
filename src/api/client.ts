import { config } from '../config/environment';
import { ApiError } from '../types/api';

class ApiClient {
  private baseUrl: string;
  private jwtToken: string;

  constructor() {
    this.baseUrl = config.apiBaseUrl;
    this.jwtToken = config.jwtToken;
    
    // Test network connectivity on initialization
    this.testNetworkConnectivity();
  }
  
  private async testNetworkConnectivity() {
    try {
      // Test with a simple HTTPS endpoint
      const testResponse = await fetch('https://www.google.com', { method: 'HEAD' });
      console.log('Network test successful - Google.com reachable:', testResponse.ok);
    } catch (error) {
      console.error('Network test failed - Cannot reach Google.com:', error);
      console.error('This indicates a general network connectivity issue in the iOS simulator');
    }
    
    // Also test the actual API endpoint
    try {
      console.log('Testing API endpoint:', this.baseUrl);
      const apiTest = await fetch(this.baseUrl, { method: 'HEAD' });
      console.log('API endpoint test result:', apiTest.ok, 'Status:', apiTest.status);
    } catch (error) {
      console.error('API endpoint test failed:', error);
      console.error('API URL:', this.baseUrl);
    }
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

    // TODO: Remove logging before production - contains sensitive information
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
          // console.log('API Error Response:', errorData);
          error.message = errorData.message || errorData.error || error.message;
          
          // Add more context for authentication errors
          if (response.status === 401) {
            error.message = 'Not authenticated';
          }
        } catch {
          // If parsing fails, use default error message
          // console.log('Could not parse error response');
        }

        throw error;
      }

      const responseData = await response.json();
      // TODO: Remove logging before production - may contain sensitive data
      // console.log('API Response:', {
      //   url,
      //   status: response.status,
      //   data: JSON.stringify(responseData, null, 2).substring(0, 500) + '...' // Log first 500 chars
      // });
      return responseData;
    } catch (error) {
      console.error('API Request Error:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', (error as Error).message);
      
      // Additional debugging for network errors
      if (error instanceof TypeError && error.message === 'Network request failed') {
        console.error('Network failure details:');
        console.error('- URL:', url);
        console.error('- Method:', options.method || 'GET');
        console.error('- Base URL:', this.baseUrl);
        console.error('- Full error:', JSON.stringify(error, null, 2));
        
        // Check if it's an iOS ATS (App Transport Security) issue
        if (this.baseUrl.startsWith('http://') && !this.baseUrl.includes('localhost')) {
          console.error('⚠️  WARNING: Using HTTP instead of HTTPS may be blocked by iOS App Transport Security');
        }
      }
      
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