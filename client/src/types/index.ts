export interface Quote {
  id: string;
  text: string;
  author: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  source?: string; // Where the quote came from (book, speech, etc.)
  isPublic?: boolean;
  likeCount?: number;
  isLikedByUser?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdAt: string;
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

export interface CreateQuoteRequest {
  text: string;
  author: string;
  category?: string;
  tags?: string[];
  source?: string;
  isPublic?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  likesPrivate: boolean;
  createdAt?: string;
  likeCount?: number;
  collectionCount?: number;
}

export interface QuoteLike {
  id: string;
  userId: string;
  quoteId: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  quoteCount?: number;
}

export interface CollectionQuote {
  id: string;
  collectionId: string;
  quoteId: string;
  addedAt: string;
}

export interface Activity {
  type: 'like' | 'collectionUpdate';
  timestamp: string;
  quote?: {
    id: string;
    text: string;
    author: string;
  };
  collection?: {
    id: string;
    name: string;
  };
}
