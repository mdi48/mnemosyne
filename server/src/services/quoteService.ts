import { Quote, CreateQuoteRequest, UpdateQuoteRequest, QuoteFilters, QuoteSortOptions } from '../types';
import { sampleQuotes } from '../data/sampleData';
import { v4 as uuidv4 } from 'uuid';

class QuoteService {
  private quotes: Quote[] = [...sampleQuotes];

  getAllQuotes(
    filters?: QuoteFilters,
    sort?: QuoteSortOptions,
    page: number = 1,
    limit: number = 10
  ): { quotes: Quote[]; total: number; totalPages: number } {
    let filteredQuotes = [...this.quotes];

    // Apply filters
    if (filters) {
      if (filters.category) {
        filteredQuotes = filteredQuotes.filter(q => 
          q.category?.toLowerCase() === filters.category?.toLowerCase()
        );
      }
      
      if (filters.author) {
        filteredQuotes = filteredQuotes.filter(q => 
          q.author.toLowerCase().includes(filters.author!.toLowerCase())
        );
      }
      
      if (filters.tags && filters.tags.length > 0) {
        filteredQuotes = filteredQuotes.filter(q => 
          q.tags?.some(tag => 
            filters.tags!.some(filterTag => 
              tag.toLowerCase().includes(filterTag.toLowerCase())
            )
          )
        );
      }
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        filteredQuotes = filteredQuotes.filter(q => 
          q.text.toLowerCase().includes(searchTerm) ||
          q.author.toLowerCase().includes(searchTerm) ||
          q.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }
      
      if (filters.isPublic !== undefined) {
        filteredQuotes = filteredQuotes.filter(q => q.isPublic === filters.isPublic);
      }
    }

    // Apply sorting
    if (sort) {
      filteredQuotes.sort((a, b) => {
        let aValue: any = a[sort.field];
        let bValue: any = b[sort.field];
        
        if (aValue instanceof Date) aValue = aValue.getTime();
        if (bValue instanceof Date) bValue = bValue.getTime();
        
        if (typeof aValue === 'string') aValue = aValue.toLowerCase();
        if (typeof bValue === 'string') bValue = bValue.toLowerCase();
        
        if (sort.order === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    // Apply pagination
    const total = filteredQuotes.length;
    const totalPages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedQuotes = filteredQuotes.slice(startIndex, endIndex);

    return {
      quotes: paginatedQuotes,
      total,
      totalPages
    };
  }

  getQuoteById(id: string): Quote | null {
    return this.quotes.find(quote => quote.id === id) || null;
  }

  createQuote(quoteData: CreateQuoteRequest): Quote {
    const newQuote: Quote = {
      id: uuidv4(),
      ...quoteData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: quoteData.isPublic ?? true
    };
    
    this.quotes.push(newQuote);
    return newQuote;
  }

  updateQuote(id: string, updateData: UpdateQuoteRequest): Quote | null {
    const quoteIndex = this.quotes.findIndex(quote => quote.id === id);
    
    if (quoteIndex === -1) {
      return null;
    }

    const updatedQuote: Quote = {
      ...this.quotes[quoteIndex],
      ...updateData,
      updatedAt: new Date()
    };

    this.quotes[quoteIndex] = updatedQuote;
    return updatedQuote;
  }

  deleteQuote(id: string): boolean {
    const quoteIndex = this.quotes.findIndex(quote => quote.id === id);
    
    if (quoteIndex === -1) {
      return false;
    }

    this.quotes.splice(quoteIndex, 1);
    return true;
  }

  getRandomQuote(): Quote | null {
    if (this.quotes.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * this.quotes.length);
    return this.quotes[randomIndex];
  }

  getQuotesByAuthor(author: string): Quote[] {
    return this.quotes.filter(quote => 
      quote.author.toLowerCase().includes(author.toLowerCase())
    );
  }

  getQuotesByCategory(category: string): Quote[] {
    return this.quotes.filter(quote => 
      quote.category?.toLowerCase() === category.toLowerCase()
    );
  }
}

export const quoteService = new QuoteService();
