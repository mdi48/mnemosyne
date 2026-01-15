import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';
import type { Quote } from '../types';
import { useAuth } from '../hooks/useAuth';
import { LikeButton } from '../components/LikeButton';
import { ShareButton } from '../components/ShareButton';
import { AddToCollectionButton } from '../components/AddToCollectionButton';
import AuthModal from '../components/AuthModal';
import { ThemeToggle } from '../components/ThemeToggle';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout, isAuthenticated } = useAuth();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'register'>('login');
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Quote[]>([]);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const fetchRandomQuote = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getRandomQuote();
      
      if (response.success && response.data) {
        setCurrentQuote(response.data);
      } else {
        setError(response.error || 'No quote available');
      }
    } catch (err) {
      console.error('Network error fetching quote:', err);
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchQuoteById = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.getQuoteById(id);
      
      if (response.success && response.data) {
        setCurrentQuote(response.data);
      } else {
        setError(response.error || 'Quote not found');
        setTimeout(() => fetchRandomQuote(), 2000);
      }
    } catch (err) {
      console.error('Error fetching quote:', err);
      setError('Failed to load quote');
      setTimeout(() => fetchRandomQuote(), 2000);
    } finally {
      setIsLoading(false);
    }
  }, [fetchRandomQuote]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchMode(false);
      setSearchResults([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.getQuotes({ 
        search: query,
        limit: 50 
      });
      
      if (response.success && response.data) {
        setSearchResults(response.data);
        setSearchMode(true);
      } else {
        setError(response.error || 'Search failed');
      }
    } catch (err) {
      console.error('Error searching quotes:', err);
      setError('Failed to search quotes');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchMode(false);
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  };

  useEffect(() => {
    const quoteId = searchParams.get('quote');
    
    if (quoteId) {
      fetchQuoteById(quoteId);
    } else {
      fetchRandomQuote();
    }
  }, [searchParams, fetchRandomQuote, fetchQuoteById]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Allow Escape to work even in input fields
      if (e.key === 'Escape') {
        if (showShortcutsHelp) {
          e.preventDefault();
          setShowShortcutsHelp(false);
          return;
        }
        if (searchMode || searchQuery) {
          clearSearch();
          // Blur the search input if focused
          const searchInput = document.getElementById('search-input') as HTMLInputElement;
          searchInput?.blur();
          return;
        }
      }

      // Don't trigger other shortcuts when typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (showShortcutsHelp) {
        return;
      }

      if (e.key === 'n' && !searchMode) {
        e.preventDefault();
        fetchRandomQuote();
      } else if (e.key === 's' || e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input') as HTMLInputElement;
        searchInput?.focus();
      } else if (e.key === 'c' || e.key === 'C') {
        if (currentQuote && !searchMode) {
          const text = `"${currentQuote.text}" - ${currentQuote.author}`;
          navigator.clipboard.writeText(text);
          setSuccessMessage('Quote copied to clipboard!');
          setTimeout(() => setSuccessMessage(null), 2000);
        }
      } else if (e.key === 'l' || e.key === 'L') {
        if (currentQuote && !searchMode) {
          const url = `${window.location.origin}?quote=${currentQuote.id}`;
          navigator.clipboard.writeText(url);
          setSuccessMessage('Link copied to clipboard!');
          setTimeout(() => setSuccessMessage(null), 2000);
        }
      } else if (e.key === 'm' || e.key === 'M') {
        navigate('/manage');
      } else if (e.key === 'p' || e.key === 'P') {
        if (isAuthenticated && user) {
          navigate(`/profile/${user.id}`);
        }
      } else if (e.key === 'a' || e.key === 'A') {
        if (isAuthenticated) {
          navigate('/activity');
        }
      } else if (e.key === 'd' || e.key === 'D') {
        if (isAuthenticated) {
          navigate('/discover');
        }
      } else if (e.key === '?') {
        e.preventDefault();
        setShowShortcutsHelp(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [searchMode, searchQuery, currentQuote, showShortcutsHelp, isAuthenticated, user, fetchRandomQuote, navigate, clearSearch]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header with Auth */}
        <div className="text-center mb-12">
          <div className="flex justify-end mb-4">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-4">
                <span className="text-white/80">Welcome, {user.displayName || user.username}</span>
                <button
                  onClick={() => navigate('/discover')}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  title="Discover Users"
                >
                  🧑‍🤝‍🧑
                </button>
                <button
                  onClick={() => navigate('/activity')}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  title="Activity Feed"
                >
                  📊
                </button>
                <button
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  title="Profile"
                >
                  👤
                </button>
                <button
                  onClick={() => navigate('/manage')}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                  title="Manage Quotes"
                >
                  📕
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setAuthModalView('login');
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/20"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setAuthModalView('register');
                    setAuthModalOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Sign Up
                </button>
                <ThemeToggle />
              </div>
            )}
          </div>
          
          <h1 className="text-6xl font-bold text-white mb-4 text-shadow-lg">Mnemosyne</h1>
          <p className="text-xl text-white/80">Your Daily Dose of Wisdom</p>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <input
              id="search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search quotes, authors, or topics... (Press 's' or '/' to focus)"
              className="w-full px-6 py-4 rounded-2xl bg-white/10 backdrop-blur-lg text-white placeholder-white/50 border-2 border-white/20 focus:border-white/40 focus:outline-none text-lg"
            />
            {searchMode && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {searchMode ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border-2 border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">
              Search Results ({searchResults.length})
            </h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {searchResults.map((quote) => (
                <div
                  key={quote.id}
                  className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => {
                    setCurrentQuote(quote);
                    clearSearch();
                  }}
                >
                  <p className="text-white text-lg mb-2">{quote.text}</p>
                  <p className="text-white/70">— {quote.author}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border-2 border-white/20 shadow-2xl">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            ) : error ? (
              <div className="text-center">
                <p className="text-red-300 text-lg mb-4">{error}</p>
                <button
                  onClick={fetchRandomQuote}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : currentQuote ? (
              <>
                <blockquote className="text-3xl text-white font-serif italic mb-8 leading-relaxed">
                  "{currentQuote.text}"
                </blockquote>
                <div className="flex justify-between items-center">
                  <p className="text-xl text-white/90">— {currentQuote.author}</p>
                  <div className="flex gap-3">
                    {isAuthenticated && (
                      <>
                        <LikeButton 
                          quoteId={currentQuote.id}
                          initialLikeCount={currentQuote.likeCount || 0}
                          initialIsLiked={currentQuote.isLikedByUser || false}
                          onAuthRequired={() => {
                            setAuthModalView('login');
                            setAuthModalOpen(true);
                          }}
                        />
                        <AddToCollectionButton quoteId={currentQuote.id} />
                      </>
                    )}
                    <ShareButton quote={currentQuote} />
                  </div>
                </div>
                {currentQuote.category && (
                  <div className="mt-6">
                    <span className="px-3 py-1 bg-white/20 text-white/90 rounded-full text-sm">
                      {currentQuote.category}
                    </span>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* New Quote Button */}
        {!searchMode && (
          <div className="mt-8 text-center space-y-4">
            <button
              onClick={fetchRandomQuote}
              className="px-8 py-4 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors text-lg font-medium backdrop-blur-lg border-2 border-white/30"
            >
              New Quote (n)
            </button>
            
            {successMessage && (
              <div className="bg-green-500/20 border border-green-400/50 rounded-xl p-3 backdrop-blur animate-fade-in">
                <span className="text-green-200 text-sm font-medium">{successMessage}</span>
              </div>
            )}
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowShortcutsHelp(true)}
                className="text-white/50 hover:text-white/90 text-sm flex items-center gap-2 transition-colors"
                title="Keyboard shortcuts"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Keyboard Shortcuts (?)
              </button>
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts Help */}
        {showShortcutsHelp && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setShowShortcutsHelp(false)}>
            <div className="bg-linear-to-br from-purple-900 to-indigo-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-white/20" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                <button
                  onClick={() => setShowShortcutsHelp(false)}
                  className="text-white/70 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Get new quote</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">N</kbd>
                </div>
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Focus search</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">S or /</kbd>
                </div>
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Copy quote</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">C</kbd>
                </div>
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Copy link</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">L</kbd>
                </div>
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Manage quotes</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">M</kbd>
                </div>
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Your profile</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">P</kbd>
                </div>
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Discover users</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">D</kbd>
                </div>
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Activity feed</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">A</kbd>
                </div>
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Clear search</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">Esc</kbd>
                </div>
                <div className="flex items-center justify-between text-white/90 hover:bg-white/5 p-3 rounded-lg transition-colors">
                  <span>Show this help</span>
                  <kbd className="px-3 py-1 bg-white/10 rounded border border-white/30 font-mono text-sm">?</kbd>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-white/60 text-sm text-center">
                  Press <kbd className="px-2 py-0.5 bg-white/10 rounded text-xs border border-white/30">Esc</kbd> to close this dialog
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
      />
    </div>
  );
}
