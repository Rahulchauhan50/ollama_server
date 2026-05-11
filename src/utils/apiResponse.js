// Standard API Response class for consistent response format
class ApiResponse {
  constructor(statusCode, data, message = 'Success', requestId = null) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
    this.timestamp = new Date().toISOString();
    this.meta = {
      requestId: requestId || 'unknown',
    };
  }

  static success(data = null, message = 'Success', statusCode = 200, requestId = null) {
    return new ApiResponse(statusCode, data, message, requestId);
  }

  static created(data = null, message = 'Resource created', requestId = null) {
    return new ApiResponse(201, data, message, requestId);
  }

  static error(message = 'Internal Server Error', statusCode = 500, data = null, requestId = null) {
    const response = new ApiResponse(statusCode, data, message, requestId);
    response.success = false;
    return response;
  }

  toJSON() {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
      meta: this.meta,
      timestamp: this.timestamp,
    };
  }
}

module.exports = ApiResponse;
