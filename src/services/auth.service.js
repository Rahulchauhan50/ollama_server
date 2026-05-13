const UserRepository = require('../repositories/user.repository');
const PasswordService = require('./password.service');
const TokenService = require('./token.service');
const { AppError } = require('../utils');

/**
 * Authentication Service
 * Handles user signup, login, and profile retrieval
 */
const AuthService = {
  /**
   * Sign up a new user
   * @param {string} name - User's full name
   * @param {string} email - User's email address
   * @param {string} password - User's plain password
   * @returns {Promise<object>} - Created user object (without password)
   * @throws {AppError} - If signup fails
   */
  async signup(name, email, password) {
    try {
      // Check if email already exists
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        throw AppError.conflict('An account with this email already exists', {
          email,
          errorCode: 'EMAIL_ALREADY_EXISTS',
        });
      }

      // Hash the password
      const passwordHash = await PasswordService.hashPassword(password);

      // Create new user with hashed password
      const newUser = await UserRepository.create({
        name,
        email,
        passwordHash,
      });

      // Convert to JSON (which excludes passwordHash)
      return newUser.toJSON();
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Signup failed: ${error.message}`);
    }
  },

  /**
   * Log in an existing user
   * @param {string} email - User's email address
   * @param {string} password - User's plain password
   * @returns {Promise<object>} - User object and accessToken
   * @throws {AppError} - If login fails
   */
  async login(email, password) {
    try {
      // Find user by email (with password)
      const user = await UserRepository.findByEmailWithPassword(email);
      if (!user) {
        // Generic error - don't reveal whether email exists
        throw AppError.unauthorized('Invalid email or password', {
          errorCode: 'AUTH_INVALID_CREDENTIALS',
        });
      }

      // Compare password
      const isPasswordValid = await PasswordService.comparePassword(
        password,
        user.passwordHash
      );
      if (!isPasswordValid) {
        // Generic error - don't reveal password was wrong
        throw AppError.unauthorized('Invalid email or password', {
          errorCode: 'AUTH_INVALID_CREDENTIALS',
        });
      }

      // Update last login timestamp
      await UserRepository.updateLastLogin(user._id);

      // Generate JWT access token using TokenService
      const accessToken = TokenService.signAccessToken(user);

      // Create refresh session
      const { refreshToken } = await TokenService.createRefreshSession(
        user._id.toString(),
        { email: user.email }
      );

      // Return user (without password), access token, and refresh token
      return {
        user: user.toJSON(),
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Login failed: ${error.message}`);
    }
  },

  /**
   * Logout user and revoke refresh token
   * @param {string} userId - User's ID
   * @param {string} refreshToken - Refresh token to revoke
   * @returns {Promise<object>} - Logout result
   * @throws {AppError} - If logout fails
   */
  async logout(userId, refreshToken) {
    try {
      if (!userId) {
        throw AppError.badRequest('User ID is required');
      }

      if (refreshToken) {
        // Revoke the specific refresh token
        await TokenService.revokeRefreshToken(refreshToken);
      }

      return {
        success: true,
        message: 'Logout successful',
      };
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Logout failed: ${error.message}`);
    }
  },

  /**
   * Logout user from all devices
   * @param {string} userId - User's ID
   * @returns {Promise<object>} - Logout result
   * @throws {AppError} - If logout fails
   */
  async logoutAll(userId) {
    try {
      if (!userId) {
        throw AppError.badRequest('User ID is required');
      }

      // Revoke all refresh sessions for user
      await TokenService.revokeAllUserSessions(userId);

      return {
        success: true,
        message: 'Logged out from all devices',
      };
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Logout all failed: ${error.message}`);
    }
  },

  /**
   * Get current user profile
   * @param {string} userId - User's ID
   * @returns {Promise<object>} - User object (without password)
   * @throws {AppError} - If user not found
   */
  async getCurrentUser(userId) {
    try {
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('User not found', {
          userId,
          errorCode: 'USER_NOT_FOUND',
        });
      }
      return user.toJSON();
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Failed to get user profile: ${error.message}`);
    }
  },

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<object>} - New tokens
   * @throws {AppError} - If refresh fails
   */
  async refresh(refreshToken) {
    try {
      // Rotate refresh token (validates and generates new tokens)
      const result = await TokenService.rotateRefreshToken(refreshToken);

      return {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
    } catch (error) {
      if (error.isCustom) {
        throw error;
      }
      throw AppError.internal(`Refresh token failed: ${error.message}`);
    }
  },
};

module.exports = AuthService;
