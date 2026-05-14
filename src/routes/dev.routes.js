const express = require('express');
const { ApiResponse, AppError } = require('../utils');
const { requireAuth } = require('../middleware/auth.middleware');
const EmbeddingService = require('../services/embedding.service');
const MessageRepository = require('../repositories/message.repository');

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

    const queryEmbedding = await EmbeddingService.createTextEmbedding(query.trim());
    const matches = await MessageRepository.findSimilarByUserId(
      req.user._id?.toString?.() || String(req.user._id),
      queryEmbedding,
      {
        limit: Number.isInteger(limit) ? limit : 10,
        threshold: 0.5,
      }
    );

    const response = ApiResponse.success(
      {
        query,
        matches: matches.map((message) => ({
          id: message._id,
          content: message.content,
          role: message.role,
          score: Number(message.similarity.toFixed(4)),
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

module.exports = router;