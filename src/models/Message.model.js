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
    userIdStr: {
      type: String,
      default: null,
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
    embedding: {
      type: [Number],
      default: null,
      // Primary vector field used for memory search phases
    },
    embeddings: {
      type: [Number],
      default: null,
      // Will be indexed as vector in Phase 20
    },
    embeddingModel: {
      type: String,
      default: null,
    },
    embeddingDim: {
      type: Number,
      default: null,
    },
    isMemoryEligible: {
      type: Boolean,
      default: false,
    },
    metadata: {
      tokenCount: Number,
      modelUsed: String,
      temperature: Number,
      aiFailed: Boolean,
      aiErrorCode: String,
      aiErrorMessage: String,
      embeddingFailed: Boolean,
      // Phase 37: usage tracking
      ollamaDurationMs: Number,
      tokenUsage: {
        promptTokens: Number,
        completionTokens: Number,
        totalTokens: Number,
      },
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
messageSchema.index({ userIdStr: 1, role: 1, isMemoryEligible: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
