// Simple request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = req.get('x-request-id') || generateRequestId();

  // Attach to request for later use
  req.requestId = requestId;

  // Log the incoming request
  console.log(`[${requestId}] ${req.method} ${req.path}`);

  // Capture the original res.json function
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    return originalJson.call(this, data);
  };

  next();
};

// Generate a simple request ID
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = { requestLogger, generateRequestId };
