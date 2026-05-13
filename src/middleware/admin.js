const { AppError } = require('../utils');

/**
 * Middleware to check if user has admin role
 * Must be used after authentication middleware
 */
const requireAdmin = (req, res, next) => {
  // Check if user exists (should be set by auth middleware)
  if (!req.user) {
    return next(
      new AppError({
        statusCode: 401,
        message: 'Authentication required',
        code: 'UNAUTHORIZED',
      })
    );
  }

  // Check if user has admin role
  if (req.user.role !== 'admin') {
    return next(
      new AppError({
        statusCode: 403,
        message: 'Admin access required',
        code: 'FORBIDDEN',
      })
    );
  }

  next();
};

module.exports = { requireAdmin };
