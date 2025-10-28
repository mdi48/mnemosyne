export interface Quote {
  id: string;
  text: string;
  author: string;
  category?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  source?: string; // Where the quote came from (book, speech, etc.)
  isPublic?: boolean;
  userId?: string; // For future user system
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: Date;
}

export interface CreateQuoteRequest {
  text: string;
  author: string;
  category?: string;
  tags?: string[];
  source?: string;
  isPublic?: boolean;
}

export interface UpdateQuoteRequest {
  text?: string;
  author?: string;
  category?: string;
  tags?: string[];
  source?: string;
  isPublic?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface QuoteFilters {
  category?: string;
  author?: string;
  tags?: string[];
  search?: string; // Full-text search
  isPublic?: boolean;
}

export interface QuoteSortOptions {
  field: 'createdAt' | 'updatedAt' | 'author' | 'text';
  order: 'asc' | 'desc';
}
