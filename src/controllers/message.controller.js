const { asyncHandler } = require('../utils');
const { ApiResponse } = require('../utils');
const { AppError } = require('../utils');
const config = require('../config');
const MessageRepository = require('../repositories/message.repository');
const ConversationRepository = require('../repositories/conversation.repository');
const OllamaService = require('../services/ollama.service');
const { buildChatMessages, parseAssistantContent } = require('./chat.controller');
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

const simpleChatSchema = z.object({
  content: z.string().min(1).max(10000),
  model: z.string().min(1).optional(),
  system: z.string().max(4000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().positive().optional(),
});

const validationError = (validation) => AppError.validation('Validation failed', {
  fields: validation.error.flatten().fieldErrors,
});

const handleAddMessage = async (req, res) => {
  const { conversationId } = req.params;

  // Verify conversation exists and belongs to user
  const conversation = await ConversationRepository.findById(conversationId, req.user._id);
  if (!conversation) {
    throw AppError.notFound('Conversation not found');
  }

  // Phase 23: simple chat flow without RAG when the request provides content only
  if (req.body && req.body.role === undefined) {
    const validation = simpleChatSchema.safeParse(req.body);
    if (!validation.success) {
      throw validationError(validation);
    }

    const data = validation.data;
    const allowedModels = config.ollama.allowedChatModels || [];
    const model = data.model || conversation.model || config.ollama.defaultChatModel;

    if (!allowedModels.includes(model)) {
      throw new AppError(
        `Model "${model}" not in allowed list`,
        400,
        'MODEL_NOT_ALLOWED',
        { model, allowedModels }
      );
    }

    const userMessage = await MessageRepository.create(conversationId, {
      role: 'user',
      content: data.content,
      metadata: {
        modelUsed: model,
        temperature: data.temperature,
      },
    });

    const recentMessages = await MessageRepository.findByConversationIdBatch(conversationId, 6);
    const orderedMessages = recentMessages.reverse().map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const chatMessages = buildChatMessages(orderedMessages, null, data.system);
    let assistantContent;

    try {
      const chatResponse = await OllamaService.chat(model, chatMessages, {
        temperature: data.temperature,
        top_p: data.top_p,
        max_tokens: data.max_tokens,
      });

      assistantContent = parseAssistantContent(chatResponse);
    } catch (error) {
      await MessageRepository.updateMetadata(userMessage._id, {
        ...(userMessage.metadata || {}),
        aiFailed: true,
        aiErrorCode: error.code || 'AI_UNAVAILABLE',
        aiErrorMessage: error.message,
      });

      if (error.isCustom && error.statusCode === 503) {
        throw error;
      }

      throw AppError.serviceUnavailable('AI Service Unavailable', {
        aiFailed: true,
        aiErrorCode: error.code || 'AI_UNAVAILABLE',
      });
    }

    const assistantMessage = await MessageRepository.create(conversationId, {
      role: 'assistant',
      content: assistantContent,
      metadata: {
        modelUsed: model,
        temperature: data.temperature,
      },
    });

    // If the conversation still has the default title, generate a short title
    try {
      if (!conversation.title || conversation.title === 'New Conversation') {
        const titlePrompt = `Create a short, descriptive conversation title (max 6 words) based on the following user message and AI reply. Return only the title.\n\nUser: ${data.content}\nAssistant: ${assistantContent}`;
        const gen = await OllamaService.generate(model, titlePrompt, '', { max_tokens: 30 });
        const generatedTitle = parseAssistantContent(gen)?.trim();
        if (generatedTitle && generatedTitle.length > 0) {
          const updatedConversation = await ConversationRepository.updateById(conversationId, req.user._id, { title: generatedTitle });
          if (updatedConversation) {
            // replace conversation reference
            conversation = updatedConversation;
          }
        }
      }
    } catch (err) {
      console.error('Failed to generate conversation title:', err);
    }

    const response = new ApiResponse(
      201,
      {
        messages: [userMessage, assistantMessage],
        userMessage,
        assistantMessage,
        reply: assistantContent,
        conversation,
      },
      'Chat completed'
    );

    res.status(201).json(response);
    return;
  }

  // Validate request body
  const validation = createMessageSchema.safeParse(req.body);
  if (!validation.success) {
    throw validationError(validation);
  }

  const data = validation.data;

  // Create message
  const message = await MessageRepository.create(conversationId, data);

  res.status(201).json(
    ApiResponse.created(
      { message },
      'Message created'
    )
  );
};

const addMessage = asyncHandler(handleAddMessage);

const handleGetMessages = async (req, res) => {
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
    {
      messages,
      pagination: { skip, limit, total },
    },
    'Messages retrieved'
  );
  res.status(200).json(response);
};

const getMessages = asyncHandler(handleGetMessages);

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

  res.status(200).json(
    ApiResponse.success(
      { message },
      'Message retrieved'
    )
  );
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

  res.status(200).json(
    ApiResponse.success(
      null,
      'Message deleted'
    )
  );
});

module.exports = {
  handleAddMessage,
  handleGetMessages,
  addMessage,
  getMessages,
  getMessage,
  deleteMessage,
};
