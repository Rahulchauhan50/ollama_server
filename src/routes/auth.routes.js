const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Auth routes
 */

// POST /api/auth/signup - User registration
router.post('/signup', AuthController.signup);

/**
 * POST /api/auth/login
 * User login
 */
router.post('/login', AuthController.login);

// OAuth redirect flow
router.get('/google', AuthController.googleRedirect);
router.get('/google/callback', AuthController.googleCallback);

/**
 * POST /api/auth/google
 * Sign in / Sign up using Google ID token
 */
router.post('/google', AuthController.google);

// POST /api/auth/firebase - verify Firebase ID token
router.post('/firebase', AuthController.firebase);

/**
 * GET /api/auth/me
 * Get current user (requires authentication)
 */
router.get('/me', requireAuth, AuthController.getCurrentUser);

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', AuthController.refresh);

/**
 * POST /api/auth/logout
 * User logout (requires authentication)
 */
router.post('/logout', requireAuth, AuthController.logout);

module.exports = router;
