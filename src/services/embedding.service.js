const OllamaService = require('./ollama.service');
const { AppError } = require('../utils');
const config = require('../config');

/**
 * Embedding Service
 * Handles generation and management of message embeddings for semantic search
 */
const EmbeddingService = {
  /**
   * Create a text embedding for the provided text.
   * This is the phase 25 entry point and keeps the old generateEmbeddings
   * method working for earlier callers.
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  async createTextEmbedding(text) {
    if (!text || typeof text !== 'string') {
      throw AppError.validation('Text must be a non-empty string');
    }

    try {
      if (config.isTest) {
        const seed = Array.from(text)
          .map((char) => char.charCodeAt(0))
          .reduce((sum, code) => sum + code, 0);

        return Array.from({ length: 384 }, (_, index) => {
          const value = Math.sin(seed + index) * 10000;
          return value - Math.floor(value);
        });
      }

      const embeddings = await OllamaService.createEmbedding({
        model: config.ollama.embeddingModel,
        input: text,
      });

      if (Array.isArray(embeddings)) {
        return embeddings;
      }

      if (embeddings && Array.isArray(embeddings.embedding)) {
        return embeddings.embedding;
      }

      if (embeddings && Array.isArray(embeddings.embeddings)) {
        return embeddings.embeddings[0] || embeddings.embeddings;
      }

      throw AppError.internal('Invalid embedding response from Ollama');
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw AppError.internal(`Failed to create text embedding: ${error.message}`);
    }
  },

  /**
   * Generate embeddings for text content
   * @param {string} text - Text to generate embeddings for
   * @returns {Promise<number[]>} Array of embedding values
   */
  async generateEmbeddings(text) {
    return this.createTextEmbedding(text);
  },

  /**
   * Calculate cosine similarity between two embedding vectors
   * @param {number[]} vec1 - First embedding vector
   * @param {number[]} vec2 - Second embedding vector
   * @returns {number} Cosine similarity score (0 to 1)
   */
  cosineSimilarity(vec1, vec2) {
    if (!Array.isArray(vec1) || !Array.isArray(vec2)) {
      throw new Error('Both arguments must be arrays');
    }

    if (vec1.length !== vec2.length) {
      throw new Error('Vectors must have the same dimension');
    }

    let dotProduct = 0;
    let magnitude1 = 0;
    let magnitude2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      magnitude1 += vec1[i] * vec1[i];
      magnitude2 += vec2[i] * vec2[i];
    }

    magnitude1 = Math.sqrt(magnitude1);
    magnitude2 = Math.sqrt(magnitude2);

    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    return dotProduct / (magnitude1 * magnitude2);
  },

  /**
   * Find similar embeddings using cosine similarity
   * @param {number[]} queryEmbedding - Query embedding vector
   * @param {Object[]} candidates - Array of candidate objects with embeddings field
   * @param {number} threshold - Minimum similarity threshold (0 to 1)
   * @returns {Object[]} Sorted array of similar candidates with similarity scores
   */
  findSimilarEmbeddings(queryEmbedding, candidates, threshold = 0.5) {
    if (!Array.isArray(queryEmbedding)) {
      throw new Error('Query embedding must be an array');
    }

    if (!Array.isArray(candidates)) {
      throw new Error('Candidates must be an array');
    }

    const results = candidates
      .filter((candidate) => candidate.embeddings && Array.isArray(candidate.embeddings))
      .map((candidate) => ({
        ...candidate,
        similarity: this.cosineSimilarity(queryEmbedding, candidate.embeddings),
      }))
      .filter((result) => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity);

    return results;
  },
};

module.exports = EmbeddingService;
