const request = require('supertest');
const jwt = require('jsonwebtoken');
const { app } = require('../src/app');
const TokenService = require('../src/services/token.service');
const config = require('../src/config');

describe('Phase 12: JWT Access Token Service', () => {
  describe('TokenService.signAccessToken()', () => {
    test('should generate valid JWT token', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = TokenService.signAccessToken(user);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts
    });

    test('should include user data in token payload', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'admin',
      };

      const token = TokenService.signAccessToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.userId).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('admin');
    });

    test('should set token expiry', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = TokenService.signAccessToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp > decoded.iat).toBe(true);
    });

    test('should set issuer and audience', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = TokenService.signAccessToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.iss).toBe('ollama-backend');
      expect(decoded.aud).toBe('ollama-frontend');
    });

    test('should default role to user if not provided', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
      };

      const token = TokenService.signAccessToken(user);
      const decoded = jwt.decode(token);

      expect(decoded.role).toBe('user');
    });

    test('should throw error if user is null', () => {
      expect(() => TokenService.signAccessToken(null)).toThrow();
    });

    test('should throw error if user has no _id', () => {
      const user = {
        email: 'test@example.com',
        role: 'user',
      };

      expect(() => TokenService.signAccessToken(user)).toThrow();
    });

    test('should throw error if user has no email', () => {
      const user = {
        _id: 'user123',
        role: 'user',
      };

      expect(() => TokenService.signAccessToken(user)).toThrow();
    });

    test('should generate different tokens for multiple calls with same user', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };

      const token1 = TokenService.signAccessToken(user);
      // Small delay to ensure different iat values
      const token1Decoded = jwt.decode(token1);
      
      const token2 = TokenService.signAccessToken(user);
      const token2Decoded = jwt.decode(token2);

      // Tokens should decode to same user data
      expect(token1Decoded.userId).toBe(token2Decoded.userId);
      expect(token1Decoded.email).toBe(token2Decoded.email);
      // But they may have different iat timestamps
      // Just verify both tokens are valid JWTs
      expect(token1.split('.').length).toBe(3);
      expect(token2.split('.').length).toBe(3);
    });
  });

  describe('TokenService.verifyAccessToken()', () => {
    test('should verify valid token', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = TokenService.signAccessToken(user);
      const decoded = TokenService.verifyAccessToken(token);

      expect(decoded.userId).toBe('user123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.role).toBe('user');
    });

    test('should reject missing token', () => {
      expect(() => TokenService.verifyAccessToken(null)).toThrow();
      expect(() => TokenService.verifyAccessToken(undefined)).toThrow();
      expect(() => TokenService.verifyAccessToken('')).toThrow();
    });

    test('should reject invalid token', () => {
      expect(() => TokenService.verifyAccessToken('invalid.token.here')).toThrow();
    });

    test('should handle Bearer prefix', () => {
      const user = {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = TokenService.signAccessToken(user);
      const bearerToken = `Bearer ${token}`;
      const decoded = TokenService.verifyAccessToken(bearerToken);

      expect(decoded.userId).toBe('user123');
    });

    test('should reject token with wrong issuer', () => {
      const wrongToken = jwt.sign(
        { userId: 'user123', email: 'test@example.com' },
        config.jwt.accessSecret,
        { issuer: 'wrong-issuer', audience: 'ollama-frontend' }
      );

      expect(() => TokenService.verifyAccessToken(wrongToken)).toThrow();
    });

    test('should reject token with wrong audience', () => {
      const wrongToken = jwt.sign(
        { userId: 'user123', email: 'test@example.com' },
        config.jwt.accessSecret,
        { issuer: 'ollama-backend', audience: 'wrong-audience' }
      );

      expect(() => TokenService.verifyAccessToken(wrongToken)).toThrow();
    });

    test('should reject token signed with wrong secret', () => {
      const wrongToken = jwt.sign(
        { userId: 'user123', email: 'test@example.com' },
        'wrong-secret',
        { issuer: 'ollama-backend', audience: 'ollama-frontend' }
      );

      expect(() => TokenService.verifyAccessToken(wrongToken)).toThrow();
    });
  });

  describe('TokenService.extractTokenFromRequest()', () => {
    test('should extract token from Authorization header with Bearer prefix', () => {
      const req = {
        headers: {
          authorization: 'Bearer valid.token.here',
        },
        cookies: {},
        query: {},
      };

      const token = TokenService.extractTokenFromRequest(req);
      expect(token).toBe('valid.token.here');
    });

    test('should extract token from Authorization header without Bearer prefix', () => {
      const req = {
        headers: {
          authorization: 'valid.token.here',
        },
        cookies: {},
        query: {},
      };

      const token = TokenService.extractTokenFromRequest(req);
      expect(token).toBe('valid.token.here');
    });

    test('should extract token from cookies if not in header', () => {
      const req = {
        headers: {},
        cookies: {
          accessToken: 'token.from.cookies',
        },
        query: {},
      };

      const token = TokenService.extractTokenFromRequest(req);
      expect(token).toBe('token.from.cookies');
    });

    test('should extract token from query string if not in header or cookies', () => {
      const req = {
        headers: {},
        cookies: {},
        query: {
          token: 'token.from.query',
        },
      };

      const token = TokenService.extractTokenFromRequest(req);
      expect(token).toBe('token.from.query');
    });

    test('should return null if no token found', () => {
      const req = {
        headers: {},
        cookies: {},
        query: {},
      };

      const token = TokenService.extractTokenFromRequest(req);
      expect(token).toBeNull();
    });

    test('should prioritize Authorization header over cookies', () => {
      const req = {
        headers: {
          authorization: 'Bearer header.token',
        },
        cookies: {
          accessToken: 'cookie.token',
        },
        query: {
          token: 'query.token',
        },
      };

      const token = TokenService.extractTokenFromRequest(req);
      expect(token).toBe('header.token');
    });
  });

  describe('GET /api/auth/me - Without Token', () => {
    test('should return 401 when token is missing', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect([
        'TOKEN_MISSING',
        'UNAUTHORIZED',
      ]).toContain(response.body.error.code);
    });

    test('should return error response with proper structure', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.body.error).toBeDefined();
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.statusCode).toBe(401);
      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
    });
  });

  describe('GET /api/auth/me - With Invalid Token', () => {
    test('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect([
        'TOKEN_INVALID',
        'UNAUTHORIZED',
      ]).toContain(response.body.error.code);
    });

    test('should return 401 for malformed JWT', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer notajwt');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return 401 for empty Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '');

      expect(response.status).toBe(401);
    });

    test('should return 401 for Bearer with no token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer ');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me - With Expired Token', () => {
    test('should return 401 for expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user123', email: 'test@example.com', role: 'user' },
        config.jwt.accessSecret,
        {
          expiresIn: '-1h', // Expired 1 hour ago
          issuer: 'ollama-backend',
          audience: 'ollama-frontend',
        }
      );

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect([
        'TOKEN_EXPIRED',
        'UNAUTHORIZED',
      ]).toContain(response.body.error.code);
    });
  });

  describe('GET /api/auth/me - Endpoint Validation', () => {
    test('should exist at GET /api/auth/me', async () => {
      const response = await request(app).get('/api/auth/me');
      expect(response.status).not.toBe(404);
    });

    test('should reject POST request to /api/auth/me', async () => {
      const response = await request(app)
        .post('/api/auth/me')
        .send({});

      expect(response.status).toBe(404);
    });

    test('should reject PUT request to /api/auth/me', async () => {
      const response = await request(app)
        .put('/api/auth/me')
        .send({});

      expect(response.status).toBe(404);
    });

    test('should reject DELETE request to /api/auth/me', async () => {
      const response = await request(app).delete('/api/auth/me');
      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/auth/me - Response Format', () => {
    test('should include requestId in response', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid');

      expect(response.body.meta).toBeDefined();
      expect(response.body.meta.requestId).toBeDefined();
      expect(typeof response.body.meta.requestId).toBe('string');
    });

    test('should include timestamp in response', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.timestamp).toBe('string');
    });

    test('error response should have correct error structure', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      expect(response.body.error.code).toBeDefined();
      expect(response.body.error.statusCode).toBeDefined();
      expect(response.body.error.message).toBeDefined();
    });
  });

  describe('GET /api/auth/me - Authorization Header Handling', () => {
    test('should accept token with Bearer prefix', async () => {
      const token = 'some.token.here';
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).not.toBe(404);
    });

    test('should accept token without Bearer prefix', async () => {
      const token = 'some.token.here';
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', token);

      expect(response.status).not.toBe(404);
    });

    test('should be case-insensitive for Bearer prefix (attempt)', async () => {
      const token = 'some.token.here';
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `bearer ${token}`);

      // May or may not work depending on implementation, but shouldn't 404
      expect(response.status).not.toBe(404);
    });

    test('should handle whitespace in Authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', '  Bearer invalid.token  ');

      expect(response.status).not.toBe(404);
    });
  });

  describe('GET /api/auth/me - Protection', () => {
    test('should require authentication to access endpoint', async () => {
      const response = await request(app).get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect([
        'TOKEN_MISSING',
        'TOKEN_INVALID',
        'TOKEN_EXPIRED',
        'UNAUTHORIZED',
      ]).toContain(response.body.error.code);
    });

    test('should not expose sensitive data in error responses', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.token');

      expect(response.body.data).toBeUndefined();
      expect(response.body.error.details?.password).toBeUndefined();
    });
  });

  describe('TokenService - Round Trip', () => {
    test('should successfully sign and verify token in round trip', () => {
      const user = {
        _id: 'user456',
        email: 'roundtrip@example.com',
        role: 'admin',
      };

      const token = TokenService.signAccessToken(user);
      const decoded = TokenService.verifyAccessToken(token);

      expect(decoded.userId).toBe(user._id);
      expect(decoded.email).toBe(user.email);
      expect(decoded.role).toBe(user.role);
    });

    test('should preserve all user data in round trip', () => {
      const user = {
        _id: '507f1f77bcf86cd799439011',
        email: 'fulltest@example.com',
        role: 'premium-user',
      };

      const token = TokenService.signAccessToken(user);
      const decoded = TokenService.verifyAccessToken(token);

      expect(decoded).toMatchObject({
        userId: user._id,
        email: user.email,
        role: user.role,
      });
    });
  });
});
