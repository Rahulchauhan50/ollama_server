const request = require('supertest');
const { app } = require('../../src/app');

describe('Integration - Security: Rate limiting and Body size', () => {
  test('Rate limiter returns 429 after many rapid requests', async () => {
    const path = '/api/health';
    const attempts = 30;
    let got429 = false;

    for (let i = 0; i < attempts; i++) {
      // perform requests in sequence to avoid overwhelming test runner
      const res = await request(app).get(path);
      if (res.status === 429) {
        got429 = true;
        break;
      }
    }

    expect(got429).toBe(true);
  }, 20000);

  test('Oversized JSON payload is rejected (payload too large)', async () => {
    // create a large string (>1MB) to exceed typical body limits
    const large = 'x'.repeat(1024 * 1024 + 100);

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: large, email: 'big@example.com', password: 'Password123' });

    // server should reject with 413 or another 4xx
    expect(res.status).toBeGreaterThanOrEqual(400);
    // prefer explicit 413 when possible
    const ok = res.status === 413 || res.status === 400 || res.status === 413;
    expect(ok).toBe(true);
  }, 20000);
});
