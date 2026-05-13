const RefreshSession = require('../models/RefreshSession.model');
const { AppError } = require('../utils');

/**
 * Refresh Session Repository
 * Handles database operations for refresh sessions
 */
class RefreshSessionRepository {
  /**
   * Create a new refresh session
   * @param {object} sessionData - Session data
   * @returns {Promise<object>} - Created session
   */
  static async create(sessionData) {
    try {
      const session = new RefreshSession(sessionData);
      await session.save();
      return session;
    } catch (error) {
      if (error.code === 11000) {
        throw AppError.conflict('Refresh token already exists');
      }
      throw error;
    }
  }

  /**
   * Find session by refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<object|null>} - Session or null
   */
  static async findByToken(refreshToken) {
    return RefreshSession.findOne({ refreshToken });
  }

  /**
   * Find session by ID
   * @param {string} sessionId - Session ID
   * @returns {Promise<object|null>} - Session or null
   */
  static async findById(sessionId) {
    return RefreshSession.findById(sessionId);
  }

  /**
   * Find all active sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<array>} - Array of sessions
   */
  static async findActiveSessionsByUserId(userId) {
    return RefreshSession.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });
  }

  /**
   * Find all sessions for a user (including revoked)
   * @param {string} userId - User ID
   * @returns {Promise<array>} - Array of sessions
   */
  static async findAllSessionsByUserId(userId) {
    return RefreshSession.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Update refresh session
   * @param {string} sessionId - Session ID
   * @param {object} updateData - Data to update
   * @returns {Promise<object>} - Updated session
   */
  static async update(sessionId, updateData) {
    const session = await RefreshSession.findByIdAndUpdate(
      sessionId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!session) {
      throw AppError.notFound('Refresh session not found');
    }

    return session;
  }

  /**
   * Revoke a refresh session
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} - Updated session
   */
  static async revoke(sessionId) {
    const session = await RefreshSession.findByIdAndUpdate(
      sessionId,
      {
        isRevoked: true,
        revokedAt: new Date(),
      },
      { new: true }
    );

    if (!session) {
      throw AppError.notFound('Refresh session not found');
    }

    return session;
  }

  /**
   * Revoke all sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<object>} - Result with deletedCount
   */
  static async revokeAllUserSessions(userId) {
    const result = await RefreshSession.updateMany(
      { userId, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      }
    );

    return result;
  }

  /**
   * Revoke sessions by refresh token family (for security)
   * @param {string} refreshTokenFamily - Token family ID
   * @returns {Promise<object>} - Result with modifiedCount
   */
  static async revokeTokenFamily(refreshTokenFamily) {
    if (!refreshTokenFamily) {
      throw AppError.badRequest('Refresh token family is required');
    }

    const result = await RefreshSession.updateMany(
      { refreshTokenFamily, isRevoked: false },
      {
        isRevoked: true,
        revokedAt: new Date(),
      }
    );

    return result;
  }

  /**
   * Delete a refresh session
   * @param {string} sessionId - Session ID
   * @returns {Promise<object>} - Deleted session
   */
  static async delete(sessionId) {
    const session = await RefreshSession.findByIdAndDelete(sessionId);

    if (!session) {
      throw AppError.notFound('Refresh session not found');
    }

    return session;
  }

  /**
   * Clean up expired sessions
   * @returns {Promise<object>} - Result with deletedCount
   */
  static async cleanupExpiredSessions() {
    const result = await RefreshSession.deleteMany({
      expiresAt: { $lt: new Date() },
    });

    return result;
  }

  /**
   * Count active sessions for a user
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Count of active sessions
   */
  static async countActiveSessions(userId) {
    return RefreshSession.countDocuments({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() },
    });
  }
}

module.exports = RefreshSessionRepository;
