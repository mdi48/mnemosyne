import { beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '../generated/prisma/client';

// Set test database URL
process.env.DATABASE_URL = 'file:./prisma/test.db';

// Create a test database instance
export const prisma = new PrismaClient();

// Clean up database before each test
beforeEach(async () => {
  // Clean in correct order to respect foreign key constraints
  await prisma.quoteLike.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.quote.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
