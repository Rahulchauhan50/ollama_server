const request = require('supertest');
const { app } = require('../../src/app');
const User = require('../../src/models/User.model');
const Conversation = require('../../src/models/Conversation.model');
const Message = require('../../src/models/Message.model');
const LoggingService = require('../../src/services/logging.service');

describe('Integration - Admin endpoints', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
  });

  test('admin can access status, counts, logs and usage summary', async () => {
    // create a regular user and generate a conversation/message
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'User A', email: 'usera@example.com', password: 'Password123' })
      .expect(201);

    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usera@example.com', password: 'Password123' })
      .expect(200);

    const tokenA = loginA.body.data.accessToken;

    const conv = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Admin Test Conv' })
      .expect(201);

    const convId = conv.body.data.conversation._id;

    await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ role: 'user', content: 'Secret info' })
      .expect(201);

    // create admin user and escalate role
    const adminEmail = 'admin@example.com';
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Admin', email: adminEmail, password: 'Password123' })
      .expect(201);

    // escalate role directly in DB
    await User.updateOne({ email: adminEmail }, { $set: { role: 'admin' } });

    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: adminEmail, password: 'Password123' })
      .expect(200);

    const adminToken = loginAdmin.body.data.accessToken;

    // status
    const statusRes = await request(app)
      .get('/api/admin/status')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(statusRes.body.data.user.role).toBe('admin');

    // counts
    const usersCount = await request(app)
      .get('/api/admin/users/count')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(usersCount.body.data.users).toBeGreaterThanOrEqual(2);

    const convCount = await request(app)
      .get('/api/admin/conversations/count')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(convCount.body.data.conversations).toBeGreaterThanOrEqual(1);

    const msgCount = await request(app)
      .get('/api/admin/messages/count')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(msgCount.body.data.messages).toBeGreaterThanOrEqual(1);

    // system logs: create one and fetch
    await LoggingService.create({ event: 'TEST_EVENT', message: 'hello' });

    const logsRes = await request(app)
      .get('/api/admin/system/logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(logsRes.body.data.logs)).toBe(true);
    expect(logsRes.body.data.logs.length).toBeGreaterThanOrEqual(1);

    // usage summary
    const usageRes = await request(app)
      .get('/api/admin/usage/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(usageRes.body.data.summary)).toBe(true);
  });
});
