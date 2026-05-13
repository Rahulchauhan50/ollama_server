const mongoose = require('mongoose');

// Message Schema
const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'assistant'],
        message: 'Role must be either "user" or "assistant"',
      },
      required: [true, 'Role is required'],
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [10000, 'Message content must not exceed 10000 characters'],
    },
    embeddings: {
      type: [Number],
      default: null,
      // Will be indexed as vector in Phase 20
    },
    metadata: {
      tokenCount: Number,
      modelUsed: String,
      temperature: Number,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'messages',
  }
);

// Index for fast message retrieval
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ conversationId: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
