import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { sampleQuotes } from '../src/data/sampleData';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function main() {
  console.log('Seeding database with sample data...');
  
  // Clear existing data
  console.log('Clearing existing data...');
  await prisma.quoteLike.deleteMany({});
  await prisma.follow.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.quote.deleteMany({});
  console.log('Database cleared.');
  
  // Create sample users
  console.log('Creating sample users...');
  const password = await bcrypt.hash('password123', SALT_ROUNDS);
  
  const john = await prisma.user.create({
    data: {
      email: 'john@example.com',
      password,
      username: 'johndoe',
      displayName: 'John Doe',
      likesPrivate: false,
    },
  });
  
  const jane = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      password,
      username: 'janedoe',
      displayName: 'Jane Doe',
      likesPrivate: true,
    },
  });
  
  console.log('Created two sample users (password: password123).');
  
  // Create sample quotes
  console.log('Creating sample quotes...');
  const quotes = [];
  for (let i = 0; i < sampleQuotes.length; i++) {
    const quote = sampleQuotes[i];
    // Alternate assigning quotes to John and Jane
    const userId = i % 2 === 0 ? john.id : jane.id;
    
    const createdQuote = await prisma.quote.create({
      data: {
        text: quote.text,
        author: quote.author,
        category: quote.category,
        tags: quote.tags?.join(','),
        source: quote.source,
        isPublic: quote.isPublic ?? true,
        userId: userId
      }
    });
    quotes.push(createdQuote);
  }
  
  console.log(`Seeded ${quotes.length} quotes successfully!`);
  
  // Create some sample likes
  console.log('Creating sample likes...');
  // John likes the first 3 quotes
  for (let i = 0; i < 3 && i < quotes.length; i++) {
    await prisma.quoteLike.create({
      data: {
        userId: john.id,
        quoteId: quotes[i].id,
      },
    });
  }
  
  // Jane likes quotes 2, 4, and 6
  for (const index of [1, 3, 5]) {
    if (index < quotes.length) {
      await prisma.quoteLike.create({
        data: {
          userId: jane.id,
          quoteId: quotes[index].id,
        },
      });
    }
  }
  
  console.log('Created sample likes for users!');
  
  // Create follow relationships
  console.log('Creating follow relationships...');
  // John follows Jane
  await prisma.follow.create({
    data: {
      followerId: john.id,
      followingId: jane.id,
    },
  });
  
  // Jane follows John
  await prisma.follow.create({
    data: {
      followerId: jane.id,
      followingId: john.id,
    },
  });
  
  console.log('Created follow relationships!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
