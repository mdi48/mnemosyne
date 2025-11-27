#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.join(__dirname, '..', '..');

// Remove old test database
const testDbPath = path.join(serverRoot, 'prisma', 'test.db');
if (fs.existsSync(testDbPath)) {
  fs.unlinkSync(testDbPath);
  console.log('Removed old test database.');
}

// Apply migrations to test database
console.log('Creating test database with migrations...');
try {
  execSync('DATABASE_URL="file:./prisma/test.db" npx prisma db push --skip-generate', {
    cwd: serverRoot,
    stdio: 'inherit',
  });
  console.log('Test database ready.');
} catch (error) {
  console.error('Failed to setup test database!');
  process.exit(1);
}
