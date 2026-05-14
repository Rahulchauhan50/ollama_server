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

  /**
   * Sign in or sign up using Google ID token
   * @param {string} idToken
   */
  async signInWithGoogle(idToken) {
    try {
      const GoogleService = require('./google.service');
      const payload = await GoogleService.verifyIdToken(idToken);

      const email = payload.email;
      const name = payload.name || 'Google User';
      const googleId = payload.sub;
      const profileUrl = payload.picture || null;

      if (!email) {
        throw AppError.validation('Google token did not contain email');
      }

      // Check if user exists
      let user = await UserRepository.findByEmail(email);

      if (user) {
        // If existing user, attach googleId if missing
        if (!user.googleId && googleId) {
          try {
            user = await UserRepository.update(user._id, { isEmailVerified: true });
            // directly set googleId via repository create/update may be required; use findById then set and save
            const existing = await UserRepository.findById(user._id);
            existing.googleId = googleId;
            if (profileUrl && !existing.profileUrl) {
              existing.profileUrl = profileUrl;
            }
            await existing.save();
          } catch (err) {
            // non-fatal
          }
        }
      } else {
        // Create new user; generate a random password hash so schema constraint satisfied
        const PasswordService = require('./password.service');
        const randomPassword = Math.random().toString(36);
        const passwordHash = await PasswordService.hashPassword(randomPassword);

        const newUser = await UserRepository.create({
          name,
          email,
          passwordHash,
          isEmailVerified: true,
          googleId,
          profileUrl,
        });

        user = newUser;
      }

      // Update last login
      await UserRepository.updateLastLogin(user._id);

      const accessToken = TokenService.signAccessToken(user);
      const { refreshToken } = await TokenService.createRefreshSession(user._id.toString(), { email: user.email });

      return {
        user: user.toJSON ? user.toJSON() : user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error.isCustom) throw error;
      throw AppError.internal(`Google sign-in failed: ${error.message}`);
    }
  },

  /**
   * Sign in or sign up using Google profile payload
   * @param {object} payload - Google profile payload (must include email, sub)
   */
  async signInWithGooglePayload(payload) {
    try {
      const email = payload.email;
      const name = payload.name || payload.full_name || 'Google User';
      const googleId = payload.sub || payload.sub;
      const profileUrl = payload.picture || null;

      if (!email) {
        throw AppError.validation('Google profile did not contain email');
      }

      // Check if user exists
      let user = await UserRepository.findByEmail(email);

      if (user) {
        // attach googleId if missing
        if (!user.googleId && googleId) {
          try {
            const existing = await UserRepository.findById(user._id);
            existing.googleId = googleId;
            existing.isEmailVerified = true;
            if (profileUrl && !existing.profileUrl) {
              existing.profileUrl = profileUrl;
            }
            await existing.save();
            user = existing;
          } catch (err) {
            // ignore
          }
        }
      } else {
        const PasswordService = require('./password.service');
        const randomPassword = Math.random().toString(36);
        const passwordHash = await PasswordService.hashPassword(randomPassword);

        const newUser = await UserRepository.create({
          name,
          email,
          passwordHash,
          isEmailVerified: true,
          googleId,
          profileUrl,
        });

        user = newUser;
      }

      // Update last login
      await UserRepository.updateLastLogin(user._id);

      const accessToken = TokenService.signAccessToken(user);
      const { refreshToken } = await TokenService.createRefreshSession(user._id.toString(), { email: user.email });

      return {
        user: user.toJSON ? user.toJSON() : user,
        accessToken,
        refreshToken,
      };
    } catch (error) {
      if (error.isCustom) throw error;
      throw AppError.internal(`Google sign-in failed: ${error.message}`);
    }
  },

  /**
   * Sign in/up using Firebase token payload
   * @param {object} payload - Firebase decoded token (contains uid, email, name, picture)
   */
  async signInWithFirebasePayload(payload) {
    try {
      // Map Firebase payload to similar shape as Google
      const mapped = {
        email: payload.email,
        name: payload.name || payload.displayName || '',
        sub: payload.uid,
        picture: payload.picture || payload.photoURL,
      };

      return await this.signInWithGooglePayload(mapped);
    } catch (error) {
      if (error.isCustom) throw error;
      throw AppError.internal(`Firebase sign-in failed: ${error.message}`);
    }
  },
};

module.exports = AuthService;
