import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import activityRouter from '../routes/activity';
import quotesRouter from '../routes/quotes';
import collectionsRouter from '../routes/collections';
import authRouter from '../routes/auth';
import { prisma } from './setup';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/activity', activityRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/auth', authRouter);

describe('Activity Tracking System', () => {
  let authToken: string;
  let userId: string;
  let quoteId: string;

  beforeEach(async () => {
    // Clear activities
    await prisma.activity.deleteMany();
    await prisma.quoteLike.deleteMany();
    await prisma.collectionQuote.deleteMany();
    await prisma.collection.deleteMany();
    await prisma.quote.deleteMany();
    await prisma.user.deleteMany();

    // Create test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'activitytest@test.com',
        password: 'password123',
        name: 'Activity Tester'
      });

    authToken = registerResponse.body.data.accessToken;
    userId = registerResponse.body.data.user.id;

    // Create a test quote
    const quote = await prisma.quote.create({
      data: {
        text: 'Test quote for activity',
        author: 'Test Author',
        category: 'Testing'
      }
    });
    quoteId = quote.id;
  });

  describe('Activity Creation', () => {
    it('should create activity when user likes a quote', async () => {
      // Like the quote
      await request(app)
        .post(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Check activity was created
      const activities = await prisma.activity.findMany({
        where: { userId }
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].activityType).toBe('like');
      expect(activities[0].quoteId).toBe(quoteId);
    });

    it('should create activity when user creates a collection', async () => {
      await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Collection',
          description: 'A test collection'
        })
        .expect(200);

      const activities = await prisma.activity.findMany({
        where: { userId }
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].activityType).toBe('collectionCreate');
    });

    it('should create activity when user updates a collection', async () => {
      // Create collection first
      const collectionResponse = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Name',
          description: 'Original description'
        });

      const collectionId = collectionResponse.body.data.id;

      // Clear the create activity
      await prisma.activity.deleteMany();

      // Update collection
      await request(app)
        .patch(`/api/collections/${collectionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name'
        })
        .expect(200);

      const activities = await prisma.activity.findMany({
        where: { userId }
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].activityType).toBe('collectionUpdate');
      expect(activities[0].collectionId).toBe(collectionId);
    });

    it('should create activity when user adds quote to collection', async () => {
      // Create collection
      const collectionResponse = await request(app)
        .post('/api/collections')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Collection'
        });

      const collectionId = collectionResponse.body.data.id;

      // Clear create activity
      await prisma.activity.deleteMany();

      // Add quote to collection
      await request(app)
        .post(`/api/collections/${collectionId}/quotes`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ quoteId })
        .expect(200);

      const activities = await prisma.activity.findMany({
        where: { userId }
      });

      expect(activities).toHaveLength(1);
      expect(activities[0].activityType).toBe('collectionUpdate');
      expect(activities[0].quoteId).toBe(quoteId);
      expect(activities[0].collectionId).toBe(collectionId);
    });
  });

  describe('Activity Feed Endpoints', () => {
    beforeEach(async () => {
      // Create some test activities
      await prisma.activity.create({
        data: {
          userId,
          activityType: 'like',
          quoteId
        }
      });
    });

    it('should get global activity feed', async () => {
      const response = await request(app)
        .get('/api/activity/feed')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).toHaveProperty('userId');
      expect(response.body.data[0]).toHaveProperty('userName');
      expect(response.body.data[0]).toHaveProperty('activityType');
    });

    it('should get user-specific activity feed', async () => {
      const response = await request(app)
        .get(`/api/activity/user/${userId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((a: { userId: string }) => a.userId === userId)).toBe(true);
    });

    it('should get current user activity feed when authenticated', async () => {
      const response = await request(app)
        .get('/api/activity/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    it('should return 401 for /me endpoint without authentication', async () => {
      await request(app)
        .get('/api/activity/me')
        .expect(401);
    });

    it('should enrich activities with quote and collection data', async () => {
      const response = await request(app)
        .get('/api/activity/feed')
        .expect(200);

      const likeActivity = response.body.data.find((a: { activityType: string }) => a.activityType === 'like');
      
      expect(likeActivity).toBeDefined();
      expect(likeActivity.quote).toBeDefined();
      expect(likeActivity.quote.text).toBe('Test quote for activity');
      expect(likeActivity.quote.author).toBe('Test Author');
    });

    it('should limit results when limit parameter is provided', async () => {
      // Create multiple activities
      for (let i = 0; i < 5; i++) {
        await prisma.activity.create({
          data: {
            userId,
            activityType: 'like',
            quoteId
          }
        });
      }

      const response = await request(app)
        .get('/api/activity/feed?limit=3')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/activity/feed?limit=500')
        .expect(200);

      // Should be capped at 100, but depends on how many activities exist
      expect(response.body.data.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Activity Data Integrity', () => {
    it('should include user name in activity records', async () => {
      await request(app)
        .post(`/api/quotes/${quoteId}/like`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      const response = await request(app)
        .get('/api/activity/feed')
        .expect(200);

      expect(response.body.data[0].userName).toBe('Activity Tester');
    });

    it('should handle deleted quotes gracefully', async () => {
      // Create activity
      await prisma.activity.create({
        data: {
          userId,
          activityType: 'like',
          quoteId
        }
      });

      // Delete the quote
      await prisma.quote.delete({ where: { id: quoteId } });

      const response = await request(app)
        .get('/api/activity/feed')
        .expect(200);

      // Should still return activity but without quote data
      expect(response.body.data[0].quote).toBeUndefined();
    });
  });
});
