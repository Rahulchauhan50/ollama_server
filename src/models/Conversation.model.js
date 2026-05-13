const mongoose = require('mongoose');

// Conversation Schema
const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'New Conversation',
      trim: true,
      maxlength: [200, 'Title must not exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description must not exceed 1000 characters'],
    },
    model: {
      type: String,
      default: 'llama2',
      required: [true, 'Model is required'],
    },
    messageCount: {
      type: Number,
      default: 0,
      min: [0, 'Message count cannot be negative'],
    },
    lastMessageAt: {
      type: Date,
      default: null,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'conversations',
  }
);

// Index for fast user lookups with sorting
conversationSchema.index({ userId: 1, createdAt: -1 });
conversationSchema.index({ userId: 1, isArchived: 1 });
conversationSchema.index({ userId: 1, isPinned: 1 });

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
