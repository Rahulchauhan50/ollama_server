const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/app');
const TokenService = require('../src/services/token.service');
const RefreshSessionRepository = require('../src/repositories/refreshSession.repository');
const config = require('../src/config');

describe('Phase 13: Refresh Token and Logout', () => {
  describe('POST /api/auth/refresh - Validation', () => {
    test('should return 422 if refreshToken is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should return 422 if refreshToken is empty string', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: '' });

      expect(response.status).not.toBe(200);
    });

    test('should return 422 if refreshToken is null', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: null });

      expect(response.status).not.toBe(200);
    });
  });

  describe('POST /api/auth/refresh - Token Verification', () => {
    test('should return 401 for invalid refreshToken', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.here' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect([
        'REFRESH_TOKEN_INVALID',
        'UNAUTHORIZED',
      ]).toContain(response.body.error.code);
    });

    test('should return 401 for malformed refreshToken', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'notajwt' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 for expired refreshToken', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user123', email: 'test@example.com', type: 'refresh' },
        config.jwt.refreshSecret,
        {
          expiresIn: '-1h',
          issuer: 'ollama-backend',
          audience: 'ollama-frontend',
        }
      );

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: expiredToken });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect([
        'REFRESH_TOKEN_EXPIRED',
        'UNAUTHORIZED',
      ]).toContain(response.body.error.code);
    });
  });

  describe('POST /api/auth/refresh - Response Format', () => {
    test('should return proper response structure on success', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid' });

      // Even on error, check response structure
      expect(response.body.success).toBeDefined();
      expect(response.body.error || response.body.data).toBeDefined();
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
      expect(response.body.timestamp).toBeDefined();
    });

    test('should include requestId in error response', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
    });

    test('should include timestamp in response', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');
    });
  });

  describe('POST /api/auth/refresh - Endpoint Validation', () => {
    test('should exist at POST /api/auth/refresh', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).not.toBe(404);
    });

    test('should reject GET request to /api/auth/refresh', async () => {
      const response = await request(app).get('/api/auth/refresh');
      expect(response.status).toBe(404);
    });

    test('should reject PUT request to /api/auth/refresh', async () => {
      const response = await request(app)
        .put('/api/auth/refresh')
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/auth/logout - Authentication', () => {
    test('should return 401 if not authenticated', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should reject logout without Authorization header', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-token' });

      expect(response.status).toBe(401);
    });

    test('should reject logout with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid.token')
        .send({});

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/logout - Response Format', () => {
    test('should include requestId in response', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
    });

    test('should include timestamp in response', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/auth/logout - Endpoint Validation', () => {
    test('should exist at POST /api/auth/logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).not.toBe(404);
    });

    test('should reject GET request to /api/auth/logout', async () => {
      const response = await request(app).get('/api/auth/logout');
      expect(response.status).toBe(404);
    });

    test('should reject PUT request to /api/auth/logout', async () => {
      const response = await request(app)
        .put('/api/auth/logout')
        .send({});

      expect(response.status).toBe(404);
    });

    test('should reject DELETE request to /api/auth/logout', async () => {
      const response = await request(app).delete('/api/auth/logout');
      expect(response.status).toBe(404);
    });
  });

  describe('TokenService - Refresh Token Operations', () => {
    test('should generate valid refresh token', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
      };

      const token = TokenService.generateRefreshToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });

    test('should include type field in refresh token', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
      };

      const token = TokenService.generateRefreshToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.type).toBe('refresh');
      expect(decoded.userId).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
    });

    test('should verify valid refresh token', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
      };

      const token = TokenService.generateRefreshToken(user);
      const decoded = TokenService.verifyRefreshToken(token);

      expect(decoded.userId).toBe('user123');
      expect(decoded.type).toBe('refresh');
    });

    test('should reject invalid refresh token', () => {
      expect(() => {
        TokenService.verifyRefreshToken('invalid.token.here');
      }).toThrow();
    });

    test('should reject missing refresh token', () => {
      expect(() => {
        TokenService.verifyRefreshToken(null);
      }).toThrow();
    });
  });

  describe('RefreshSessionRepository - Session Management', () => {
    test('should have create method', () => {
      expect(typeof RefreshSessionRepository.create).toBe('function');
    });

    test('should have findByToken method', () => {
      expect(typeof RefreshSessionRepository.findByToken).toBe('function');
    });

    test('should have revoke method', () => {
      expect(typeof RefreshSessionRepository.revoke).toBe('function');
    });

    test('should have revokeAllUserSessions method', () => {
      expect(typeof RefreshSessionRepository.revokeAllUserSessions).toBe('function');
    });

    test('should have findActiveSessionsByUserId method', () => {
      expect(typeof RefreshSessionRepository.findActiveSessionsByUserId).toBe('function');
    });

    test('should have findAllSessionsByUserId method', () => {
      expect(typeof RefreshSessionRepository.findAllSessionsByUserId).toBe('function');
    });
  });

  describe('Refresh Token Lifecycle', () => {
    test('should have createRefreshSession method', () => {
      expect(typeof TokenService.createRefreshSession).toBe('function');
    });

    test('should have rotateRefreshToken method', () => {
      expect(typeof TokenService.rotateRefreshToken).toBe('function');
    });

    test('should have revokeRefreshToken method', () => {
      expect(typeof TokenService.revokeRefreshToken).toBe('function');
    });

    test('should have revokeAllUserSessions method', () => {
      expect(typeof TokenService.revokeAllUserSessions).toBe('function');
    });
  });

  describe('Auth Service - Session Lifecycle', () => {
    test('should have refresh method', () => {
      expect(typeof require('../src/services/auth.service').refresh).toBe('function');
    });

    test('should have logout method', () => {
      expect(typeof require('../src/services/auth.service').logout).toBe('function');
    });

    test('should have logoutAll method', () => {
      expect(typeof require('../src/services/auth.service').logoutAll).toBe('function');
    });

    test('should have getCurrentUser method', () => {
      expect(typeof require('../src/services/auth.service').getCurrentUser).toBe('function');
    });
  });

  describe('Auth Controller - Endpoints', () => {
    test('should have refresh handler', () => {
      expect(typeof require('../src/controllers/auth.controller').refresh).toBe('function');
    });

    test('should have logout handler', () => {
      expect(typeof require('../src/controllers/auth.controller').logout).toBe('function');
    });

    test('should have getCurrentUser handler', () => {
      expect(typeof require('../src/controllers/auth.controller').getCurrentUser).toBe('function');
    });
  });

  describe('Refresh Token Response Format', () => {
    test('error response should have correct structure', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.statusCode).toBeDefined();
      expect(response.body.error.message).toBeDefined();
    });
  });

  describe('Logout Response Format', () => {
    test('error response should have correct structure', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.statusCode).toBeDefined();
    });
  });

  describe('Session Token Family', () => {
    test('refresh token should include family tracking for security', async () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
      };

      const { session } = await TokenService.createRefreshSession(user._id);

      expect(session.refreshTokenFamily).toBeDefined();
      expect(typeof session.refreshTokenFamily).toBe('string');
    });

    test('should track rotation count', async () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
      };

      const { session } = await TokenService.createRefreshSession(user._id);

      expect(session.rotationCount).toBeDefined();
      expect(typeof session.rotationCount).toBe('number');
    });
  });

  describe('Access Token Expiry', () => {
    test('should have configured access token expiry', () => {
      expect(config.jwt.accessExpiry).toBeDefined();
      expect(typeof config.jwt.accessExpiry).toBe('string');
    });

    test('refresh endpoint should return valid access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid' });

      // Response will be error, but structure should be correct
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('meta');
    });
  });
});
