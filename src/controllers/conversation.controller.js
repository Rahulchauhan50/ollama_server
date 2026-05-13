const { asyncHandler } = require('../utils');
const { ApiResponse } = require('../utils');
const { AppError } = require('../utils');
const ConversationRepository = require('../repositories/conversation.repository');
const config = require('../config');
const { z } = require('zod');

// Validation schemas
const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  model: z.string().min(1).optional(),
});

const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  model: z.string().min(1).optional(),
  isArchived: z.boolean().optional(),
});

const createConversation = asyncHandler(async (req, res) => {
  // Validate request body
  const validation = createConversationSchema.safeParse(req.body);
  if (!validation.success) {
    throw AppError.badRequest('Validation failed', {
      fields: validation.error.flatten().fieldErrors,
    });
  }

  const data = validation.data;

  // Validate model is allowed if provided
  if (data.model) {
    const allowedModels = config.ollama.allowedChatModels || [];
    if (!allowedModels.includes(data.model)) {
      throw AppError.badRequest(`Model "${data.model}" not in allowed list`);
    }
  } else {
    data.model = config.ollama.defaultChatModel || 'llama2';
  }

  const conversation = await ConversationRepository.create(req.user._id, data);

  const response = new ApiResponse(
    201,
    'Conversation created',
    { conversation }
  );
  res.status(201).json(response);
});

const listConversations = asyncHandler(async (req, res) => {
  const skip = parseInt(req.query.skip) || 0;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const archived = req.query.archived === 'true' ? true : req.query.archived === 'false' ? false : null;

  const { conversations, total } = await ConversationRepository.findByUserId(
    req.user._id,
    { skip, limit, archived }
  );

  const response = new ApiResponse(
    200,
    'Conversations retrieved',
    {
      conversations,
      pagination: { skip, limit, total },
    }
  );
  res.status(200).json(response);
});

const getConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const conversation = await ConversationRepository.findById(id, req.user._id);
  if (!conversation) {
    throw AppError.notFound('Conversation not found');
  }

  const response = new ApiResponse(
    200,
    'Conversation retrieved',
    { conversation }
  );
  res.status(200).json(response);
});

const updateConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Validate request body
  const validation = updateConversationSchema.safeParse(req.body);
  if (!validation.success) {
    throw AppError.badRequest('Validation failed', {
      fields: validation.error.flatten().fieldErrors,
    });
  }

  const data = validation.data;

  // Validate model is allowed if provided
  if (data.model) {
    const allowedModels = config.ollama.allowedChatModels || [];
    if (!allowedModels.includes(data.model)) {
      throw AppError.badRequest(`Model "${data.model}" not in allowed list`);
    }
  }

  const conversation = await ConversationRepository.updateById(id, req.user._id, data);
  if (!conversation) {
    throw AppError.notFound('Conversation not found');
  }

  const response = new ApiResponse(
    200,
    'Conversation updated',
    { conversation }
  );
  res.status(200).json(response);
});

const deleteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const deleted = await ConversationRepository.deleteById(id, req.user._id);
  if (!deleted) {
    throw AppError.notFound('Conversation not found');
  }

  const response = new ApiResponse(
    200,
    'Conversation deleted'
  );
  res.status(200).json(response);
});

module.exports = {
  createConversation,
  listConversations,
  getConversation,
  updateConversation,
  deleteConversation,
};
