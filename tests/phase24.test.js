jest.mock('../src/repositories/conversation.repository', () => ({
  findById: jest.fn(),
}));

jest.mock('../src/repositories/message.repository', () => ({
  create: jest.fn(),
  findByConversationIdBatch: jest.fn(),
  updateMetadata: jest.fn(),
}));

jest.mock('../src/services/ollama.service', () => ({
  chat: jest.fn(),
}));

const ConversationRepository = require('../src/repositories/conversation.repository');
const MessageRepository = require('../src/repositories/message.repository');
const OllamaService = require('../src/services/ollama.service');
const { handleAddMessage } = require('../src/controllers/message.controller');

describe('Phase 24: Chat Error Handling', () => {
  const baseReq = {
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
      metadata: data.metadata,
      ...data,
    }));
    MessageRepository.findByConversationIdBatch.mockResolvedValue([
      { role: 'user', content: 'Previous user question' },
      { role: 'assistant', content: 'Previous assistant reply' },
    ]);
    MessageRepository.updateMetadata.mockResolvedValue({});
    OllamaService.chat.mockResolvedValue({
      message: { role: 'assistant', content: 'I am an AI assistant.' },
    });
  });

  async function getError(reqOverride = {}) {
    try {
      await handleAddMessage({ ...baseReq, ...reqOverride }, res);
      return null;
    } catch (error) {
      return error;
    }
  }

  it('returns 422 for empty message', async () => {
    const error = await getError({ body: { content: '', model: 'llama2' } });

    expect(error).toBeTruthy();
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(OllamaService.chat).not.toHaveBeenCalled();
  });

  it('returns 422 for message too long', async () => {
    const error = await getError({ body: { content: 'x'.repeat(10001), model: 'llama2' } });

    expect(error).toBeTruthy();
    expect(error.statusCode).toBe(422);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(OllamaService.chat).not.toHaveBeenCalled();
  });

  it('returns MODEL_NOT_ALLOWED for disallowed models', async () => {
    const error = await getError({ body: { content: 'Hello', model: 'not-allowed' } });

    expect(error).toBeTruthy();
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('MODEL_NOT_ALLOWED');
    expect(OllamaService.chat).not.toHaveBeenCalled();
  });

  it('marks the user message as failed and returns 503 when Ollama is unavailable', async () => {
    OllamaService.chat.mockRejectedValue({
      isCustom: true,
      statusCode: 503,
      code: 'SERVICE_UNAVAILABLE',
      message: 'AI Service Unavailable',
    });

    const error = await getError();

    expect(error).toBeTruthy();
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
    expect(MessageRepository.updateMetadata).toHaveBeenCalledWith(
      'msg-user',
      expect.objectContaining({
        aiFailed: true,
        aiErrorCode: 'SERVICE_UNAVAILABLE',
      })
    );
    expect(MessageRepository.create).toHaveBeenCalledTimes(1);
  });

  it('marks the user message as failed and returns 503 when Ollama times out', async () => {
    OllamaService.chat.mockRejectedValue(new Error('timeout of 30000ms exceeded'));

    const error = await getError();

    expect(error).toBeTruthy();
    expect(error.statusCode).toBe(503);
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
    expect(MessageRepository.updateMetadata).toHaveBeenCalledWith(
      'msg-user',
      expect.objectContaining({
        aiFailed: true,
        aiErrorCode: 'AI_UNAVAILABLE',
      })
    );
    expect(MessageRepository.create).toHaveBeenCalledTimes(1);
  });
});
