import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import quotesRouter from '../routes/quotes';
import authRouter from '../routes/auth';
import { prisma } from './setup';

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use('/api/quotes', quotesRouter);
app.use('/api/auth', authRouter);

describe('Quotes API with Like Data', () => {
  let accessToken: string;
  let userId: string;
  let quoteId1: string;
  let quoteId2: string;

  beforeEach(async () => {
    // Register a user and get token
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testuser@example.com',
        password: 'password123',
        username: 'Test User',
      });

    accessToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;

    // Create two quotes
    const quote1 = await prisma.quote.create({
      data: {
        text: 'First test quote',
        author: 'Author One',
      },
    });
    quoteId1 = quote1.id;

    const quote2 = await prisma.quote.create({
      data: {
        text: 'Second test quote',
        author: 'Author Two',
      },
    });
    quoteId2 = quote2.id;

    // Like the first quote
    await prisma.quoteLike.create({
      data: {
        userId,
        quoteId: quoteId1,
      },
    });
  });

  describe('GET /api/quotes - with like data', () => {
    it('should include likeCount and isLikedByUser when authenticated', async () => {
      const response = await request(app)
        .get('/api/quotes')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Check first quote (liked by user)
      const likedQuote = response.body.data.find((q: any) => q.id === quoteId1);
      expect(likedQuote.likeCount).toBe(1);
      expect(likedQuote.isLikedByUser).toBe(true);

      // Check second quote (not liked by user)
      const notLikedQuote = response.body.data.find((q: any) => q.id === quoteId2);
      expect(notLikedQuote.likeCount).toBe(0);
      expect(notLikedQuote.isLikedByUser).toBe(false);
    });

    it('should include likeCount but isLikedByUser=false when not authenticated', async () => {
      const response = await request(app)
        .get('/api/quotes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);

      // Check first quote (has likes but user not authenticated)
      const likedQuote = response.body.data.find((q: any) => q.id === quoteId1);
      expect(likedQuote.likeCount).toBe(1);
      expect(likedQuote.isLikedByUser).toBe(false);

      // Check second quote (no likes)
      const notLikedQuote = response.body.data.find((q: any) => q.id === quoteId2);
      expect(notLikedQuote.likeCount).toBe(0);
      expect(notLikedQuote.isLikedByUser).toBe(false);
    });

    it('should show correct like counts with multiple users', async () => {
      // Create another user and like the first quote
      const user2Response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'user2@example.com',
          password: 'password123',
          username: 'User Two',
        });

      await prisma.quoteLike.create({
        data: {
          userId: user2Response.body.data.user.id,
          quoteId: quoteId1,
        },
      });

      const response = await request(app)
        .get('/api/quotes')
        .expect(200);

      const likedQuote = response.body.data.find((q: any) => q.id === quoteId1);
      expect(likedQuote.likeCount).toBe(2);
    });
  });

  describe('GET /api/quotes/:id - with like data', () => {
    it('should include likeCount and isLikedByUser when authenticated', async () => {
      const response = await request(app)
        .get(`/api/quotes/${quoteId1}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likeCount).toBe(1);
      expect(response.body.data.isLikedByUser).toBe(true);
    });

    it('should include likeCount but isLikedByUser=false when not authenticated', async () => {
      const response = await request(app)
        .get(`/api/quotes/${quoteId1}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likeCount).toBe(1);
      expect(response.body.data.isLikedByUser).toBe(false);
    });

    it('should show likeCount=0 for unliked quote', async () => {
      const response = await request(app)
        .get(`/api/quotes/${quoteId2}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.likeCount).toBe(0);
      expect(response.body.data.isLikedByUser).toBe(false);
    });
  });

  describe('GET /api/quotes/random - with like data', () => {
    it('should include likeCount and isLikedByUser when authenticated', async () => {
      const response = await request(app)
        .get('/api/quotes/random')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('likeCount');
      expect(response.body.data).toHaveProperty('isLikedByUser');
      expect(typeof response.body.data.likeCount).toBe('number');
      expect(typeof response.body.data.isLikedByUser).toBe('boolean');
    });

    it('should include likeCount but isLikedByUser=false when not authenticated', async () => {
      const response = await request(app)
        .get('/api/quotes/random')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('likeCount');
      expect(response.body.data).toHaveProperty('isLikedByUser');
      expect(response.body.data.isLikedByUser).toBe(false);
    });
  });
});
