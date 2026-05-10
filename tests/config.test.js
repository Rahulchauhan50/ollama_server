const { config } = require('../src/app');

describe('Environment Configuration', () => {
  test('should load config from environment', () => {
    expect(config).toBeDefined();
    expect(config.port).toBe(3000);
    // Jest automatically sets NODE_ENV=test
    expect(['development', 'test']).toContain(config.nodeEnv);
  });

  test('should have required config properties', () => {
    expect(config.mongoUri).toBeDefined();
    expect(config.jwt).toBeDefined();
    expect(config.ollama).toBeDefined();
  });

  test('should have JWT configuration', () => {
    expect(config.jwt.accessSecret).toBeDefined();
    expect(config.jwt.refreshSecret).toBeDefined();
    expect(config.jwt.accessExpiry).toBe('15m');
    expect(config.jwt.refreshExpiry).toBe('7d');
  });

  test('should have Ollama configuration', () => {
    expect(config.ollama.baseUrl).toBeDefined();
    expect(config.ollama.defaultChatModel).toBeDefined();
    expect(config.ollama.embeddingModel).toBeDefined();
    expect(Array.isArray(config.ollama.allowedChatModels)).toBe(true);
  });

  test('should identify environment correctly', () => {
    // Jest automatically sets NODE_ENV=test, so:
    expect(config.isTest).toBe(true);
    expect(config.isProduction).toBe(false);
    // isDevelopment may be false when running tests
  });
});
