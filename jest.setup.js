// Jest setup for server-api tests
process.env.NODE_ENV = 'test';
// Optionally silence console logs during tests
const originalConsole = { ...console };
console.log = (...args) => {
  // keep important logs
};
