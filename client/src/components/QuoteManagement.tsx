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
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    text: '',
    author: '',
    category: '',
    tags: '',
    source: ''
  })
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formData.text.trim()) {
      setFormError('Quote text is required')
      return
    }
    if (!formData.author.trim()) {
      setFormError('Author is required. Set as "Anonymous" if source is unknown.')
      return
    }

    try {
      setIsSubmitting(true)

      // Prepare data
      const quoteData = {
        text: formData.text.trim(),
        author: formData.author.trim(),
        ...(formData.category && { category: formData.category }),
        ...(formData.tags && { tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) }),
        ...(formData.source && { source: formData.source.trim() })
      }

      const response = await apiClient.createQuote(quoteData)

      if (response.success) {
        // Reset form
        setFormData({ text: '', author: '', category: '', tags: '', source: '' })
        setShowAddForm(false)

        // Show success message
        setSuccessMessage('Quote added successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)

        // Refresh quotes list
        fetchQuotes(1)
      } else {
        setFormError(response.error || 'Failed to create quote')
      }
    } catch (err) {
      console.error('Error creating quote:', err)
      setFormError(err instanceof Error ? err.message : 'Failed to create quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-7xl mx-auto">

        {/* Success Message */}
        {successMessage && (
          <div className="fixed top-4 right-4 z-50 bg-green-500/90 backdrop-blur-lg border border-green-400/50 rounded-xl p-4 shadow-xl animate-slide-in">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-white font-medium">{successMessage}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Quote Library</h1>
            <p className="text-indigo-200">Explore and manage your collection</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-linear-to-r from-pink-500 to-violet-500 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-medium"
            >
              + Add Quote
            </button>
            <button
              onClick={onBackToRandom}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur border border-white/20 transition-all duration-200"
            >
              ← Back to Random
            </button>
          </div>
        </div>

        {/* Add Quote Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">Add New Quote</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="text-white/70 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {formError && (
                  <div className="bg-red-500/20 border border-red-400/50 rounded-lg p-4 backdrop-blur">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-red-200 text-sm">{formError}</span>
                    </div>
                  </div>
                )}

                {/* Quote Text */}
                <div>
                  <div className="flex items-baseline justify-between mb-2">
                    <label className="text-white text-sm font-medium">
                      Quote Text <span className="text-red-400">*</span>
                    </label>
                    <span className="text-white/40 text-xs italic">Quotation marks are added automatically, so do not enter them here.</span>
                  </div>
                  <textarea
                    value={formData.text}
                    onChange={(e) => setFormData(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Enter the quote text..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent resize-none"
                  />
                </div>

                {/* Author */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Author <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                    placeholder="Author name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  >
                    <option value="" className="bg-purple-900">Select a category...</option>
                    {categories.map(category => (
                      <option key={category} value={category} className="bg-purple-900">
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="wisdom, philosophy, life (comma-separated)"
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  />
                </div>

                {/* Source */}
                <div>
                  <label className="block text-white text-sm font-medium mb-2">
                    Source
                  </label>
                  <input
                    type="text"
                    value={formData.source}
                    onChange={(e) => setFormData(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="Book title, speech, interview, etc."
                    className="w-full px-4 py-3 bg-white/10 border border-white/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-linear-to-r from-pink-500 to-violet-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Quote'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                    <div className="text-white/50 text-xs">
                      Added {new Date(quote.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => alert('Edit feature coming next!')}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                        title="Edit quote"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => alert('Delete feature coming next!')}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors"
                        title="Delete quote"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mb-16">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                >
                  Previous
                </button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-white/20 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white/70'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
