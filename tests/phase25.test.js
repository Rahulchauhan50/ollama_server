jest.mock('../src/middleware/auth.middleware', () => ({
  requireAuth: (req, _res, next) => {
    req.user = { _id: 'user123', role: 'user' };
    req.token = 'test-token';
    next();
  },
}));

const request = require('supertest');
const { app } = require('../src/app');
const EmbeddingService = require('../src/services/embedding.service');

describe('Phase 25: Embedding Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EmbeddingService', () => {
    it('creates stable embeddings for the same text', async () => {
      const first = await EmbeddingService.createTextEmbedding('hello world');
      const second = await EmbeddingService.createTextEmbedding('hello world');

      expect(Array.isArray(first)).toBe(true);
      expect(first.length).toBeGreaterThan(0);
      expect(first.length).toBe(second.length);
      expect(first).toEqual(second);
    });

    it('rejects empty text', async () => {
      await expect(EmbeddingService.createTextEmbedding('')).rejects.toMatchObject({
        code: 'VALIDATION_ERROR',
        statusCode: 422,
      });
    });
  });

  describe('POST /api/dev/embeddings/test', () => {
    it('returns a preview and dimension for text embeddings', async () => {
      const response = await request(app)
        .post('/api/dev/embeddings/test')
        .send({ text: 'Hi, I am Rahul. I love MERN stack.' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.dimension).toBeGreaterThan(0);
      expect(Array.isArray(response.body.data.embeddingPreview)).toBe(true);
      expect(response.body.data.embeddingPreview.length).toBeGreaterThan(0);
    });
  });
});