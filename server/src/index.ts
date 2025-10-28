import express from 'express';
import cors from 'cors';
import quotesRouter from './routes/quotes';
import categoriesRouter from './routes/categories';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Mnemosyne API Server', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      quotes: '/api/quotes',
      categories: '/api/categories',
      health: '/api/health' // to do: implement health check logic
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/quotes', quotesRouter);
app.use('/api/categories', categoriesRouter);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Mnemosyne API ready to serve wisdom ;)`);
});

export default app;
