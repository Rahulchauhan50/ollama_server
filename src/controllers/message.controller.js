const { asyncHandler } = require('../utils');
const { ApiResponse } = require('../utils');
const { AppError } = require('../utils');
const config = require('../config');
const MessageRepository = require('../repositories/message.repository');
const ConversationRepository = require('../repositories/conversation.repository');
const EmbeddingService = require('../services/embedding.service');
const AIService = require('../services/ai.service');
const ConversationSummaryScheduler = require('../services/conversation-summary-scheduler.service');
const { buildConversationTitleFromMessage } = require('../services/conversation-title.service');
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

const attachUserMessageEmbedding = async (message, content) => {
  try {
    const embedding = await EmbeddingService.createTextEmbedding(content);
    return MessageRepository.updateEmbeddings(message._id, {
      embedding,
      embeddingModel: config.ai.embeddingModel,
      embeddingDim: embedding.length,
      isMemoryEligible: true,
    });
  } catch (error) {
    await MessageRepository.updateMetadata(message._id, {
      ...(message.metadata || {}),
      embeddingFailed: true,
      embeddingErrorCode: error.code || 'EMBEDDING_UNAVAILABLE',
      embeddingErrorMessage: error.message,
    });

    return {
      ...message,
      metadata: {
        ...(message.metadata || {}),
        embeddingFailed: true,
        embeddingErrorCode: error.code || 'EMBEDDING_UNAVAILABLE',
        embeddingErrorMessage: error.message,
      },
    };
  }
};

const scheduleConversationSummary = (conversationId, userId, options = {}) => {
  return ConversationSummaryScheduler.scheduleConversationSummary({
    conversationId,
    userId,
    delayMinutes: options.delayMinutes,
    limit: options.limit,
    model: options.model,
    max_tokens: options.max_tokens,
  });
};

const handleAddMessage = async (req, res) => {
  const { conversationId } = req.params;

  // Verify conversation exists and belongs to user

  let conversation = await ConversationRepository.findById(conversationId, req.user._id);
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
    const providerConfig = config.ai.providerConfig;
    const allowedModels = providerConfig.allowedChatModels || [];
    const model = data.model || conversation.model || providerConfig.defaultChatModel;

    if (!allowedModels.includes(model)) {
      throw new AppError(
        `Model "${model}" not in allowed list`,
        400,
        'MODEL_NOT_ALLOWED',
        { model, allowedModels }
      );
    }

    const userMessage = await MessageRepository.create(conversationId, {
      userIdStr: req.user._id?.toString?.() || String(req.user._id),
      role: 'user',
      content: data.content,
      metadata: {
        modelUsed: model,
        temperature: data.temperature,
      },
      skipEmbedding: true,
    });

    const enrichedUserMessage = await attachUserMessageEmbedding(userMessage, data.content);
    scheduleConversationSummary(conversationId, req.user._id, {
      delayMinutes: Number(config.summaryInactivityMinutes) || 10,
      limit: 50,
      model,
      max_tokens: data.max_tokens,
    });

    const recentMessages = await MessageRepository.findByConversationIdBatch(conversationId, 6);
    const orderedMessages = recentMessages.reverse().map((message) => ({
      role: message.role,
      content: message.content,
    }));

    const chatMessages = buildChatMessages(orderedMessages, null, data.system);
    let assistantContent;

    try {
      const chatResponse = await AIService.chat(model, chatMessages, {
        temperature: data.temperature,
        top_p: data.top_p,
        max_tokens: data.max_tokens,
      });

      assistantContent = parseAssistantContent(chatResponse);

      // Phase 37: capture duration and token usage when provider returns them
      let extraMetadata = {};
      if (chatResponse) {
        // duration
        if (chatResponse.durationMs) extraMetadata.ollamaDurationMs = chatResponse.durationMs;
        if (chatResponse.duration_ms) extraMetadata.ollamaDurationMs = chatResponse.duration_ms;
        if (chatResponse.time_ms) extraMetadata.ollamaDurationMs = chatResponse.time_ms;

        // token usage - common shapes
        const usage = chatResponse.usage || chatResponse.tokens || chatResponse.tokenUsage || null;
        if (usage) {
          extraMetadata.tokenUsage = {
            promptTokens: usage.prompt_tokens || usage.promptTokens || usage.prompt || 0,
            completionTokens: usage.completion_tokens || usage.completionTokens || usage.completion || 0,
            totalTokens: usage.total_tokens || usage.totalTokens || usage.total || 0,
          };
        }
      }

      // merge into userMessage metadata so prompt tokens are attributed
      if (extraMetadata && Object.keys(extraMetadata).length > 0) {
        await MessageRepository.updateMetadata(userMessage._id, {
          ...(userMessage.metadata || {}),
          ...extraMetadata,
        });
      }
    } catch (error) {
      await MessageRepository.updateMetadata(userMessage._id, {
        ...(userMessage.metadata || {}),
        aiFailed: true,
        aiErrorCode: error.code || 'AI_UNAVAILABLE',
        aiErrorMessage: error.message,
      });

      if (error.isCustom) {
        throw error;
      }

      throw AppError.serviceUnavailable('AI Service Unavailable', {
        aiFailed: true,
        aiErrorCode: error.code || 'AI_UNAVAILABLE',
      });
    }

    const assistantMessage = await MessageRepository.create(conversationId, {
      userIdStr: req.user._id?.toString?.() || String(req.user._id),
      role: 'assistant',
      content: assistantContent,
      metadata: {
        modelUsed: model,
        temperature: data.temperature,
        // copy metadata from userMessage if available (tokens/duration were saved there)
      },
    });

    // If chatResponse included tokenUsage/ollamaDuration, also attach to assistant message
    try {
      const recent = await MessageRepository.findByConversationIdBatch(conversationId, 3);
      const latestAssistant = recent.find((m) => m.role === 'assistant');
      if (latestAssistant && latestAssistant.metadata) {
        // update assistant message with parsed usage if userMessage had it
        if (latestAssistant.metadata.tokenUsage || latestAssistant.metadata.ollamaDurationMs) {
          await MessageRepository.updateMetadata(assistantMessage._id, {
            ...(assistantMessage.metadata || {}),
            tokenUsage: latestAssistant.metadata.tokenUsage,
            ollamaDurationMs: latestAssistant.metadata.ollamaDurationMs,
          });
        }
      }
    } catch (e) {
      // non-fatal
    }

    // If the conversation still has the default title, generate a short title
    try {
      if (!conversation.title || conversation.title === 'New Conversation') {
        const generatedTitle = buildConversationTitleFromMessage(data.content);
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
        messages: [enrichedUserMessage, assistantMessage],
        userMessage: enrichedUserMessage,
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
  const message = await MessageRepository.create(conversationId, {
    userIdStr: req.user._id?.toString?.() || String(req.user._id),
    ...data,
    skipEmbedding: data.role === 'user',
  });

  const savedMessage = data.role === 'user'
    ? await attachUserMessageEmbedding(message, data.content)
    : message;

  if (data.role === 'user') {
    scheduleConversationSummary(conversationId, req.user._id, {
      delayMinutes: Number(config.summaryInactivityMinutes) || 10,
      limit: 50,
    });
  }

  res.status(201).json(
    ApiResponse.created(
      { message: savedMessage },
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
