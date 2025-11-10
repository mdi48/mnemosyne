import { useState, useEffect } from 'react'
import { apiClient } from './services/api'
import type { Quote } from './types'
import QuoteManagement from './components/QuoteManagement'

function App() {
  const [currentView, setCurrentView] = useState<'random' | 'management'>('random')
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRandomQuote = async () => {
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
  }

  useEffect(() => {
    fetchRandomQuote()
  }, [])

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
