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

describe('Quote Likes API', () => {
  let accessToken: string;
  let userId: string;
  let quoteId: string;

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

    // Create a quote
    const quote = await prisma.quote.create({
      data: {
        text: 'Test quote for likes',
        author: 'Test Author',
      },
    });
    quoteId = quote.id;
  });

  describe('POST /api/quotes/:id/like', () => {
    it('should like a quote when authenticated', async () => {
      const response = await request(app)
        .post(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.quoteId).toBe(quoteId);
      expect(response.body.data.userId).toBe(userId);
    });

    it('should reject like without authentication', async () => {
      const response = await request(app)
        .post(`/api/quotes/${quoteId}/like`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should reject duplicate like', async () => {
      // First like
      await request(app)
        .post(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      // Second like attempt
      const response = await request(app)
        .post(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Quote already liked');
    });

    it('should reject like for non-existent quote', async () => {
      const response = await request(app)
        .post('/api/quotes/nonexistent-id/like')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Quote not found');
    });
  });

  describe('DELETE /api/quotes/:id/like', () => {
    beforeEach(async () => {
      // Create a like for testing deletion
      await request(app)
        .post(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${accessToken}`);
    });

    it('should unlike a quote when authenticated', async () => {
      const response = await request(app)
        .delete(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('unliked');

      // Verify like is removed from database
      const like = await prisma.quoteLike.findUnique({
        where: {
          userId_quoteId: {
            userId,
            quoteId,
          },
        },
      });
      expect(like).toBeNull();
    });

    it('should reject unlike without authentication', async () => {
      const response = await request(app)
        .delete(`/api/quotes/${quoteId}/like`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should reject unlike when quote not liked', async () => {
      // Create another user
      const otherUserResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'other@example.com',
          password: 'password123',
          username: 'Other User',
        });

      const otherToken = otherUserResponse.body.data.accessToken;

      // Try to unlike with user who hasn't liked it
      const response = await request(app)
        .delete(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${otherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Quote not liked');
    });
  });

  describe('Like/Unlike Flow', () => {
    it('should allow like -> unlike -> like again', async () => {
      // Like
      await request(app)
        .post(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      // Unlike
      await request(app)
        .delete(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Relike
      const response = await request(app)
        .post(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });
});
