const request = require('supertest');
const { app } = require('../src/app');

describe('Phase 38 - automated unit tests smoke', () => {
  test('GET /api/health returns 200 and health object', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status', 'healthy');
  });
});
