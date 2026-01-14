import type { Quote, Category, ApiResponse, PaginatedResponse, CreateQuoteRequest, QuoteLike, User, Collection, CollectionQuote, Activity, UserStats } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Helper to make authenticated requests with automatic token refresh
const makeRequest = async (endpoint: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem('accessToken');
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'include',
  };

  let response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  // If we get 401 and we're not already on a refresh/auth endpoint, try to refresh
  if (response.status === 401 && !endpoint.includes('/auth/refresh') && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
    try {
      // Try to refresh the token
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (refreshResponse.ok) {
        const { data } = await refreshResponse.json();
        localStorage.setItem('accessToken', data.accessToken);
        
        // Retry the original request with new token
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${data.accessToken}`,
        };
        response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      }
    } catch {
      // Refresh failed, clear token
      localStorage.removeItem('accessToken');
    }
  }
  
  return response;
};

// Simple fetch wrapper for auth endpoints
export const api = {
  get: async (endpoint: string) => {
    const response = await makeRequest(endpoint);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw { response: { data: error, status: response.status } };
    }
    
    return response.json();
  },
  
  post: async (endpoint: string, data?: unknown) => {
    const response = await makeRequest(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw { response: { data: error, status: response.status } };
    }
    
    return response.json();
  },
};

class ApiClient {

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const token = localStorage.getItem('accessToken');
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      credentials: 'include', // Important for sending cookies
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
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

  async likeQuote(id: string): Promise<ApiResponse<QuoteLike>> {
    return this.request<ApiResponse<QuoteLike>>(`/quotes/${id}/like`, {
      method: 'POST',
    });
  }

  async unlikeQuote(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/quotes/${id}/like`, {
      method: 'DELETE',
    });
  }

  async followUser(userId: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/follows/${userId}`, {
      method: 'POST',
    });
  }

  async unfollowUser(userId: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/follows/${userId}`, {
      method: 'DELETE',
    });
  }

  async checkFollowStatus(userId: string): Promise<ApiResponse<{ isFollowing: boolean }>> {
    return this.request<ApiResponse<{ isFollowing: boolean }>>(`/follows/check/${userId}`);
  }

  async getUserFollowers(userId: string): Promise<ApiResponse<User[]>> {
    return this.request<ApiResponse<User[]>>(`/follows/${userId}/followers`);
  }

  async getUserFollowing(userId: string): Promise<ApiResponse<User[]>> {
    return this.request<ApiResponse<User[]>>(`/follows/${userId}/following`);
  }

  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/users/profile');
  }

  async updateUserProfile(data: { 
    username?: string; 
    email?: string; 
    displayName?: string | null;
    bio?: string | null;
    avatarUrl?: string | null;
    likesPrivate?: boolean;
  }): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Collections
  async getCollections(): Promise<ApiResponse<Collection[]>> {
    return this.request<ApiResponse<Collection[]>>('/collections');
  }

  async getCollectionQuotes(collectionId: string): Promise<ApiResponse<Quote[]>> {
    return this.request<ApiResponse<Quote[]>>(`/collections/${collectionId}/quotes`);
  }

  async createCollection(data: { name: string; description?: string }): Promise<ApiResponse<Collection>> {
    return this.request<ApiResponse<Collection>>('/collections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCollection(id: string, data: { name?: string; description?: string }): Promise<ApiResponse<Collection>> {
    return this.request<ApiResponse<Collection>>(`/collections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCollection(id: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/collections/${id}`, {
      method: 'DELETE',
    });
  }

  async addQuoteToCollection(collectionId: string, quoteId: string): Promise<ApiResponse<CollectionQuote>> {
    return this.request<ApiResponse<CollectionQuote>>(`/collections/${collectionId}/quotes`, {
      method: 'POST',
      body: JSON.stringify({ quoteId }),
    });
  }

  async removeQuoteFromCollection(collectionId: string, quoteId: string): Promise<ApiResponse<null>> {
    return this.request<ApiResponse<null>>(`/collections/${collectionId}/quotes/${quoteId}`, {
      method: 'DELETE',
    });
  }

  // User social features
  async getUsers(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<User>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return this.request<PaginatedResponse<User>>(`/users${query ? `?${query}` : ''}`);
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>(`/users/${id}`);
  }

  async getUserLikes(id: string, params?: { page?: number; limit?: number }): Promise<PaginatedResponse<Quote>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    
    const query = queryParams.toString();
    return this.request<PaginatedResponse<Quote>>(`/users/${id}/likes${query ? `?${query}` : ''}`);
  }

  async getUserCollections(id: string): Promise<ApiResponse<Collection[]>> {
    return this.request<ApiResponse<Collection[]>>(`/users/${id}/collections`);
  }


  async getUserStats(id: string): Promise<ApiResponse<UserStats>> {
    return this.request<ApiResponse<UserStats>>(`/users/stats/${id}`);
  }

  // Activity feed
  async getGlobalActivityFeed(limit?: number): Promise<ApiResponse<Activity[]>> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse<Activity[]>>(`/activity/feed${query}`);
  }

  async getMyActivityFeed(limit?: number): Promise<ApiResponse<Activity[]>> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse<Activity[]>>(`/activity/me${query}`);
  }

  async getUserActivityFeed(userId: string, limit?: number): Promise<ApiResponse<Activity[]>> {
    const query = limit ? `?limit=${limit}` : '';
    return this.request<ApiResponse<Activity[]>>(`/activity/user/${userId}${query}`);
  }
}

export const apiClient = new ApiClient();
