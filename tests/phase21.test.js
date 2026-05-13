jest.mock('../src/repositories/conversation.repository', () => ({
  findById: jest.fn(),
}));

jest.mock('../src/repositories/message.repository', () => ({
  create: jest.fn(),
  findByConversationIdBatch: jest.fn(),
}));

jest.mock('../src/services/ollama.service', () => ({
  chat: jest.fn(),
}));

const ConversationRepository = require('../src/repositories/conversation.repository');
const MessageRepository = require('../src/repositories/message.repository');
const OllamaService = require('../src/services/ollama.service');
const { handleChatConversation, buildChatMessages, parseAssistantContent } = require('../src/controllers/chat.controller');

describe('Phase 21: Chat Endpoint', () => {
  const req = {
    params: { conversationId: 'conv123' },
    body: { message: 'Hello there' },
    user: { _id: 'user123' },
    requestId: 'req-1',
  };

  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    ConversationRepository.findById.mockResolvedValue({
      _id: 'conv123',
      userId: 'user123',
      model: 'llama2',
    });
    MessageRepository.create.mockImplementation(async (_conversationId, data) => ({
      _id: data.role === 'user' ? 'msg-user' : 'msg-assistant',
      conversationId: 'conv123',
      ...data,
    }));
    MessageRepository.findByConversationIdBatch.mockResolvedValue([
      { role: 'assistant', content: 'Previous answer' },
      { role: 'user', content: 'Previous question' },
    ]);
    OllamaService.chat.mockResolvedValue({
      message: { role: 'assistant', content: 'Hello! How can I help?' },
    });
  });

  it('builds chat messages with system prompt and preserves order', () => {
    const messages = buildChatMessages(
      [
        { role: 'user', content: 'Hi' },
        { role: 'assistant', content: 'Hello' },
      ],
      'Tell me more',
      'You are helpful'
    );

    expect(messages).toEqual([
      { role: 'system', content: 'You are helpful' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Tell me more' },
    ]);
  });

  it('parses assistant content from common Ollama response shapes', () => {
    expect(parseAssistantContent({ message: { content: 'A' } })).toBe('A');
    expect(parseAssistantContent({ response: 'B' })).toBe('B');
    expect(parseAssistantContent({ choices: [{ message: { content: 'C' } }] })).toBe('C');
  });

  it('creates a chat reply and persists both messages', async () => {
    await handleChatConversation(req, res, () => {});

    expect(ConversationRepository.findById).toHaveBeenCalledWith('conv123', 'user123');
    expect(MessageRepository.create).toHaveBeenCalledTimes(2);
    expect(OllamaService.chat).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalled();
    expect(OllamaService.chat.mock.calls[0][0]).toBe('llama2');
  });

  it('rejects disallowed models', async () => {
    req.body = { message: 'Hello', model: 'not-allowed' };
    await expect(handleChatConversation(req, res, () => {})).rejects.toBeDefined();

    expect(OllamaService.chat).not.toHaveBeenCalled();
    expect(MessageRepository.create).not.toHaveBeenCalled();
  });
});