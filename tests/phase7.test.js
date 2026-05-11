const request = require('supertest');
const { app } = require('../src/app');

describe('Phase 7: Request ID and Logging', () => {
  describe('Request ID Middleware', () => {
    test('should attach requestId to request object', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('requestId');
      expect(typeof response.body.meta.requestId).toBe('string');
      expect(response.body.meta.requestId.length).toBeGreaterThan(0);
    });

    test('should use x-request-id header if provided', async () => {
      const customRequestId = 'custom-req-123';
      const response = await request(app)
        .get('/api/health')
        .set('x-request-id', customRequestId);

      expect(response.status).toBe(200);
      expect(response.body.meta.requestId).toBe(customRequestId);
    });

    test('should generate unique requestId for different requests', async () => {
      const response1 = await request(app).get('/api/health');
      const response2 = await request(app).get('/api/health');

      expect(response1.body.meta.requestId).not.toBe(response2.body.meta.requestId);
    });
  });

  describe('Response Format with Meta', () => {
    test('success responses should include meta.requestId', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('statusCode', 200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('requestId');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('should include meta in all success endpoints', async () => {
      const endpoints = ['/api/health', '/api/config', '/api/version', '/'];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);
        expect(response.body).toHaveProperty('meta.requestId');
        expect(typeof response.body.meta.requestId).toBe('string');
      }
    });

    test('should include meta.requestId in error responses', async () => {
      const response = await request(app).get('/api/non-existent-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('requestId');
    });
  });

  describe('Health Endpoint with Request ID', () => {
    test('health endpoint should include requestId in response', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('database');
      expect(response.body.meta).toHaveProperty('requestId');
    });

    test('health endpoint should work with custom requestId', async () => {
      const customId = 'req_health_check_001';
      const response = await request(app)
        .get('/api/health')
        .set('x-request-id', customId);

      expect(response.body.meta.requestId).toBe(customId);
    });
  });

  describe('Configuration Endpoint with Request ID', () => {
    test('config endpoint should include requestId', async () => {
      const response = await request(app).get('/api/config');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('meta.requestId');
      expect(response.body.data).toHaveProperty('nodeEnv');
      expect(response.body.data).toHaveProperty('port');
    });
  });

  describe('Version Endpoint with Request ID', () => {
    test('version endpoint should include requestId', async () => {
      const response = await request(app).get('/api/version');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('meta.requestId');
      expect(response.body.data).toHaveProperty('version');
    });
  });

  describe('Root Endpoint with Request ID', () => {
    test('root endpoint should include requestId', async () => {
      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('meta.requestId');
    });
  });

  describe('Meta Structure Consistency', () => {
    test('all successful responses should have consistent meta structure', async () => {
      const endpoints = ['/api/health', '/api/config', '/api/version', '/'];

      for (const endpoint of endpoints) {
        const response = await request(app).get(endpoint);

        expect(response.body).toHaveProperty('meta');
        expect(Object.keys(response.body.meta)).toContain('requestId');
        expect(typeof response.body.meta.requestId).toBe('string');
        expect(response.body.meta.requestId.length).toBeGreaterThan(0);
      }
    });

    test('error responses should have consistent meta structure', async () => {
      const response = await request(app).get('/nonexistent');

      expect(response.body).toHaveProperty('meta');
      expect(response.body.meta).toHaveProperty('requestId');
      expect(typeof response.body.meta.requestId).toBe('string');
    });
  });

  describe('Request ID Persistence', () => {
    test('custom requestId should persist through the request lifecycle', async () => {
      const customId = 'persistent-id-12345';
      const response = await request(app)
        .get('/api/health')
        .set('x-request-id', customId);

      expect(response.body.meta.requestId).toBe(customId);
      // Make another request with same ID to verify it's used
      const response2 = await request(app)
        .get('/api/config')
        .set('x-request-id', customId);

      expect(response2.body.meta.requestId).toBe(customId);
    });
  });

  describe('Logger Utility', () => {
    test('Logger utility should be importable', () => {
      const { Logger } = require('../src/utils');
      expect(Logger).toBeDefined();
      expect(typeof Logger).toBe('object');
    });

    test('Logger should have required methods', () => {
      const { Logger } = require('../src/utils');
      expect(typeof Logger.info).toBe('function');
      expect(typeof Logger.warn).toBe('function');
      expect(typeof Logger.error).toBe('function');
      expect(typeof Logger.debug).toBe('function');
      expect(typeof Logger.logRequest).toBe('function');
      expect(typeof Logger.logResponse).toBe('function');
    });

    test('Logger methods should accept requestId parameter', () => {
      const { Logger } = require('../src/utils');
      const requestId = 'test-request-id';

      // Should not throw
      expect(() => Logger.info('Test', requestId)).not.toThrow();
      expect(() => Logger.warn('Test', requestId)).not.toThrow();
      expect(() => Logger.error('Test', requestId)).not.toThrow();
      expect(() => Logger.debug('Test', requestId)).not.toThrow();
    });
  });

  describe('AppError with Request ID', () => {
    test('AppError should support requestId', () => {
      const { AppError } = require('../src/utils');
      const error = AppError.notFound('Resource not found', null, 'req_test_123');

      expect(error.requestId).toBe('req_test_123');
    });

    test('AppError toJSON should include meta.requestId', () => {
      const { AppError } = require('../src/utils');
      const error = AppError.badRequest('Invalid input', null, 'req_error_001');
      const json = error.toJSON();

      expect(json).toHaveProperty('meta');
      expect(json.meta).toHaveProperty('requestId', 'req_error_001');
    });

    test('AppError factory methods should support requestId', () => {
      const { AppError } = require('../src/utils');
      const requestId = 'factory-request-id';

      expect(AppError.badRequest('Bad', null, requestId).requestId).toBe(requestId);
      expect(AppError.unauthorized('Unauth', null, requestId).requestId).toBe(requestId);
      expect(AppError.forbidden('Forbidden', null, requestId).requestId).toBe(requestId);
      expect(AppError.notFound('Not Found', null, requestId).requestId).toBe(requestId);
      expect(AppError.conflict('Conflict', null, requestId).requestId).toBe(requestId);
      expect(AppError.validation('Invalid', null, requestId).requestId).toBe(requestId);
      expect(AppError.internal('Error', null, requestId).requestId).toBe(requestId);
      expect(AppError.serviceUnavailable('Unavailable', null, requestId).requestId).toBe(requestId);
    });
  });

  describe('ApiResponse with Request ID', () => {
    test('ApiResponse should support requestId', () => {
      const { ApiResponse } = require('../src/utils');
      const response = ApiResponse.success({ test: 'data' }, 'Success', 200, 'req_test_456');

      expect(response.meta.requestId).toBe('req_test_456');
    });

    test('ApiResponse toJSON should include meta.requestId', () => {
      const { ApiResponse } = require('../src/utils');
      const response = ApiResponse.success({ test: 'data' }, 'Success', 200, 'req_json_001');
      const json = response.toJSON();

      expect(json).toHaveProperty('meta');
      expect(json.meta).toHaveProperty('requestId', 'req_json_001');
    });

    test('ApiResponse factory methods should support requestId', () => {
      const { ApiResponse } = require('../src/utils');
      const requestId = 'factory-req-id';

      expect(ApiResponse.success({}, 'Success', 200, requestId).meta.requestId).toBe(requestId);
      expect(ApiResponse.created({}, 'Created', requestId).meta.requestId).toBe(requestId);
      expect(ApiResponse.error('Error', 400, null, requestId).meta.requestId).toBe(requestId);
    });
  });
});
