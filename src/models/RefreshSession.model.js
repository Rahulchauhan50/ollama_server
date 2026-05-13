const mongoose = require('mongoose');

/**
 * Refresh Session Schema
 * Stores refresh token sessions for token rotation and revocation
 */
const refreshSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    refreshToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    refreshTokenFamily: {
      type: String,
      default: null,
      index: true,
    },
    deviceInfo: {
      userAgent: String,
      ipAddress: String,
      deviceType: {
        type: String,
        enum: ['web', 'mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown',
      },
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    rotationCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding active sessions
refreshSessionSchema.index({ userId: 1, isRevoked: 1 });

// Index for cleanup of expired sessions
refreshSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Virtual: isActive
 * Checks if session is active (not revoked and not expired)
 */
refreshSessionSchema.virtual('isActive').get(function() {
  return !this.isRevoked && this.expiresAt > new Date();
});

/**
 * Method: toJSON
 * Returns session without sensitive fields
 */
refreshSessionSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

const RefreshSession = mongoose.model('RefreshSession', refreshSessionSchema);

module.exports = RefreshSession;
