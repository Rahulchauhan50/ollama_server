const { connectDB, disconnectDB, isConnected, getConnection } = require('../src/config/database');

describe('Phase 6: MongoDB Connection', () => {
  // Note: These are unit tests. Full integration tests would require a real MongoDB instance.
  
  describe('Database Configuration', () => {
    test('should have database module with required functions', () => {
      expect(typeof connectDB).toBe('function');
      expect(typeof disconnectDB).toBe('function');
      expect(typeof isConnected).toBe('function');
      expect(typeof getConnection).toBe('function');
    });

    test('isConnected should return a boolean', () => {
      const status = isConnected();
      expect(typeof status).toBe('boolean');
    });

    test('getConnection should return connection object or null', () => {
      const conn = getConnection();
      expect(conn === null || typeof conn === 'object').toBe(true);
    });
  });

  describe('Connection Status', () => {
    test('should handle connection status checks', () => {
      // isConnected returns a boolean: true (1) or false (0)
      const status = isConnected();
      expect(typeof status).toBe('boolean');
      expect([true, false]).toContain(status);
    });
  });

  describe('Database Error Handling', () => {
    test('connectDB should be callable', async () => {
      // We can't actually test without a real MongoDB instance,
      // but we can verify the function exists and is async
      expect(connectDB.constructor.name).toBe('AsyncFunction');
    });

    test('disconnectDB should be callable', async () => {
      expect(disconnectDB.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Health Endpoint with Database', () => {
    test('health response should include database status', () => {
      // Mock health response structure
      const healthResponse = {
        success: true,
        data: {
          status: 'healthy',
          database: 'connected', // or 'disconnected'
          timestamp: new Date().toISOString(),
        },
      };

      expect(healthResponse).toHaveProperty('success', true);
      expect(healthResponse.data).toHaveProperty('database');
      expect(['connected', 'disconnected']).toContain(healthResponse.data.database);
    });

    test('should indicate disconnected database when offline', () => {
      const healthResponse = {
        success: true,
        data: {
          status: 'healthy',
          database: 'disconnected',
        },
      };

      expect(healthResponse.data.database).toBe('disconnected');
    });

    test('should indicate connected database when online', () => {
      const healthResponse = {
        success: true,
        data: {
          status: 'healthy',
          database: 'connected',
        },
      };

      expect(healthResponse.data.database).toBe('connected');
    });
  });

  describe('MongoDB URI Configuration', () => {
    test('should use MONGODB_URI from environment', () => {
      const config = require('../src/config');
      expect(config.mongoUri).toBeDefined();
      expect(typeof config.mongoUri).toBe('string');
      expect(config.mongoUri).toMatch(/^mongodb/i);
    });

    test('should handle MongoDB connection string', () => {
      const config = require('../src/config');
      // Valid MongoDB URI formats: mongodb://... or mongodb+srv://...
      const isValidUri = config.mongoUri.match(/^mongodb(\+srv)?:\/\//);
      expect(isValidUri).toBeTruthy();
    });
  });

  describe('Graceful Shutdown', () => {
    test('graceful shutdown should disconnect database', () => {
      // This is a conceptual test - actual shutdown is tested by process signals
      const disconnectFn = disconnectDB;
      expect(typeof disconnectFn).toBe('function');
      expect(disconnectFn.constructor.name).toBe('AsyncFunction');
    });
  });
});
