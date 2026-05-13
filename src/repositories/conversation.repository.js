const Conversation = require('../models/Conversation.model');

const ConversationRepository = {
  async create(userId, data) {
    const conversation = new Conversation({
      userId,
      title: data.title || 'New Conversation',
      description: data.description,
      model: data.model,
    });
    return conversation.save();
  },

  async findById(conversationId, userId = null) {
    const conversation = await Conversation.findById(conversationId);
    // Verify ownership if userId provided
    if (conversation && userId && conversation.userId.toString() !== userId.toString()) {
      return null;
    }
    return conversation;
  },

  async findByUserId(userId, options = {}) {
    const {
      skip = 0,
      limit = 20,
      archived = null,
    } = options;

    const query = { userId };
    if (archived !== null) {
      query.isArchived = archived;
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Conversation.countDocuments(query),
    ]);

    return { conversations, total };
  },

  async updateById(conversationId, userId, data) {
    const conversation = await Conversation.findById(conversationId);

    // Verify ownership
    if (!conversation || conversation.userId.toString() !== userId.toString()) {
      return null;
    }

    // Update allowed fields
    if (data.title !== undefined) {
      conversation.title = data.title;
    }
    if (data.description !== undefined) {
      conversation.description = data.description;
    }
    if (data.model !== undefined) {
      conversation.model = data.model;
    }
    if (data.isArchived !== undefined) {
      conversation.isArchived = data.isArchived;
    }

    return conversation.save();
  },

  async deleteById(conversationId, userId) {
    const conversation = await Conversation.findById(conversationId);

    // Verify ownership
    if (!conversation || conversation.userId.toString() !== userId.toString()) {
      return false;
    }

    await Conversation.deleteOne({ _id: conversationId });
    return true;
  },

  async incrementMessageCount(conversationId) {
    return Conversation.findByIdAndUpdate(
      conversationId,
      {
        $inc: { messageCount: 1 },
        lastMessageAt: new Date(),
      },
      { new: true }
    );
  },

  async decrementMessageCount(conversationId) {
    return Conversation.findByIdAndUpdate(
      conversationId,
      { $inc: { messageCount: -1 } },
      { new: true }
    );
  },
};

module.exports = ConversationRepository;
