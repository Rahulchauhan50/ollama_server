const LoggingService = require('../services/logging.service');

// Simple request logging middleware that records to SystemLog
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.get('x-request-id') || generateRequestId();

  // Attach to request for later use
  req.requestId = requestId;

  // Log the incoming request to console and DB (async)
  console.log(`[${requestId}] ${req.method} ${req.path}`);
  LoggingService.create({ level: 'info', event: 'HTTP_REQUEST', requestId, message: `${req.method} ${req.path}`, metadata: { ip: req.ip } }).catch(() => {});

  // Capture the original res.json function
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    LoggingService.create({ level: res.statusCode >= 500 ? 'error' : 'info', event: 'HTTP_RESPONSE', requestId, message: `${req.method} ${req.path}`, metadata: { statusCode: res.statusCode, duration } }).catch(() => {});
    return originalJson.call(this, data);
  };

  next();
};

// Generate a simple request ID
const generateRequestId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

module.exports = { requestLogger, generateRequestId };
