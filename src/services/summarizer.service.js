const AIService = require('./ai.service');
const MessageRepository = require('../repositories/message.repository');
const ConversationRepository = require('../repositories/conversation.repository');
const config = require('../config');

const DEFAULT_LIMIT = 50;

const buildSummaryPrompt = (messages) => {
  const chatText = messages
    .slice()
    .reverse()
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  return `Produce a concise summary (max 200 words) of the following conversation. Focus on user intent, key facts, and any follow-up actions. Return only the summary text.\n\n${chatText}`;
};

const summarizeConversation = async ({ conversationId, userId, limit = DEFAULT_LIMIT, model, max_tokens }) => {
  const msgs = await MessageRepository.findByConversationIdBatch(conversationId, limit);
  const messages = Array.isArray(msgs) ? msgs : msgs.map?.((m) => m) || msgs;

  if (!messages || messages.length === 0) {
    return null;
  }

  const prompt = buildSummaryPrompt(messages);
  const usedModel = model || (config.ai && config.ai.providerConfig && config.ai.providerConfig.defaultChatModel) || undefined;

  const gen = await AIService.generate(usedModel, prompt, '', { max_tokens: max_tokens || 200 });
  const text = typeof gen === 'string' ? gen : (gen?.response || gen?.content || gen?.choices?.[0]?.text || gen?.choices?.[0]?.message?.content || JSON.stringify(gen));

  // Save summary into conversation.description (fits existing schema)
  const updated = await ConversationRepository.updateById(conversationId, userId, { description: text });
  return { summary: text, conversation: updated };
};

module.exports = { summarizeConversation };
