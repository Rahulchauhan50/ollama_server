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

module.exports = router;
