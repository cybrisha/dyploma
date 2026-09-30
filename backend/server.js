import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import sequelize, { testConnection, syncDatabase } from './config/database.js';
import routes from './routes/index.js';
import { attachLogger, requestLogger } from './middleware/logger.js';
import { apiRateLimiter } from './middleware/rateLimiter.js';
import './models/index.js'; // Initialize models

// Load environment variables
dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 5000;

const configuredFrontendUrl =
  process.env.FRONTEND_URL || 'http://localhost:3000';
const devLocalOrigin =
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

/**
 * CORS: in production only the configured origin is allowed. In development,
 * any localhost / 127.0.0.1 origin is allowed so Vite can use another port
 * when the default is already taken.
 */
const corsOrigin = (origin, callback) => {
  if (!origin) {
    return callback(null, true);
  }
  if (process.env.NODE_ENV === 'production') {
    if (origin === configuredFrontendUrl) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  }
  if (origin === configuredFrontendUrl || devLocalOrigin.test(origin)) {
    return callback(null, true);
  }
  return callback(new Error('Not allowed by CORS'));
};

/**
 * Security middleware
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

/**
 * CORS configuration
 */
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/**
 * Logger middleware
 */
app.use(attachLogger);
app.use(requestLogger);

/**
 * Rate limiting
 */
app.use('/api', apiRateLimiter);

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * API routes
 */
app.use('/api', routes);

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

/**
 * Error handling middleware
 */
app.use((err, req, res, next) => {
  req.logger?.error('Unhandled error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database. Exiting...');
      process.exit(1);
    }

    // Sync database (use migrations in production)
    if (process.env.NODE_ENV !== 'production') {
      await syncDatabase(false); // Set to true to force sync (drops tables)
    }

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 API: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing server...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing server...');
  await sequelize.close();
  process.exit(0);
});

startServer();

