const request = require('supertest');
const { app } = require('../../src/app');
const User = require('../../src/models/User.model');
const Message = require('../../src/models/Message.model');

describe('Integration - Usage Aggregation', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Message.deleteMany({});
  });

  test('User usage endpoint returns aggregated tokens and duration', async () => {
    // sign up user
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'UsageTester', email: 'usage@example.com', password: 'Password123' })
      .expect(201);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'usage@example.com', password: 'Password123' })
      .expect(200);

    const token = login.body.data.accessToken;
    const userId = login.body.data.user._id;

    // insert messages directly to simulate recorded usage
    await Message.create([
      { userIdStr: userId, role: 'user', content: 'one', metadata: { tokenUsage: 10, ollamaDurationMs: 120 } },
      { userIdStr: userId, role: 'assistant', content: 'two', metadata: { tokenUsage: 20, ollamaDurationMs: 80 } },
      { userIdStr: userId, role: 'user', content: 'three', metadata: { tokenUsage: 5, ollamaDurationMs: 50 } },
    ]);

    const res = await request(app)
      .get('/api/me/usage')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const usage = res.body.data;
    expect(usage.totalTokens).toBe(35); // 10+20+5
    expect(usage.totalDurationMs).toBe(250); // 120+80+50
  });

  test('Admin usage summary aggregates across users', async () => {
    // create two users
    await request(app).post('/api/auth/signup').send({ name: 'A', email: 'a@example.com', password: 'Password123' }).expect(201);
    await request(app).post('/api/auth/signup').send({ name: 'B', email: 'b@example.com', password: 'Password123' }).expect(201);

    // make one admin
    await User.updateOne({ email: 'a@example.com' }, { $set: { role: 'admin' } });

    const adminLogin = await request(app).post('/api/auth/login').send({ email: 'a@example.com', password: 'Password123' }).expect(200);
    const adminToken = adminLogin.body.data.accessToken;

    // get user ids
    const userA = await User.findOne({ email: 'a@example.com' });
    const userB = await User.findOne({ email: 'b@example.com' });

    // insert messages for both users
    await Message.create([
      { userIdStr: String(userA._id), role: 'user', content: 'uA1', metadata: { tokenUsage: 7, ollamaDurationMs: 10 } },
      { userIdStr: String(userB._id), role: 'user', content: 'uB1', metadata: { tokenUsage: 3, ollamaDurationMs: 5 } },
      { userIdStr: String(userA._id), role: 'assistant', content: 'uA2', metadata: { tokenUsage: 2, ollamaDurationMs: 2 } },
    ]);

    const res = await request(app)
      .get('/api/admin/usage/summary')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const summary = res.body.data;
    expect(summary.totalTokens).toBe(12); // 7+3+2
    expect(summary.totalDurationMs).toBe(17); // 10+5+2
    expect(summary.byUser).toBeDefined();
    expect(Array.isArray(summary.byUser)).toBe(true);
  });
});
