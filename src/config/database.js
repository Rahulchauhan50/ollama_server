const mongoose = require('mongoose');
const config = require('./env');

let dbConnection = null;

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    const conn = await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });

    dbConnection = conn;

    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Connected to: ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);

    // Connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB error:', err.message);
    });

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error;
  }
};

// Disconnect from MongoDB
const disconnectDB = async () => {
  try {
    if (dbConnection) {
      await mongoose.disconnect();
      dbConnection = null;
      console.log('✅ MongoDB disconnected');
    }
  } catch (error) {
    console.error('❌ Error disconnecting MongoDB:', error.message);
    throw error;
  }
};

// Get connection status
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

// Get connection object
const getConnection = () => {
  return dbConnection;
};

module.exports = {
  connectDB,
  disconnectDB,
  isConnected,
  getConnection,
};
