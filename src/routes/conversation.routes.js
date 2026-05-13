const express = require('express');
const {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} = require('../controllers/conversation.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Conversation routes
 * All routes require authentication
 */

/**
 * POST /api/conversations
 * Create a new conversation
 */
router.post('/', requireAuth, createConversation);

/**
 * GET /api/conversations
 * List all conversations for the authenticated user
 * Query params: skip, limit, archived
 */
router.get('/', requireAuth, listConversations);

/**
 * GET /api/conversations/:id
 * Get a specific conversation
 */
router.get('/:id', requireAuth, getConversation);

/**
 * PUT /api/conversations/:id
 * Update a conversation (title, description, model, isArchived)
 */
router.put('/:id', requireAuth, updateConversation);

/**
 * DELETE /api/conversations/:id
 * Delete a conversation
 */
router.delete('/:id', requireAuth, deleteConversation);

module.exports = router;
