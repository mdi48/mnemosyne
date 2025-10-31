import { useState, useEffect } from 'react'
import { apiClient } from './services/api'
import type { Quote } from './types'

function App() {
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

  return (
    <div className="p-5 font-sans">
      <h1 className="text-xl font-bold mb-4">Mnemosyne API Test</h1>
      
      <div className="mb-5">
        <button 
          onClick={fetchRandomQuote}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white border-none rounded cursor-pointer transition-colors"
        >
          Get Random Quote
        </button>
      </div>

      {isLoading && (
        <div className="text-gray-600">Loading...</div>
      )}

      {error && (
        <div className="text-red-500 mb-5">
          Error: {error}
        </div>
      )}

      {currentQuote && !isLoading && (
        <div className="border border-white p-5 rounded-lg bg-green-500">
          <blockquote className="text-lg italic m-0 mb-2.5 text-white">
            "{currentQuote.text}"
          </blockquote>
          <div className="font-bold text-right text-white">
            - {currentQuote.author}
          </div>
          {currentQuote.category && (
            <div className="mt-2.5 text-sm text-black">
              Category: {currentQuote.category}
            </div>
          )}
          {currentQuote.tags && currentQuote.tags.length > 0 && (
            <div className="mt-1.5 text-sm text-black">
              Tags: {currentQuote.tags.join(', ')}
            </div>
          )}
        </div>
      )}

      <div className="mt-5 text-xs text-white">
        API Status: {error ? 'Failed' : currentQuote ? 'Connected' : 'Loading...'}
      </div>
    </div>
  )
}

export default App
