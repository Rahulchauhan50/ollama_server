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
const { handleAddMessage } = require('../src/controllers/message.controller');

describe('Phase 23: Simple Chat Without RAG', () => {
  const req = {
    params: { conversationId: 'conv123' },
    body: { content: 'Hello, who are you?', model: 'llama2' },
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
      { role: 'user', content: 'Hello, who are you?' },
      { role: 'assistant', content: 'Previous assistant reply' },
      { role: 'user', content: 'Previous user question' },
    ]);
    OllamaService.chat.mockResolvedValue({
      message: { role: 'assistant', content: 'I am an AI assistant.' },
    });
  });

  it('saves the user message, sends recent context to Ollama, and saves the assistant reply', async () => {
    await handleAddMessage(req, res);

    expect(ConversationRepository.findById).toHaveBeenCalledWith('conv123', 'user123');
    expect(MessageRepository.create).toHaveBeenCalledTimes(2);
    expect(MessageRepository.findByConversationIdBatch).toHaveBeenCalledWith('conv123', 6);
    expect(OllamaService.chat).toHaveBeenCalledTimes(1);
    expect(OllamaService.chat.mock.calls[0][0]).toBe('llama2');
    expect(OllamaService.chat.mock.calls[0][1]).toEqual([
      { role: 'user', content: 'Previous user question' },
      { role: 'assistant', content: 'Previous assistant reply' },
      { role: 'user', content: 'Hello, who are you?' },
    ]);
    expect(res.status).toHaveBeenCalledWith(201);

    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.data.userMessage.role).toBe('user');
    expect(responsePayload.data.assistantMessage.role).toBe('assistant');
    expect(responsePayload.data.reply).toBe('I am an AI assistant.');
  });

  it('preserves the existing role-based message creation flow', async () => {
    req.body = {
      role: 'assistant',
      content: 'Existing flow message',
      metadata: { tokenCount: 3 },
    };

    await handleAddMessage(req, res);

    expect(OllamaService.chat).not.toHaveBeenCalled();
    expect(MessageRepository.create).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects disallowed models in chat mode', async () => {
    req.body = { content: 'Hello', model: 'not-allowed' };

    await expect(handleAddMessage(req, res)).rejects.toBeDefined();

    expect(OllamaService.chat).not.toHaveBeenCalled();
    expect(MessageRepository.create).not.toHaveBeenCalled();
  });
});
