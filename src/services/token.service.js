const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const { AppError } = require('../utils');
const RefreshSessionRepository = require('../repositories/refreshSession.repository');

/**
 * Token Service
 * Handles JWT token generation, verification, and refresh token management
 */
const TokenService = {
  /**
   * Sign and generate access token
   * @param {object} user - User object
   * @param {string} user._id - User ID
   * @param {string} user.email - User email
   * @param {string} user.role - User role
   * @returns {string} - JWT access token
   * @throws {AppError} - If token generation fails
   */
  signAccessToken(user) {
    try {
      if (!user || !user._id || !user.email) {
        throw AppError.internal(
          'Invalid user data for token generation',
          { userId: user?._id }
        );
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email,
          role: user.role || 'user',
        },
        config.jwt.accessSecret,
        {
          expiresIn: config.jwt.accessExpiry,
          issuer: 'ollama-backend',
          audience: 'ollama-frontend',
        }
      );

      return token;
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Failed to sign access token: ${error.message}`);
    }
  },

  /**
   * Verify and decode access token
   * @param {string} token - JWT access token
   * @returns {object} - Decoded token payload
   * @throws {AppError} - If token is invalid or expired
   */
  verifyAccessToken(token) {
    try {
      if (!token) {
        throw AppError.unauthorized('Access token is required', {
          errorCode: 'TOKEN_MISSING',
        });
      }

      // Remove 'Bearer ' prefix if present
      const cleanToken = token.startsWith('Bearer ') 
        ? token.slice(7) 
        : token;

      const decoded = jwt.verify(cleanToken, config.jwt.accessSecret, {
        issuer: 'ollama-backend',
        audience: 'ollama-frontend',
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Access token has expired', {
          errorCode: 'TOKEN_EXPIRED',
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized('Invalid access token', {
          errorCode: 'TOKEN_INVALID',
        });
      }

      if (error.isCustom) {
        throw error;
      }

      throw AppError.unauthorized('Token verification failed', {
        errorCode: 'TOKEN_VERIFICATION_FAILED',
      });
    }
  },

  /**
   * Extract token from request headers
   * @param {object} req - Express request object
   * @returns {string|null} - Token string or null if not found
   */
  extractTokenFromRequest(req) {
    // Check Authorization header first (standard approach)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      // Handle "Bearer <token>" format
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.slice(7);
      }
      return authHeader;
    }

    // Check for token in cookies (optional)
    if (req.cookies && req.cookies.accessToken) {
      return req.cookies.accessToken;
    }

    // Check for token in query string (not recommended but sometimes needed)
    if (req.query && req.query.token) {
      return req.query.token;
    }

    return null;
  },

  /**
   * Generate refresh token
   * @param {object} user - User object
   * @param {object} options - Optional parameters
   * @returns {string} - Refresh token
   */
  generateRefreshToken(user, options = {}) {
    try {
      if (!user || !user._id) {
        throw AppError.internal('Invalid user data for refresh token generation');
      }

      const token = jwt.sign(
        {
          userId: user._id.toString(),
          email: user.email || undefined,
          type: 'refresh',
        },
        config.jwt.refreshSecret,
        {
          expiresIn: options.expiresIn || '7d',
          issuer: 'ollama-backend',
          audience: 'ollama-frontend',
        }
      );

      return token;
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Failed to generate refresh token: ${error.message}`);
    }
  },

  /**
   * Verify refresh token
   * @param {string} token - Refresh token
   * @returns {object} - Decoded token payload
   */
  verifyRefreshToken(token) {
    try {
      if (!token) {
        throw AppError.unauthorized('Refresh token is required', {
          errorCode: 'REFRESH_TOKEN_MISSING',
        });
      }

      const decoded = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'ollama-backend',
        audience: 'ollama-frontend',
      });

      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw AppError.unauthorized('Refresh token has expired', {
          errorCode: 'REFRESH_TOKEN_EXPIRED',
        });
      }

      if (error instanceof jwt.JsonWebTokenError) {
        throw AppError.unauthorized('Invalid refresh token', {
          errorCode: 'REFRESH_TOKEN_INVALID',
        });
      }

      if (error.isCustom) {
        throw error;
      }

      throw AppError.unauthorized('Refresh token verification failed', {
        errorCode: 'REFRESH_TOKEN_VERIFICATION_FAILED',
      });
    }
  },

  /**
   * Create a new refresh session
   * @param {string} userId - User ID
   * @param {object} options - Session options
   * @returns {Promise<object>} - Refresh token and session
   */
  async createRefreshSession(userId, options = {}) {
    try {
      if (!userId) {
        throw AppError.badRequest('User ID is required');
      }

      // Generate refresh token
      const refreshToken = this.generateRefreshToken(
        { _id: userId, email: options.email },
        { expiresIn: '7d' }
      );

      // Create token family ID for rotation
      const tokenFamily = crypto.randomBytes(16).toString('hex');

      // Calculate expiry (7 days from now)
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // In test environment avoid writing to the DB (prevents Mongoose buffering timeouts)
      if (config.isTest) {
        const session = {
          _id: null,
          userId,
          refreshToken,
          refreshTokenFamily: tokenFamily,
          deviceInfo: options.deviceInfo || {},
          isRevoked: false,
          expiresAt,
          lastUsedAt: null,
          rotationCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          toJSON() {
            const obj = { ...this };
            delete obj.toJSON;
            return obj;
          },
        };

        return {
          refreshToken,
          session: session.toJSON(),
        };
      }

      // Create refresh session (production/dev)
      const session = await RefreshSessionRepository.create({
        userId,
        refreshToken,
        refreshTokenFamily: tokenFamily,
        deviceInfo: options.deviceInfo || {},
        expiresAt,
      });

      return {
        refreshToken,
        session: session.toJSON(),
      };
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Failed to create refresh session: ${error.message}`);
    }
  },

  /**
   * Rotate refresh token
   * @param {string} refreshToken - Current refresh token
   * @returns {Promise<object>} - New refresh token and session
   */
  async rotateRefreshToken(refreshToken) {
    try {
      // Verify the refresh token
      const decoded = this.verifyRefreshToken(refreshToken);

      // Find the session
      const session = await RefreshSessionRepository.findByToken(refreshToken);
      if (!session) {
        throw AppError.unauthorized('Refresh session not found', {
          errorCode: 'SESSION_NOT_FOUND',
        });
      }

      // Check if session is revoked
      if (session.isRevoked) {
        // Potential token reuse attack - revoke entire token family
        if (session.refreshTokenFamily) {
          await RefreshSessionRepository.revokeTokenFamily(session.refreshTokenFamily);
        }
        throw AppError.unauthorized('Refresh session has been revoked', {
          errorCode: 'SESSION_REVOKED',
        });
      }

      // Check if session is expired
      if (session.expiresAt < new Date()) {
        throw AppError.unauthorized('Refresh session has expired', {
          errorCode: 'SESSION_EXPIRED',
        });
      }

      // Update last used timestamp
      await RefreshSessionRepository.update(session._id, {
        lastUsedAt: new Date(),
        rotationCount: (session.rotationCount || 0) + 1,
      });

      // Generate new tokens
      const newAccessToken = this.signAccessToken({
        _id: decoded.userId,
        email: decoded.email,
      });

      const newRefreshToken = this.generateRefreshToken(
        { _id: decoded.userId, email: decoded.email },
        { expiresIn: '7d' }
      );

      // Calculate new expiry
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Create new session with same token family
      const newSession = await RefreshSessionRepository.create({
        userId: decoded.userId,
        refreshToken: newRefreshToken,
        refreshTokenFamily: session.refreshTokenFamily,
        deviceInfo: session.deviceInfo,
        expiresAt,
        rotationCount: (session.rotationCount || 0) + 1,
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        session: newSession.toJSON(),
      };
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Failed to rotate refresh token: ${error.message}`);
    }
  },

  /**
   * Revoke refresh token and session
   * @param {string} refreshToken - Refresh token to revoke
   * @returns {Promise<object>} - Revoked session
   */
  async revokeRefreshToken(refreshToken) {
    try {
      const session = await RefreshSessionRepository.findByToken(refreshToken);
      if (!session) {
        throw AppError.notFound('Refresh session not found', {
          errorCode: 'SESSION_NOT_FOUND',
        });
      }

      const revokedSession = await RefreshSessionRepository.revoke(session._id);
      return revokedSession.toJSON();
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Failed to revoke refresh token: ${error.message}`);
    }
  },

  /**
   * Revoke all sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Result with modifiedCount
   */
  async revokeAllUserSessions(userId) {
    try {
      const result = await RefreshSessionRepository.revokeAllUserSessions(userId);
      return result;
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Failed to revoke user sessions: ${error.message}`);
    }
  },
};

module.exports = TokenService;
