jest.mock('../src/services/auth.service', () => ({
  signInWithGoogle: jest.fn(),
}));

const request = require('supertest');
const { app } = require('../src/app');
const AuthService = require('../src/services/auth.service');

describe('Auth Google Sign-in', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns tokens and user info when idToken is valid', async () => {
    AuthService.signInWithGoogle.mockResolvedValue({
      user: { _id: 'u1', name: 'Rahul', email: 'r@example.com', role: 'user' },
      accessToken: 'access.123',
      refreshToken: 'refresh.456',
    });

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'valid-token' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBe('access.123');
    expect(res.body.data.refreshToken).toBe('refresh.456');
    expect(res.body.data.user.email).toBe('r@example.com');
    expect(AuthService.signInWithGoogle).toHaveBeenCalledWith('valid-token');
  });

  it('returns validation error when idToken missing', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({});

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
