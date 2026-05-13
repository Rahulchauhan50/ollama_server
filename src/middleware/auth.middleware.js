const TokenService = require('../services/token.service');
const UserRepository = require('../repositories/user.repository');
const { AppError, asyncHandler } = require('../utils');

/**
 * Authentication Middleware
 * Protects routes that require valid JWT token
 */

/**
 * Middleware to require authentication
 * Verifies JWT token and attaches user to req.user
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  // Extract token from request
  const token = TokenService.extractTokenFromRequest(req);

  // Verify token
  const decoded = TokenService.verifyAccessToken(token);

  // Fetch user from database
  const user = await UserRepository.findById(decoded.userId);
  if (!user) {
    throw AppError.unauthorized('User not found', {
      errorCode: 'USER_NOT_FOUND',
    });
  }

  // Attach user to request
  req.user = user;
  req.token = token;
  req.decodedToken = decoded;

  next();
});

/**
 * Optional authentication middleware
 * Verifies JWT token if present, but doesn't require it
 * Attaches user to req.user if token is valid
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = TokenService.extractTokenFromRequest(req);

  if (!token) {
    // Token not provided, continue without user
    req.user = null;
    return next();
  }

  try {
    const decoded = TokenService.verifyAccessToken(token);
    const user = await UserRepository.findById(decoded.userId);
    
    if (user) {
      req.user = user;
      req.decodedToken = decoded;
    }
  } catch (error) {
    // Token invalid or expired, continue without user
    req.user = null;
  }

  next();
});

/**
 * Middleware to check user role
 * @param {...string} allowedRoles - Roles that are allowed
 * @returns {function} - Express middleware
 */
const requireRole = (...allowedRoles) => {
  return asyncHandler(async (req, res, next) => {
    // Ensure user is authenticated first
    if (!req.user) {
      throw AppError.unauthorized('Authentication required', {
        errorCode: 'AUTH_REQUIRED',
      });
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      throw AppError.forbidden(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        {
          errorCode: 'INSUFFICIENT_PERMISSIONS',
          userRole: req.user.role,
          requiredRoles: allowedRoles,
        }
      );
    }

    next();
  });
};

module.exports = {
  requireAuth,
  optionalAuth,
  requireRole,
};
