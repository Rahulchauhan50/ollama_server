const { z } = require('zod');
const { asyncHandler, ApiResponse, AppError } = require('../utils');
const config = require('../config');
const ConversationRepository = require('../repositories/conversation.repository');
const MessageRepository = require('../repositories/message.repository');
const AIService = require('../services/ai.service');

const chatRequestSchema = z.object({
  message: z.string().min(1).max(10000),
  system: z.string().max(4000).optional(),
  model: z.string().min(1).optional(),
  temperature: z.number().min(0).max(2).optional(),
  top_p: z.number().min(0).max(1).optional(),
  max_tokens: z.number().int().positive().optional(),
  contextLimit: z.number().int().min(1).max(50).optional(),
});

const buildChatMessages = (history, userMessage, systemPrompt) => {
  const messages = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  for (const message of history) {
    messages.push({
      role: message.role,
      content: message.content,
    });
  }

  if (userMessage) {
    messages.push({
      role: 'user',
      content: userMessage,
    });
  }

  return messages;
};

const parseAssistantContent = (chatResponse) => {
  if (typeof chatResponse === 'string') {
    return chatResponse;
  }

  const candidates = [
    chatResponse?.message?.content,
    chatResponse?.response,
    chatResponse?.content,
    chatResponse?.choices?.[0]?.message?.content,
  ];

  const content = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);

  if (!content) {
    throw AppError.serviceUnavailable('Unexpected AI chat response');
  }

  return content;
};

const handleChatConversation = async (req, res) => {
  const { conversationId } = req.params;


  const conversation = await ConversationRepository.findById(conversationId, req.user._id);
  if (!conversation) {
    throw AppError.notFound('Conversation not found');
  }

  const validation = chatRequestSchema.safeParse(req.body);
  if (!validation.success) {
    throw AppError.badRequest('Validation failed', {
      fields: validation.error.flatten().fieldErrors,
    });
  }

  const data = validation.data;
  const providerConfig = config.ai.providerConfig;
  const allowedModels = providerConfig.allowedChatModels || [];
  const model = data.model || conversation.model || providerConfig.defaultChatModel;

  if (!allowedModels.includes(model)) {
    throw AppError.badRequest(`Model "${model}" not in allowed list`);
  }

  const contextLimit = data.contextLimit || 20;

  const history = await MessageRepository.findByConversationIdBatch(conversationId, contextLimit);
  const orderedHistory = history.reverse().map((message) => ({
    role: message.role,
    content: message.content,
  }));

  const userMessage = await MessageRepository.create(conversationId, {
    userIdStr: req.user._id?.toString?.() || String(req.user._id),
    role: 'user',
    content: data.message,
    metadata: {
      modelUsed: model,
      temperature: data.temperature,
    },
  });
  const assistantRequest = buildChatMessages(orderedHistory, data.message, data.system);

  const chatResponse = await AIService.chat(model, assistantRequest, {
    temperature: data.temperature,
    top_p: data.top_p,
    max_tokens: data.max_tokens,
  });

  const assistantContent = parseAssistantContent(chatResponse);

  const assistantMessage = await MessageRepository.create(conversationId, {
    userIdStr: req.user._id?.toString?.() || String(req.user._id),
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
      const titlePrompt = `Create a short, descriptive conversation title (max 6 words) based on the following user message and AI reply. Return only the title.\n\nUser: ${data.message}\nAssistant: ${assistantContent}`;
      const gen = await AIService.generate(model, titlePrompt, '', { max_tokens: 30 });
      const generatedTitle = parseAssistantContent(gen)?.trim();
      if (generatedTitle && generatedTitle.length > 0) {
        const updatedConversation = await ConversationRepository.updateById(conversationId, req.user._id, { title: generatedTitle });
        if (updatedConversation) {
          conversation = updatedConversation;
        }
      }
    }
  } catch (err) {
    // Non-fatal: log and continue returning the chat response
    console.error('Failed to generate conversation title:', err);
  }

  const response = ApiResponse.created(
    {
      conversation,
      userMessage,
      assistantMessage,
      reply: assistantContent,
    },
    'Chat completed',
    req.requestId
  );

  res.status(response.statusCode).json(response.toJSON());
};

const chatConversation = asyncHandler(handleChatConversation);

module.exports = {
  handleChatConversation,
  chatConversation,
  buildChatMessages,
  parseAssistantContent,
  chatRequestSchema,
};