// Custom Error class for standardized error handling
class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR', details = null, requestId = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId || 'unknown';
    this.isCustom = true;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        details: this.details,
      },
      meta: {
        requestId: this.requestId,
      },
      timestamp: this.timestamp,
    };
  }

  // Common error factory methods
  static badRequest(message = 'Bad Request', details = null, requestId = null) {
    return new AppError(message, 400, 'BAD_REQUEST', details, requestId);
  }

  static unauthorized(message = 'Unauthorized', details = null, requestId = null) {
    return new AppError(message, 401, 'UNAUTHORIZED', details, requestId);
  }

  static forbidden(message = 'Forbidden', details = null, requestId = null) {
    return new AppError(message, 403, 'FORBIDDEN', details, requestId);
  }

  static notFound(message = 'Not Found', details = null, requestId = null) {
    return new AppError(message, 404, 'NOT_FOUND', details, requestId);
  }

  static conflict(message = 'Conflict', details = null, requestId = null) {
    return new AppError(message, 409, 'CONFLICT', details, requestId);
  }

  static validation(message = 'Validation Error', details = null, requestId = null) {
    return new AppError(message, 422, 'VALIDATION_ERROR', details, requestId);
  }

  static tooManyRequests(message = 'Too Many Requests', details = null, requestId = null) {
    return new AppError(message, 429, 'RATE_LIMITED', details, requestId);
  }

  static internal(message = 'Internal Server Error', details = null, requestId = null) {
    return new AppError(message, 500, 'INTERNAL_ERROR', details, requestId);
  }

  static serviceUnavailable(message = 'Service Unavailable', details = null, requestId = null) {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE', details, requestId);
  }
}

module.exports = AppError;
