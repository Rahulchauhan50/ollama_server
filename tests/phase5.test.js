const { ApiResponse, AppError, asyncHandler } = require('../src/utils');

describe('Phase 5: Standard API Response and Error Classes', () => {
  describe('ApiResponse', () => {
    test('should create successful response', () => {
      const response = ApiResponse.success({ id: 1 }, 'User found', 200);
      expect(response.success).toBe(true);
      expect(response.statusCode).toBe(200);
      expect(response.message).toBe('User found');
      expect(response.data).toEqual({ id: 1 });
    });

    test('should create created response (201)', () => {
      const response = ApiResponse.created({ id: 1 }, 'User created');
      expect(response.statusCode).toBe(201);
      expect(response.success).toBe(true);
    });

    test('should create error response', () => {
      const response = ApiResponse.error('Not found', 404);
      expect(response.success).toBe(false);
      expect(response.statusCode).toBe(404);
      expect(response.message).toBe('Not found');
    });

    test('should include timestamp in response', () => {
      const response = ApiResponse.success(null);
      expect(response.timestamp).toBeDefined();
      expect(response.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('should convert to JSON correctly', () => {
      const response = ApiResponse.success({ test: 'data' }, 'Success');
      const json = response.toJSON();
      expect(json.success).toBe(true);
      expect(json.data).toEqual({ test: 'data' });
      expect(json.message).toBe('Success');
    });
  });

  describe('AppError', () => {
    test('should create custom error', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error instanceof Error).toBe(true);
    });

    test('should create bad request error', () => {
      const error = AppError.badRequest('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('BAD_REQUEST');
    });

    test('should create unauthorized error', () => {
      const error = AppError.unauthorized('No token provided');
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe('UNAUTHORIZED');
    });

    test('should create forbidden error', () => {
      const error = AppError.forbidden('Access denied');
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe('FORBIDDEN');
    });

    test('should create not found error', () => {
      const error = AppError.notFound('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe('NOT_FOUND');
    });

    test('should create conflict error', () => {
      const error = AppError.conflict('Email already exists');
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe('CONFLICT');
    });

    test('should create validation error', () => {
      const error = AppError.validation('Invalid email', { field: 'email' });
      expect(error.statusCode).toBe(422);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });

    test('should create internal error', () => {
      const error = AppError.internal('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe('INTERNAL_ERROR');
    });

    test('should create service unavailable error', () => {
      const error = AppError.serviceUnavailable('Database down');
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe('SERVICE_UNAVAILABLE');
    });

    test('should convert error to JSON', () => {
      const error = AppError.badRequest('Invalid data', { field: 'email' });
      const json = error.toJSON();
      expect(json.success).toBe(false);
      expect(json.error.code).toBe('BAD_REQUEST');
      expect(json.error.statusCode).toBe(400);
      expect(json.error.details).toEqual({ field: 'email' });
    });

    test('should include timestamp', () => {
      const error = new AppError('Test', 400);
      expect(error.timestamp).toBeDefined();
    });

    test('should maintain stack trace', () => {
      const error = new AppError('Test', 400);
      expect(error.stack).toBeDefined();
      expect(error.stack).toMatch(/Error: Test/);
    });
  });

  describe('asyncHandler', () => {
    test('should be a function', () => {
      expect(typeof asyncHandler).toBe('function');
    });

    test('should wrap async functions', () => {
      const wrappedFn = asyncHandler(async (req, res) => {
        res.json({ test: 'data' });
      });
      expect(typeof wrappedFn).toBe('function');
      expect(wrappedFn.length).toBe(3); // (req, res, next)
    });

    test('should catch async errors', (done) => {
      const mockNext = jest.fn();
      const wrappedFn = asyncHandler(async () => {
        throw new Error('Async error');
      });

      wrappedFn({}, {}, mockNext);

      // Give the promise time to resolve
      setTimeout(() => {
        expect(mockNext).toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
        done();
      }, 100);
    });
  });

  describe('Response Format Consistency', () => {
    test('success responses should all have same structure', () => {
      const responses = [
        ApiResponse.success(null, 'Test 1'),
        ApiResponse.created({ id: 1 }, 'Test 2'),
        ApiResponse.success({ data: 'value' }, 'Test 3'),
      ];

      responses.forEach((response) => {
        const json = response.toJSON();
        expect(json).toHaveProperty('success');
        expect(json).toHaveProperty('statusCode');
        expect(json).toHaveProperty('message');
        expect(json).toHaveProperty('data');
        expect(json).toHaveProperty('timestamp');
      });
    });

    test('error responses should all have same structure', () => {
      const errors = [
        AppError.badRequest('Test'),
        AppError.notFound('Test'),
        AppError.internal('Test'),
      ];

      errors.forEach((error) => {
        const json = error.toJSON();
        expect(json).toHaveProperty('success', false);
        expect(json).toHaveProperty('error');
        expect(json.error).toHaveProperty('code');
        expect(json.error).toHaveProperty('message');
        expect(json.error).toHaveProperty('statusCode');
        expect(json).toHaveProperty('timestamp');
      });
    });
  });
});
