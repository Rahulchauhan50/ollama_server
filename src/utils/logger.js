// Centralized logging utility with request ID support
const isDevelopment = process.env.NODE_ENV === 'development';

const Logger = {
  // Log info level messages
  info(message, requestId = null, data = null) {
    const prefix = requestId ? `[${requestId}]` : '';
    const logMessage = prefix ? `${prefix} ${message}` : message;
    if (data) {
      console.log(`ℹ️  ${logMessage}`, data);
    } else {
      console.log(`ℹ️  ${logMessage}`);
    }
  },

  // Log warning level messages
  warn(message, requestId = null, data = null) {
    const prefix = requestId ? `[${requestId}]` : '';
    const logMessage = prefix ? `${prefix} ${message}` : message;
    if (data) {
      console.warn(`⚠️  ${logMessage}`, data);
    } else {
      console.warn(`⚠️  ${logMessage}`);
    }
  },

  // Log error level messages
  error(message, requestId = null, error = null) {
    const prefix = requestId ? `[${requestId}]` : '';
    const logMessage = prefix ? `${prefix} ${message}` : message;
    if (error) {
      console.error(`❌ ${logMessage}`, error);
    } else {
      console.error(`❌ ${logMessage}`);
    }
  },

  // Log debug level messages (only in development)
  debug(message, requestId = null, data = null) {
    if (!isDevelopment) {
      return;
    }
    const prefix = requestId ? `[${requestId}]` : '';
    const logMessage = prefix ? `${prefix} ${message}` : message;
    if (data) {
      console.log(`🐛 ${logMessage}`, data);
    } else {
      console.log(`🐛 ${logMessage}`);
    }
  },

  // Log request details
  logRequest(method, path, requestId) {
    const prefix = `[${requestId}]`;
    console.log(`📥 ${prefix} ${method} ${path}`);
  },

  // Log response details
  logResponse(method, path, statusCode, duration, requestId) {
    const prefix = `[${requestId}]`;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️ ' : '✅';
    console.log(`📤 ${prefix} ${statusEmoji} ${method} ${path} - ${statusCode} (${duration}ms)`);
  },
};

module.exports = Logger;
