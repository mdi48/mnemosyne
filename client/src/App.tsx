import { useState, useEffect, useCallback } from 'react'
import { apiClient } from './services/api'
import type { Quote } from './types'
import QuoteManagement from './components/QuoteManagement'
import { AuthProvider } from './contexts/AuthContext'
import { useAuth } from './hooks/useAuth'
import AuthModal from './components/AuthModal'
import ProfileSettings from './components/ProfileSettings'
import { LikeButton } from './components/LikeButton'

function AppContent() {
  const { user, logout, isAuthenticated } = useAuth()
  const [currentView, setCurrentView] = useState<'random' | 'management'>('random')
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login')
  const [profileSettingsOpen, setProfileSettingsOpen] = useState(false)
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Quote[]>([])

  const fetchRandomQuote = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getRandomQuote()
      
      if (response.success && response.data) {
        setCurrentQuote(response.data)
      } else {
        // API returned an error response
        setError(response.error || 'No quote available')
      }
    } catch (err) {
      // Network or parsing error
      console.error('Network error fetching quote:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchQuoteById = useCallback(async (id: string) => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiClient.getQuoteById(id)
      
      if (response.success && response.data) {
        setCurrentQuote(response.data)
      } else {
        setError(response.error || 'Quote not found')
        // Fall back to random quote after a moment
        setTimeout(() => fetchRandomQuote(), 2000)
      }
    } catch (err) {
      console.error('Error fetching quote:', err)
      setError('Failed to load quote')
      setTimeout(() => fetchRandomQuote(), 2000)
    } finally {
      setIsLoading(false)
    }
  }, [fetchRandomQuote])

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchMode(false)
      setSearchResults([])
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      setSearchQuery(query)
      
      const response = await apiClient.getQuotes({ 
        search: query,
        limit: 50 
      })
      
      if (response.success && response.data) {
        setSearchResults(response.data)
        setSearchMode(true)
      } else {
        setError(response.error || 'Search failed')
      }
    } catch (err) {
      console.error('Error searching quotes:', err)
      setError('Failed to search quotes')
    } finally {
      setIsLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchMode(false)
    setSearchQuery('')
    setSearchResults([])
    setError(null)
  }

  useEffect(() => {
    // Check if there's a quote ID in the URL
    const params = new URLSearchParams(window.location.search)
    const quoteId = params.get('quote')
    
    if (quoteId) {
      fetchQuoteById(quoteId)
    } else {
      fetchRandomQuote()
    }
  }, [fetchRandomQuote, fetchQuoteById])

  if (currentView === 'management') {
    return <QuoteManagement onBackToRandom={() => {
      setCurrentView('random')
      // Refetch the current quote to get updated like data
      if (currentQuote?.id) {
        fetchQuoteById(currentQuote.id)
      }
    }} />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">

        {/* Header with Auth */}
        <div className="text-center mb-12">
          <div className="flex justify-end mb-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <span className="text-white/80">Welcome, {user.name}</span>
                <button
                  onClick={() => setProfileSettingsOpen(true)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  title="Settings"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <button
                  onClick={async () => {
                    await logout();
                    // Refetch current quote to indicate that we are logged out (will affect like status)
                    if (currentQuote?.id) {
                      fetchQuoteById(currentQuote.id);
                    }
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setAuthModalView('login')
                    setAuthModalOpen(true)
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    setAuthModalView('register')
                    setAuthModalOpen(true)
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Register
                </button>
              </div>
            )}
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4 tracking-wide">
            Mnemosyne
          </h1>
          <p className="text-xl text-indigo-200 font-light">
            Remember the wisdom of the ages
          </p>
          <div className="w-32 h-1 bg-linear-to-r from-pink-400 to-yellow-400 mx-auto mt-4 rounded-full"></div>
        </div>
        
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialView={authModalView}
          onSuccess={() => {
            // Refetch current quote to update like status after login/register
            if (currentQuote?.id) {
              fetchQuoteById(currentQuote.id);
            }
          }}
        />

        <ProfileSettings
          isOpen={profileSettingsOpen}
          onClose={() => setProfileSettingsOpen(false)}
        />

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search quotes by text, author, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery)
                }
              }}
              className="w-full px-6 py-4 bg-white/10 backdrop-blur-lg border border-white/30 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent pr-24"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => handleSearch(searchQuery)}
                className="px-4 py-2 bg-pink-500/80 hover:bg-pink-500 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12">
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mr-4"></div>
              <span className="text-white text-lg">Ruminating...</span>
            </div>
          )}

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

          {/* Search Results */}
          {searchMode && !isLoading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  Search Results for "{searchQuery}"
                </h2>
                <span className="text-white/70">{searchResults.length} quotes found</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-16">
                  <svg className="w-16 h-16 text-white/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-white/60 text-lg">No quotes found matching your search.</p>
                  <button
                    onClick={clearSearch}
                    className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2">
                  {searchResults.map((quote) => (
                    <div
                      key={quote.id}
                      className="bg-white/5 backdrop-blur border border-white/20 rounded-xl p-6 hover:bg-white/10 transition-all"
                    >
                      <blockquote className="text-lg text-white leading-relaxed mb-3 italic">
                        "{quote.text}"
                      </blockquote>
                      <div className="flex items-center justify-between">
                        <span className="text-pink-200 font-medium">- {quote.author}</span>
                        <div className="flex items-center gap-3">
                          {quote.category && (
                            <span className="px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full text-xs">
                              {quote.category}
                            </span>
                          )}
                          <LikeButton
                            quoteId={quote.id}
                            initialLikeCount={quote.likeCount || 0}
                            initialIsLiked={quote.isLikedByUser || false}
                            onAuthRequired={() => {
                              setAuthModalView('login');
                              setAuthModalOpen(true);
                            }}
                          />
                          <button
                            onClick={() => {
                              setCurrentQuote(quote);
                              clearSearch();
                            }}
                            className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentQuote && !isLoading && !searchMode && (
            <div className="text-center">
              <blockquote className="text-2xl md:text-3xl font-light text-white leading-relaxed mb-8 italic">
                "{currentQuote.text}"
              </blockquote>
              
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-px bg-linear-to-r from-transparent via-pink-400 to-transparent"></div>
                <span className="text-xl font-semibold text-pink-200 mx-6">
                  - {currentQuote.author}
                </span>
                <div className="ml-3">
                  <LikeButton
                    quoteId={currentQuote.id}
                    initialLikeCount={currentQuote.likeCount || 0}
                    initialIsLiked={currentQuote.isLikedByUser || false}
                    onAuthRequired={() => {
                      setAuthModalView('login');
                      setAuthModalOpen(true);
                    }}
                  />
                </div>
                <div className="w-16 h-px bg-linear-to-r from-transparent via-pink-400 to-transparent"></div>
              </div>

              {currentQuote.category && (
                <div className="mb-4">
                  <span className="inline-block px-4 py-2 bg-indigo-500/30 text-indigo-200 rounded-full text-sm font-medium backdrop-blur border border-indigo-400/30">
                    {currentQuote.category}
                  </span>
                </div>
              )}

              {currentQuote.tags && currentQuote.tags.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                  {currentQuote.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-lg text-xs font-medium border border-purple-400/30"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {!searchMode && (
            <div className="text-center space-y-4">
            <button 
              onClick={() => {
                clearSearch();
                fetchRandomQuote();
              }}
              disabled={isLoading}
              className="group relative px-8 py-4 bg-linear-to-r from-pink-500 to-violet-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="relative z-10">
                {isLoading ? 'Loading...' : 'New Wisdom'}
              </span>
              <div className="absolute inset-0 bg-linear-to-r from-pink-600 to-violet-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
            
            {currentQuote && !isLoading && (
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => {
                    const text = `"${currentQuote.text}" - ${currentQuote.author}`;
                    navigator.clipboard.writeText(text);
                    setSuccessMessage('Quote copied to clipboard!');
                    setTimeout(() => setSuccessMessage(null), 2000);
                  }}
                  className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl shadow-lg hover:bg-white/20 transform hover:scale-105 transition-all duration-200 border border-white/20 backdrop-blur"
                  title="Copy quote"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy
                  </span>
                </button>
                
                <button
                  onClick={() => {
                    const url = `${window.location.origin}?quote=${currentQuote.id}`;
                    navigator.clipboard.writeText(url);
                    setSuccessMessage('Link copied to clipboard!');
                    setTimeout(() => setSuccessMessage(null), 2000);
                  }}
                  className="px-6 py-3 bg-white/10 text-white font-medium rounded-xl shadow-lg hover:bg-white/20 transform hover:scale-105 transition-all duration-200 border border-white/20 backdrop-blur"
                  title="Share link"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </span>
                </button>
              </div>
            )}
            
            {successMessage && (
              <div className="bg-green-500/20 border border-green-400/50 rounded-xl p-3 backdrop-blur animate-fade-in">
                <span className="text-green-200 text-sm font-medium">{successMessage}</span>
              </div>
            )}
            
            <div>
              <button
                onClick={() => setCurrentView('management')}
                className="text-indigo-300 hover:text-white underline transition-colors"
              >
                Or explore all quotes...
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="text-center mt-8">
          <div className="flex items-center justify-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              error ? 'bg-red-400' : currentQuote ? 'bg-green-400' : 'bg-yellow-400'
            }`}></div>
            <span className="text-white/70 text-sm">
              API Status: {error ? 'Disconnected' : currentQuote ? 'Connected' : 'Loading...'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App
