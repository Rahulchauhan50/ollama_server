const express = require('express');
const { getAdminStatus } = require('../controllers/admin.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireAdmin } = require('../middleware/admin');

const router = express.Router();

/**
 * Admin routes
 * All admin routes require authentication and admin role
 */

/**
 * GET /api/admin/status
 * Get admin panel status
 * Requires: Authentication + Admin role
 */
router.get('/status', requireAuth, requireAdmin, getAdminStatus);

// Ollama internals
router.get('/ollama/tags', requireAuth, requireAdmin, getOllamaTags);
router.get('/ollama/ps', requireAuth, requireAdmin, getOllamaPs);

// Counts
router.get('/users/count', requireAuth, requireAdmin, getCounts);
router.get('/conversations/count', requireAuth, requireAdmin, getCounts);
router.get('/messages/count', requireAuth, requireAdmin, getCounts);

module.exports = router;
