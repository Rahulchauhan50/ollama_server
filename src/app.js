const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { isConnected } = require('./config/database');
const { requestLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/error');
const { ApiResponse } = require('./utils');
const authRoutes = require('./routes/auth.routes');
const modelsRoutes = require('./routes/models.routes');
const adminRoutes = require('./routes/admin.routes');
const healthRoutes = require('./routes/health.routes');
const conversationRoutes = require('./routes/conversation.routes');
const messageRoutes = require('./routes/message.routes');
const devRoutes = require('./routes/dev.routes');

const app = express();

// Middleware - Security & Parsing
app.use(helmet());



const allowedOrigins = [
  'http://localhost:5173', // Development
  'http://localhost:3000', // Development
  'https://vertext.rahulcodes.tech'
];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        origin.startsWith('file://') ||
        origin === 'null'
      ) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware - Logging
app.use(requestLogger);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/models', modelsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api', messageRoutes);
if (!config.isProduction) {
  app.use('/api/dev', devRoutes);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  const response = ApiResponse.success(
    {
      status: 'healthy',
      database: isConnected() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    },
    'Backend is healthy',
    200,
    req.requestId
  );
  res.status(response.statusCode).json(response.toJSON());
});

// Configuration check endpoint (non-sensitive info only)
app.get('/api/config', (req, res) => {
  const response = ApiResponse.success({
    nodeEnv: config.nodeEnv,
    port: config.port,
    mongoUri: config.mongoUri.replace(/:[^:]*@/, ':****@'),
    ai: {
      provider: config.ai.providerName,
      providerKey: config.ai.providerKey,
      defaultChatModel: config.ai.defaultChatModel,
      embeddingModel: config.ai.embeddingModel,
      allowedChatModels: config.ai.allowedChatModels,
    },
  }, 'Configuration', 200, req.requestId);
  res.status(response.statusCode).json(response.toJSON());
});

// Version endpoint
app.get('/api/version', (req, res) => {
  const response = ApiResponse.success(
    { version: '1.0.0', api: 'v1' },
    'API version',
    200,
    req.requestId
  );
  res.status(response.statusCode).json(response.toJSON());
});

// Root endpoint
app.get('/', (req, res) => {
  const response = ApiResponse.success(
    null,
    'AI Backend API v1.0',
    200,
    req.requestId
  );
  res.status(response.statusCode).json(response.toJSON());
});

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Error handling middleware - must be last
app.use(errorHandler);

module.exports = { app, config };
