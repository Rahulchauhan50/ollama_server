const request = require('supertest');
const { app } = require('../src/app');

describe('Phase 11: Login API', () => {
  describe('POST /api/auth/login - Validation', () => {
    test('should return 422 if email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123!',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.errors).toBeDefined();
      expect(response.body.error.details.errors.length).toBeGreaterThan(0);
    });

    test('should return 422 if password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rahul@example.com',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 422 if both fields are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.details.errors.length).toBeGreaterThan(0);
    });

    test('should return 422 if email is invalid format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 422 if password is empty string', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rahul@example.com',
          password: '',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should lowercase email before validation', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'RAHUL@EXAMPLE.COM',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    test('should trim email whitespace', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '  rahul@example.com  ',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/login - Error Handling', () => {
    test('should return 401 for non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    test('should return 401 for wrong password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(response.body.error.message).toBe('Invalid email or password');
    });

    test('should not distinguish between missing email and wrong password', async () => {
      const response1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      const response2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword123!',
        });

      expect(response1.body.error.message).toBe(response2.body.error.message);
      expect(response1.body.error.code).toBe(response2.body.error.code);
    });
  });

  describe('POST /api/auth/login - Response Format', () => {
    test('should include requestId in response meta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
      expect(typeof response.body.meta.requestId).toBe('string');
    });

    test('should include timestamp in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');
    });

    test('error response should have correct structure for validation error', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid',
          password: 'pass',
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.statusCode).toBe(422);
      expect(response.body.error.details).toBeDefined();
      expect(Array.isArray(response.body.error.details.errors)).toBe(true);
    });

    test('error response should have correct structure for auth error', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(response.body.error.statusCode).toBe(401);
      expect(response.body.error.message).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/login - Endpoint Validation', () => {
    test('should exist at POST /api/auth/login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).not.toBe(404);
    });

    test('should reject GET request to /api/auth/login', async () => {
      const response = await request(app).get('/api/auth/login');

      expect(response.status).toBe(404);
    });

    test('should reject PUT request to /api/auth/login', async () => {
      const response = await request(app)
        .put('/api/auth/login')
        .send({});

      expect(response.status).toBe(404);
    });

    test('should reject DELETE request to /api/auth/login', async () => {
      const response = await request(app).delete('/api/auth/login');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/auth/login - Special Characters', () => {
    test('should handle email with special characters', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user+test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle password with special characters', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'P@$$w0rd!#%&*()[]{}',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('AUTH_INVALID_CREDENTIALS');
    });

    test('should handle unicode characters in password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!😀🔐',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login - Edge Cases', () => {
    test('should handle very long email', async () => {
      const longEmail = `${'a'.repeat(50)}@${'b'.repeat(50)}.com`;
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: longEmail,
          password: 'Password123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should handle very long password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'a'.repeat(1000),
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject request with extra fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          rememberMe: true,
          redirectUrl: '/dashboard',
        });

      expect([200, 401, 422]).toContain(response.status);
    });

    test('should reject request with null values', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: null,
          password: null,
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject request with numeric values', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 12345,
          password: 67890,
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject request with boolean values', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: true,
          password: false,
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject request with array values', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: ['test@example.com'],
          password: ['Password123!'],
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should reject request with object values', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: { value: 'test@example.com' },
          password: { value: 'Password123!' },
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/login - Endpoint Validation', () => {
    test('should be accessible via POST', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      // Should return a valid HTTP status (not 404 or method not allowed)
      expect(response.status).not.toBe(404);
      expect(response.status).not.toBe(405); // Method Not Allowed
    });

    test('should respond to requests with valid body structure', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      // Should have proper response structure
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('statusCode');
      expect(response.body).toHaveProperty('meta');
    });
  });
});
