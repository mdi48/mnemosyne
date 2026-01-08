import { useState } from 'react';
import { createPortal } from 'react-dom';
import type { Quote } from '../types';

interface ShareButtonProps {
  quote: Quote;
}

export function ShareButton({ quote }: ShareButtonProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatQuoteText = () => {
    const text = `"${quote.text}"`;
    const attribution = quote.author ? ` - ${quote.author}` : '';
    return `${text}${attribution}`;
  };

  const shareOnFacebook = () => {
    const text = formatQuoteText();
    // Facebook sharing - using sharer.php with quote parameter
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  const shareOnLinkedIn = () => {
    const text = formatQuoteText();
    // LinkedIn sharing with title and summary
    const url = `https://www.linkedin.com/sharing/share-offsite/?summary=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'width=600,height=400');
    setShowMenu(false);
  };

  const copyToClipboard = async () => {
    const text = formatQuoteText();
    try {
      await navigator.clipboard.writeText(text);
      alert('Quote copied to clipboard!');
      setShowMenu(false);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowMenu(true)}
        className="px-3 py-1.5 bg-linear-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 text-purple-200 rounded hover:from-purple-500/30 hover:to-pink-500/30 transition-all duration-200 text-sm"
        title="Share quote"
      >
        <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      </button>

      {showMenu && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowMenu(false)}
          />
          <div className="relative bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl border border-white/20 shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="border-b border-white/20 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Share Quote</h2>
                <button
                  onClick={() => setShowMenu(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Quote Preview */}
            <div className="p-6 border-b border-white/10">
              <blockquote className="text-white/90 italic mb-2">
                "{quote.text}"
              </blockquote>
              <div className="text-pink-200 text-sm">
                — {quote.author}
              </div>
            </div>

            {/* Share Options */}
            <div className="p-6 space-y-2">
              <button
                onClick={shareOnFacebook}
                className="w-full px-4 py-3 text-left text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center gap-3 border border-white/10"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Share on Facebook</span>
              </button>
              <button
                onClick={shareOnLinkedIn}
                className="w-full px-4 py-3 text-left text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center gap-3 border border-white/10"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                <span>Share on LinkedIn</span>
              </button>
              <button
                onClick={copyToClipboard}
                className="w-full px-4 py-3 text-left text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 flex items-center gap-3 border border-white/10 border-t-2 border-t-white/20 mt-2 pt-4"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy to Clipboard</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
