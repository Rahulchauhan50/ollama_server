const Message = require('../models/Message.model');
const Conversation = require('../models/Conversation.model');
const EmbeddingService = require('../services/embedding.service');

const MessageRepository = {
  async create(conversationId, data) {
    const {
      skipEmbedding = false,
      embedding: explicitEmbedding = null,
      embeddings: explicitEmbeddings = null,
      ...messageData
    } = data;

    let embedding = explicitEmbedding || explicitEmbeddings || null;
    let embeddings = explicitEmbeddings || explicitEmbedding || null;

    if (!skipEmbedding && !embedding && !embeddings && messageData.role === 'user') {
      embedding = await EmbeddingService.generateEmbeddings(messageData.content);
      embeddings = embedding;
    }

    const message = new Message({
      conversationId,
      userIdStr: messageData.userIdStr || null,
      role: messageData.role,
      content: messageData.content,
      metadata: messageData.metadata,
      embedding,
      embeddings,
      embeddingModel: messageData.embeddingModel || null,
      embeddingDim: messageData.embeddingDim || null,
      isMemoryEligible: messageData.isMemoryEligible || false,
    });
    const saved = await message.save();

    // Update conversation's message count and lastMessageAt
    await Conversation.findByIdAndUpdate(
      conversationId,
      {
        $inc: { messageCount: 1 },
        lastMessageAt: new Date(),
      }
    );

    return saved;
  },

  async findById(messageId) {
    return Message.findById(messageId);
  },

  async findByConversationId(conversationId, options = {}) {
    const {
      skip = 0,
      limit = 50,
    } = options;

    const [messages, total] = await Promise.all([
      Message.find({ conversationId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Message.countDocuments({ conversationId }),
    ]);

    return { messages, total };
  },

  async deleteById(messageId, conversationId) {
    const message = await Message.findByIdAndDelete(messageId);

    if (message) {
      // Update conversation's message count
      await Conversation.findByIdAndUpdate(
        conversationId,
        { $inc: { messageCount: -1 } }
      );
    }

    return message;
  },

  async updateEmbeddings(messageId, embeddings) {
    const update = Array.isArray(embeddings)
      ? {
          embedding: embeddings,
          embeddings,
          embeddingDim: embeddings.length,
        }
      : {
          embedding: embeddings.embedding || embeddings.embeddings || null,
          embeddings: embeddings.embedding || embeddings.embeddings || null,
          embeddingModel: embeddings.embeddingModel,
          embeddingDim: embeddings.embeddingDim,
          isMemoryEligible: embeddings.isMemoryEligible,
        };

    return Message.findByIdAndUpdate(
      messageId,
      update,
      { new: true }
    );
  },

  async updateMetadata(messageId, metadata) {
    return Message.findByIdAndUpdate(
      messageId,
      { metadata },
      { new: true }
    );
  },

  async findByConversationIdBatch(conversationId, limit = 10) {
    return Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  /**
   * Find messages similar to query text using semantic search
   * @param {string} conversationId - Conversation ID to search within
   * @param {number[]} queryEmbedding - Embedding vector of query
   * @param {Object} options - Search options
   * @returns {Promise<Object[]>} Array of similar messages with similarity scores
   */
  async findSimilarByEmbedding(conversationId, queryEmbedding, options = {}) {
    const {
      limit = 10,
      threshold = 0.5,
    } = options;

    // Get all messages in conversation that have embeddings
    const messages = await Message.find({
      conversationId,
      $or: [
        { embedding: { $exists: true, $ne: null } },
        { embeddings: { $exists: true, $ne: null } },
      ],
    })
      .sort({ createdAt: -1 })
      .lean();

    // Use embedding service to find similar messages
    const similarMessages = EmbeddingService.findSimilarEmbeddings(
      queryEmbedding,
      messages.map((message) => ({
        ...message,
        embeddings: message.embedding || message.embeddings,
      })),
      threshold
    );

    // Return top N results
    return similarMessages.slice(0, limit);
  },

  /**
   * Get messages with embeddings for a conversation
   * Used for building context for semantic search
   * @param {string} conversationId - Conversation ID
   * @param {number} limit - Maximum number of messages to return
   * @returns {Promise<Object[]>} Messages that have embeddings
   */
  async findWithEmbeddingsByConversationId(conversationId, limit = 50) {
    return Message.find({
      conversationId,
      $or: [
        { embedding: { $exists: true, $ne: null } },
        { embeddings: { $exists: true, $ne: null } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  async findWithEmbeddingsByUserId(userIdStr, limit = 50, includeAll = false) {
    const query = {
      userIdStr,
      $or: [
        { embedding: { $exists: true, $ne: null } },
        { embeddings: { $exists: true, $ne: null } },
      ],
    };

    if (!includeAll) {
      query.isMemoryEligible = true;
    }

    return Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  },

  async findSimilarByUserId(userIdStr, queryEmbedding, options = {}) {
    const {
      limit = 10,
      threshold = 0.5,
      includeAll = false,
    } = options;

    const messages = await this.findWithEmbeddingsByUserId(userIdStr, limit * 5, includeAll);
    const similarMessages = EmbeddingService.findSimilarEmbeddings(
      queryEmbedding,
      messages.map((message) => ({
        ...message,
        embeddings: message.embedding || message.embeddings,
      })),
      threshold
    );

    return similarMessages.slice(0, limit);
  },
};

module.exports = MessageRepository;
