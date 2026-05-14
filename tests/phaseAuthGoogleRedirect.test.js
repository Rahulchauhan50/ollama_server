const request = require('supertest');
const { app } = require('../src/app');

describe('Auth Google Redirect', () => {
  beforeAll(() => {
    process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'test-client-id';
  });

  it('redirects to Google consent screen', async () => {
    const res = await request(app).get('/api/auth/google');
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/accounts.google.com/);
  });
});
