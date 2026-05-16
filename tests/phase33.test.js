jest.mock('../src/services/ai.service', () => ({
  generate: jest.fn(),
}));

jest.mock('../src/repositories/message.repository', () => ({
  findByConversationIdBatch: jest.fn(),
}));

jest.mock('../src/repositories/conversation.repository', () => ({
  updateById: jest.fn(),
}));

const AIService = require('../src/services/ai.service');
const MessageRepository = require('../src/repositories/message.repository');
const ConversationRepository = require('../src/repositories/conversation.repository');
const Summarizer = require('../src/services/summarizer.service');

describe('Phase 33: Conversation Summarizer', () => {
  beforeEach(() => jest.clearAllMocks());

  it('generates and saves a summary', async () => {
    MessageRepository.findByConversationIdBatch.mockResolvedValue([
      { role: 'user', content: 'I need help with my project.' },
      { role: 'assistant', content: 'Sure, what is it about?' },
    ]);
    AIService.generate.mockResolvedValue('Short summary of conversation.');
    ConversationRepository.updateById.mockResolvedValue({ description: 'Short summary of conversation.' });

    const result = await Summarizer.summarizeConversation({ conversationId: 'c1', userId: 'u1' });
    expect(AIService.generate).toHaveBeenCalled();
    expect(ConversationRepository.updateById).toHaveBeenCalledWith('c1', 'u1', { description: 'Short summary of conversation.' });
    expect(result.summary).toBe('Short summary of conversation.');
  });
});
