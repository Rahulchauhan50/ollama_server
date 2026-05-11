// Custom Error class for standardized error handling
class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();

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
      timestamp: this.timestamp,
    };
  }

  // Common error factory methods
  static badRequest(message = 'Bad Request', details = null) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Unauthorized', details = null) {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  static forbidden(message = 'Forbidden', details = null) {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  static notFound(message = 'Not Found', details = null) {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  static conflict(message = 'Conflict', details = null) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  static validation(message = 'Validation Error', details = null) {
    return new AppError(message, 422, 'VALIDATION_ERROR', details);
  }

  static internal(message = 'Internal Server Error', details = null) {
    return new AppError(message, 500, 'INTERNAL_ERROR', details);
  }

  static serviceUnavailable(message = 'Service Unavailable', details = null) {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE', details);
  }
}

module.exports = AppError;
