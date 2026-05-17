jest.mock('../src/config', () => ({
  ai: {
    providerConfig: {
      defaultChatModel: 'qwen2.5-coder:1.5b',
      allowedChatModels: ['gemma2:9b', 'gemma2:2b', 'qwen2.5-coder:1.5b'],
    },
  },
  summaryInactivityMinutes: 10,
  isProduction: false,
}));

jest.mock('../src/services/conversation-summary-scheduler.service', () => ({
  scheduleConversationSummary: jest.fn(),
  clearConversationSummary: jest.fn(),
}));

jest.mock('../src/repositories/conversation.repository', () => ({
  findById: jest.fn(),
  updateById: jest.fn(),
}));

jest.mock('../src/repositories/message.repository', () => ({
  create: jest.fn(),
  updateEmbeddings: jest.fn(),
  updateMetadata: jest.fn(),
  findByConversationIdBatch: jest.fn(),
}));

jest.mock('../src/services/embedding.service', () => ({
  createTextEmbedding: jest.fn(),
}));

jest.mock('../src/services/ai.service', () => ({
  chat: jest.fn(),
  generate: jest.fn(),
}));

const Scheduler = require('../src/services/conversation-summary-scheduler.service');
const ConversationRepository = require('../src/repositories/conversation.repository');
const MessageRepository = require('../src/repositories/message.repository');
const { handleAddMessage } = require('../src/controllers/message.controller');

describe('Phase 33 message hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ConversationRepository.findById.mockResolvedValue({ _id: 'c1', userId: 'u1', model: 'qwen2.5-coder:1.5b' });
  });

  it('schedules auto-summary after user message in simple chat flow', async () => {
    MessageRepository.create.mockResolvedValue({ _id: 'm1', metadata: {} });
    MessageRepository.updateEmbeddings.mockResolvedValue({ _id: 'm1', metadata: {} });
    MessageRepository.findByConversationIdBatch.mockResolvedValue([]);
    const AIService = require('../src/services/ai.service');
    AIService.chat.mockResolvedValue('Test assistant reply');
    AIService.generate.mockResolvedValue('Generated Title');

    const req = {
      params: { conversationId: 'c1' },
      user: { _id: 'u1' },
      body: { content: 'Hello', model: 'qwen2.5-coder:1.5b' },
    };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };

    await handleAddMessage(req, res);

    expect(Scheduler.scheduleConversationSummary).toHaveBeenCalled();
  });
});
