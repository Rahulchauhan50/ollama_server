const config = require('../config');
const SummarizerService = require('./summarizer.service');

const timers = new Map();

const getDelayMs = (delayMinutes) => Math.max(1, Number(delayMinutes) || 10) * 60 * 1000;

const scheduleConversationSummary = ({ conversationId, userId, delayMinutes = 10, limit = 50, model, max_tokens }) => {
  // Keep this dev-only and single-process. Production should use a real job queue.
  if (config.isProduction) {
    return { scheduled: false, reason: 'production-disabled' };
  }

  if (!conversationId || !userId) {
    return { scheduled: false, reason: 'missing-ids' };
  }

  const existing = timers.get(conversationId);
  if (existing) {
    clearTimeout(existing);
  }

  const timeout = setTimeout(async () => {
    timers.delete(conversationId);

    try {
      await SummarizerService.summarizeConversation({
        conversationId,
        userId,
        limit,
        model,
        max_tokens,
      });
      console.info(`Auto-summarized conversation ${conversationId}`);
    } catch (error) {
      console.error(`Auto-summary failed for conversation ${conversationId}:`, error);
    }
  }, getDelayMs(delayMinutes));

  timers.set(conversationId, timeout);
  return { scheduled: true, delayMs: getDelayMs(delayMinutes) };
};

const clearConversationSummary = (conversationId) => {
  const timeout = timers.get(conversationId);
  if (timeout) {
    clearTimeout(timeout);
    timers.delete(conversationId);
    return true;
  }
  return false;
};

module.exports = {
  scheduleConversationSummary,
  clearConversationSummary,
};
