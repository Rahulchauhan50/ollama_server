jest.mock('../src/repositories/conversation.repository', () => ({
  findById: jest.fn(),
  updateById: jest.fn(),
}));

jest.mock('../src/repositories/message.repository', () => ({
  create: jest.fn(),
  findByConversationIdBatch: jest.fn(),
  updateMetadata: jest.fn(),
  updateEmbeddings: jest.fn(),
}));

jest.mock('../src/services/ollama.service', () => ({
  chat: jest.fn(),
  generate: jest.fn(),
}));

jest.mock('../src/services/embedding.service', () => ({
  createTextEmbedding: jest.fn(),
}));

const ConversationRepository = require('../src/repositories/conversation.repository');
const MessageRepository = require('../src/repositories/message.repository');
const OllamaService = require('../src/services/ollama.service');
const EmbeddingService = require('../src/services/embedding.service');
const { handleAddMessage } = require('../src/controllers/message.controller');

describe('Phase 26: Save Embeddings on User Messages', () => {
  const req = {
    params: { conversationId: 'conv123' },
    body: { content: 'Hi, I am Rahul. I love MERN stack.', model: 'llama2' },
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
      title: 'New Conversation',
    });
    ConversationRepository.updateById.mockResolvedValue({
      _id: 'conv123',
      userId: 'user123',
      model: 'llama2',
      title: 'Short title',
    });
    MessageRepository.create.mockImplementation(async (_conversationId, data) => ({
      _id: 'msg-user',
      conversationId: 'conv123',
      metadata: data.metadata,
      ...data,
    }));
    MessageRepository.updateEmbeddings.mockImplementation(async (_messageId, update) => ({
      _id: 'msg-user',
      conversationId: 'conv123',
      role: 'user',
      content: req.body.content,
      metadata: req.body.metadata,
      ...update,
    }));
    MessageRepository.updateMetadata.mockResolvedValue({});
    MessageRepository.findByConversationIdBatch.mockResolvedValue([
      { role: 'user', content: 'Previous user question' },
      { role: 'assistant', content: 'Previous assistant reply' },
    ]);
    EmbeddingService.createTextEmbedding.mockResolvedValue([0.1, 0.2, 0.3, 0.4]);
    OllamaService.chat.mockResolvedValue({
      message: { role: 'assistant', content: 'I am an AI assistant.' },
    });
    OllamaService.generate.mockResolvedValue({
      message: { content: 'Short title' },
    });
  });

  it('saves the user message, stores embeddings, and continues the chat flow', async () => {
    await handleAddMessage(req, res);

    expect(MessageRepository.create).toHaveBeenCalledWith(
      'conv123',
      expect.objectContaining({
        role: 'user',
        content: req.body.content,
        skipEmbedding: true,
      })
    );
    expect(EmbeddingService.createTextEmbedding).toHaveBeenCalledWith(req.body.content);
    expect(MessageRepository.updateEmbeddings).toHaveBeenCalledWith(
      'msg-user',
      expect.objectContaining({
        embedding: [0.1, 0.2, 0.3, 0.4],
        embeddingModel: expect.any(String),
        embeddingDim: 4,
        isMemoryEligible: true,
      })
    );
    expect(res.status).toHaveBeenCalledWith(201);

    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.data.userMessage.embedding).toEqual([0.1, 0.2, 0.3, 0.4]);
    expect(responsePayload.data.userMessage.embeddingDim).toBe(4);
    expect(responsePayload.data.userMessage.isMemoryEligible).toBe(true);
  });

  it('marks the user message when embedding generation fails but still completes chat', async () => {
    EmbeddingService.createTextEmbedding.mockRejectedValue(new Error('embedding service down'));

    await handleAddMessage(req, res);

    expect(MessageRepository.updateMetadata).toHaveBeenCalledWith(
      'msg-user',
      expect.objectContaining({
        embeddingFailed: true,
      })
    );
    expect(OllamaService.chat).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(201);

    const responsePayload = res.json.mock.calls[0][0];
    expect(responsePayload.data.userMessage.metadata.embeddingFailed).toBe(true);
  });
});