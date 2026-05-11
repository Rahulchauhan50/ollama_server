const { app, config } = require('./app');

const server = app.listen(config.port, () => {
  console.log(`✅ Ollama Backend Server running on http://localhost:${config.port}`);
  console.log('📋 Available Endpoints:');
  console.log(`   GET  http://localhost:${config.port}/api/health - Health check`);
  console.log(`   GET  http://localhost:${config.port}/api/config - Show configuration`);
  console.log(`   GET  http://localhost:${config.port}/api/version - API version`);
  console.log(`\n🔧 Environment: ${config.nodeEnv}`);
  console.log(`🗄️  Database: ${config.mongoUri.replace(/:[^:]*@/, ':****@')}`);
  console.log(`🤖 Ollama: ${config.ollama.baseUrl}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = server;
