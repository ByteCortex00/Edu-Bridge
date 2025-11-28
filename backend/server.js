// server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import mlService from './services/mlService.js'; // ✅ NEW: ML Service import
import './workers/embeddingWorker.js'; //  Start the worker
import { embeddingQueue } from './config/queue.js'; // Ensure queue is init

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import institutionRoutes from './routes/institutionRoutes.js';
import curriculumRoutes from './routes/curriculumRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Resolve __dirname for ESM and load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize express app
const app = express();

// ✅ MOUNT WEBHOOKS HERE (Before express.json)
app.use('/api/webhooks', webhookRoutes);

// Middleware
// Define allowed origins
const allowedOrigins = [
  'http://localhost:5173',                  // Local development
  'https://edu-bridge-2b36.vercel.app',     // Old Vercel deployment
  'https://edu-bridge-bytecortex00s-projects.vercel.app', // Current Vercel deployment
  process.env.FRONTEND_URL                  // Fallback to env var
].filter(Boolean);                          // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('CORS: Allowing request with no origin');
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      console.log(`CORS: Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`CORS: Blocked origin: ${origin}`);
      console.log('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'svix-id', 'svix-timestamp', 'svix-signature']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health check route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'EduBridge API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      webhooks: '/api/webhooks',
      institutions: '/api/institutions',
      curricula: '/api/curricula',
      jobs: '/api/jobs',
      analytics: '/api/analytics',
    },
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/institutions', institutionRoutes);
app.use('/api/curricula', curriculumRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/analytics', analyticsRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ✅ Define port
const PORT = process.env.PORT || 5000;

// ✅ ML Service initialization wrapper
async function initializeServices() {
  try {
    console.log('\n🚀 Initializing services...');

    // Initialize ML model
    await mlService.initModel();
    console.log('✅ ML Service ready\n');
  } catch (error) {
    console.error('⚠️  ML Service initialization failed:', error.message);
    console.log('⚠️  Server will continue but ML features will be disabled\n');
  }
}

// ✅ Start server with full initialization
const startServer = async () => {
  try {
    await connectDB(); // Connect MongoDB
    await initializeServices(); // Load ML model

    const server = app.listen(PORT, () => {
      console.log('='.repeat(50));
      console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      console.log(`📡 Port: ${PORT}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log('='.repeat(50));
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('❌ UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('❌ UNCAUGHT EXCEPTION! Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// ✅ Execute startup
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;