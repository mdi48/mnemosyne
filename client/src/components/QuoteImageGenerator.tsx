import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Quote } from '../types';

interface QuoteImageGeneratorProps {
  quote: Quote;
}

type BackgroundStyle = 'gradient1' | 'gradient2' | 'gradient3' | 'gradient4' | 'solid1' | 'solid2';
type FontSize = 'small' | 'medium' | 'large';

const BACKGROUNDS = {
  gradient1: { type: 'gradient', colors: ['#667eea', '#764ba2'] },
  gradient2: { type: 'gradient', colors: ['#f093fb', '#f5576c'] },
  gradient3: { type: 'gradient', colors: ['#4facfe', '#00f2fe'] },
  gradient4: { type: 'gradient', colors: ['#43e97b', '#38f9d7'] },
  solid1: { type: 'solid', color: '#1a1a2e' },
  solid2: { type: 'solid', color: '#2d3436' },
};

const FONT_SIZES = {
  small: { quote: 28, author: 20 },
  medium: { quote: 36, author: 24 },
  large: { quote: 44, author: 28 },
};

export function QuoteImageGenerator({ quote }: QuoteImageGeneratorProps) {
  const [showModal, setShowModal] = useState(false);
  const [background, setBackground] = useState<BackgroundStyle>('gradient1');
  const [fontSize, setFontSize] = useState<FontSize>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (showModal && canvasRef.current) {
      generateImage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal, background, fontSize]);

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  };

  const generateImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 1200;
    canvas.height = 630;

    // Draw background
    const bg = BACKGROUNDS[background];
    if (bg.type === 'gradient' && 'colors' in bg) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, bg.colors[0]);
      gradient.addColorStop(1, bg.colors[1]);
      ctx.fillStyle = gradient;
    } else if (bg.type === 'solid' && 'color' in bg) {
      ctx.fillStyle = bg.color;
    }
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set text properties
    const padding = 80;
    const maxWidth = canvas.width - (padding * 2);
    const sizes = FONT_SIZES[fontSize];

    // Draw quote text
    ctx.fillStyle = '#ffffff';
    ctx.font = `italic ${sizes.quote}px Georgia, serif`;
    ctx.textAlign = 'center';
    
    const quoteText = `"${quote.text}"`;
    const quoteLines = wrapText(ctx, quoteText, maxWidth);
    
    // Calculate vertical centering
    const lineHeight = sizes.quote * 1.4;
    const authorHeight = sizes.author * 1.5;
    const totalHeight = (quoteLines.length * lineHeight) + authorHeight + 40;
    let y = (canvas.height - totalHeight) / 2 + sizes.quote;

    // Draw quote lines
    quoteLines.forEach((line) => {
      ctx.fillText(line, canvas.width / 2, y);
      y += lineHeight;
    });

    // Draw author
    y += 40;
    ctx.font = `${sizes.author}px Arial, sans-serif`;
    ctx.fillStyle = '#f0f0f0';
    ctx.fillText(`— ${quote.author}`, canvas.width / 2, y);

    // Draw source if available
    if (quote.source) {
      y += sizes.author * 1.3;
      ctx.font = `italic ${sizes.author - 4}px Arial, sans-serif`;
      ctx.fillStyle = '#d0d0d0';
      ctx.fillText(quote.source, canvas.width / 2, y);
    }
  };

  const downloadImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGenerating(true);
    
    try {
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (!blob) return;
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const filename = `quote-${quote.author.replace(/\s+/g, '-').toLowerCase()}.png`;
        link.download = filename;
        link.href = url;
        link.click();
        
        // Cleanup
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to download image:', err);
      setIsGenerating(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="px-3 py-1.5 bg-linear-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-400/30 text-indigo-200 rounded hover:from-indigo-500/30 hover:to-cyan-500/30 transition-all duration-200 text-sm"
        title="Generate image"
      >
        <svg className="w-4 h-4 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      {showModal && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-100 p-4">
          <div 
            className="absolute inset-0" 
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-linear-to-br from-indigo-900 via-purple-900 to-pink-900 rounded-2xl border border-white/20 shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="border-b border-white/20 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Generate Quote Image</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview */}
              <div>
                <h3 className="text-white font-medium mb-3">Preview</h3>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-auto rounded shadow-lg"
                    style={{ aspectRatio: '1200/630' }}
                  />
                </div>
              </div>

              {/* Customization Options */}
              <div className="space-y-6">
                {/* Background Style */}
                <div>
                  <h3 className="text-white font-medium mb-3">Background</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setBackground('gradient1')}
                      className={`h-16 rounded-lg border-2 transition-all ${
                        background === 'gradient1' ? 'border-pink-400 ring-2 ring-pink-400/50' : 'border-white/20'
                      }`}
                      style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                      title="Purple Gradient"
                    />
                    <button
                      onClick={() => setBackground('gradient2')}
                      className={`h-16 rounded-lg border-2 transition-all ${
                        background === 'gradient2' ? 'border-pink-400 ring-2 ring-pink-400/50' : 'border-white/20'
                      }`}
                      style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
                      title="Pink Gradient"
                    />
                    <button
                      onClick={() => setBackground('gradient3')}
                      className={`h-16 rounded-lg border-2 transition-all ${
                        background === 'gradient3' ? 'border-pink-400 ring-2 ring-pink-400/50' : 'border-white/20'
                      }`}
                      style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}
                      title="Blue Gradient"
                    />
                    <button
                      onClick={() => setBackground('gradient4')}
                      className={`h-16 rounded-lg border-2 transition-all ${
                        background === 'gradient4' ? 'border-pink-400 ring-2 ring-pink-400/50' : 'border-white/20'
                      }`}
                      style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}
                      title="Green Gradient"
                    />
                    <button
                      onClick={() => setBackground('solid1')}
                      className={`h-16 rounded-lg border-2 transition-all ${
                        background === 'solid1' ? 'border-pink-400 ring-2 ring-pink-400/50' : 'border-white/20'
                      }`}
                      style={{ background: '#1a1a2e' }}
                      title="Dark Blue"
                    />
                    <button
                      onClick={() => setBackground('solid2')}
                      className={`h-16 rounded-lg border-2 transition-all ${
                        background === 'solid2' ? 'border-pink-400 ring-2 ring-pink-400/50' : 'border-white/20'
                      }`}
                      style={{ background: '#2d3436' }}
                      title="Dark Gray"
                    />
                  </div>
                </div>

                {/* Font Size */}
                <div>
                  <h3 className="text-white font-medium mb-3">Text Size</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setFontSize('small')}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        fontSize === 'small'
                          ? 'border-pink-400 bg-pink-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-white">Small</span>
                      <span className="text-white/60 text-sm ml-2">- Best for long quotes</span>
                    </button>
                    <button
                      onClick={() => setFontSize('medium')}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        fontSize === 'medium'
                          ? 'border-pink-400 bg-pink-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-white">Medium</span>
                      <span className="text-white/60 text-sm ml-2">- Balanced</span>
                    </button>
                    <button
                      onClick={() => setFontSize('large')}
                      className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                        fontSize === 'large'
                          ? 'border-pink-400 bg-pink-500/20'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <span className="text-white">Large</span>
                      <span className="text-white/60 text-sm ml-2">- Best for short quotes</span>
                    </button>
                  </div>
                </div>

                {/* Download Button */}
                <div className="pt-4">
                  <button
                    onClick={downloadImage}
                    disabled={isGenerating}
                    className="w-full px-6 py-4 bg-linear-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download Image (1200x630)
                      </span>
                    )}
                  </button>
                  <p className="text-white/60 text-xs text-center mt-2">
                    Perfect size for social media posts
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
