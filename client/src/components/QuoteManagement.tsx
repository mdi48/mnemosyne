import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '../services/api'
import type { Quote } from '../types'
import { LikeButton } from './LikeButton'
import { AddToCollectionButton } from './AddToCollectionButton'
import { CollectionsManager } from './CollectionsManager'
import { ShareButton } from './ShareButton'
import AuthModal from './AuthModal'

interface QuoteManagementProps {
  onBackToRandom: () => void
}

interface Filters {
  search: string
  author: string
  category: string
  sortBy: 'createdAt' | 'author' | 'category'
  sortOrder: 'asc' | 'desc'
  likedByMe: boolean
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
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; text: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
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
    sortOrder: 'desc',
    likedByMe: false
  })
  const [categories, setCategories] = useState<string[]>([])
  const [authors, setAuthors] = useState<string[]>([])
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login')
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'csv' | 'txt'>('json')
  const [isExporting, setIsExporting] = useState(false)
  const [showCollectionsManager, setShowCollectionsManager] = useState(false)

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
        ...(filters.likedByMe && { likedByMe: 'true' }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }

      const response = await apiClient.getQuotes(params)
      
      if (response.success && response.data) {
        setQuotes(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
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

  // Keyboard shortcuts for quote library (since they might be different from random quote view)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        // Allow Esc to blur input fields
        if (e.key === 'Escape') {
          target.blur()
        }
        return
      }

      // Ignore shortcuts when modals are open
      if (showAddForm || editingQuote || deleteConfirm || showAuthModal) {
        return
      }

      switch (e.key) {
        case 'Escape': // Esc - Clear search and filters
          if (filters.search || filters.author || filters.category || filters.likedByMe) {
            clearFilters()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [filters, showAddForm, editingQuote, deleteConfirm, showAuthModal])

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
      sortOrder: 'desc',
      likedByMe: false
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)

    // Validation
    if (!formData.text.trim()) {
      setFormError('Quote text is required.')
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

  const handleDelete = async (id: string) => {
    try {
      setIsDeleting(true)
      const response = await apiClient.deleteQuote(id)
      
      if (response.success) {
        setSuccessMessage('Quote deleted successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
        setDeleteConfirm(null)
        fetchQuotes(pagination.page)
      } else {
        setError(response.error || 'Failed to delete quote')
      }
    } catch (err) {
      console.error('Error deleting quote:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete quote')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEdit = (quote: Quote) => {
    setEditingQuote(quote)
    setFormData({
      text: quote.text,
      author: quote.author,
      category: quote.category || '',
      tags: quote.tags?.join(', ') || '',
      source: quote.source || ''
    })
    setFormError(null)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingQuote) return
    
    setFormError(null)

    // Validation
    if (!formData.text.trim()) {
      setFormError('Quote text is required.')
      return
    }
    if (!formData.author.trim()) {
      setFormError('Author is required. Set as "Anonymous" if source is unknown.')
      return
    }

    try {
      setIsSubmitting(true)

      const quoteData = {
        text: formData.text.trim(),
        author: formData.author.trim(),
        ...(formData.category && { category: formData.category }),
        ...(formData.tags && { tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) }),
        ...(formData.source && { source: formData.source.trim() })
      }

      const response = await apiClient.updateQuote(editingQuote.id, quoteData)

      if (response.success) {
        setFormData({ text: '', author: '', category: '', tags: '', source: '' })
        setEditingQuote(null)
        setSuccessMessage('Quote updated successfully!')
        setTimeout(() => setSuccessMessage(null), 3000)
        fetchQuotes(pagination.page)
      } else {
        setFormError(response.error || 'Failed to update quote')
      }
    } catch (err) {
      console.error('Error updating quote:', err)
      setFormError(err instanceof Error ? err.message : 'Failed to update quote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingQuote(null)
    setFormData({ text: '', author: '', category: '', tags: '', source: '' })
    setFormError(null)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      
      // Fetch all quotes with current filters
      const params = {
        limit: 10000, // Get all quotes
        ...(filters.search && { search: filters.search }),
        ...(filters.author && { author: filters.author }),
        ...(filters.category && { category: filters.category }),
        ...(filters.likedByMe && { likedByMe: 'true' }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      }

      const response = await apiClient.getQuotes(params)
      
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch quotes for export')
      }

      const quotesToExport = response.data
      let content: string
      let mimeType: string
      let fileExtension: string

      switch (exportFormat) {
        case 'json':
          content = JSON.stringify(quotesToExport, null, 2)
          mimeType = 'application/json'
          fileExtension = 'json'
          break

        case 'csv': {
          // CSV format with headers
          const headers = ['Text', 'Author', 'Category', 'Tags', 'Source', 'Created At']
          const rows = quotesToExport.map(q => [
            `"${q.text.replace(/"/g, '""')}"`, // Escape quotes
            `"${q.author.replace(/"/g, '""')}"`,
            q.category ? `"${q.category.replace(/"/g, '""')}"` : '',
            q.tags?.length ? `"${q.tags.join(', ')}"` : '',
            q.source ? `"${q.source.replace(/"/g, '""')}"` : '',
            new Date(q.createdAt).toISOString()
          ])
          content = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
          mimeType = 'text/csv'
          fileExtension = 'csv'
          break
        }

        case 'txt': {
          // Plain text format
          content = quotesToExport.map(q => {
            const parts = [
              `"${q.text}"`,
              `— ${q.author}`,
              q.category ? `Category: ${q.category}` : '',
              q.tags?.length ? `Tags: ${q.tags.join(', ')}` : '',
              q.source ? `Source: ${q.source}` : '',
              ''
            ].filter(Boolean)
            return parts.join('\n')
          }).join('\n---\n\n')
          mimeType = 'text/plain'
          fileExtension = 'txt'
          break
        }

        default:
          throw new Error('Invalid export format')
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mnemosyne-quotes-${new Date().toISOString().split('T')[0]}.${fileExtension}`
      link.click()
      
      setTimeout(() => {
        URL.revokeObjectURL(url)
        setSuccessMessage(`Exported ${quotesToExport.length} quote${quotesToExport.length !== 1 ? 's' : ''} as ${exportFormat.toUpperCase()}`)
        setTimeout(() => setSuccessMessage(null), 3000)
      }, 100)

      setShowExportModal(false)
    } catch (err) {
      console.error('Error exporting quotes:', err)
      setSuccessMessage('Export failed - please try again')
      setTimeout(() => setSuccessMessage(null), 3000)
    } finally {
      setIsExporting(false)
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
              onClick={() => setShowCollectionsManager(true)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur border border-white/20 transition-all duration-200 flex items-center gap-2"
              title="Manage Collections"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Collections
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl backdrop-blur border border-white/20 transition-all duration-200 flex items-center gap-2"
              title="Export quotes"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export
            </button>
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

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-500/20 rounded-full">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white">Delete Quote?</h3>
              </div>
              
              <p className="text-white/70 mb-2">Are you sure you want to delete this quote?</p>
              <p className="text-white/90 italic text-sm mb-6 p-3 bg-white/5 rounded-lg border border-white/10">
                "{deleteConfirm.text.substring(0, 100)}{deleteConfirm.text.length > 100 ? '...' : ''}"
              </p>
              <p className="text-red-300 text-sm mb-6">This action cannot be undone.</p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all duration-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm.id)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Quote Form Modal */}
        {editingQuote && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold text-white">Edit Quote</h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-white/70 hover:text-white text-2xl transition-colors"
                >
                  ×
                </button>
              </div>
              
              <form onSubmit={handleUpdate} className="space-y-6">
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

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-6 py-3 bg-linear-to-r from-pink-500 to-violet-500 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Updating...' : 'Update Quote'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
            <div className="flex items-center gap-4">
              <div className="text-white/70 text-sm">
                Showing {quotes.length} of {pagination.total} quotes
              </div>
              <button
                onClick={() => setFilters(prev => ({ ...prev, likedByMe: !prev.likedByMe }))}
                className={`px-4 py-2 rounded-lg border transition-all duration-200 flex items-center gap-2 ${
                  filters.likedByMe
                    ? 'bg-pink-500/30 border-pink-400 text-pink-200'
                    : 'bg-white/10 border-white/30 text-white/70 hover:bg-white/20'
                }`}
              >
                <svg
                  className="w-4 h-4"
                  fill={filters.likedByMe ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <span className="text-sm font-medium">My Likes</span>
              </button>
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
                  
                  {quote.source && (
                    <div className="text-white/70 text-sm italic mb-3">
                      {quote.source}
                    </div>
                  )}
                  
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
                  
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <div className="text-white/50 text-xs mb-3">
                      Added {new Date(quote.createdAt).toLocaleDateString()}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <LikeButton
                        quoteId={quote.id}
                        initialLikeCount={quote.likeCount || 0}
                        initialIsLiked={quote.isLikedByUser || false}
                        onAuthRequired={() => {
                          setAuthModalView('login');
                          setShowAuthModal(true);
                        }}
                      />
                      <AddToCollectionButton quoteId={quote.id} />
                      <ShareButton quote={quote} />
                      <button
                        onClick={() => {
                          const text = `"${quote.text}" - ${quote.author}`;
                          navigator.clipboard.writeText(text);
                          setSuccessMessage('Quote copied to clipboard!');
                          setTimeout(() => setSuccessMessage(null), 2000);
                        }}
                        className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg transition-colors"
                        title="Copy quote"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleEdit(quote)}
                        className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-colors"
                        title="Edit quote"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm({ id: quote.id, text: quote.text })}
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
              <div className="mb-16 space-y-4">
                {/* Page Info */}
                <div className="text-center text-white/70 text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </div>
                
                <div className="flex justify-center items-center gap-2 flex-wrap">
                  {/* First Page */}
                  <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                    title="First page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>

                  {/* Previous Page */}
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                  >
                    Previous
                  </button>

                  {/* Page Numbers */}
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    const halfVisible = Math.floor(maxVisible / 2);
                    
                    let startPage = Math.max(1, pagination.page - halfVisible);
                    const endPage = Math.min(pagination.totalPages, startPage + maxVisible - 1);
                    
                    // Adjust start if we're near the end
                    if (endPage - startPage < maxVisible - 1) {
                      startPage = Math.max(1, endPage - maxVisible + 1);
                    }

                    // Show first page + ellipsis if needed
                    if (startPage > 1) {
                      pages.push(
                        <button
                          key={1}
                          onClick={() => handlePageChange(1)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors"
                        >
                          1
                        </button>
                      );
                      if (startPage > 2) {
                        pages.push(
                          <span key="ellipsis-start" className="px-2 text-white/50">
                            ...
                          </span>
                        );
                      }
                    }

                    // Show page range
                    const loopStart = startPage > 1 ? Math.max(startPage, 2) : startPage;
                    const loopEnd = endPage < pagination.totalPages ? Math.min(endPage, pagination.totalPages - 1) : endPage;
                    for (let i = loopStart; i <= loopEnd; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            pagination.page === i
                              ? 'bg-pink-500/80 text-white font-semibold border border-pink-400'
                              : 'bg-white/10 hover:bg-white/20 text-white/70'
                          }`}
                        >
                          {i}
                        </button>
                      );
                    }

                    // Show ellipsis + last page if needed
                    if (endPage < pagination.totalPages) {
                      if (endPage < pagination.totalPages - 1) {
                        pages.push(
                          <span key="ellipsis-end" className="px-2 text-white/50">
                            ...
                          </span>
                        );
                      }
                      pages.push(
                        <button
                          key={pagination.totalPages}
                          onClick={() => handlePageChange(pagination.totalPages)}
                          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg transition-colors"
                        >
                          {pagination.totalPages}
                        </button>
                      );
                    }

                    return pages;
                  })()}

                  {/* Next Page */}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                  >
                    Next
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-white/20"
                    title="Last page"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView={authModalView}
      />

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-linear-to-br from-purple-900 to-indigo-900 rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Export Quotes</h2>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Info */}
              <div className="bg-blue-500/20 border border-blue-400/50 rounded-lg p-4">
                <p className="text-blue-200 text-sm">
                  {filters.search || filters.author || filters.category || filters.likedByMe
                    ? 'Export will include all quotes matching your current filters.'
                    : 'Export will include all quotes in your library.'}
                </p>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-white text-sm font-medium mb-3">Export Format</label>
                <div className="space-y-2">
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      exportFormat === 'json'
                        ? 'border-pink-400 bg-pink-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        exportFormat === 'json' ? 'border-pink-400' : 'border-white/40'
                      }`}>
                        {exportFormat === 'json' && (
                          <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-white font-medium">JSON</div>
                        <div className="text-white/60 text-sm">Structured data with all fields</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportFormat('csv')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      exportFormat === 'csv'
                        ? 'border-pink-400 bg-pink-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        exportFormat === 'csv' ? 'border-pink-400' : 'border-white/40'
                      }`}>
                        {exportFormat === 'csv' && (
                          <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-white font-medium">CSV</div>
                        <div className="text-white/60 text-sm">Spreadsheet-compatible format</div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setExportFormat('txt')}
                    className={`w-full p-4 rounded-lg border-2 transition-all ${
                      exportFormat === 'txt'
                        ? 'border-pink-400 bg-pink-500/20'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        exportFormat === 'txt' ? 'border-pink-400' : 'border-white/40'
                      }`}>
                        {exportFormat === 'txt' && (
                          <div className="w-3 h-3 rounded-full bg-pink-400"></div>
                        )}
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-white font-medium">Plain Text</div>
                        <div className="text-white/60 text-sm">Human-readable format</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex-1 px-6 py-3 bg-linear-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-lg transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isExporting ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Exporting...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Export
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collections Manager Modal */}
      {showCollectionsManager && (
        <CollectionsManager
          onClose={() => setShowCollectionsManager(false)}
        />
      )}
    </div>
  )
}
