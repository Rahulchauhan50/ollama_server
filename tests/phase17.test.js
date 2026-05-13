const request = require('supertest');
const { app } = require('../src/app');
const OllamaService = require('../src/services/ollama.service');
const config = require('../src/config');

// Mock OllamaService
jest.mock('../src/services/ollama.service');

describe('Phase 17: Models List API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/models - Validation', () => {
    test('should return 200 with models array', async () => {
      const mockModels = [
        { name: 'llama2', isDefault: true },
        { name: 'mistral', isDefault: false },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data.models)).toBe(true);
    });

    test('should return proper response structure', async () => {
      const mockModels = [
        { name: 'llama2', isDefault: true },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      expect(response.body.success).toBe(true);
      expect(response.body.statusCode).toBe(200);
      expect(response.body.message).toBeDefined();
      expect(response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    test('should include meta.requestId in response', async () => {
      const mockModels = [
        { name: 'llama2', isDefault: true },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      expect(response.body.meta.requestId).toBeDefined();
      expect(typeof response.body.meta.requestId).toBe('string');
      expect(response.body.meta.requestId.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/models - Model Format', () => {
    test('should return models with name and isDefault fields', async () => {
      const mockModels = [
        { name: 'llama2', isDefault: true },
        { name: 'mistral', isDefault: false },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(200);
      expect(response.body.data.models).toHaveLength(2);

      response.body.data.models.forEach(model => {
        expect(model).toHaveProperty('name');
        expect(model).toHaveProperty('isDefault');
        expect(typeof model.name).toBe('string');
        expect(typeof model.isDefault).toBe('boolean');
      });
    });

    test('should have exactly one default model marked', async () => {
      const mockModels = [
        { name: 'llama2', isDefault: true },
        { name: 'mistral', isDefault: false },
        { name: 'neural-chat', isDefault: false },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      const defaultModels = response.body.data.models.filter(m => m.isDefault);
      expect(defaultModels).toHaveLength(1);
      expect(defaultModels[0].name).toBe('llama2');
    });

    test('should return empty models array when no models available', async () => {
      OllamaService.listModels.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(200);
      expect(response.body.data.models).toHaveLength(0);
      expect(Array.isArray(response.body.data.models)).toBe(true);
    });
  });

  describe('GET /api/models - Error Handling', () => {
    test('should return 503 when Ollama service is unavailable', async () => {
      const error = new Error('Connection refused');
      error.code = 'SERVICE_UNAVAILABLE';
      OllamaService.listModels.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(503);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
    });

    test('should include error code in error response', async () => {
      const error = new Error('Ollama API error');
      error.code = 'SERVICE_UNAVAILABLE';
      OllamaService.listModels.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(503);
      expect(response.body.error.code).toBeDefined();
    });

    test('should include requestId in error response', async () => {
      const error = new Error('Service error');
      error.code = 'SERVICE_UNAVAILABLE';
      OllamaService.listModels.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/models');

      expect(response.body.meta.requestId).toBeDefined();
      expect(response.body.meta.requestId.length).toBeGreaterThan(0);
    });

    test('should include timestamp in error response', async () => {
      const error = new Error('Service error');
      error.code = 'SERVICE_UNAVAILABLE';
      OllamaService.listModels.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/models');

      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('GET /api/models - Service Integration', () => {
    test('should call OllamaService.listModels once', async () => {
      OllamaService.listModels.mockResolvedValue([
        { name: 'llama2', isDefault: true },
      ]);

      await request(app)
        .get('/api/models');

      expect(OllamaService.listModels).toHaveBeenCalledTimes(1);
    });

    test('should call OllamaService.listModels without arguments', async () => {
      OllamaService.listModels.mockResolvedValue([]);

      await request(app)
        .get('/api/models');

      expect(OllamaService.listModels).toHaveBeenCalledWith();
    });

    test('should return models from OllamaService', async () => {
      const mockModels = [
        { name: 'llama2', isDefault: true },
        { name: 'mistral', isDefault: false },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      expect(response.body.data.models).toEqual(mockModels);
    });
  });

  describe('GET /api/models - Multiple Models', () => {
    test('should handle multiple models correctly', async () => {
      const mockModels = [
        { name: 'llama2', isDefault: true },
        { name: 'mistral', isDefault: false },
        { name: 'neural-chat', isDefault: false },
        { name: 'openchat', isDefault: false },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(200);
      expect(response.body.data.models).toHaveLength(4);
      expect(response.body.data.models[0].name).toBe('llama2');
      expect(response.body.data.models[1].name).toBe('mistral');
      expect(response.body.data.models[2].name).toBe('neural-chat');
      expect(response.body.data.models[3].name).toBe('openchat');
    });

    test('should maintain model order from service', async () => {
      const mockModels = [
        { name: 'model-z', isDefault: false },
        { name: 'model-a', isDefault: false },
        { name: 'model-m', isDefault: true },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      expect(response.body.data.models[0].name).toBe('model-z');
      expect(response.body.data.models[1].name).toBe('model-a');
      expect(response.body.data.models[2].name).toBe('model-m');
    });
  });

  describe('GET /api/models - Edge Cases', () => {
    test('should handle models with special characters in names', async () => {
      const mockModels = [
        { name: 'llama2-uncensored', isDefault: true },
        { name: 'neural-chat-7b-v3', isDefault: false },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(200);
      expect(response.body.data.models[0].name).toBe('llama2-uncensored');
      expect(response.body.data.models[1].name).toBe('neural-chat-7b-v3');
    });

    test('should handle long model names', async () => {
      const longName = 'a'.repeat(100);
      const mockModels = [
        { name: longName, isDefault: true },
      ];

      OllamaService.listModels.mockResolvedValue(mockModels);

      const response = await request(app)
        .get('/api/models');

      expect(response.status).toBe(200);
      expect(response.body.data.models[0].name).toBe(longName);
    });

    test('should return success true for valid response', async () => {
      OllamaService.listModels.mockResolvedValue([
        { name: 'llama2', isDefault: true },
      ]);

      const response = await request(app)
        .get('/api/models');

      expect(response.body.success).toBe(true);
      expect(response.body.error).toBeUndefined();
    });

    test('should return success false for error response', async () => {
      const error = new Error('Service error');
      error.code = 'SERVICE_UNAVAILABLE';
      OllamaService.listModels.mockRejectedValue(error);

      const response = await request(app)
        .get('/api/models');

      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeUndefined();
      expect(response.body.error).toBeDefined();
    });
  });
});
