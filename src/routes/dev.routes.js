const express = require('express');
const { ApiResponse, AppError } = require('../utils');
const { requireAuth } = require('../middleware/auth.middleware');
const EmbeddingService = require('../services/embedding.service');

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

module.exports = router;