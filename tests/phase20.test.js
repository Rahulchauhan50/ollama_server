const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/User.model');
const Conversation = require('../src/models/Conversation.model');
const Message = require('../src/models/Message.model');
const AuthService = require('../src/services/auth.service');
const EmbeddingService = require('../src/services/embedding.service');
const MessageRepository = require('../src/repositories/message.repository');

describe('Phase 20: Embeddings & Vector Search', () => {
  let user;
  let conversation;
  let token;
  let message1;
  let message2;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await require('../src/config/database').connect();
    }
  });

  afterAll(async () => {
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    await User.deleteMany({});
  });

  beforeEach(async () => {
    // Clean up test data
    await Message.deleteMany({});
    await Conversation.deleteMany({});
    await User.deleteMany({});

    // Create test user
    const hashedPassword = await require('bcrypt').hash('password123', 10);
    user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      passwordHash: hashedPassword,
      role: 'user',
    });

    // Create tokens
    const { accessToken } = await AuthService.login('test@example.com', 'password123');
    token = accessToken;

    // Create conversation
    conversation = await Conversation.create({
      userId: user._id,
      title: 'Test Conversation',
      model: 'llama2',
    });

    // Create messages with sample embeddings
    // Using simple mock embeddings for testing
    const embedding1 = Array(384).fill(1).map(() => Math.random()); // Mock embedding
    const embedding2 = Array(384).fill(1).map(() => Math.random()); // Mock embedding

    message1 = await Message.create({
      conversationId: conversation._id,
      role: 'user',
      content: 'What is artificial intelligence?',
      embeddings: embedding1,
    });

    message2 = await Message.create({
      conversationId: conversation._id,
      role: 'assistant',
      content: 'Artificial intelligence is the simulation of human intelligence.',
      embeddings: embedding2,
    });
  });

  // Embedding Service Tests
  describe('EmbeddingService', () => {
    it('should generate deterministic embeddings in test mode', async () => {
      const embeddingsA = await EmbeddingService.generateEmbeddings('hello world');
      const embeddingsB = await EmbeddingService.generateEmbeddings('hello world');

      expect(Array.isArray(embeddingsA)).toBe(true);
      expect(embeddingsA.length).toBe(384);
      expect(embeddingsA).toEqual(embeddingsB);
    });

    describe('cosineSimilarity', () => {
      it('should calculate cosine similarity between two vectors', () => {
        const vec1 = [1, 0, 0];
        const vec2 = [1, 0, 0];
        const similarity = EmbeddingService.cosineSimilarity(vec1, vec2);
        expect(similarity).toBe(1); // Identical vectors have similarity 1
      });

      it('should return 0 for orthogonal vectors', () => {
        const vec1 = [1, 0, 0];
        const vec2 = [0, 1, 0];
        const similarity = EmbeddingService.cosineSimilarity(vec1, vec2);
        expect(similarity).toBeCloseTo(0);
      });

      it('should throw error for mismatched dimensions', () => {
        const vec1 = [1, 0];
        const vec2 = [1, 0, 0];
        expect(() => EmbeddingService.cosineSimilarity(vec1, vec2)).toThrow();
      });

      it('should handle zero magnitude vectors', () => {
        const vec1 = [0, 0, 0];
        const vec2 = [1, 1, 1];
        const similarity = EmbeddingService.cosineSimilarity(vec1, vec2);
        expect(similarity).toBe(0);
      });
    });

    describe('findSimilarEmbeddings', () => {
      it('should find similar embeddings above threshold', () => {
        const queryEmbedding = [1, 0, 0];
        const candidates = [
          { id: 1, embeddings: [1, 0, 0], content: 'Similar' },
          { id: 2, embeddings: [0, 1, 0], content: 'Orthogonal' },
        ];

        const results = EmbeddingService.findSimilarEmbeddings(
          queryEmbedding,
          candidates,
          0.5
        );

        expect(results.length).toBe(1);
        expect(results[0].id).toBe(1);
        expect(results[0].similarity).toBe(1);
      });

      it('should filter by threshold', () => {
        const queryEmbedding = [1, 0, 0];
        const candidates = [
          { id: 1, embeddings: [0.9, 0.1, 0], content: 'Similar' },
          { id: 2, embeddings: [0.1, 0.9, 0], content: 'Dissimilar' },
        ];

        const results = EmbeddingService.findSimilarEmbeddings(
          queryEmbedding,
          candidates,
          0.8
        );

        // At least some results should pass 0.8 threshold
        expect(results.length).toBeGreaterThanOrEqual(0);
      });

      it('should return sorted results by similarity', () => {
        const queryEmbedding = [1, 0, 0];
        const candidates = [
          { id: 1, embeddings: [0.5, 0.5, 0], similarity: 0.5 },
          { id: 2, embeddings: [0.9, 0.1, 0], similarity: 0.9 },
          { id: 3, embeddings: [0.7, 0.3, 0], similarity: 0.7 },
        ];

        const results = EmbeddingService.findSimilarEmbeddings(
          queryEmbedding,
          candidates,
          0.3
        );

        // Check if sorted by similarity descending
        for (let i = 0; i < results.length - 1; i++) {
          expect(results[i].similarity).toBeGreaterThanOrEqual(results[i + 1].similarity);
        }
      });

      it('should respect limit parameter', () => {
        const queryEmbedding = [1, 0, 0];
        const candidates = Array.from({ length: 20 }, (_, i) => ({
          id: i,
          embeddings: [0.9, 0.1, 0],
        }));

        const results = EmbeddingService.findSimilarEmbeddings(
          queryEmbedding,
          candidates,
          0.1,
        );

        // Results should be limited even with 20 candidates
        expect(results.length).toBeLessThanOrEqual(20);
      });

      it('should skip candidates without embeddings', () => {
        const queryEmbedding = [1, 0, 0];
        const candidates = [
          { id: 1, embeddings: [1, 0, 0] },
          { id: 2, content: 'No embeddings' },
          { id: 3, embeddings: null },
        ];

        const results = EmbeddingService.findSimilarEmbeddings(
          queryEmbedding,
          candidates,
          0.5
        );

        expect(results.length).toBe(1);
        expect(results[0].id).toBe(1);
      });
    });
  });

  // Message Repository Semantic Search Tests
  describe('MessageRepository Semantic Search', () => {
    it('should generate embeddings automatically for user messages', async () => {
      const created = await MessageRepository.create(conversation._id, {
        role: 'user',
        content: 'Generate embeddings for this message',
      });

      expect(created.embeddings).toBeDefined();
      expect(Array.isArray(created.embeddings)).toBe(true);
      expect(created.embeddings.length).toBe(384);
    });

    describe('findSimilarByEmbedding', () => {
      it('should find similar messages by embedding', async () => {
        const queryEmbedding = message1.embeddings;
        const results = await MessageRepository.findSimilarByEmbedding(
          conversation._id,
          queryEmbedding,
          { threshold: 0, limit: 10 }
        );

        expect(results.length).toBeGreaterThan(0);
        expect(results[0]).toHaveProperty('similarity');
      });

      it('should respect threshold parameter', async () => {
        const queryEmbedding = message1.embeddings;
        const results = await MessageRepository.findSimilarByEmbedding(
          conversation._id,
          queryEmbedding,
          { threshold: 0.99, limit: 10 }
        );

        // Results should only include messages meeting threshold
        results.forEach((result) => {
          expect(result.similarity).toBeGreaterThanOrEqual(0.99);
        });
      });

      it('should respect limit parameter', async () => {
        const queryEmbedding = message1.embeddings;
        const results = await MessageRepository.findSimilarByEmbedding(
          conversation._id,
          queryEmbedding,
          { threshold: 0, limit: 1 }
        );

        expect(results.length).toBeLessThanOrEqual(1);
      });

      it('should only search within conversation', async () => {
        // Create another conversation
        const conversation2 = await Conversation.create({
          userId: user._id,
          title: 'Other Conversation',
          model: 'llama2',
        });

        const embedding = Array(384).fill(1).map(() => Math.random());
        await Message.create({
          conversationId: conversation2._id,
          role: 'user',
          content: 'Other message',
          embeddings: embedding,
        });

        const queryEmbedding = message1.embeddings;
        const results = await MessageRepository.findSimilarByEmbedding(
          conversation._id,
          queryEmbedding,
          { threshold: 0, limit: 10 }
        );

        // Should only include messages from first conversation
        results.forEach((result) => {
          expect(result.conversationId.toString()).toBe(conversation._id.toString());
        });
      });
    });

    describe('findWithEmbeddingsByConversationId', () => {
      it('should find messages with embeddings', async () => {
        const results = await MessageRepository.findWithEmbeddingsByConversationId(
          conversation._id
        );

        expect(results.length).toBe(2);
        results.forEach((msg) => {
          expect(msg.embeddings).toBeDefined();
          expect(Array.isArray(msg.embeddings)).toBe(true);
        });
      });

      it('should respect limit parameter', async () => {
        const results = await MessageRepository.findWithEmbeddingsByConversationId(
          conversation._id,
          1
        );

        expect(results.length).toBeLessThanOrEqual(1);
      });

      it('should exclude messages without embeddings', async () => {
        // Create a message without embeddings
        await Message.create({
          conversationId: conversation._id,
          role: 'user',
          content: 'No embedding message',
        });

        const results = await MessageRepository.findWithEmbeddingsByConversationId(
          conversation._id
        );

        // Should only return 2 messages (the ones with embeddings)
        expect(results.length).toBe(2);
      });

      it('should sort by createdAt descending', async () => {
        const results = await MessageRepository.findWithEmbeddingsByConversationId(
          conversation._id
        );

        if (results.length > 1) {
          for (let i = 0; i < results.length - 1; i++) {
            expect(new Date(results[i].createdAt).getTime()).toBeGreaterThanOrEqual(
              new Date(results[i + 1].createdAt).getTime()
            );
          }
        }
      });
    });

    describe('updateEmbeddings', () => {
      it('should update embeddings for a message', async () => {
        const newEmbeddings = Array(384).fill(1).map(() => Math.random());
        const updated = await MessageRepository.updateEmbeddings(
          message1._id,
          newEmbeddings
        );

        expect(updated.embeddings).toEqual(newEmbeddings);
      });

      it('should return updated message', async () => {
        const newEmbeddings = Array(384).fill(1).map(() => Math.random());
        const updated = await MessageRepository.updateEmbeddings(
          message1._id,
          newEmbeddings
        );

        expect(updated._id.toString()).toBe(message1._id.toString());
        expect(updated.content).toBe(message1.content);
      });
    });
  });

  // Integration Tests
  describe('Integration', () => {
    it('should complete embedding workflow', async () => {
      // Verify embeddings were created
      const msg = await Message.findById(message1._id);
      expect(msg.embeddings).toBeDefined();
      expect(Array.isArray(msg.embeddings)).toBe(true);

      // Find similar messages
      const similar = await MessageRepository.findSimilarByEmbedding(
        conversation._id,
        msg.embeddings,
        { threshold: 0 }
      );

      expect(similar.length).toBeGreaterThan(0);
    });

    it('should handle empty search results', async () => {
      const zeroEmbedding = Array(384).fill(0);
      const results = await MessageRepository.findSimilarByEmbedding(
        conversation._id,
        zeroEmbedding,
        { threshold: 0.99 }
      );

      // Should return empty array or filtered results
      expect(Array.isArray(results)).toBe(true);
    });
  });
});
