const express = require('express');
const { checkAiHealth } = require('../controllers/health.controller');

const router = express.Router();

/**
 * Health check routes
 */

/**
 * GET /api/health/ai
 * Check Ollama AI server health
 * Public endpoint (no auth required)
 */
router.get('/ai', checkAiHealth);

module.exports = router;
