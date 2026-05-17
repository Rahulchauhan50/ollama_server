const request = require('supertest');
const { app } = require('../src/app');
const MemoryService = require('../src/services/memory.service');
const User = require('../src/models/User.model');

describe('Phase 41 - Privacy and Data Isolation', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });

  test('User B should not see User A secrets via memory retrieval', async () => {
    // Sign up user A
    await request(app).post('/api/auth/signup').send({ name: 'User A', email: 'usera@example.com', password: 'Password123' }).expect(201);
    const loginA = await request(app).post('/api/auth/login').send({ email: 'usera@example.com', password: 'Password123' }).expect(200);
    const tokenA = loginA.body.data.accessToken;

    // Create conversation for A
    const convARes = await request(app).post('/api/conversations').set('Authorization', `Bearer ${tokenA}`).send({ title: 'A conv' }).expect(201);
    const convA = convARes.body.data.conversation || convARes.body.data;
    const convAId = convA._id || convA.id;

    // Post secret message as user A
    await request(app).post(`/api/conversations/${convAId}/chat`).set('Authorization', `Bearer ${tokenA}`).send({ message: 'My secret code is mango123.' }).expect(201);

    // Ensure MemoryService can retrieve for user A
    const userADocs = await request(app).post(`/api/auth/login`).send({ email: 'usera@example.com', password: 'Password123' });
    const userAId = loginA.body.data.user.id || loginA.body.data.user._id || null;
    const memoriesForA = await MemoryService.retrieveRelevantMemories({ userId: userAId, queryText: 'secret code', limit: 5, threshold: 0.1 });
    expect(Array.isArray(memoriesForA)).toBe(true);
    expect(memoriesForA.length).toBeGreaterThan(0);
    expect(memoriesForA[0].content).toMatch(/mango123/);

    // Sign up user B
    await request(app).post('/api/auth/signup').send({ name: 'User B', email: 'userb@example.com', password: 'Password123' }).expect(201);
    const loginB = await request(app).post('/api/auth/login').send({ email: 'userb@example.com', password: 'Password123' }).expect(200);
    const tokenB = loginB.body.data.accessToken;
    const userBId = loginB.body.data.user.id || loginB.body.data.user._id || null;

    // Create conversation for B
    const convBRes = await request(app).post('/api/conversations').set('Authorization', `Bearer ${tokenB}`).send({ title: 'B conv' }).expect(201);
    const convB = convBRes.body.data.conversation || convBRes.body.data;
    const convBId = convB._id || convB.id;

    // User B queries memory retrieval via MemoryService directly
    const memoriesForB = await MemoryService.retrieveRelevantMemories({ userId: userBId, queryText: 'What is my secret code?', limit: 5, threshold: 0.1 });
    expect(Array.isArray(memoriesForB)).toBe(true);
    // Should be empty — user B must not retrieve user A's memory
    expect(memoriesForB.length).toBe(0);
  });
});
