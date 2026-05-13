const express = require('express');
const {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
} = require('../controllers/conversation.controller');
const { chatConversation } = require('../controllers/chat.controller');
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
 * POST /api/conversations/:id/chat
 * Send a chat message to a conversation and get AI response
 */
router.post('/:conversationId/chat', requireAuth, chatConversation);

/**
 * DELETE /api/conversations/:id
 * Delete a conversation
 */
router.delete('/:id', requireAuth, deleteConversation);

module.exports = router;
