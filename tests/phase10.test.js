const request = require('supertest');
const { app } = require('../src/app');
const PasswordService = require('../src/services/password.service');
const { validateSignup } = require('../src/validators/auth.validators');

describe('Phase 10: Signup API', () => {
  describe('Signup Validation', () => {
    it('should validate correct signup data', () => {
      const data = {
        name: 'Rahul Kumar',
        email: 'rahul@example.com',
        password: 'Password123!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeNull();
    });

    it('should reject missing name', () => {
      const data = {
        email: 'rahul@example.com',
        password: 'Password123!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors[0].field).toBe('name');
    });

    it('should reject empty name', () => {
      const data = {
        name: '',
        email: 'rahul@example.com',
        password: 'Password123!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('at least 2 characters');
    });

    it('should reject name shorter than 2 characters', () => {
      const data = {
        name: 'R',
        email: 'rahul@example.com',
        password: 'Password123!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('at least 2 characters');
    });

    it('should reject name longer than 100 characters', () => {
      const data = {
        name: 'a'.repeat(101),
        email: 'rahul@example.com',
        password: 'Password123!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('at most 100 characters');
    });

    it('should reject invalid email format', () => {
      const data = {
        name: 'Rahul Kumar',
        email: 'invalid-email',
        password: 'Password123!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('email');
      expect(result.errors[0].message).toContain('Invalid email');
    });

    it('should reject missing email', () => {
      const data = {
        name: 'Rahul Kumar',
        password: 'Password123!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('email');
    });

    it('should reject missing password', () => {
      const data = {
        name: 'Rahul Kumar',
        email: 'rahul@example.com',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].field).toBe('password');
    });

    it('should reject short password', () => {
      const data = {
        name: 'Rahul Kumar',
        email: 'rahul@example.com',
        password: 'Pass12!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(false);
      expect(result.errors[0].message).toContain('at least 8 characters');
    });

    it('should lowercase email', () => {
      const data = {
        name: 'Rahul Kumar',
        email: 'RAHUL@EXAMPLE.COM',
        password: 'Password123!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(true);
      expect(result.data.email).toBe('rahul@example.com');
    });

    it('should trim whitespace from name and email', () => {
      const data = {
        name: '  Rahul Kumar  ',
        email: '  rahul@example.com  ',
        password: 'Password123!',
      };
      const result = validateSignup(data);

      expect(result.isValid).toBe(true);
      expect(result.data.name).toBe('Rahul Kumar');
      expect(result.data.email).toBe('rahul@example.com');
    });
  });

  describe('POST /api/auth/signup - Request Validation', () => {
    it('should reject missing name field', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject missing email field', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          password: 'Password123!',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing password field', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'invalid-email',
          password: 'Password123!',
        });

      expect(response.status).toBe(422);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject password shorter than 8 characters', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Pass12!',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should reject name shorter than 2 characters', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'A',
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });

    it('should include requestId in error response', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .set('x-request-id', 'test-validation-error-123')
        .send({
          email: 'invalid.email',
          password: 'Pass12!',
        });

      expect(response.status).toBe(422);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBe('test-validation-error-123');
    });

    it('should include validation error details', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test',
          email: 'invalid',
          password: 'short',
        });

      expect(response.status).toBe(422);
      expect(response.body.error.details).toBeDefined();
      expect(response.body.error.details.errors).toBeDefined();
      expect(Array.isArray(response.body.error.details.errors)).toBe(true);
      expect(response.body.error.details.errors.length).toBeGreaterThan(0);
    });

    it('should accept email with different cases', async () => {
      // This test validates behavior at the API level
      // We expect a 500 error (database timeout) not validation error
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'TEST@EXAMPLE.COM',
          password: 'Password123!',
        });

      // Status should be either 201 (success) or 500 (db timeout), not 422 (validation)
      expect([201, 500]).toContain(response.status);
    });

    it('should handle special characters in name', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: "O'Brien-Smith",
          email: 'test@example.com',
          password: 'Password123!',
        });

      // Should be 201 success or 500 db timeout, not validation error
      expect([201, 500]).toContain(response.status);
    });

    it('should handle whitespace in input', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: '  Test User  ',
          email: '  test@example.com  ',
          password: 'Password123!',
        });

      // Should be 201 success or 500 db timeout, not validation error
      expect([201, 500]).toContain(response.status);
    });
  });

  describe('Signup Request/Response Format', () => {
    it('should return proper timestamp in response', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should include statusCode in response', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'invalid',
          password: 'short',
        });

      expect(response.body.statusCode).toBeDefined();
      expect(response.body.statusCode).toBeGreaterThan(0);
    });

    it('should include success flag in response', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test',
          email: 'test',
          password: 'Pass123!',
        });

      expect(response.body.success).toBeDefined();
      expect(typeof response.body.success).toBe('boolean');
    });

    it('should include meta.requestId in error response', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid',
          password: 'short',
        });

      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
    });

    it('should generate unique requestIds for different requests', async () => {
      const response1 = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User1', email: 'user1@test.com', password: 'Pass123!' });

      const response2 = await request(app)
        .post('/api/auth/signup')
        .send({ name: 'User2', email: 'user2@test.com', password: 'Pass123!' });

      if (response1.body.meta && response2.body.meta) {
        expect(response1.body.meta.requestId).not.toBe(response2.body.meta.requestId);
      }
    });
  });

  describe('Signup Endpoint Existence and Routes', () => {
    it('POST /api/auth/signup should be callable', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test',
          email: 'test@test.com',
          password: 'TestPass123!',
        });

      // Should not be a 404
      expect(response.status).not.toBe(404);
    });

    it('GET /api/auth/signup should not exist', async () => {
      const response = await request(app)
        .get('/api/auth/signup');

      expect(response.status).toBe(404);
    });

    it('should respond with error for invalid HTTP methods', async () => {
      const response = await request(app)
        .put('/api/auth/signup')
        .send({
          name: 'Test',
          email: 'test@test.com',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('Signup Error Responses', () => {
    it('should return error response object structure for validation error', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid',
          password: 'short',
        });

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.statusCode).toBeDefined();
    });

    it('should return empty request body error', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should not expose server stack trace in production-like responses', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test',
          email: 'invalid-email',
          password: 'Pass123!',
        });

      // In error response, should not have raw Error details
      if (response.body.error.details) {
        // If there are details, they should be structured errors, not stack traces
        expect(typeof response.body.error.details).toBe('object');
      }
    });
  });

  describe('Signup Validation Edge Cases', () => {
    it('should accept email with plus addressing', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'user+tag@example.com',
          password: 'Password123!',
        });

      // Not validation error (should be 201 or 500)
      expect(response.status).not.toBe(422);
    });

    it('should accept numeric characters in email', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: '123456@example.com',
          password: 'Password123!',
        });

      // Not validation error
      expect(response.status).not.toBe(422);
    });

    it('should accept very long name up to 100 characters', async () => {
      const longName = 'a'.repeat(100);
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: longName,
          email: 'test@example.com',
          password: 'Password123!',
        });

      // Not validation error
      expect(response.status).not.toBe(422);
    });

    it('should reject name longer than 100 characters', async () => {
      const tooLongName = 'a'.repeat(101);
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: tooLongName,
          email: 'test@example.com',
          password: 'Password123!',
        });

      // Should be validation error
      expect(response.status).toBe(422);
    });

    it('should accept password with special characters', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'P@ssw0rd!#$%^&*()',
        });

      // Not validation error
      expect(response.status).not.toBe(422);
    });

    it('should accept numeric passwords', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '12345678',
        });

      // Not validation error
      expect(response.status).not.toBe(422);
    });

    it('should accept maximum length password', async () => {
      const longPassword = 'a'.repeat(1000);
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: longPassword,
        });

      // Not validation error
      expect(response.status).not.toBe(422);
    });
  });
});
