import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import quotesRouter from '../routes/quotes';
import { PrismaClient } from '../generated/prisma/client';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/quotes', quotesRouter);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

describe('Quotes API', () => {
  beforeEach(async () => {
    // Clean database before each test
    await prisma.quote.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /api/quotes', () => {
    it('should create a new quote', async () => {
      const quoteData = {
        text: 'Test quote from API',
        author: 'Test Author',
        category: 'Testing',
        tags: ['test', 'api'],
      };

      const response = await request(app)
        .post('/api/quotes')
        .send(quoteData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe(quoteData.text);
      expect(response.body.data.author).toBe(quoteData.author);
      expect(response.body.data.id).toBeDefined();
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/quotes')
        .send({ text: '' }) // Missing author
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/quotes', () => {
    beforeEach(async () => {
      // Create test quotes
      await prisma.quote.create({
        data: {
          text: 'Quote 1',
          author: 'Author A',
          category: 'Philosophy',
        },
      });
      await prisma.quote.create({
        data: {
          text: 'Quote 2',
          author: 'Author B',
          category: 'Motivation',
        },
      });
    });

    it('should get all quotes', async () => {
      const response = await request(app)
        .get('/api/quotes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/quotes?category=Philosophy')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].category).toBe('Philosophy');
    });

    it('should filter by author', async () => {
      const response = await request(app)
        .get('/api/quotes?author=Author A')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].author).toBe('Author A');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/quotes?page=1&limit=1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.totalPages).toBe(2);
    });

    it('should search quotes', async () => {
      const response = await request(app)
        .get('/api/quotes?search=Quote 1')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].text).toContain('Quote 1');
    });
  });

  describe('GET /api/quotes/:id', () => {
    it('should get a quote by id', async () => {
      const created = await prisma.quote.create({
        data: {
          text: 'Test quote',
          author: 'Test Author',
        },
      });

      const response = await request(app)
        .get(`/api/quotes/${created.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(created.id);
      expect(response.body.data.text).toBe(created.text);
    });

    it('should return 404 for non-existent quote', async () => {
      const response = await request(app)
        .get('/api/quotes/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/quotes/:id', () => {
    it('should update a quote', async () => {
      const created = await prisma.quote.create({
        data: {
          text: 'Original text',
          author: 'Original Author',
        },
      });

      const response = await request(app)
        .put(`/api/quotes/${created.id}`)
        .send({
          text: 'Updated text',
          author: 'Updated Author',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBe('Updated text');
      expect(response.body.data.author).toBe('Updated Author');
    });

    it('should return 404 for non-existent quote', async () => {
      const response = await request(app)
        .put('/api/quotes/non-existent-id')
        .send({ text: 'Updated text' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/quotes/:id', () => {
    it('should delete a quote', async () => {
      const created = await prisma.quote.create({
        data: {
          text: 'To be deleted',
          author: 'Test Author',
        },
      });

      const response = await request(app)
        .delete(`/api/quotes/${created.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify it's deleted
      const deleted = await prisma.quote.findUnique({
        where: { id: created.id },
      });
      expect(deleted).toBeNull();
    });

    it('should return 404 for non-existent quote', async () => {
      const response = await request(app)
        .delete('/api/quotes/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/quotes/random', () => {
    it('should get a random quote', async () => {
      await prisma.quote.create({
        data: {
          text: 'Quote 1',
          author: 'Author 1',
        },
      });

      const response = await request(app)
        .get('/api/quotes/random')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.text).toBeDefined();
    });

    it('should return 404 when no quotes exist', async () => {
      const response = await request(app)
        .get('/api/quotes/random')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
