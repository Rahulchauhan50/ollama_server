const Message = require('../models/Message.model');

const UsageService = {
  async userUsage(userIdStr) {
    const match = { userIdStr };

    const agg = await Message.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$userIdStr',
          messageCount: { $sum: 1 },
          totalPromptTokens: { $sum: { $ifNull: [ '$metadata.tokenUsage.promptTokens', 0 ] } },
          totalCompletionTokens: { $sum: { $ifNull: [ '$metadata.tokenUsage.completionTokens', 0 ] } },
          totalTokens: { $sum: { $ifNull: [ '$metadata.tokenUsage.totalTokens', { $ifNull: [ '$metadata.tokenCount', 0 ] } ] } },
          totalOllamaDurationMs: { $sum: { $ifNull: [ '$metadata.ollamaDurationMs', 0 ] } },
        }
      }
    ]).exec();

    return agg[0] || { messageCount: 0, totalPromptTokens: 0, totalCompletionTokens: 0, totalTokens: 0, totalOllamaDurationMs: 0 };
  },

  async summary(limit = 50) {
    const agg = await Message.aggregate([
      {
        $group: {
          _id: '$userIdStr',
          messageCount: { $sum: 1 },
          totalTokens: { $sum: { $ifNull: [ '$metadata.tokenUsage.totalTokens', { $ifNull: [ '$metadata.tokenCount', 0 ] } ] } },
          totalOllamaDurationMs: { $sum: { $ifNull: [ '$metadata.ollamaDurationMs', 0 ] } },
        }
      },
      { $sort: { totalTokens: -1 } },
      { $limit: limit }
    ]).exec();

    return agg.map((r) => ({ userIdStr: r._id, messageCount: r.messageCount, totalTokens: r.totalTokens, totalOllamaDurationMs: r.totalOllamaDurationMs }));
  }
};

module.exports = UsageService;
