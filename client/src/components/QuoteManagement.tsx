import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api'
import type { Quote } from '../types'

interface QuoteManagementProps {
  onBackToRandom: () => void
}

interface Filters {
  search: string
  author: string
  category: string
  sortBy: 'createdAt' | 'author' | 'category'
  sortOrder: 'asc' | 'desc'
}

export default function QuoteManagement({ onBackToRandom }: QuoteManagementProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({
    search: '',
    author: '',
    category: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  })
  const [categories, setCategories] = useState<string[]>([])
  const [authors, setAuthors] = useState<string[]>([])

  const fetchQuotes = useCallback(async (page = 1) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const params = {
        page,
        limit: pagination.limit,
        ...(filters.search && { search: filters.search }),
        ...(filters.author && { author: filters.author }),
        ...(filters.category && { category: filters.category }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }

      const response = await apiClient.getQuotes(params)
      
      if (response.success && response.data) {
        setQuotes(response.data)
        setPagination(response.pagination)
      } else {
        setError(response.error || 'Failed to load quotes')
      }
    } catch (err) {
      console.error('Error fetching quotes:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsLoading(false)
    }
  }, [filters, pagination.limit])

  const fetchMetadata = async () => {
    try {
      const categoriesResponse = await apiClient.getCategories()
      if (categoriesResponse.success && categoriesResponse.data) {
        setCategories(categoriesResponse.data.map(cat => cat.name || cat.id))
      }
      
      // Get unique authors from all quotes
      const allQuotesResponse = await apiClient.getQuotes({ limit: 1000 })
      if (allQuotesResponse.success && allQuotesResponse.data) {
        const uniqueAuthors = [...new Set(allQuotesResponse.data.map(q => q.author))]
        setAuthors(uniqueAuthors.sort())
      }
    } catch (err) {
      console.error('Error fetching metadata:', err)
    }
  }

  useEffect(() => {
    fetchQuotes(1)
    fetchMetadata()
  }, [filters, fetchQuotes])

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handlePageChange = (page: number) => {
    fetchQuotes(page)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      author: '',
      category: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Quote Library</h1>
            <p className="text-indigo-200">Explore and manage your collection</p>
          </div>
          <button
            onClick={onBackToRandom}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur border border-white/20 transition-all duration-200"
          >
            ← Back to Random
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">

            {/* Search */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Search</label>
              <input
                type="text"
                placeholder="Search quotes..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              />
            </div>

            {/* Author Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Author</label>
              <select
                value={filters.author}
                onChange={(e) => handleFilterChange('author', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              >
                <option value="">All Authors</option>
                {authors.map(author => (
                  <option key={author} value={author} className="bg-purple-900">
                    {author}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category} className="bg-purple-900">
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-white text-sm font-medium mb-2">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  <option value="createdAt" className="bg-purple-900">Date</option>
                  <option value="author" className="bg-purple-900">Author</option>
                  <option value="category" className="bg-purple-900">Category</option>
                </select>
                <button
                  onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-white transition-colors"
                  title={`Sort ${filters.sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center">
            <div className="text-white/70 text-sm">
              Showing {quotes.length} of {pagination.total} quotes
            </div>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-pink-300 hover:text-white text-sm underline transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mr-4"></div>
            <span className="text-white text-lg">Loading quotes...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-400/50 rounded-xl p-6 mb-8 backdrop-blur">
            <div className="flex items-center">
              <svg className="w-6 h-6 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-red-200 font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Quotes Grid */}
        {!isLoading && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 group"
                >
                  <blockquote className="text-white text-lg leading-relaxed mb-4 italic line-clamp-4">
                    "{quote.text}"
                  </blockquote>
                  
                  <div className="text-pink-200 font-medium mb-3">
                    - {quote.author}
                  </div>
                  
                  {quote.category && (
                    <div className="mb-3">
                      <span className="inline-block px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full text-xs font-medium backdrop-blur border border-indigo-400/30">
                        {quote.category}
                      </span>
                    </div>
                  )}
                  
                  {quote.tags && quote.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {quote.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-purple-500/20 text-purple-200 rounded text-xs border border-purple-400/30"
                        >
                          #{tag}
                        </span>
                      ))}
                      {quote.tags.length > 3 && (
                        <span className="text-white/50 text-xs px-2 py-1">
                          +{quote.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  
                  <div className="text-white/50 text-xs">
                    Added {new Date(quote.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add pagination controls */}
            
          </>
        )}
      </div>
    </div>
  )
}
