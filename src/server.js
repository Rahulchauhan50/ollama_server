const { app, config } = require('./app');
const { connectDB, disconnectDB } = require('./config/database');

let server;

// Start server with database connection
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    server = app.listen(config.port, () => {
      console.log(`✅ Backend Server running on http://localhost:${config.port}`);
      console.log('📋 Available Endpoints:');
      console.log(`   GET  http://localhost:${config.port}/api/health - Health check`);
      console.log(`   GET  http://localhost:${config.port}/api/config - Show configuration`);
      console.log(`   GET  http://localhost:${config.port}/api/version - API version`);
      console.log(`\n🔧 Environment: ${config.nodeEnv}`);
      console.log(`🗄️  Database: ${config.mongoUri.replace(/:[^:]*@/, ':****@')}`);
      console.log(`🤖 AI provider: ${config.ai.providerName}`);
      console.log(`🤖 Active model: ${config.ai.defaultChatModel}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      console.log('Server closed');
      try {
        await disconnectDB();
        console.log('Shutdown complete');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error.message);
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = server;
