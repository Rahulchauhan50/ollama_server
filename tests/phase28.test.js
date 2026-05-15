jest.mock('../src/services/embedding.service', () => ({
  createTextEmbedding: jest.fn(),
}));

jest.mock('../src/repositories/message.repository', () => ({
  findSimilarByUserId: jest.fn(),
}));

const EmbeddingService = require('../src/services/embedding.service');
const MessageRepository = require('../src/repositories/message.repository');
const MemoryService = require('../src/services/memory.service');

describe('Phase 28: Memory Retrieval Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns normalized memories for a user query', async () => {
    EmbeddingService.createTextEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
    MessageRepository.findSimilarByUserId.mockResolvedValue([
      {
        _id: 'msg1',
        content: 'I am Rahul and I like MERN.',
        role: 'user',
        similarity: 0.92345,
        createdAt: '2026-05-15T10:00:00.000Z',
      },
    ]);

    const memories = await MemoryService.retrieveRelevantMemories({
      userId: 'user123',
      queryText: 'What is my name?',
      limit: 5,
    });

    expect(EmbeddingService.createTextEmbedding).toHaveBeenCalledWith('What is my name?');
    expect(MessageRepository.findSimilarByUserId).toHaveBeenCalledWith(
      'user123',
      [0.1, 0.2, 0.3],
      { limit: 5, threshold: 0.5 }
    );
    expect(memories).toEqual([
      {
        messageId: 'msg1',
        content: 'I am Rahul and I like MERN.',
        role: 'user',
        score: 0.9234,
        createdAt: '2026-05-15T10:00:00.000Z',
      },
    ]);
  });

  it('rejects missing query text', async () => {
    await expect(
      MemoryService.retrieveRelevantMemories({
        userId: 'user123',
        queryText: '   ',
      })
    ).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      statusCode: 422,
    });
  });
});