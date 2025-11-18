import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { sampleQuotes } from '../src/data/sampleData';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with sample quotes...');
  
  for (const quote of sampleQuotes) {
    await prisma.quote.create({
      data: {
        text: quote.text,
        author: quote.author,
        category: quote.category,
        tags: quote.tags?.join(','),
        source: quote.source,
        isPublic: quote.isPublic ?? true
      }
    });
  }
  
  console.log(`✅ Seeded ${sampleQuotes.length} quotes successfully!`);
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
