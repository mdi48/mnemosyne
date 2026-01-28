import { Quote, CreateQuoteRequest, UpdateQuoteRequest, QuoteFilters, QuoteSortOptions } from '../types';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient();

// Database quote type from Prisma
interface DbQuote {
  id: string;
  text: string;
  author: string;
  category: string | null;
  tags: string | null;
  source: string | null;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

class QuoteService {

  async getAllQuotes(
    filters?: QuoteFilters,
    sort?: QuoteSortOptions,
    page: number = 1,
    limit: number = 10
  ): Promise<{ quotes: Quote[]; total: number; totalPages: number }> {
    // Build where clause for filters
    const where: any = {};
    
    if (filters) {
      if (filters.category) {
        where.category = {
          equals: filters.category
        };
      }
      
      if (filters.author) {
        where.author = {
          contains: filters.author
        };
      }
      
      if (filters.tags && filters.tags.length > 0) {
        // Search for any of the tags in comma-separated string
        where.tags = {
          contains: filters.tags[0] // Simplified for SQLite
        };
      }
      
      if (filters.search) {
        where.OR = [
          { text: { contains: filters.search } },
          { author: { contains: filters.search } },
          { tags: { contains: filters.search } }
        ];
      }
      
      if (filters.isPublic !== undefined) {
        where.isPublic = filters.isPublic;
      }
    }

    // Build orderBy clause for sorting
    const orderBy: any = {};
    if (sort) {
      orderBy[sort.field] = sort.order;
    } else {
      orderBy.createdAt = 'desc'; // Default sort
    }

    // Get total count for pagination
    const total = await prisma.quote.count({ where });
    const totalPages = Math.ceil(total / limit);

    // Get paginated quotes
    const quotes = await prisma.quote.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    return {
      quotes: quotes.map((q: any) => this.formatQuote(q)),
      total,
      totalPages
    };
  }

  async getQuoteById(id: string): Promise<Quote | null> {
    const quote = await prisma.quote.findUnique({
      where: { id }
    });
    
    if (!quote) return null;
    
    return this.formatQuote(quote);
  }

  async createQuote(quoteData: CreateQuoteRequest & { userId?: string }): Promise<Quote> {
    const quote = await prisma.quote.create({
      data: {
        text: quoteData.text,
        author: quoteData.author,
        category: quoteData.category,
        tags: quoteData.tags?.join(','),
        source: quoteData.source,
        isPublic: quoteData.isPublic ?? true,
        userId: quoteData.userId
      }
    });
    
    return this.formatQuote(quote);
  }

  async updateQuote(id: string, updateData: UpdateQuoteRequest): Promise<Quote | null> {
    try {
      const quote = await prisma.quote.update({
        where: { id },
        data: {
          ...(updateData.text && { text: updateData.text }),
          ...(updateData.author && { author: updateData.author }),
          ...(updateData.category !== undefined && { category: updateData.category }),
          ...(updateData.tags && { tags: updateData.tags.join(',') }),
          ...(updateData.source !== undefined && { source: updateData.source }),
          ...(updateData.isPublic !== undefined && { isPublic: updateData.isPublic })
        }
      });
      
      return this.formatQuote(quote);
    } catch (error) {
      return null;
    }
  }

  async deleteQuote(id: string): Promise<boolean> {
    try {
      await prisma.quote.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async getRandomQuote(): Promise<Quote | null> {
    const count = await prisma.quote.count();
    if (count === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * count);
    const quote = await prisma.quote.findMany({
      skip: randomIndex,
      take: 1
    });
    
    return quote[0] ? this.formatQuote(quote[0]) : null;
  }

  async getQuotesByAuthor(author: string): Promise<Quote[]> {
    const quotes = await prisma.quote.findMany({
      where: {
        author: {
          contains: author
        }
      }
    });
    
    return quotes.map(q => this.formatQuote(q));
  }

  async getQuotesByCategory(category: string): Promise<Quote[]> {
    const quotes = await prisma.quote.findMany({
      where: {
        category: {
          equals: category
        }
      }
    });
    
    return quotes.map(q => this.formatQuote(q));
  }

  // Helper to format Prisma quote to app Quote type
  private formatQuote(quote: DbQuote): Quote {
    return {
      id: quote.id,
      text: quote.text,
      author: quote.author,
      category: quote.category ?? undefined,
      tags: quote.tags ? quote.tags.split(',').map(t => t.trim()) : undefined,
      source: quote.source ?? undefined,
      isPublic: quote.isPublic,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt
    };
  }
}

export const quoteService = new QuoteService();
