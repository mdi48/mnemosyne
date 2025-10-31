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

  // Endpoints for Quotes
  async getRandomQuote(): Promise<ApiResponse<Quote>> {
    return this.request<ApiResponse<Quote>>('/quotes/random');
  }

  async getQuoteById(id: string): Promise<ApiResponse<Quote>> {
    return this.request<ApiResponse<Quote>>(`/quotes/${id}`);
  }

  async getQuotesByAuthor(author: string): Promise<ApiResponse<Quote[]>> {
    return this.request<ApiResponse<Quote[]>>(`/quotes/author/${encodeURIComponent(author)}`);
  }

  async createQuote(data: CreateQuoteRequest): Promise<ApiResponse<Quote>> {
    return this.request<ApiResponse<Quote>>('/quotes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateQuote(id: string, data: Partial<CreateQuoteRequest>): Promise<ApiResponse<Quote>> {
    return this.request<ApiResponse<Quote>>(`/quotes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteQuote(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/quotes/${id}`, {
      method: 'DELETE',
    });
  }

  // Endpoints for Categories can be added similarly
  async getCategories(): Promise<ApiResponse<Category[]>> {
    return this.request<ApiResponse<Category[]>>('/categories');
  }

  async getCategoryById(id: string): Promise<ApiResponse<Category>> {
    return this.request<ApiResponse<Category>>(`/categories/${id}`);
  }

  async getQuotesByCategory(category: string): Promise<ApiResponse<Quote[]>> {
    return this.request<ApiResponse<Quote[]>>(`/quotes/category/${encodeURIComponent(category)}`);
  }
}

export const apiClient = new ApiClient();
