const bcrypt = require('bcrypt');
const { AppError } = require('../utils');

const SALT_ROUNDS = 10;

/**
 * Password Hashing Service
 * Provides secure password hashing and comparison using bcrypt
 */
const PasswordService = {
  /**
   * Hash a plain password
   * @param {string} password - Plain text password to hash
   * @returns {Promise<string>} - Hashed password
   * @throws {AppError} - If password is invalid or hashing fails
   */
  async hashPassword(password) {
    try {
      if (!password || typeof password !== 'string') {
        throw AppError.validation('Password must be a non-empty string');
      }

      if (password.length < 8) {
        throw AppError.validation('Password must be at least 8 characters long');
      }

      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      return hash;
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Failed to hash password: ${error.message}`);
    }
  },

  /**
   * Compare a plain password with a hash
   * @param {string} password - Plain text password to check
   * @param {string} passwordHash - Hashed password to compare against
   * @returns {Promise<boolean>} - True if password matches hash, false otherwise
   * @throws {AppError} - If comparison fails
   */
  async comparePassword(password, passwordHash) {
    try {
      if (!password || typeof password !== 'string') {
        throw AppError.validation('Password must be a non-empty string');
      }

      if (!passwordHash || typeof passwordHash !== 'string') {
        throw AppError.validation('Password hash must be a non-empty string');
      }

      const isMatch = await bcrypt.compare(password, passwordHash);
      return isMatch;
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Failed to compare password: ${error.message}`);
    }
  },
};

module.exports = PasswordService;
