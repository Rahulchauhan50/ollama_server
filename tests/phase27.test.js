jest.mock('../src/middleware/auth.middleware', () => ({
  requireAuth: (req, _res, next) => {
    req.user = { _id: 'user123', role: 'user' };
    req.token = 'test-token';
    next();
  },
}));

jest.mock('../src/repositories/message.repository', () => ({
  findSimilarByUserId: jest.fn(),
}));

const request = require('supertest');
const { app } = require('../src/app');
const MessageRepository = require('../src/repositories/message.repository');
const EmbeddingService = require('../src/services/embedding.service');

describe('Phase 27: MongoDB Vector Search Index', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns matching user memories for a query', async () => {
    MessageRepository.findSimilarByUserId.mockResolvedValue([
      {
        _id: 'msg-1',
        content: 'Hi, I am Rahul. I love MERN stack.',
        role: 'user',
        similarity: 0.8912,
      },
    ]);

    const response = await request(app)
      .post('/api/dev/memory/search')
      .send({ query: 'What is my name and what technology do I like?' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.matches).toHaveLength(1);
    expect(response.body.data.matches[0].content).toContain('Rahul');
    expect(response.body.data.matches[0].score).toBe(0.8912);
    expect(EmbeddingService.createTextEmbedding).toBeDefined();
    expect(MessageRepository.findSimilarByUserId).toHaveBeenCalledWith(
      'user123',
      expect.any(Array),
      expect.objectContaining({ limit: 10, threshold: 0.5 })
    );
  });

  it('rejects empty queries', async () => {
    const response = await request(app)
      .post('/api/dev/memory/search')
      .send({ query: '' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});