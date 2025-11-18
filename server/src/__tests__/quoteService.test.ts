import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { quoteService } from '../services/quoteService';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

describe('QuoteService', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.quote.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('createQuote', () => {
    it('should create a new quote', async () => {
      const quoteData = {
        text: 'Test quote',
        author: 'Test Author',
        category: 'Testing',
        tags: ['test', 'unit'],
        source: 'Test Source',
        isPublic: true,
      };

      const quote = await quoteService.createQuote(quoteData);

      expect(quote).toBeDefined();
      expect(quote.text).toBe(quoteData.text);
      expect(quote.author).toBe(quoteData.author);
      expect(quote.category).toBe(quoteData.category);
      expect(quote.tags).toEqual(quoteData.tags);
      expect(quote.source).toBe(quoteData.source);
      expect(quote.isPublic).toBe(true);
      expect(quote.id).toBeDefined();
      expect(quote.createdAt).toBeDefined();
      expect(quote.updatedAt).toBeDefined();
    });

    it('should create a quote without optional fields', async () => {
      const quoteData = {
        text: 'Minimal quote',
        author: 'Test Author',
      };

      const quote = await quoteService.createQuote(quoteData);

      expect(quote).toBeDefined();
      expect(quote.text).toBe(quoteData.text);
      expect(quote.author).toBe(quoteData.author);
      expect(quote.isPublic).toBe(true);
    });
  });

  describe('getQuoteById', () => {
    it('should retrieve a quote by id', async () => {
      const created = await quoteService.createQuote({
        text: 'Test quote',
        author: 'Test Author',
      });

      const found = await quoteService.getQuoteById(created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
      expect(found?.text).toBe(created.text);
    });

    it('should return null for non-existent id', async () => {
      const found = await quoteService.getQuoteById('non-existent-id');
      expect(found).toBeNull();
    });
  });

  describe('getAllQuotes', () => {
    beforeEach(async () => {
      // Create test quotes
      await quoteService.createQuote({
        text: 'Quote 1',
        author: 'Author A',
        category: 'Philosophy',
        tags: ['wisdom'],
      });
      await quoteService.createQuote({
        text: 'Quote 2',
        author: 'Author B',
        category: 'Motivation',
        tags: ['inspiration'],
      });
      await quoteService.createQuote({
        text: 'Quote 3',
        author: 'Author A',
        category: 'Philosophy',
        tags: ['wisdom'],
      });
    });

    it('should retrieve all quotes with pagination', async () => {
      const result = await quoteService.getAllQuotes(undefined, undefined, 1, 10);

      expect(result.quotes).toHaveLength(3);
      expect(result.total).toBe(3);
      expect(result.totalPages).toBe(1);
    });

    it('should filter quotes by category', async () => {
      const result = await quoteService.getAllQuotes(
        { category: 'Philosophy' },
        undefined,
        1,
        10
      );

      expect(result.quotes).toHaveLength(2);
      expect(result.quotes.every(q => q.category === 'Philosophy')).toBe(true);
    });

    it('should filter quotes by author', async () => {
      const result = await quoteService.getAllQuotes(
        { author: 'Author A' },
        undefined,
        1,
        10
      );

      expect(result.quotes).toHaveLength(2);
      expect(result.quotes.every(q => q.author === 'Author A')).toBe(true);
    });

    it('should search quotes by text', async () => {
      const result = await quoteService.getAllQuotes(
        { search: 'Quote 1' },
        undefined,
        1,
        10
      );

      expect(result.quotes).toHaveLength(1);
      expect(result.quotes[0].text).toBe('Quote 1');
    });

    it('should paginate results correctly', async () => {
      const page1 = await quoteService.getAllQuotes(undefined, undefined, 1, 2);
      const page2 = await quoteService.getAllQuotes(undefined, undefined, 2, 2);

      expect(page1.quotes).toHaveLength(2);
      expect(page2.quotes).toHaveLength(1);
      expect(page1.totalPages).toBe(2);
      expect(page1.total).toBe(3);
    });

    it('should sort quotes by field', async () => {
      const result = await quoteService.getAllQuotes(
        undefined,
        { field: 'author', order: 'asc' },
        1,
        10
      );

      expect(result.quotes[0].author).toBe('Author A');
      expect(result.quotes[result.quotes.length - 1].author).toBe('Author B');
    });
  });

  describe('updateQuote', () => {
    it('should update a quote', async () => {
      const created = await quoteService.createQuote({
        text: 'Original text',
        author: 'Original Author',
      });

      const updated = await quoteService.updateQuote(created.id, {
        text: 'Updated text',
        author: 'Updated Author',
      });

      expect(updated).toBeDefined();
      expect(updated?.text).toBe('Updated text');
      expect(updated?.author).toBe('Updated Author');
    });

    it('should return null for non-existent quote', async () => {
      const updated = await quoteService.updateQuote('non-existent-id', {
        text: 'Updated text',
      });

      expect(updated).toBeNull();
    });
  });

  describe('deleteQuote', () => {
    it('should delete a quote', async () => {
      const created = await quoteService.createQuote({
        text: 'To be deleted',
        author: 'Test Author',
      });

      const deleted = await quoteService.deleteQuote(created.id);
      expect(deleted).toBe(true);

      const found = await quoteService.getQuoteById(created.id);
      expect(found).toBeNull();
    });

    it('should return false for non-existent quote', async () => {
      const deleted = await quoteService.deleteQuote('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('getRandomQuote', () => {
    it('should return a random quote', async () => {
      await quoteService.createQuote({
        text: 'Quote 1',
        author: 'Author 1',
      });
      await quoteService.createQuote({
        text: 'Quote 2',
        author: 'Author 2',
      });

      const random = await quoteService.getRandomQuote();
      expect(random).toBeDefined();
      expect(random?.text).toBeDefined();
    });

    it('should return null when no quotes exist', async () => {
      const random = await quoteService.getRandomQuote();
      expect(random).toBeNull();
    });
  });

  describe('getQuotesByAuthor', () => {
    it('should retrieve quotes by author', async () => {
      await quoteService.createQuote({
        text: 'Quote 1',
        author: 'John Doe',
      });
      await quoteService.createQuote({
        text: 'Quote 2',
        author: 'Jane Smith',
      });
      await quoteService.createQuote({
        text: 'Quote 3',
        author: 'John Doe',
      });

      const quotes = await quoteService.getQuotesByAuthor('John');
      expect(quotes).toHaveLength(2);
      expect(quotes.every(q => q.author.includes('John'))).toBe(true);
    });
  });

  describe('getQuotesByCategory', () => {
    it('should retrieve quotes by category', async () => {
      await quoteService.createQuote({
        text: 'Quote 1',
        author: 'Author 1',
        category: 'Philosophy',
      });
      await quoteService.createQuote({
        text: 'Quote 2',
        author: 'Author 2',
        category: 'Motivation',
      });
      await quoteService.createQuote({
        text: 'Quote 3',
        author: 'Author 3',
        category: 'Philosophy',
      });

      const quotes = await quoteService.getQuotesByCategory('Philosophy');
      expect(quotes).toHaveLength(2);
      expect(quotes.every(q => q.category === 'Philosophy')).toBe(true);
    });
  });
});
