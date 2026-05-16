const MemoryService = require('./memory.service');
const config = require('../config');

const DEFAULT_MEMORY_LIMIT = 5;
const DEFAULT_THRESHOLD = 0.01;

const buildSystemPrompt = () => {
  return (config.rag && config.rag.systemPrompt) || 'You are a helpful assistant. Use the provided memories to answer concisely.';
};

const formatMemoryBlock = (mem) => {
  const score = typeof mem.score === 'number' ? mem.score : Number(mem.score || 0);
  return `Memory (score: ${Number(score).toFixed(4)}): ${mem.content}`;
};

const formatRecentMessages = (recentMessages = []) => {
  return recentMessages.map((m) => ({ role: m.role, content: m.content }));
};

/**
 * Build chat messages with optional RAG memories injected as a system message.
 * @param {Object} opts
 * @param {string} opts.userId
 * @param {string} opts.queryText
 * @param {Array} opts.recentMessages - ordered array of {role,content}
 * @param {number} opts.memoryLimit
 * @param {number} opts.threshold
 */
const buildChatMessages = async ({ userId, queryText, recentMessages = [], memoryLimit, threshold }) => {
  const systemPrompt = buildSystemPrompt();
  const messages = [];

  // Retrieve memories if we have a query
  let memories = [];
  try {
    memories = await MemoryService.retrieveRelevantMemories({
      userId,
      queryText,
      limit: memoryLimit || DEFAULT_MEMORY_LIMIT,
      threshold: typeof threshold === 'number' ? threshold : DEFAULT_THRESHOLD,
    });
  } catch (err) {
    // Non-fatal: log and continue without memories
    console.error('RAG: memory retrieval failed', err);
    memories = [];
  }

  // Compose system message containing system prompt + compact memory block
  const memoryBlocks = (memories || []).map(formatMemoryBlock).join('\n\n');
  const composedSystem = memoryBlocks && memoryBlocks.length > 0 ? `${systemPrompt}\n\nRelevant memories:\n\n${memoryBlocks}` : systemPrompt;
  messages.push({ role: 'system', content: composedSystem });

  // Add recent chat history
  const recent = formatRecentMessages(recentMessages);
  for (const r of recent) messages.push(r);

  // The user's current query will be appended by caller
  return messages;
};

module.exports = {
  buildSystemPrompt,
  formatMemoryBlock,
  formatRecentMessages,
  buildChatMessages,
};
