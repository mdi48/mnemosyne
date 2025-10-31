import type { Quote, Category, ApiResponse, PaginatedResponse, CreateQuoteRequest } from '../types';

const API_BASE_URL = 'http://localhost:3001/api'; // To be replaced with environment variable in production

class ApiClient {

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }
  
  // Endpoints for Quotes
  async getQuotes(params?: {
    category?: string;
    author?: string;
    tags?: string[];
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Quote>> {
    const searchParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined) {
          if (Array.isArray(val)) {
            searchParams.append(key, val.join(','));
          } else {
            searchParams.append(key, String(val));
          }
        }
      });
    }

    const endpoint = `/quotes${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    return this.request<PaginatedResponse<Quote>>(endpoint);
  }

  
}

export const apiClient = new ApiClient();
