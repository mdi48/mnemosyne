import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import quotesRouter from '../routes/quotes';
import { prisma } from './setup';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/quotes', quotesRouter);

describe('Quote Validation Tests', () => {
  describe('POST /api/quotes - Validation', () => {
    it('should reject quote without text', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          author: 'Test Author'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some((d: any) => d.field === 'text')).toBe(true);
    });

    it('should reject quote without author', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          text: 'Test quote text'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toBeDefined();
      expect(response.body.details.some((d: any) => d.field === 'author')).toBe(true);
    });

    it('should reject quote with empty text', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          text: '   ',
          author: 'Test Author'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should reject quote with text exceeding 2000 characters', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          text: 'a'.repeat(2001),
          author: 'Test Author'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.message.includes('2000'))).toBe(true);
    });

    it('should reject quote with author exceeding 200 characters', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          text: 'Valid quote text',
          author: 'a'.repeat(201)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.message.includes('200'))).toBe(true);
    });

    it('should reject quote with more than 20 tags', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          text: 'Valid quote text',
          author: 'Test Author',
          tags: Array(21).fill('tag')
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.message.includes('20'))).toBe(true);
    });

    it('should accept valid quote with all fields', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          text: 'A valid quote for testing',
          author: 'Test Author',
          category: 'Testing',
          tags: ['test', 'validation'],
          source: 'Test Suite',
          isPublic: true
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.text).toBe('A valid quote for testing');
    });

    it('should trim whitespace from text and author', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({
          text: '  Trimmed quote  ',
          author: '  Trimmed Author  '
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe('Trimmed quote');
      expect(response.body.data.author).toBe('Trimmed Author');
    });
  });

  describe('PUT /api/quotes/:id - Validation', () => {
    let quoteId: string;

    beforeEach(async () => {
      // Create a quote to update
      const quote = await prisma.quote.create({
        data: {
          text: 'Original text',
          author: 'Original Author'
        }
      });
      quoteId = quote.id;
    });

    it('should reject update with empty request body', async () => {
      const response = await request(app)
        .put(`/api/quotes/${quoteId}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.some((d: any) => d.message.toLowerCase().includes('at least one field'))).toBe(true);
    });

    it('should reject update with text exceeding 2000 characters', async () => {
      const response = await request(app)
        .put(`/api/quotes/${quoteId}`)
        .send({
          text: 'a'.repeat(2001)
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });

    it('should accept partial update with valid text', async () => {
      const response = await request(app)
        .put(`/api/quotes/${quoteId}`)
        .send({
          text: 'Updated text'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe('Updated text');
      expect(response.body.data.author).toBe('Original Author'); // Unchanged
    });

    it('should accept partial update with valid author', async () => {
      const response = await request(app)
        .put(`/api/quotes/${quoteId}`)
        .send({
          author: 'Updated Author'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.author).toBe('Updated Author');
    });
  });
});
