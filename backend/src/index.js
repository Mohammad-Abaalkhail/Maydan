import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as Sentry from '@sentry/node';
import authRoutes from './api/auth.js';
import roomRoutes from './api/rooms.js';
import adminRoutes from './api/admin.js';
import { initializeGameSocket } from './sockets/gameSocket.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

// Initialize Sentry (backend)
if (process.env.SENTRY_DSN_BACKEND) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_BACKEND,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
// WebSocket CORS
const WS_ORIGINS = process.env.WS_ORIGINS
  ? process.env.WS_ORIGINS.split(',').map(origin => origin.trim())
  : [process.env.SOCKET_IO_CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173'];

const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || WS_ORIGINS.includes(origin) || WS_ORIGINS.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for Socket.IO
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const CORS_ORIGINS = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (CORS_ORIGINS.includes(origin) || CORS_ORIGINS.includes('*')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// Rate limiting
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes default
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '100'); // 100 requests default

const apiLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: Math.floor(RATE_LIMIT_MAX / 20), // Auth endpoints stricter (5% of general limit)
  message: 'Too many authentication attempts, please try again later.',
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Version route
app.get('/api/version', (req, res) => {
  res.json({ 
    version: '1.0.0',
    name: 'الميدان يا حميدان',
    description: 'Arabic multiplayer card game backend'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/admin', adminRoutes);

// Metrics route (for WebSocket latency monitoring)
const metricsRoutes = await import('./api/metrics.js');
app.use('/api/metrics', metricsRoutes.default);

// Socket.IO game handlers
initializeGameSocket(io);

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.IO server ready`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});

