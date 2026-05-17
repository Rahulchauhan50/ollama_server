const request = require('supertest');
const { app } = require('../../src/app');
const User = require('../../src/models/User.model');
const Conversation = require('../../src/models/Conversation.model');
const Message = require('../../src/models/Message.model');

describe('Integration - Conversations & Messages', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Conversation.deleteMany({});
    await Message.deleteMany({});
  });

  test('create conversation, add/get/delete messages', async () => {
    // signup
    await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Conv Tester', email: 'conv@test.com', password: 'Password123' })
      .expect(201);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'conv@test.com', password: 'Password123' })
      .expect(200);

    const token = loginRes.body.data.accessToken;

    // create conversation
    const convRes = await request(app)
      .post('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Integration Test Conv' })
      .expect(201);

    const convId = convRes.body.data.conversation._id || convRes.body.data.conversationId;

    // add a user message (role specified to avoid AI call)
    const addMsgRes = await request(app)
      .post(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'user', content: 'Hello from integration test' })
      .expect(201);

    const message = addMsgRes.body.data.message;
    expect(message).toHaveProperty('_id');
    expect(message.content).toBe('Hello from integration test');

    // get messages
    const getRes = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(getRes.body.data.messages)).toBe(true);
    expect(getRes.body.data.messages.length).toBeGreaterThanOrEqual(1);

    // delete message
    await request(app)
      .delete(`/api/messages/${message._id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    // confirm deletion
    const afterRes = await request(app)
      .get(`/api/conversations/${convId}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(afterRes.body.data.messages.find((m) => m._id === message._id)).toBeUndefined();
  });
});
