// Jest setup for server-api tests
process.env.NODE_ENV = 'test';
// Optionally silence console logs during tests
const originalConsole = { ...console };
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  await mongoose.connect(uri, { dbName: 'test' });
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
});

// Silence console.log during tests to keep output clean
console.log = () => {};
