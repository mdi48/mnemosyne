import { useState, useEffect, useCallback } from 'react'
import { apiClient } from './services/api'
import type { Quote } from './types'
import QuoteManagement from './components/QuoteManagement'

function App() {
  const [currentView, setCurrentView] = useState<'random' | 'management'>('random')
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

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
    return <QuoteManagement onBackToRandom={() => setCurrentView('random')} />
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4 tracking-wide">
            Mnemosyne
          </h1>
          <p className="text-xl text-indigo-200 font-light">
            Remember the wisdom of the ages
          </p>
          <div className="w-32 h-1 bg-linear-to-r from-pink-400 to-yellow-400 mx-auto mt-4 rounded-full"></div>
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

          {currentQuote && !isLoading && (
            <div className="text-center">
              <blockquote className="text-2xl md:text-3xl font-light text-white leading-relaxed mb-8 italic">
                "{currentQuote.text}"
              </blockquote>
              
              <div className="flex items-center justify-center mb-8">
                <div className="w-16 h-px bg-linear-to-r from-transparent via-pink-400 to-transparent"></div>
                <span className="text-xl font-semibold text-pink-200 mx-6">
                  - {currentQuote.author}
                </span>
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
          <div className="text-center space-y-4">
            <button 
              onClick={fetchRandomQuote}
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

export default App
