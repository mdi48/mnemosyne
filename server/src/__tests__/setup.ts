import { beforeEach, afterAll } from 'vitest';
import { PrismaClient } from '../generated/prisma/client';

// Create a test database instance
export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./test.db',
    },
  },
});

// Clean up database before each test
beforeEach(async () => {
  await prisma.quote.deleteMany({});
});

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});
