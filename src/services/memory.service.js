const { AppError } = require('../utils');
const EmbeddingService = require('./embedding.service');
const MessageRepository = require('../repositories/message.repository');

const normalizeUserId = (userId) => {
  if (!userId) {
    return null;
  }

  if (typeof userId === 'string') {
    return userId;
  }

  return userId?.toString?.() || String(userId);
};

const MemoryService = {
  async retrieveRelevantMemories({ userId, queryText, limit = 10, threshold = 0.5 } = {}) {
    const normalizedUserId = normalizeUserId(userId);
    const normalizedQuery = typeof queryText === 'string' ? queryText.trim() : '';

    if (!normalizedUserId) {
      throw AppError.validation('userId is required');
    }

    if (!normalizedQuery) {
      throw AppError.validation('queryText must be a non-empty string');
    }

    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 10;
    const safeThreshold = typeof threshold === 'number' && threshold >= 0 && threshold <= 1
      ? threshold
      : 0.5;

    const queryEmbedding = await EmbeddingService.createTextEmbedding(normalizedQuery);
    const similarMessages = await MessageRepository.findSimilarByUserId(
      normalizedUserId,
      queryEmbedding,
      {
        limit: safeLimit,
        threshold: safeThreshold,
      }
    );

    return similarMessages.map((message) => ({
      messageId: message._id?.toString?.() || String(message._id),
      content: message.content,
      role: message.role,
      score: Number((message.similarity ?? 0).toFixed(4)),
      createdAt: message.createdAt,
    }));
  },
};

module.exports = MemoryService;