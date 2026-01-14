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
  username: string;
  displayName?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
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
  id: string;
  userId: string;
  userName: string;
  activityType: 'like' | 'collectionCreate' | 'collectionUpdate' | 'quoteAdd';
  createdAt: string;
  quote?: {
    id: string;
    text: string;
    author: string;
  };
  collection?: {
    id: string;
    name: string;
    description: string | null;
  };
  metadata?: Record<string, unknown>;
}

export interface UserStats {
  userId: string;
  userName: string;
  user: User; // Full user object with profile fields
  stats: {
    likesGiven: number | null; // null when likesPrivate is true and viewing another user
    likesReceived: number;
    collectionsCount: number;
    quotesAdded: number;
    followersCount: number;
    followingCount: number;
  };
  collections?: Array<{
    id: string;
    name: string;
    description: string | null;
    quotesCount: number;
    createdAt: string;
    updatedAt: string;
  }>;
}
