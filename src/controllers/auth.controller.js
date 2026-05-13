const AuthService = require('../services/auth.service');
const { validateSignup, validateLogin } = require('../validators/auth.validators');
const { AppError, ApiResponse, asyncHandler } = require('../utils');

/**
 * Authentication Controller
 * Handles authentication-related HTTP requests
 */
const AuthController = {
  /**
   * Handle user signup request
   * POST /api/auth/signup
   */
  signup: asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const requestId = req.requestId;

    // Validate request data
    const validation = validateSignup({ name, email, password });
    if (!validation.isValid) {
      throw AppError.validation('Validation failed', {
        errors: validation.errors,
      });
    }

    // Perform signup
    const user = await AuthService.signup(
      validation.data.name,
      validation.data.email,
      validation.data.password
    );

    // Return 201 Created with user data
    res.status(201).json(
      ApiResponse.created(
        {
          user,
        },
        'Signup successful',
        requestId
      )
    );
  }),

  /**
   * Handle user login request
   * POST /api/auth/login
   */
  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const requestId = req.requestId;

    // Validate request data
    const validation = validateLogin({ email, password });
    if (!validation.isValid) {
      throw AppError.validation('Validation failed', {
        errors: validation.errors,
      });
    }

    // Perform login
    const { user, accessToken } = await AuthService.login(
      validation.data.email,
      validation.data.password
    );

    // Return 200 OK with user data and token
    res.status(200).json(
      ApiResponse.success(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
          accessToken,
        },
        'Login successful',
        200,
        requestId
      )
    );
  }),

  /**
   * Handle get current user request
   * GET /api/auth/me
   */
  getCurrentUser: asyncHandler(async (req, res) => {
    const requestId = req.requestId;

    // User is already attached to req by auth middleware
    const user = req.user;

    // Return 200 OK with user data
    res.status(200).json(
      ApiResponse.success(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        },
        'User profile retrieved successfully',
        200,
        requestId
      )
    );
  }),

  /**
   * Handle refresh token request
   * POST /api/auth/refresh
   */
  refresh: asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const requestId = req.requestId;

    if (!refreshToken) {
      throw AppError.validation('Validation failed', {
        errors: [{ field: 'refreshToken', message: 'Refresh token is required' }],
      });
    }

    // Rotate refresh token
    const { accessToken, refreshToken: newRefreshToken } = 
      await AuthService.refresh(refreshToken);

    // Return 200 OK with new tokens
    res.status(200).json(
      ApiResponse.success(
        {
          accessToken,
          refreshToken: newRefreshToken,
        },
        'Tokens refreshed successfully',
        200,
        requestId
      )
    );
  }),

  /**
   * Handle logout request
   * POST /api/auth/logout
   */
  logout: asyncHandler(async (req, res) => {
    const requestId = req.requestId;
    const userId = req.user._id;
    const { refreshToken } = req.body;

    // Logout user
    await AuthService.logout(userId.toString(), refreshToken);

    // Return 200 OK
    res.status(200).json(
      ApiResponse.success(
        {},
        'Logout successful',
        200,
        requestId
      )
    );
  }),
};

module.exports = AuthController;
