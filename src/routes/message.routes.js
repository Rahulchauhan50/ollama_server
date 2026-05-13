const express = require('express');
const {
  addMessage,
  getMessages,
  getMessage,
  deleteMessage,
} = require('../controllers/message.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Message routes
 * All routes require authentication
 */

/**
 * POST /api/conversations/:conversationId/messages
 * Add a message to a conversation
 */
router.post('/conversations/:conversationId/messages', requireAuth, addMessage);

/**
 * GET /api/conversations/:conversationId/messages
 * Get all messages for a conversation
 * Query params: skip, limit
 */
router.get('/conversations/:conversationId/messages', requireAuth, getMessages);

/**
 * GET /api/messages/:id
 * Get a specific message
 */
router.get('/messages/:id', requireAuth, getMessage);

/**
 * DELETE /api/messages/:id
 * Delete a message
 */
router.delete('/messages/:id', requireAuth, deleteMessage);

module.exports = router;
