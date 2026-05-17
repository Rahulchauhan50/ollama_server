const axios = require('axios');

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const pause = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  try {
    console.log('Using backend:', BASE);

    // use a unique email each run to avoid collisions with existing test users
    const testEmail = `rahul.rag.test.${Date.now()}@example.com`;

    // 1. Create test user
    const signupResp = await axios.post(`${BASE}/api/auth/signup`, {
      name: 'Rahul Test',
      email: testEmail,
      password: 'Password123!'
    }).catch((e) => e.response || e);

    if (signupResp.status !== 201) {
      console.log('Signup may have failed or user exists, continuing:', signupResp.status || signupResp);
    } else {
      console.log('User signed up');
    }

    // 2. Login
    const loginResp = await axios.post(`${BASE}/api/auth/login`, {
      email: testEmail,
      password: 'Password123!'
    });

    const token = loginResp.data?.data?.accessToken;
    if (!token) throw new Error('Login failed, no token returned');
    console.log('Logged in, token acquired');

    const authHeader = { headers: { Authorization: `Bearer ${token}` } };

    // 3. Create conversation 1
    const conv1 = await axios.post(`${BASE}/api/conversations`, { title: 'Conv A' }, authHeader);
    const conv1Id = conv1.data?.data?.conversation?._id || conv1.data?.data?._id || conv1.data?.data?.conversationId || conv1.data?.data?.id;
    console.log('Created conversation 1:', conv1Id);

    // 4. Send message to conversation 1
    await axios.post(`${BASE}/api/conversations/${conv1Id}/chat`, { message: 'Hi, I am Rahul. I love MERN stack.' }, authHeader);
    console.log('Sent message to conversation 1');

    // small pause to allow embeddings to be created
    await pause(800);

    // 5. Create conversation 2
    const conv2 = await axios.post(`${BASE}/api/conversations`, { title: 'Conv B' }, authHeader);
    const conv2Id = conv2.data?.data?.conversation?._id || conv2.data?.data?._id || conv2.data?.data?.conversationId || conv2.data?.data?.id;
    console.log('Created conversation 2:', conv2Id);

    // 6. Send question to conversation 2 with RAG enabled
    const chatResp = await axios.post(`${BASE}/api/conversations/${conv2Id}/chat`, { message: 'What is my name and what stack do I like?', rag: true }, authHeader);

    console.log('\nChat response status:', chatResp.status);
    console.log('Chat response body:');
    console.log(JSON.stringify(chatResp.data, null, 2));

    const reply = chatResp.data?.data?.reply || chatResp.data?.data?.assistantMessage?.content || chatResp.data?.data?.assistantMessage;
    console.log('\nAssistant reply:');
    console.log(reply);

  } catch (err) {
    console.error('Script failed:', err.response?.data || err.message || err);
    process.exit(1);
  }
}

run();
