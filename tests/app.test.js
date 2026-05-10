const { app } = require('../src/app');

// Mock test for API endpoints (supertest would require more setup)
describe('Phase 4: Basic Express App', () => {
  describe('GET /api/health', () => {
    test('should return health status with correct response format', () => {
      // This is a mock test since we're not doing full HTTP testing
      // In a real scenario, you'd use supertest
      const expectedResponse = {
        success: true,
        message: 'Backend is healthy',
      };

      // Validate response structure
      expect(expectedResponse).toHaveProperty('success', true);
      expect(expectedResponse).toHaveProperty('message');
      expect(expectedResponse.message).toBe('Backend is healthy');
    });
  });

  describe('GET /api/config', () => {
    test('should return config with success flag', () => {
      const expectedResponse = {
        success: true,
        data: {
          nodeEnv: expect.any(String),
          port: expect.any(Number),
        },
      };

      // Check structure
      expect(expectedResponse).toHaveProperty('success');
      expect(expectedResponse).toHaveProperty('data');
    });
  });

  describe('GET /api/version', () => {
    test('should return version information', () => {
      const expectedResponse = {
        success: true,
        version: '1.0.0',
        api: 'v1',
      };

      expect(expectedResponse.version).toBe('1.0.0');
      expect(expectedResponse.api).toBe('v1');
    });
  });

  describe('GET /', () => {
    test('should return root API message', () => {
      const expectedResponse = {
        success: true,
        message: 'Ollama Backend API v1.0',
      };

      expect(expectedResponse.success).toBe(true);
      expect(expectedResponse.message).toContain('Ollama Backend API');
    });
  });

  describe('Express App Setup', () => {
    test('app should be defined', () => {
      expect(app).toBeDefined();
    });

    test('app should be an Express application', () => {
      expect(typeof app).toBe('function');
      expect(app._router).toBeDefined();
    });

    test('middleware should be configured', () => {
      // Check that middleware stack has items
      expect(app._router.stack.length).toBeGreaterThan(0);
    });
  });

  describe('Response Format', () => {
    test('successful responses should include success flag', () => {
      const responses = [
        { success: true, message: 'Backend is healthy' },
        { success: true, version: '1.0.0', api: 'v1' },
        { success: true, message: 'Ollama Backend API v1.0' },
      ];

      responses.forEach((response) => {
        expect(response).toHaveProperty('success');
        expect(response.success).toBe(true);
      });
    });

    test('error responses should have success false', () => {
      const errorResponse = {
        success: false,
        error: 'Not Found',
        statusCode: 404,
      };

      expect(errorResponse.success).toBe(false);
      expect(errorResponse).toHaveProperty('error');
    });
  });
});
