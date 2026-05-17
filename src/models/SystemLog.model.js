const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema(
  {
    level: { type: String, enum: ['info', 'warn', 'error'], default: 'info', index: true },
    event: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    requestId: { type: String, default: null, index: true },
    message: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false }, collection: 'system_logs' }
);

systemLogSchema.index({ createdAt: -1 });

const SystemLog = mongoose.model('SystemLog', systemLogSchema);

module.exports = SystemLog;
