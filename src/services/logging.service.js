const SystemLog = require('../models/SystemLog.model');

const LoggingService = {
  async create({ level = 'info', event, userId = null, requestId = null, message = '', metadata = {} }) {
    const doc = new SystemLog({ level, event, userId, requestId, message, metadata });
    return doc.save();
  },

  async recent(limit = 50) {
    return SystemLog.find().sort({ createdAt: -1 }).limit(limit).lean();
  },
};

module.exports = LoggingService;
