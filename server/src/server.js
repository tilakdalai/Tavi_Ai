import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { fileURLToPath } from 'url';
import healthRouter from './routes/health.js';
import userRouter from './routes/user.js';
import creatorRouter from './routes/creator.js';
import conversationsRouter from './routes/conversations.js';
import chatRouter from './routes/chat.js';
import memoryRouter from './routes/memory.js';
import adminRouter from './routes/admin.js';
import searchRouter from './modules/search/search.routes.js';
import scraperRouter from './modules/scraper/scraper.routes.js';

// Load environment variables
dotenv.config();

const app = express();

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Let frontend handle CSP where needed
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, serverless) or any dev origin
    if (!origin || process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parsing with size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Apply general rate limiting
app.use('/api', generalLimiter);

// Register routes
app.use('/api', healthRouter);
app.use('/api', creatorRouter);
app.use('/api', userRouter);
app.use('/api', conversationsRouter);
app.use('/api', chatRouter);
app.use('/api', memoryRouter);
app.use('/api', adminRouter);
app.use('/api', searchRouter);
app.use('/api', scraperRouter);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      message: `API endpoint '${req.originalUrl}' not found.`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
});

// Centralized Error Handler
app.use(errorHandler);

// Initialize subsystems
if (process.env.MONGODB_URI) {
  connectDB().catch((err) => {
    console.warn('[Server Startup] Initial MongoDB connection postponed:', err.message);
  });
}

// Start local listener if executed directly as main script
const isMain = process.argv[1] && (
  fileURLToPath(import.meta.url) === process.argv[1] ||
  process.argv[1].endsWith('server.js')
);

if (isMain && !process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`[Tavi Server] Running on http://localhost:${PORT}`);
    console.log(`[Tavi Server] Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;

