const express = require('express');
const { ApiResponse, AppError } = require('../utils');
const { requireAuth } = require('../middleware/auth.middleware');
const EmbeddingService = require('../services/embedding.service');
const MemoryService = require('../services/memory.service');
const SummarizerService = require('../services/summarizer.service');

const router = express.Router();

/**
 * Development-only routes
 */
router.post('/embeddings/test', requireAuth, async (req, res, next) => {
  try {
    const { text } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      throw AppError.validation('Text must be a non-empty string');
    }

    const embedding = await EmbeddingService.createTextEmbedding(text.trim());
    const response = ApiResponse.success(
      {
        dimension: embedding.length,
        embeddingPreview: embedding.slice(0, 3),
        embedding,
      },
      'Embedding generated',
      200,
      req.requestId
    );

    return res.status(response.statusCode).json(response.toJSON());
  } catch (error) {
    return next(error);
  }
});

router.post('/memory/search', requireAuth, async (req, res, next) => {
  try {
    const { query, limit } = req.body || {};

    if (!query || typeof query !== 'string' || !query.trim()) {
      throw AppError.validation('Query must be a non-empty string');
    }

    const memories = await MemoryService.retrieveRelevantMemories({
      userId: req.user._id,
      queryText: query.trim(),
      limit: Number.isInteger(limit) ? limit : 10,
      threshold: 0.5,
    });

    const response = ApiResponse.success(
      {
        query,
        matches: memories.map((memory) => ({
          id: memory.messageId,
          content: memory.content,
          role: memory.role,
          score: memory.score,
          createdAt: memory.createdAt,
        })),
      },
      'Memory search completed',
      200,
      req.requestId
    );

    return res.status(response.statusCode).json(response.toJSON());
  } catch (error) {
    return next(error);
  }
});

router.post('/conversations/:conversationId/summarize', requireAuth, async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { limit } = req.body || {};

    const result = await SummarizerService.summarizeConversation({
      conversationId,
      userId: req.user._id,
      limit: Number.isInteger(limit) ? limit : 50,
    });

    if (!result) {
      throw new Error('No messages to summarize');
    }

    const response = ApiResponse.success({ summary: result.summary }, 'Conversation summarized', 200, req.requestId);
    return res.status(response.statusCode).json(response.toJSON());
  } catch (error) {
    return next(error);
  }
});

module.exports = router;