const { asyncHandler } = require('../utils');
const { ApiResponse } = require('../utils');
const { AppError } = require('../utils');
const MessageRepository = require('../repositories/message.repository');
const ConversationRepository = require('../repositories/conversation.repository');
const { z } = require('zod');

// Validation schemas
const createMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(10000),
  metadata: z.object({
    tokenCount: z.number().optional(),
    modelUsed: z.string().optional(),
    temperature: z.number().optional(),
  }).optional(),
});

const addMessage = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  // Verify conversation exists and belongs to user
  const conversation = await ConversationRepository.findById(conversationId, req.user._id);
  if (!conversation) {
    throw AppError.notFound('Conversation not found');
  }

  // Validate request body
  const validation = createMessageSchema.safeParse(req.body);
  if (!validation.success) {
    throw AppError.badRequest('Validation failed', {
      fields: validation.error.flatten().fieldErrors,
    });
  }

  const data = validation.data;

  // Create message
  const message = await MessageRepository.create(conversationId, data);

  const response = new ApiResponse(
    201,
    'Message created',
    { message }
  );
  res.status(201).json(response);
});

const getMessages = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  // Verify conversation exists and belongs to user
  const conversation = await ConversationRepository.findById(conversationId, req.user._id);
  if (!conversation) {
    throw AppError.notFound('Conversation not found');
  }

  const skip = parseInt(req.query.skip) || 0;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  const { messages, total } = await MessageRepository.findByConversationId(
    conversationId,
    { skip, limit }
  );

  const response = new ApiResponse(
    200,
    'Messages retrieved',
    {
      messages,
      pagination: { skip, limit, total },
    }
  );
  res.status(200).json(response);
});

const getMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await MessageRepository.findById(id);
  if (!message) {
    throw AppError.notFound('Message not found');
  }

  // Verify conversation belongs to user
  const conversation = await ConversationRepository.findById(
    message.conversationId,
    req.user._id
  );
  if (!conversation) {
    throw AppError.notFound('Message not found');
  }

  const response = new ApiResponse(
    200,
    'Message retrieved',
    { message }
  );
  res.status(200).json(response);
});

const deleteMessage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const message = await MessageRepository.findById(id);
  if (!message) {
    throw AppError.notFound('Message not found');
  }

  // Verify conversation belongs to user
  const conversation = await ConversationRepository.findById(
    message.conversationId,
    req.user._id
  );
  if (!conversation) {
    throw AppError.notFound('Message not found');
  }

  await MessageRepository.deleteById(id, message.conversationId);

  const response = new ApiResponse(
    200,
    'Message deleted'
  );
  res.status(200).json(response);
});

module.exports = {
  addMessage,
  getMessages,
  getMessage,
  deleteMessage,
};
