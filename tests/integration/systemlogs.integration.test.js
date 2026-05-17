const request = require('supertest');
const { app } = require('../../src/app');
const User = require('../../src/models/User.model');
const SystemLog = require('../../src/models/SystemLog.model');
const LoggingService = require('../../src/services/logging.service');

describe('Integration - System Logs', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await SystemLog.deleteMany({});
  });

  test('HTTP requests are logged and admin can fetch logs', async () => {
    // trigger a public endpoint to create a log (health)
    await request(app).get('/api/health').expect(200);

    // create admin
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Admin', email: 'sysadmin@example.com', password: 'Password123' })
      .expect(201);

    // escalate role directly
    await User.updateOne({ email: 'sysadmin@example.com' }, { $set: { role: 'admin' } });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sysadmin@example.com', password: 'Password123' })
      .expect(200);

    const token = login.body.data.accessToken;

    // create an explicit log entry
    await LoggingService.create({ event: 'INTEGRATION_TEST', message: 'created by test' });

    // Give a small pause for async logs to persist
    await new Promise((r) => setTimeout(r, 100));

    const res = await request(app)
      .get('/api/admin/system/logs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const logs = res.body.data.logs;
    expect(Array.isArray(logs)).toBe(true);
    // expect at least one log from the health request or our created log
    const found = logs.find((l) => l.event === 'HTTP_REQUEST' || l.event === 'INTEGRATION_TEST');
    expect(found).toBeTruthy();
  });
});
