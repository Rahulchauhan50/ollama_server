const AppError = require('../utils/AppError');
const config = require('../config');

// Global error handling middleware
const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error to console
  console.error('[ERROR]', err.message);

  // Handle specific error types
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = AppError.conflict(message);
    return res.status(error.statusCode).json(error.toJSON());
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = AppError.unauthorized('Invalid token');
    return res.status(error.statusCode).json(error.toJSON());
  }

  if (err.name === 'TokenExpiredError') {
    error = AppError.unauthorized('Token expired');
    return res.status(error.statusCode).json(error.toJSON());
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => e.message);
    error = AppError.validation('Validation failed', details);
    return res.status(error.statusCode).json(error.toJSON());
  }

  // Default error response
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  const response = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
      statusCode,
    },
    timestamp: new Date().toISOString(),
  };

  // Include stack trace in development
  if (config.isDevelopment) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// 404 handler
const notFoundHandler = (req, res, _next) => {
  const error = AppError.notFound('Route not found', {
    path: req.path,
    method: req.method,
  });
  error.code = 'ROUTE_NOT_FOUND';
  res.status(404).json(error.toJSON());
};

module.exports = { errorHandler, notFoundHandler };
