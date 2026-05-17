const request = require('supertest');
const { app } = require('../../src/app');
const User = require('../../src/models/User.model');

describe('Integration - Auth flows', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('signup -> login -> me', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test User', email: 'test@example.com', password: 'Password123' })
      .expect(201);

    expect(signupRes.body).toHaveProperty('data.user');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'Password123' })
      .expect(200);

    expect(loginRes.body).toHaveProperty('data.accessToken');
    const token = loginRes.body.data.accessToken;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(meRes.body.data.user.email).toBe('test@example.com');
  });
});
