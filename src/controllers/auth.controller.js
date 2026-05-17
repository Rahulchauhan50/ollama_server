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
    const { user, accessToken, refreshToken } = await AuthService.login(
      validation.data.email,
      validation.data.password
    );

    // Return 200 OK with user data and tokens
    res.status(200).json(
      ApiResponse.success(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileUrl: user.profileUrl || null,
          },
          accessToken,
          refreshToken,
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
            profileUrl: user.profileUrl || null,
          },
        },
        'User profile retrieved successfully',
        200,
        requestId
      )
    );
  }),

  getUsage: asyncHandler(async (req, res) => {
    const UsageService = require('../services/usage.service');
    const userIdStr = req.user._id?.toString?.() || String(req.user._id);
    const usage = await UsageService.userUsage(userIdStr);
    res.status(200).json(ApiResponse.success({ usage }, 'User usage retrieved', 200, req.requestId));
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

  /**
   * Handle Google sign-in / sign-up
   * POST /api/auth/google
   */
  google: asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const requestId = req.requestId;

    if (!idToken || typeof idToken !== 'string') {
      throw AppError.validation('Validation failed', {
        errors: [{ field: 'idToken', message: 'idToken is required' }],
      });
    }

    const { user, accessToken, refreshToken } = await AuthService.signInWithGoogle(idToken);

    res.status(200).json(
      ApiResponse.success(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            profileUrl: user.profileUrl || null,
          },
          accessToken,
          refreshToken,
        },
        'Google authentication successful',
        200,
        requestId
      )
    );
  }),

  /**
   * Verify Firebase ID token and sign in/up
   * POST /api/auth/firebase
   */
  firebase: asyncHandler(async (req, res) => {
    const { idToken } = req.body;
    const requestId = req.requestId;

    if (!idToken || typeof idToken !== 'string') {
      throw AppError.validation('Validation failed', {
        errors: [{ field: 'idToken', message: 'idToken is required' }],
      });
    }

    const FirebaseService = require('../services/firebase.service');
    const payload = await FirebaseService.verifyIdToken(idToken);

    // payload contains email, name, picture, uid
    const AuthService = require('../services/auth.service');
    const { user, accessToken, refreshToken } = await AuthService.signInWithFirebasePayload(payload);

    res.status(200).json(
      ApiResponse.success(
        {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
              role: user.role,
              profileUrl: user.profileUrl || null,
          },
          accessToken,
          refreshToken,
        },
        'Firebase authentication successful',
        200,
        requestId
      )
    );
  }),

  /**
   * Redirect to Google's OAuth consent screen
   * GET /api/auth/google
   */
  googleRedirect: asyncHandler(async (req, res) => {
    const requestId = req.requestId;
    const GoogleService = require('../services/google.service');

    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const state = req.query.state || undefined;
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw AppError.internal('GOOGLE_CLIENT_ID is not configured');
    }

    const authUrl = GoogleService.getAuthUrl(redirectUri, state);
    res.redirect(authUrl);
  }),

  /**
   * OAuth callback
   * GET /api/auth/google/callback
   */
  googleCallback: asyncHandler(async (req, res) => {
    const requestId = req.requestId;
    const { code } = req.query;
    if (!code) {
      throw AppError.validation('Authorization code missing');
    }

    const GoogleService = require('../services/google.service');
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${req.protocol}://${req.get('host')}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenResp = await GoogleService.exchangeCodeForTokens(code, redirectUri);

    const accessToken = tokenResp.access_token;
    const idToken = tokenResp.id_token;

    // Prefer fetching profile via access token
    const profile = accessToken ? await GoogleService.getUserInfo(accessToken) : null;

    // Fallback to decode id_token payload if needed
    const profilePayload = profile || (idToken ? require('jsonwebtoken').decode(idToken) : null);
    if (!profilePayload || !profilePayload.email) {
      throw AppError.unauthorized('Unable to obtain user profile from Google');
    }

    // Sign in / up using profile payload
    const AuthService = require('../services/auth.service');
    const { user, accessToken: appAccessToken, refreshToken } = await AuthService.signInWithGooglePayload(profilePayload);

    // Redirect to frontend if configured
    const frontend = process.env.FRONTEND_URL;
    if (frontend) {
      const url = new URL(frontend);
      url.pathname = '/auth/callback';
      url.searchParams.set('accessToken', appAccessToken);
      url.searchParams.set('refreshToken', refreshToken);
      return res.redirect(url.toString());
    }

    // Otherwise return JSON
    res.status(200).json(ApiResponse.success({ user, accessToken: appAccessToken, refreshToken }, 'Google OAuth successful', 200, requestId));
  }),
};

module.exports = AuthController;
