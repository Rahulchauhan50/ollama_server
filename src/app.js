const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const config = require('./config');
const { requestLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/error');
const { ApiResponse } = require('./utils');

const app = express();

// Middleware - Security & Parsing
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware - Logging
app.use(requestLogger);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const response = ApiResponse.success(
    { status: 'healthy' },
    'Backend is healthy'
  );
  res.status(response.statusCode).json(response.toJSON());
});

// Configuration check endpoint (non-sensitive info only)
app.get('/api/config', (req, res) => {
  const response = ApiResponse.success({
    nodeEnv: config.nodeEnv,
    port: config.port,
    mongoUri: config.mongoUri.replace(/:[^:]*@/, ':****@'),
    ollama: {
      baseUrl: config.ollama.baseUrl,
      defaultChatModel: config.ollama.defaultChatModel,
      embeddingModel: config.ollama.embeddingModel,
      allowedChatModels: config.ollama.allowedChatModels,
    },
  }, 'Configuration');
  res.status(response.statusCode).json(response.toJSON());
});

// Version endpoint
app.get('/api/version', (req, res) => {
  const response = ApiResponse.success(
    { version: '1.0.0', api: 'v1' },
    'API version'
  );
  res.status(response.statusCode).json(response.toJSON());
});

// Root endpoint
app.get('/', (req, res) => {
  const response = ApiResponse.success(
    null,
    'Ollama Backend API v1.0'
  );
  res.status(response.statusCode).json(response.toJSON());
});

// 404 handler - must be before error handler
app.use(notFoundHandler);

// Error handling middleware - must be last
app.use(errorHandler);

module.exports = { app, config };
