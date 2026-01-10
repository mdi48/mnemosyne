import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import quotesRouter from './routes/quotes';
import categoriesRouter from './routes/categories';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import collectionsRouter from './routes/collections';
import activityRouter from './routes/activity';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true // Allow cookies
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mnemosyne API Server', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      quotes: '/api/quotes',
      categories: '/api/categories',
      health: '/api/health'
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/users', usersRouter);
app.use('/api/collections', collectionsRouter);
app.use('/api/activity', activityRouter);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Mnemosyne API ready to serve wisdom ;)`);
});

export default app;
